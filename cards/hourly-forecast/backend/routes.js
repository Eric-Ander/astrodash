const express = require('express');
const path = require('path');
const router = express.Router();
const weatherService = require(path.join(global.appRoot, 'services', 'weatherService'));
const astronomyScoreService = require(path.join(global.appRoot, 'services', 'astronomyScoreService'));
const moonPhaseService = require(path.join(global.appRoot, 'services', 'moonPhaseService'));

/**
 * GET /api/cards/hourly-forecast/data
 *
 * Returns tonight's hourly forecast. Add ?days=N for multi-day (1-5).
 * Query params: lat, lon, days (optional, default 1)
 */
router.get('/data', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const days = parseInt(req.query.days) || 1;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat and lon query parameters are required',
      });
    }

    if (days < 1 || days > 5) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 5',
      });
    }

    if (days === 1) {
      // Tonight only
      const tonightForecast = await weatherService.getTonightForecast(lat, lon);
      const processed = astronomyScoreService.processNightForecast(
        tonightForecast.forecast
      );

      res.json({
        mode: 'tonight',
        tonight: {
          start: tonightForecast.tonight_start,
          end: tonightForecast.tonight_end,
        },
        hourly_forecast: processed.hourly_forecast,
      });
    } else {
      // Multi-day
      const multiDay = await weatherService.getMultiDayNightForecast(lat, lon, days);
      const startDate = new Date();
      const moonPhases = moonPhaseService.getMultiDayMoonPhases(startDate, days);

      const nights = multiDay.nights.map((night, index) => {
        const processed = astronomyScoreService.processNightForecast(night.forecast);
        return {
          date: night.date,
          night_start: night.night_start,
          night_end: night.night_end,
          moon: moonPhases[index],
          summary: processed.summary,
          best_observation_time: processed.best_time,
          hourly_forecast: processed.hourly_forecast,
        };
      });

      res.json({
        mode: 'multiday',
        nights,
      });
    }
  } catch (error) {
    console.error('Hourly forecast card error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch hourly forecast',
    });
  }
});

module.exports = router;
