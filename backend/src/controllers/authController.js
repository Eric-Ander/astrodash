const authService = require('../services/authService');
const locationsService = require('../services/locationsService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

class AuthController {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Email and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Password must be at least 6 characters long'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid email format'
        });
      }

      const result = await authService.register(email, password, name);

      res.status(201).json(result);
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'User exists',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid email or password')) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  }

  /**
   * Get current user info
   */
  async getProfile(req, res) {
    try {
      const user = authService.getUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User not found'
        });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to get profile',
        message: error.message
      });
    }
  }

  /**
   * Save a location
   */
  async saveLocation(req, res) {
    try {
      const { location_name, lat, lon, is_favorite } = req.body;

      if (!location_name || lat === undefined || lon === undefined) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'location_name, lat, and lon are required'
        });
      }

      const location = locationsService.saveLocation(
        req.user.userId,
        location_name,
        lat,
        lon,
        is_favorite
      );

      res.status(201).json(location);
    } catch (error) {
      console.error('Save location error:', error);
      
      if (error.message.includes('already saved')) {
        return res.status(409).json({
          error: 'Location exists',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Failed to save location',
        message: error.message
      });
    }
  }

  /**
   * Get user's saved locations
   */
  async getLocations(req, res) {
    try {
      const locations = locationsService.getUserLocations(req.user.userId);
      res.json({ locations });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({
        error: 'Failed to get locations',
        message: error.message
      });
    }
  }

  /**
   * Delete a saved location
   */
  async deleteLocation(req, res) {
    try {
      const locationId = parseInt(req.params.id);

      if (isNaN(locationId)) {
        return res.status(400).json({
          error: 'Invalid location ID',
          message: 'Location ID must be a number'
        });
      }

      locationsService.deleteLocation(req.user.userId, locationId);

      res.json({ success: true });
    } catch (error) {
      console.error('Delete location error:', error);
      res.status(500).json({
        error: 'Failed to delete location',
        message: error.message
      });
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(req, res) {
    try {
      const locationId = parseInt(req.params.id);

      if (isNaN(locationId)) {
        return res.status(400).json({
          error: 'Invalid location ID',
          message: 'Location ID must be a number'
        });
      }

      const result = locationsService.toggleFavorite(req.user.userId, locationId);

      res.json(result);
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({
        error: 'Failed to toggle favorite',
        message: error.message
      });
    }
  }

  /**
   * Update notification settings for a location
   */
  async updateNotificationSettings(req, res) {
    try {
      const locationId = parseInt(req.params.id);
      const { enabled, cloud_threshold } = req.body;

      if (isNaN(locationId)) {
        return res.status(400).json({
          error: 'Invalid location ID',
          message: 'Location ID must be a number'
        });
      }

      if (cloud_threshold !== undefined && (cloud_threshold < 0 || cloud_threshold > 100)) {
        return res.status(400).json({
          error: 'Invalid threshold',
          message: 'Cloud threshold must be between 0 and 100'
        });
      }

      const result = notificationService.updateNotificationSettings(
        req.user.userId,
        locationId,
        enabled,
        cloud_threshold || 20
      );

      res.json(result);
    } catch (error) {
      console.error('Update notification settings error:', error);
      res.status(500).json({
        error: 'Failed to update notification settings',
        message: error.message
      });
    }
  }

  /**
   * Send test notification email
   */
  async sendTestNotification(req, res) {
    try {
      const user = authService.getUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User not found'
        });
      }

      if (!emailService.isConfigured()) {
        return res.status(503).json({
          error: 'Email not configured',
          message: 'Email notifications are not configured on this server'
        });
      }

      await emailService.sendTestEmail(user.email);

      res.json({
        success: true,
        message: `Test email sent to ${user.email}`
      });
    } catch (error) {
      console.error('Send test notification error:', error);
      res.status(500).json({
        error: 'Failed to send test email',
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
