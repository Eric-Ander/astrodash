const axios = require('axios');

/**
 * Astronomical Events Service
 * Provides information about ISS passes, meteor showers, planetary events, and solar/lunar data
 */
class AstronomicalEventsService {
  constructor() {
    // Open Notify API for ISS passes
    this.issApiUrl = 'http://api.open-notify.org/iss-pass.json';
    
    // Meteor shower database (annual events)
    this.meteorShowers = this.getMeteorShowerDatabase();
  }

  /**
   * Get all astronomical events for a location
   */
  async getAllEvents(lat, lon, date = new Date()) {
    try {
      const [issPasses, meteorShowers, moonEvents, solarEvents] = await Promise.all([
        this.getISSPasses(lat, lon),
        this.getUpcomingMeteorShowers(date),
        this.getMoonEvents(date),
        this.getSolarEvents(lat, lon, date)
      ]);

      return {
        iss_passes: issPasses,
        meteor_showers: meteorShowers,
        moon_events: moonEvents,
        solar_events: solarEvents,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching astronomical events:', error.message);
      throw error;
    }
  }

  /**
   * Get ISS visible passes for location
   */
  async getISSPasses(lat, lon) {
    try {
      const response = await axios.get(this.issApiUrl, {
        params: {
          lat: lat,
          lon: lon,
          n: 5 // Get next 5 passes
        },
        timeout: 5000
      });

      if (response.data && response.data.response) {
        return response.data.response.map(pass => {
          const riseTime = new Date(pass.risetime * 1000);
          
          return {
            rise_time: riseTime.toISOString(),
            rise_time_local: riseTime.toLocaleString(),
            duration_seconds: pass.duration,
            duration_minutes: Math.round(pass.duration / 60),
            description: `ISS visible for ${Math.round(pass.duration / 60)} minutes`,
            type: 'iss_pass'
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Error fetching ISS passes:', error.message);
      // Return empty array if ISS API fails (non-critical)
      return [];
    }
  }

  /**
   * Get upcoming meteor showers within the next 60 days
   */
  getUpcomingMeteorShowers(currentDate = new Date()) {
    const upcoming = [];
    const currentYear = currentDate.getFullYear();
    const sixtyDaysFromNow = new Date(currentDate);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    this.meteorShowers.forEach(shower => {
      // Calculate peak date for current year
      const peakDate = new Date(currentYear, shower.peakMonth - 1, shower.peakDay);
      
      // If peak has passed this year, check next year
      if (peakDate < currentDate) {
        peakDate.setFullYear(currentYear + 1);
      }

      // If peak is within next 60 days
      if (peakDate <= sixtyDaysFromNow) {
        const daysUntilPeak = Math.ceil((peakDate - currentDate) / (1000 * 60 * 60 * 24));
        
        upcoming.push({
          name: shower.name,
          peak_date: peakDate.toISOString().split('T')[0],
          peak_date_formatted: peakDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          }),
          days_until_peak: daysUntilPeak,
          active_period: shower.activePeriod,
          zhr: shower.zhr,
          description: shower.description,
          best_viewing: shower.bestViewing,
          type: 'meteor_shower'
        });
      }
    });

    return upcoming.sort((a, b) => a.days_until_peak - b.days_until_peak);
  }

  /**
   * Get moon events (new moon, full moon)
   */
  getMoonEvents(date = new Date()) {
    const moonPhaseService = require('./moonPhaseService');
    const currentMoon = moonPhaseService.calculateMoonPhase(date);
    
    const events = [];
    
    // Add next new moon
    const daysToNew = currentMoon.days_to_new_moon;
    const nextNewMoon = new Date(date);
    nextNewMoon.setDate(nextNewMoon.getDate() + Math.round(daysToNew));
    
    events.push({
      name: 'New Moon',
      date: nextNewMoon.toISOString().split('T')[0],
      date_formatted: nextNewMoon.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      }),
      days_until: Math.round(daysToNew),
      description: 'Best time for deep sky observations - no moonlight interference',
      emoji: '🌑',
      type: 'moon_phase'
    });
    
    // Add next full moon
    const daysToFull = currentMoon.days_to_full_moon;
    const nextFullMoon = new Date(date);
    nextFullMoon.setDate(nextFullMoon.getDate() + Math.round(daysToFull));
    
    events.push({
      name: 'Full Moon',
      date: nextFullMoon.toISOString().split('T')[0],
      date_formatted: nextFullMoon.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      }),
      days_until: Math.round(daysToFull),
      description: 'Ideal for lunar observations, challenging for deep sky objects',
      emoji: '🌕',
      type: 'moon_phase'
    });
    
