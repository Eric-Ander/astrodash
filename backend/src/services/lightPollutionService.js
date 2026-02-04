const axios = require('axios');

/**
 * Light Pollution Service
 * Provides Bortle Scale ratings and light pollution information
 */
class LightPollutionService {
  constructor() {
    // We'll use a combination of approaches for reliability
    this.cacheData = new Map();
  }

  /**
   * Get light pollution data for coordinates
   */
  async getLightPollution(lat, lon) {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    
    // Check cache first (valid for 30 days)
    if (this.cacheData.has(cacheKey)) {
      const cached = this.cacheData.get(cacheKey);
      if (Date.now() - cached.timestamp < 30 * 24 * 60 * 60 * 1000) {
        return cached.data;
      }
    }

    try {
      // Try to get real light pollution data
      const realData = await this.fetchLightPollutionData(lat, lon);
      
      if (realData) {
        this.cacheData.set(cacheKey, {
          data: realData,
          timestamp: Date.now()
        });
        return realData;
      }
    } catch (error) {
      console.log('Could not fetch light pollution data, using estimation');
    }

    // Fall back to estimation
    const estimatedData = this.estimateLightPollution(lat, lon);
    return estimatedData;
  }

  /**
   * Attempt to fetch real light pollution data
   * Using a simple estimation approach since free APIs are limited
   */
  async fetchLightPollutionData(lat, lon) {
    // For now, we'll use estimation
    // In future, integrate with: https://www.lightpollutionmap.info/
    // or https://djlorenz.github.io/astronomy/lp2022/
    return null;
  }

  /**
   * Estimate light pollution based on location
   * Uses a simplified model based on population density indicators
   */
  estimateLightPollution(lat, lon) {
    // This is a simplified estimation
    // In practice, we'd want to use actual light pollution data
    // For now, we'll estimate based on known major city coordinates
    
    const cities = this.getMajorCities();
    let minDistance = Infinity;
    let nearestCity = null;

    // Find nearest major city
    cities.forEach(city => {
      const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    });

    // Determine Bortle class based on distance from nearest city
    let bortleClass;
    let artificialBrightness;

    if (minDistance < 10) {
      // Inner city
      bortleClass = nearestCity.size === 'large' ? 9 : 8;
      artificialBrightness = bortleClass === 9 ? 'extreme' : 'severe';
    } else if (minDistance < 30) {
      // Suburban
      bortleClass = nearestCity.size === 'large' ? 7 : 6;
      artificialBrightness = 'high';
    } else if (minDistance < 60) {
      // Rural/suburban transition
      bortleClass = 5;
      artificialBrightness = 'moderate';
    } else if (minDistance < 100) {
      // Rural
      bortleClass = 4;
      artificialBrightness = 'low';
    } else if (minDistance < 200) {
      // Dark rural
      bortleClass = 3;
      artificialBrightness = 'very low';
    } else {
      // Truly dark site
      bortleClass = minDistance < 300 ? 2 : 1;
      artificialBrightness = 'minimal';
    }

    return this.getBortleScaleInfo(bortleClass, artificialBrightness, 'estimated');
  }

