const express = require('express');
const path = require('path');
const router = express.Router();
const weatherService = require(path.join(global.appRoot, 'services', 'weatherService'));
const astronomyScoreService = require(path.join(global.appRoot, 'services', 'astronomyScoreService'));

/**
 * GET /api/cards/weather-summary/data
 *
 * Returns overall sky quality summary for tonight.
 * Query params: lat, lon
 */
router.get('/data', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat and lon query parameters are required',
      });
    }

    const tonightForecast = await weatherService.getTonightForecast(lat, lon);
    const processed = astronomyScoreService.processNightForecast(
      tonightForecast.forecast
    );

    res.json({
      tonight: {
        start: tonightForecast.tonight_start,
        end: tonightForecast.tonight_end,
      },
      summary: processed.summary,
      best_observation_time: processed.best_time,
    });
  } catch (error) {
    console.error('Weather summary card error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch weather summary',
    });
  }
});

module.exports = router;