    return events.sort((a, b) => a.days_until - b.days_until);
  }

  /**
   * Get solar events (sunrise, sunset, twilight times)
   */
  getSolarEvents(lat, lon, date = new Date()) {
    const times = this.calculateSunTimes(lat, lon, date);
    
    return {
      sunrise: times.sunrise.toISOString(),
      sunrise_formatted: times.sunrise.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }),
      sunset: times.sunset.toISOString(),
      sunset_formatted: times.sunset.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }),
      civil_twilight_begin: times.civilDawn.toISOString(),
      civil_twilight_end: times.civilDusk.toISOString(),
      nautical_twilight_begin: times.nauticalDawn.toISOString(),
      nautical_twilight_end: times.nauticalDusk.toISOString(),
      astronomical_twilight_begin: times.astronomicalDawn.toISOString(),
      astronomical_twilight_end: times.astronomicalDusk.toISOString(),
      astronomical_twilight_begin_formatted: times.astronomicalDawn.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }),
      astronomical_twilight_end_formatted: times.astronomicalDusk.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }),
      day_length_hours: Math.round((times.sunset - times.sunrise) / (1000 * 60 * 60) * 10) / 10,
      type: 'solar'
    };
  }

  /**
   * Calculate sun times using simplified astronomical formulas
   * Based on sunrise equation
   */
  calculateSunTimes(lat, lon, date) {
    const rad = Math.PI / 180;
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    
    // Solar declination (simplified)
    const declination = 23.45 * Math.sin(rad * (360 / 365) * (dayOfYear - 81));
    
    // Hour angle for different twilight types
    const angles = {
      sunrise: -0.833,      // Actual sunrise/sunset
      civil: -6,            // Civil twilight
      nautical: -12,        // Nautical twilight
      astronomical: -18     // Astronomical twilight
    };
    
    const times = {};
    
    Object.keys(angles).forEach(type => {
      const hourAngle = Math.acos(
        (Math.sin(rad * angles[type]) - Math.sin(rad * lat) * Math.sin(rad * declination)) /
        (Math.cos(rad * lat) * Math.cos(rad * declination))
      ) / rad;
      
      // Calculate times
      const solarNoon = 12 - (lon / 15);
      const rise = solarNoon - (hourAngle / 15);
      const set = solarNoon + (hourAngle / 15);
      
      // Convert to Date objects
      const riseDate = new Date(date);
      riseDate.setHours(Math.floor(rise), Math.round((rise % 1) * 60), 0, 0);
      
      const setDate = new Date(date);
      setDate.setHours(Math.floor(set), Math.round((set % 1) * 60), 0, 0);
      
      if (type === 'sunrise') {
        times.sunrise = riseDate;
        times.sunset = setDate;
      } else if (type === 'civil') {
        times.civilDawn = riseDate;
        times.civilDusk = setDate;
      } else if (type === 'nautical') {
        times.nauticalDawn = riseDate;
        times.nauticalDusk = setDate;
      } else if (type === 'astronomical') {
        times.astronomicalDawn = riseDate;
        times.astronomicalDusk = setDate;
      }
    });
    
    return times;
  }

  /**
   * Meteor Shower Database
   * Annual meteor showers with peak dates and characteristics
   */
  getMeteorShowerDatabase() {
    return [
      {
        name: 'Quadrantids',
        peakMonth: 1,
        peakDay: 3,
        activePeriod: 'Dec 28 - Jan 12',
        zhr: '80-200',
        description: 'One of the best annual meteor showers with bright blue meteors',
        bestViewing: 'After midnight, facing northeast'
      },
      {
        name: 'Lyrids',
        peakMonth: 4,
        peakDay: 22,
        activePeriod: 'Apr 16 - 25',
        zhr: '10-20',
        description: 'Oldest recorded meteor shower, produces bright dust trails',
        bestViewing: 'After midnight, facing east'
      },
      {
        name: 'Eta Aquarids',
        peakMonth: 5,
        peakDay: 6,
        activePeriod: 'Apr 19 - May 28',
        zhr: '40-85',
        description: 'Fast meteors from Halley\'s Comet, best in Southern Hemisphere',
        bestViewing: 'Pre-dawn hours, facing east'
      },
      {
        name: 'Perseids',
        peakMonth: 8,
        peakDay: 12,
        activePeriod: 'Jul 17 - Aug 24',
        zhr: '60-100',
        description: 'Most popular meteor shower, bright and numerous meteors',
        bestViewing: 'After midnight, facing northeast'
      },
      {
        name: 'Orionids',
        peakMonth: 10,
        peakDay: 21,
        activePeriod: 'Oct 2 - Nov 7',
        zhr: '10-20',
        description: 'Fast meteors from Halley\'s Comet, produces long trails',
        bestViewing: 'After midnight, facing south'
      },
      {
        name: 'Leonids',
        peakMonth: 11,
        peakDay: 17,
        activePeriod: 'Nov 6 - 30',
        zhr: '10-15',
        description: 'Known for periodic meteor storms every 33 years',
        bestViewing: 'After midnight, facing east'
      },
      {
        name: 'Geminids',
        peakMonth: 12,
        peakDay: 14,
        activePeriod: 'Dec 4 - 20',
        zhr: '100-150',
        description: 'Best meteor shower of the year, bright and colorful meteors',
        bestViewing: 'After 10 PM, facing south'
      },
      {
        name: 'Ursids',
        peakMonth: 12,
        peakDay: 22,
        activePeriod: 'Dec 17 - 26',
        zhr: '5-10',
        description: 'Minor shower near winter solstice',
        bestViewing: 'After midnight, facing north'
      }
    ];
  }
}

module.exports = new AstronomicalEventsService();