  /**
   * Get detailed Bortle Scale information
   */
  getBortleScaleInfo(bortleClass, artificialBrightness, dataSource = 'estimated') {
    const bortleData = {
      1: {
        name: 'Excellent Dark Sky',
        description: 'The zodiacal light, gegenschein, and zodiacal band are visible. The Milky Way appears complex with structures visible.',
        milkyWay: 'Highly detailed with many dark voids',
        limitingMagnitude: '7.6-8.0',
        observations: 'Perfect for all deep-sky observations. Faintest objects visible.',
        color: '#001a00',
        quality: 'Excellent',
        recommendation: 'Ideal location for all types of astronomical observations'
      },
      2: {
        name: 'Typical Dark Sky',
        description: 'Airglow may be weakly visible near horizon. M33 is easy to see. Clouds are dark.',
        milkyWay: 'Detailed with structure visible',
        limitingMagnitude: '7.1-7.5',
        observations: 'Excellent for all observations. Very faint objects visible.',
        color: '#003300',
        quality: 'Excellent',
        recommendation: 'Excellent location for deep-sky and planetary observations'
      },
      3: {
        name: 'Rural Sky',
        description: 'Light pollution dome visible on horizon. Clouds illuminated near horizon, dark overhead.',
        milkyWay: 'Still impressive with good detail',
        limitingMagnitude: '6.6-7.0',
        observations: 'Good for most observations. Fainter Messier objects visible.',
        color: '#004d00',
        quality: 'Very Good',
        recommendation: 'Very good for most astronomical observations'
      },
      4: {
        name: 'Rural/Suburban Transition',
        description: 'Light pollution domes in several directions. Clouds illuminated in directions of light sources.',
        milkyWay: 'Visible but washed out, structure limited',
        limitingMagnitude: '6.1-6.5',
        observations: 'Fair for observations. Brighter Messier objects easily visible.',
        color: '#006600',
        quality: 'Good',
        recommendation: 'Good for bright deep-sky objects and planets'
      },
      5: {
        name: 'Suburban Sky',
        description: 'Light pollution visible in most directions. Clouds noticeably brighter than sky.',
        milkyWay: 'Barely visible near zenith, invisible near horizon',
        limitingMagnitude: '5.6-6.0',
        observations: 'Moderate for observations. Only brighter objects easily visible.',
        color: '#808000',
        quality: 'Fair',
        recommendation: 'Fair for planets, moon, and bright deep-sky objects'
      },
      6: {
        name: 'Bright Suburban Sky',
        description: 'No dark sky in any direction. Clouds anywhere are brighter than sky.',
        milkyWay: 'Invisible or barely visible',
        limitingMagnitude: '5.1-5.5',
        observations: 'Challenging. Only brightest objects visible.',
        color: '#999900',
        quality: 'Poor',
        recommendation: 'Suitable mainly for moon and planets'
      },
      7: {
        name: 'Suburban/Urban Transition',
        description: 'Strong light sources visible in all directions. Sky is grayish.',
        milkyWay: 'Invisible',
        limitingMagnitude: '4.6-5.0',
        observations: 'Very challenging. Only very bright objects visible.',
        color: '#cc9900',
        quality: 'Poor',
        recommendation: 'Moon, planets, and very bright stars only'
      },
      8: {
        name: 'City Sky',
        description: 'Sky is grayish or orange. Only very bright objects visible.',
        milkyWay: 'Invisible',
        limitingMagnitude: '4.1-4.5',
        observations: 'Extremely challenging. Only moon, planets, and brightest stars.',
        color: '#ff6600',
        quality: 'Very Poor',
        recommendation: 'Limited to moon and bright planets'
      },
      9: {
        name: 'Inner City Sky',
        description: 'Entire sky is grayish or brighter. Only the moon, planets, and brightest stars visible.',
        milkyWay: 'Invisible',
        limitingMagnitude: '<4.0',
        observations: 'Nearly impossible except for moon and planets.',
        color: '#ff0000',
        quality: 'Very Poor',
        recommendation: 'Consider traveling to darker skies for astronomy'
      }
    };

    const info = bortleData[bortleClass];

    return {
      bortle_class: bortleClass,
      class_name: info.name,
      description: info.description,
      milky_way_visibility: info.milkyWay,
      limiting_magnitude: info.limitingMagnitude,
      observations: info.observations,
      color: info.color,
      quality: info.quality,
      recommendation: info.recommendation,
      artificial_brightness: artificialBrightness,
      data_source: dataSource,
      emoji: this.getBortleEmoji(bortleClass)
    };
  }

  /**
   * Get emoji representation for Bortle class
   */
  getBortleEmoji(bortleClass) {
    if (bortleClass <= 2) return '🌌'; // Excellent
    if (bortleClass <= 4) return '🌃'; // Good
    if (bortleClass <= 6) return '🌆'; // Fair
    return '🏙️'; // Poor
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Database of major cities for estimation
   */
  getMajorCities() {
    return [
      // Europe
      { name: 'London', lat: 51.5074, lon: -0.1278, size: 'large' },
      { name: 'Paris', lat: 48.8566, lon: 2.3522, size: 'large' },
      { name: 'Berlin', lat: 52.5200, lon: 13.4050, size: 'large' },
      { name: 'Madrid', lat: 40.4168, lon: -3.7038, size: 'large' },
      { name: 'Rome', lat: 41.9028, lon: 12.4964, size: 'large' },
      { name: 'Zurich', lat: 47.3769, lon: 8.5417, size: 'medium' },
      { name: 'Geneva', lat: 46.2044, lon: 6.1432, size: 'medium' },
      { name: 'Vienna', lat: 48.2082, lon: 16.3738, size: 'large' },
      { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, size: 'large' },
      { name: 'Brussels', lat: 50.8503, lon: 4.3517, size: 'large' },
      
      // North America
      { name: 'New York', lat: 40.7128, lon: -74.0060, size: 'large' },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, size: 'large' },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298, size: 'large' },
      { name: 'Toronto', lat: 43.6532, lon: -79.3832, size: 'large' },
      { name: 'Mexico City', lat: 19.4326, lon: -99.1332, size: 'large' },
      
      // Asia
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, size: 'large' },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074, size: 'large' },
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737, size: 'large' },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, size: 'large' },
      { name: 'Seoul', lat: 37.5665, lon: 126.9780, size: 'large' },
      { name: 'Singapore', lat: 1.3521, lon: 103.8198, size: 'large' },
      
      // Australia
      { name: 'Sydney', lat: -33.8688, lon: 151.2093, size: 'large' },
      { name: 'Melbourne', lat: -37.8136, lon: 144.9631, size: 'large' },
      
      // South America
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333, size: 'large' },
      { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, size: 'large' },
      
      // Africa
      { name: 'Cairo', lat: 30.0444, lon: 31.2357, size: 'large' },
      { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, size: 'large' }
    ];
  }
}

module.exports = new LightPollutionService();
