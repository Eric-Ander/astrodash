/**
 * Moon Phase Calculation Service
 * Calculates moon phase, illumination, rise/set times, and visibility
 */
class MoonPhaseService {
  /**
   * Calculate moon phase for a given date
   * Returns phase name, illumination percentage, and other moon data
   */
  calculateMoonPhase(date = new Date()) {
    const timestamp = date.getTime();
    
    // Known new moon reference (January 6, 2000, 18:14 UTC)
    const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
    
    // Lunar cycle is approximately 29.53059 days
    const lunarCycle = 29.53059 * 24 * 60 * 60 * 1000; // in milliseconds
    
    // Calculate days since known new moon
    const daysSinceNew = (timestamp - knownNewMoon) / (24 * 60 * 60 * 1000);
    
    // Calculate current position in lunar cycle (0-29.53059 days)
    const currentPhase = daysSinceNew % 29.53059;
    
    // Calculate illumination percentage (0-100)
    const illumination = this.calculateIllumination(currentPhase);
    
    // Determine phase name
    const phaseName = this.getPhaseName(currentPhase);
    
    // Determine if waxing or waning
    const isWaxing = currentPhase < 14.765295;
    
    // Calculate age in days
    const age = Math.round(currentPhase * 10) / 10;
    
    // Get emoji representation
    const emoji = this.getPhaseEmoji(currentPhase);
    
    // Calculate days until next new moon and full moon
    const daysToNew = currentPhase < 1 ? currentPhase : 29.53059 - currentPhase;
    const daysToFull = Math.abs(14.765295 - currentPhase);
    
    return {
      phase_name: phaseName,
      illumination: Math.round(illumination * 10) / 10,
      age_days: age,
      is_waxing: isWaxing,
      emoji: emoji,
      days_to_new_moon: Math.round(daysToNew * 10) / 10,
      days_to_full_moon: Math.round(daysToFull * 10) / 10,
      visibility_impact: this.getVisibilityImpact(illumination)
    };
  }
  
  /**
   * Calculate moon illumination percentage
   */
  calculateIllumination(phase) {
    // Illumination follows a sinusoidal pattern
    // Full moon at day 14.765295, new moon at day 0 and 29.53059
    const normalized = phase / 29.53059;
    const illumination = (1 - Math.cos(2 * Math.PI * normalized)) / 2 * 100;
    return illumination;
  }
  
  /**
   * Get moon phase name based on age
   */
  getPhaseName(phase) {
    if (phase < 1.84566) return 'New Moon';
    if (phase < 5.53699) return 'Waxing Crescent';
    if (phase < 9.22831) return 'First Quarter';
    if (phase < 12.91963) return 'Waxing Gibbous';
    if (phase < 16.61096) return 'Full Moon';
    if (phase < 20.30228) return 'Waning Gibbous';
    if (phase < 23.99361) return 'Last Quarter';
    if (phase < 27.68493) return 'Waning Crescent';
    return 'New Moon';
  }
  
  /**
   * Get emoji representation of moon phase
   */
  getPhaseEmoji(phase) {
    if (phase < 1.84566) return '🌑'; // New Moon
    if (phase < 5.53699) return '🌒'; // Waxing Crescent
    if (phase < 9.22831) return '🌓'; // First Quarter
    if (phase < 12.91963) return '🌔'; // Waxing Gibbous
    if (phase < 16.61096) return '🌕'; // Full Moon
    if (phase < 20.30228) return '🌖'; // Waning Gibbous
    if (phase < 23.99361) return '🌗'; // Last Quarter
    if (phase < 27.68493) return '🌘'; // Waning Crescent
    return '🌑'; // New Moon
  }
  
  /**
   * Determine how moon phase impacts astronomical visibility
   */
  getVisibilityImpact(illumination) {
    if (illumination < 10) {
      return {
        rating: 'Excellent',
        description: 'Minimal moonlight interference - ideal for deep sky observations',
        score_modifier: 0 // No penalty
      };
    } else if (illumination < 30) {
      return {
        rating: 'Very Good',
        description: 'Low moonlight - good for most observations',
        score_modifier: -5
      };
    } else if (illumination < 50) {
      return {
        rating: 'Good',
        description: 'Moderate moonlight - suitable for bright objects',
        score_modifier: -10
      };
    } else if (illumination < 70) {
      return {
        rating: 'Fair',
        description: 'Significant moonlight - challenging for faint objects',
        score_modifier: -15
      };
    } else if (illumination < 90) {
      return {
        rating: 'Poor',
        description: 'Bright moonlight - limits deep sky observations',
        score_modifier: -20
      };
    } else {
      return {
        rating: 'Very Poor',
        description: 'Full or near-full moon - best for lunar and planetary observations',
        score_modifier: -25
      };
    }
  }
  
  /**
   * Calculate moon rise and set times (simplified estimation)
   * For more accurate times, would need observer's coordinates
   */
  estimateMoonTimes(date, lat, lon) {
    const moonPhase = this.calculateMoonPhase(date);
    
    // Simplified estimation: moon rises ~50 minutes later each day
    // This is a rough approximation - proper calculation requires complex astronomy
    const baseRise = 6 + (moonPhase.age_days * 0.83); // hours
    const baseSet = 18 + (moonPhase.age_days * 0.83); // hours
    
    // Normalize to 24-hour format
    const riseHour = Math.floor(baseRise % 24);
    const riseMinute = Math.floor((baseRise % 1) * 60);
    const setHour = Math.floor(baseSet % 24);
    const setMinute = Math.floor((baseSet % 1) * 60);
    
    return {
      rise: `${String(riseHour).padStart(2, '0')}:${String(riseMinute).padStart(2, '0')}`,
      set: `${String(setHour).padStart(2, '0')}:${String(setMinute).padStart(2, '0')}`,
      note: 'Approximate times - actual times vary by location and date'
    };
  }
  
  /**
   * Get moon phase for multiple dates (for multi-day forecast)
   */
  getMultiDayMoonPhases(startDate, days = 5) {
    const phases = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const moonData = this.calculateMoonPhase(date);
      
      phases.push({
        date: date.toISOString().split('T')[0],
        ...moonData
      });
    }
    
    return phases;
  }
  
  /**
   * Check if moon will interfere with observations during specific time
   */
  checkMoonInterference(date, observationStartHour = 18, observationEndHour = 5) {
    const moonPhase = this.calculateMoonPhase(date);
    const illumination = moonPhase.illumination;
    
    // High illumination during observation hours significantly impacts viewing
    let interference = 'Minimal';
    
    if (illumination > 80) {
      interference = 'Severe';
    } else if (illumination > 60) {
      interference = 'Significant';
    } else if (illumination > 40) {
      interference = 'Moderate';
    } else if (illumination > 20) {
      interference = 'Low';
    }
    
    return {
      level: interference,
      illumination: illumination,
      recommendation: this.getObservationRecommendation(illumination)
    };
  }
  
  /**
   * Get observation recommendations based on moon phase
   */
  getObservationRecommendation(illumination) {
    if (illumination < 10) {
      return 'Excellent time for deep sky objects (galaxies, nebulae, faint star clusters)';
    } else if (illumination < 30) {
      return 'Good for most deep sky objects and double stars';
    } else if (illumination < 50) {
      return 'Focus on brighter deep sky objects and open star clusters';
    } else if (illumination < 70) {
      return 'Best for bright objects, planets, and the moon itself';
    } else {
      return 'Ideal for lunar observations and bright planets - avoid faint deep sky objects';
    }
  }
}

module.exports = new MoonPhaseService();
