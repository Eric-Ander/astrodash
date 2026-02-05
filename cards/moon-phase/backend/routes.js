const express = require('express');
const path = require('path');
const router = express.Router();
const moonPhaseService = require(path.join(global.appRoot, 'services', 'moonPhaseService'));

/**
 * GET /api/cards/moon-phase/data
 *
 * Returns moon phase information for the current date and location.
 * Query params: lat, lon (used for moon rise/set estimation)
 */
router.get('/data', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat and lon query parameters are required',
      });
    }

    const now = new Date();
    const moonPhase = moonPhaseService.calculateMoonPhase(now);
    const moonTimes = moonPhaseService.estimateMoonTimes(now, lat, lon);
    const interference = moonPhaseService.checkMoonInterference(now);

    res.json({
      phase: moonPhase.phase_name,
      illumination: moonPhase.illumination,
      age_days: moonPhase.age_days,
      is_waxing: moonPhase.is_waxing,
      emoji: moonPhase.emoji,
      days_to_new_moon: moonPhase.days_to_new_moon,
      days_to_full_moon: moonPhase.days_to_full_moon,
      visibility_impact: moonPhase.visibility_impact,
      rise_time: moonTimes.rise,
      set_time: moonTimes.set,
      times_note: moonTimes.note,
      interference: interference,
      recommendation: moonPhase.visibility_impact.description,
    });
  } catch (error) {
    console.error('Moon phase card error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate moon phase data',
    });
  }
});

module.exports = router;
