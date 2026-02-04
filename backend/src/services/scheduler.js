const cron = require('node-cron');
const notificationService = require('../services/notificationService');

/**
 * Initialize cron jobs for notifications
 */
function initializeScheduler() {
  // Run daily at 2 PM (14:00) to check tonight's forecast
  // Cron format: minute hour day month weekday
  const schedule = process.env.NOTIFICATION_SCHEDULE || '0 14 * * *';

  console.log(`📅 Scheduling notification checks: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log('⏰ Running scheduled notification check...');
    try {
      await notificationService.checkAndSendNotifications();
    } catch (error) {
      console.error('❌ Error in scheduled notification check:', error);
    }
  });

  console.log('✅ Notification scheduler initialized');

  // Optional: Run a check on startup for testing (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Development mode: Running initial notification check...');
    setTimeout(async () => {
      try {
        await notificationService.checkAndSendNotifications();
      } catch (error) {
        console.error('Error in initial check:', error);
      }
    }, 5000); // Wait 5 seconds after startup
  }
}

module.exports = { initializeScheduler };
