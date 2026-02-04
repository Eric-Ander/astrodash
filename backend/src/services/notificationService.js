const db = require('../config/database');
const weatherService = require('./weatherService');
const astronomyScoreService = require('./astronomyScoreService');
const emailService = require('./emailService');

class NotificationService {
  /**
   * Check all locations with notifications enabled and send alerts
   */
  async checkAndSendNotifications() {
    console.log('🔔 Starting notification check...');

    if (!emailService.isConfigured()) {
      console.log('⚠️  Email service not configured, skipping notifications');
      return;
    }

    try {
      // Get all locations with notifications enabled
      const locations = db.prepare(`
        SELECT 
          sl.id,
          sl.location_name,
          sl.lat,
          sl.lon,
          sl.cloud_threshold,
          u.email,
          u.name
        FROM saved_locations sl
        JOIN users u ON sl.user_id = u.id
        WHERE sl.notifications_enabled = 1
      `).all();

      console.log(`📍 Found ${locations.length} location(s) with notifications enabled`);

      let sentCount = 0;
      let errorCount = 0;

      for (const location of locations) {
        try {
          const shouldNotify = await this.checkLocationConditions(location);
          
          if (shouldNotify) {
            await this.sendNotification(location);
            sentCount++;
            
            // Add small delay between emails to avoid overwhelming SMTP server
            await this.sleep(1000);
          }
        } catch (error) {
          console.error(`❌ Error checking location ${location.location_name}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Notification check complete: ${sentCount} sent, ${errorCount} errors`);
    } catch (error) {
      console.error('❌ Error in notification service:', error);
    }
  }

  /**
   * Check if location meets notification criteria
   */
  async checkLocationConditions(location) {
    try {
      // Get tonight's forecast
      const forecast = await weatherService.getTonightForecast(location.lat, location.lon);
      
      // Process with astronomy scores
      const processedData = astronomyScoreService.processNightForecast(forecast.forecast);

      // Calculate average cloud coverage
      const avgClouds = processedData.summary.average_cloud_coverage;

      console.log(`  📊 ${location.location_name}: ${avgClouds}% clouds (threshold: ${location.cloud_threshold}%)`);

      // Check if below threshold
      if (avgClouds <= location.cloud_threshold) {
        console.log(`  ✅ ${location.location_name}: Conditions met! Sending notification.`);
        return {
          shouldNotify: true,
          forecast: {
            avgClouds: avgClouds,
            avgVisibility: (processedData.hourly_forecast.reduce((sum, h) => sum + h.visibility_km, 0) / processedData.hourly_forecast.length).toFixed(1),
            bestTime: processedData.best_time?.time || 'N/A',
            score: processedData.summary.average_score
          }
        };
      }

      console.log(`  ⏭️  ${location.location_name}: Threshold not met, skipping.`);
      return false;
    } catch (error) {
      console.error(`Error checking conditions for ${location.location_name}:`, error);
      return false;
    }
  }

  /**
   * Send notification email
   */
  async sendNotification(location) {
    const result = await this.checkLocationConditions(location);
    
    if (!result || !result.shouldNotify) {
      return;
    }

    try {
      await emailService.sendClearSkyNotification(
        location.email,
        location.location_name,
        result.forecast
      );
    } catch (error) {
      console.error(`Failed to send email to ${location.email}:`, error);
      throw error;
    }
  }

  /**
   * Update notification settings for a location
   */
  updateNotificationSettings(userId, locationId, enabled, cloudThreshold = 20) {
    try {
      const result = db.prepare(`
        UPDATE saved_locations
        SET notifications_enabled = ?,
            cloud_threshold = ?
        WHERE id = ? AND user_id = ?
      `).run(enabled ? 1 : 0, cloudThreshold, locationId, userId);

      if (result.changes === 0) {
        throw new Error('Location not found or unauthorized');
      }

      return {
        notifications_enabled: enabled,
        cloud_threshold: cloudThreshold
      };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings for a location
   */
  getNotificationSettings(userId, locationId) {
    try {
      const settings = db.prepare(`
        SELECT notifications_enabled, cloud_threshold
        FROM saved_locations
        WHERE id = ? AND user_id = ?
      `).get(locationId, userId);

      if (!settings) {
        throw new Error('Location not found');
      }

      return {
        notifications_enabled: Boolean(settings.notifications_enabled),
        cloud_threshold: settings.cloud_threshold
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  }

  /**
   * Helper: Sleep for ms milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new NotificationService();
