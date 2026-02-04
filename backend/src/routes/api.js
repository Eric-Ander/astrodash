const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const eventsController = require('../controllers/eventsController');
const authController = require('../controllers/authController');
const cardPreferencesController = require('../controllers/cardPreferencesController');
const { authenticateToken } = require('../middleware/auth');

// Authentication routes
router.post('/auth/register', authController.register.bind(authController));
router.post('/auth/login', authController.login.bind(authController));
router.get('/auth/profile', authenticateToken, authController.getProfile.bind(authController));

// Saved locations routes (protected)
router.post('/locations', authenticateToken, authController.saveLocation.bind(authController));
router.get('/locations', authenticateToken, authController.getLocations.bind(authController));
router.delete('/locations/:id', authenticateToken, authController.deleteLocation.bind(authController));
router.patch('/locations/:id/favorite', authenticateToken, authController.toggleFavorite.bind(authController));

// Notification settings routes (protected)
router.patch('/locations/:id/notifications', authenticateToken, authController.updateNotificationSettings.bind(authController));
router.post('/notifications/test', authenticateToken, authController.sendTestNotification.bind(authController));

// Weather forecast endpoints
router.get('/weather/forecast', weatherController.getForecast.bind(weatherController));
router.get('/weather/forecast/multiday', weatherController.getMultiDayForecast.bind(weatherController));

// Astronomical events endpoints
router.get('/events', eventsController.getEvents.bind(eventsController));
router.get('/events/iss', eventsController.getISSPasses.bind(eventsController));
router.get('/events/meteors', eventsController.getMeteorShowers.bind(eventsController));

// Card preferences routes (protected)
router.get('/cards/preferences', authenticateToken, cardPreferencesController.getPreferences.bind(cardPreferencesController));
router.put('/cards/preferences', authenticateToken, cardPreferencesController.savePreferences.bind(cardPreferencesController));
router.patch('/cards/preferences/:cardId', authenticateToken, cardPreferencesController.updateCardPreference.bind(cardPreferencesController));

// Health check
router.get('/health', weatherController.healthCheck.bind(weatherController));

module.exports = router;
