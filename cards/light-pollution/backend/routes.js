const express = require('express');
const path = require('path');
const router = express.Router();
const lightPollutionService = require(path.join(global.appRoot, 'services', 'lightPollutionService'));

/**
 * GET /api/cards/light-pollution/data
 *
 * Returns Bortle scale light pollution data for a location.
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

    const lightPollution = await lightPollutionService.getLightPollution(lat, lon);

    res.json(lightPollution);
  } catch (error) {
    console.error('Light pollution card error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch light pollution data',
    });
  }
});

module.exports = router;
