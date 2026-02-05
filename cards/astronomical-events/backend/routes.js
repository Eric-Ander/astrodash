const express = require('express');
const path = require('path');
const router = express.Router();
const astronomicalEventsService = require(path.join(global.appRoot, 'services', 'astronomicalEventsService'));

/**
 * GET /api/cards/astronomical-events/data
 *
 * Returns upcoming astronomical events for a location.
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

    const events = await astronomicalEventsService.getAllEvents(lat, lon);

    res.json(events);
  } catch (error) {
    console.error('Astronomical events card error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch astronomical events',
    });
  }
});

module.exports = router;
