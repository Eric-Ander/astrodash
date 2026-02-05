const axios = require('axios');

/**
 * Light Pollution Service
 * Provides Bortle Scale ratings and light pollution information.
 *
 * Uses a cumulative brightness model (Walker's Law variant) with a
 * comprehensive city database to estimate light pollution at any coordinate.
 */
class LightPollutionService {
  constructor() {
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
      const realData = await this.fetchLightPollutionData(lat, lon);
      if (realData) {
        this.cacheData.set(cacheKey, { data: realData, timestamp: Date.now() });
        return realData;
      }
    } catch (error) {
      console.log('Could not fetch light pollution data, using estimation');
    }

    // Fall back to estimation
    const estimatedData = this.estimateLightPollution(lat, lon);
    this.cacheData.set(cacheKey, { data: estimatedData, timestamp: Date.now() });
    return estimatedData;
  }

  /**
   * Attempt to fetch real light pollution data.
   * Placeholder for future integration with lightpollutionmap.info or VIIRS data.
   */
  async fetchLightPollutionData(lat, lon) {
    return null;
  }

  /**
   * Estimate light pollution using a cumulative brightness model.
   *
   * For every city within 300 km, computes a brightness contribution using
   * a Walker's-Law-inspired formula:
   *   contribution = population / (distance + buffer)^2.5
   *
   * The buffer constant (5 km) prevents a singularity at d=0 and models the
   * fact that light sources are spread over the urban area, not concentrated
   * at a point.
   *
   * The cumulative brightness is then mapped to a Bortle class via
   * thresholds calibrated against known reference points:
   *   - Basel city centre (~175k pop) ≈ Bortle 6
   *   - Zurich city centre (~430k pop) ≈ Bortle 7
   *   - London / Paris centre ≈ Bortle 8-9
   *   - Rural Swiss Jura (~60 km from cities) ≈ Bortle 4
   *   - Remote alpine valley ≈ Bortle 2-3
   */
  estimateLightPollution(lat, lon) {
    const cities = this.getCityDatabase();
    const BUFFER = 5; // km – minimum effective distance
    const MAX_RANGE = 300; // km – ignore cities farther than this

    let totalBrightness = 0;
    let nearestCity = null;
    let nearestDistance = Infinity;

    for (const city of cities) {
      const distance = this.calculateDistance(lat, lon, city.lat, city.lon);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCity = city;
      }

      if (distance < MAX_RANGE) {
        const effectiveDistance = distance + BUFFER;
        totalBrightness += city.pop / Math.pow(effectiveDistance, 2.5);
      }
    }

    // Map cumulative brightness to Bortle class.
    // Thresholds calibrated so that:
    //   Basel centre  ≈ 3,200 → Bortle 6
    //   Zurich centre ≈ 8,000 → Bortle 7
    //   London centre ≈ 170k  → Bortle 9
    //   Rural 60km    ≈ 100   → Bortle 4
    //   Remote 200km+ ≈ <1    → Bortle 1-2
    let bortleClass;
    if (totalBrightness > 50000) bortleClass = 9;
    else if (totalBrightness > 15000) bortleClass = 8;
    else if (totalBrightness > 5000) bortleClass = 7;
    else if (totalBrightness > 1500) bortleClass = 6;
    else if (totalBrightness > 400) bortleClass = 5;
    else if (totalBrightness > 80) bortleClass = 4;
    else if (totalBrightness > 10) bortleClass = 3;
    else if (totalBrightness > 1) bortleClass = 2;
    else bortleClass = 1;

    const brightnessLabels = {
      1: 'minimal', 2: 'minimal', 3: 'very low', 4: 'low',
      5: 'moderate', 6: 'moderate', 7: 'high',
      8: 'severe', 9: 'extreme',
    };

    return this.getBortleScaleInfo(
      bortleClass,
      brightnessLabels[bortleClass],
      'estimated',
      nearestCity?.name,
    );
  }

  /**
   * Get detailed Bortle Scale information
   */
  getBortleScaleInfo(bortleClass, artificialBrightness, dataSource = 'estimated', nearestCityName = null) {
    const bortleData = {
      1: {
        name: 'Excellent Dark Sky',
        description: 'The zodiacal light, gegenschein, and zodiacal band are visible. The Milky Way appears complex with structures visible.',
        milkyWay: 'Highly detailed with many dark voids',
        limitingMagnitude: '7.6-8.0',
        observations: 'Perfect for all deep-sky observations. Faintest objects visible.',
        color: '#001a00',
        quality: 'Excellent',
        recommendation: 'Ideal location for all types of astronomical observations',
      },
      2: {
        name: 'Typical Dark Sky',
        description: 'Airglow may be weakly visible near horizon. M33 is easy to see. Clouds are dark.',
        milkyWay: 'Detailed with structure visible',
        limitingMagnitude: '7.1-7.5',
        observations: 'Excellent for all observations. Very faint objects visible.',
        color: '#003300',
        quality: 'Excellent',
        recommendation: 'Excellent location for deep-sky and planetary observations',
      },
      3: {
        name: 'Rural Sky',
        description: 'Light pollution dome visible on horizon. Clouds illuminated near horizon, dark overhead.',
        milkyWay: 'Still impressive with good detail',
        limitingMagnitude: '6.6-7.0',
        observations: 'Good for most observations. Fainter Messier objects visible.',
        color: '#004d00',
        quality: 'Very Good',
        recommendation: 'Very good for most astronomical observations',
      },
      4: {
        name: 'Rural/Suburban Transition',
        description: 'Light pollution domes in several directions. Clouds illuminated in directions of light sources.',
        milkyWay: 'Visible but washed out, structure limited',
        limitingMagnitude: '6.1-6.5',
        observations: 'Fair for observations. Brighter Messier objects easily visible.',
        color: '#006600',
        quality: 'Good',
        recommendation: 'Good for bright deep-sky objects and planets',
      },
      5: {
        name: 'Suburban Sky',
        description: 'Light pollution visible in most directions. Clouds noticeably brighter than sky.',
        milkyWay: 'Barely visible near zenith, invisible near horizon',
        limitingMagnitude: '5.6-6.0',
        observations: 'Moderate for observations. Only brighter objects easily visible.',
        color: '#808000',
        quality: 'Fair',
        recommendation: 'Fair for planets, moon, and bright deep-sky objects',
      },
      6: {
        name: 'Bright Suburban Sky',
        description: 'No dark sky in any direction. Clouds anywhere are brighter than sky.',
        milkyWay: 'Invisible or barely visible',
        limitingMagnitude: '5.1-5.5',
        observations: 'Challenging. Only brightest objects visible.',
        color: '#999900',
        quality: 'Poor',
        recommendation: 'Suitable mainly for moon and planets',
      },
      7: {
        name: 'Suburban/Urban Transition',
        description: 'Strong light sources visible in all directions. Sky is grayish.',
        milkyWay: 'Invisible',
        limitingMagnitude: '4.6-5.0',
        observations: 'Very challenging. Only very bright objects visible.',
        color: '#cc9900',
        quality: 'Poor',
        recommendation: 'Moon, planets, and very bright stars only',
      },
      8: {
        name: 'City Sky',
        description: 'Sky is grayish or orange. Only very bright objects visible.',
        milkyWay: 'Invisible',
        limitingMagnitude: '4.1-4.5',
        observations: 'Extremely challenging. Only moon, planets, and brightest stars.',
        color: '#ff6600',
        quality: 'Very Poor',
        recommendation: 'Limited to moon and bright planets',
      },
      9: {
        name: 'Inner City Sky',
        description: 'Entire sky is grayish or brighter. Only the moon, planets, and brightest stars visible.',
        milkyWay: 'Invisible',
        limitingMagnitude: '<4.0',
        observations: 'Nearly impossible except for moon and planets.',
        color: '#ff0000',
        quality: 'Very Poor',
        recommendation: 'Consider traveling to darker skies for astronomy',
      },
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
      nearest_city: nearestCityName,
      emoji: this.getBortleEmoji(bortleClass),
    };
  }

  /**
   * Get emoji representation for Bortle class
   */
  getBortleEmoji(bortleClass) {
    if (bortleClass <= 2) return '🌌';
    if (bortleClass <= 4) return '🌃';
    if (bortleClass <= 6) return '🌆';
    return '🏙️';
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @returns distance in km
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Comprehensive city database with population figures.
   *
   * Populations are approximate city-proper figures (not metro) so that
   * surrounding towns can be added separately for more accurate modelling
   * of light pollution spread.
   *
   * Focused on Europe (especially Switzerland and neighbours) since this
   * is the primary user base, with worldwide coverage for major cities.
   */
  getCityDatabase() {
    return [
      // ── Switzerland ─────────────────────────────────────────────────
      { name: 'Zurich', lat: 47.3769, lon: 8.5417, pop: 430000 },
      { name: 'Geneva', lat: 46.2044, lon: 6.1432, pop: 205000 },
      { name: 'Basel', lat: 47.5596, lon: 7.5886, pop: 175000 },
      { name: 'Bern', lat: 46.9480, lon: 7.4474, pop: 134000 },
      { name: 'Lausanne', lat: 46.5197, lon: 6.6323, pop: 140000 },
      { name: 'Winterthur', lat: 47.4984, lon: 8.7241, pop: 115000 },
      { name: 'Lucerne', lat: 47.0502, lon: 8.3093, pop: 82000 },
      { name: 'St. Gallen', lat: 47.4245, lon: 9.3767, pop: 80000 },
      { name: 'Lugano', lat: 46.0037, lon: 8.9511, pop: 63000 },
      { name: 'Biel/Bienne', lat: 47.1368, lon: 7.2467, pop: 55000 },
      { name: 'Thun', lat: 46.7580, lon: 7.6280, pop: 44000 },
      { name: 'Aarau', lat: 47.3925, lon: 8.0444, pop: 21000 },
      { name: 'Schaffhausen', lat: 47.6960, lon: 8.6350, pop: 37000 },
      { name: 'Fribourg', lat: 46.8065, lon: 7.1620, pop: 38000 },
      { name: 'Chur', lat: 46.8499, lon: 9.5329, pop: 38000 },
      { name: 'Neuchâtel', lat: 46.9900, lon: 6.9293, pop: 34000 },
      { name: 'Sion', lat: 46.2328, lon: 7.3594, pop: 35000 },
      { name: 'Olten', lat: 47.3500, lon: 7.9000, pop: 19000 },
      { name: 'Baden', lat: 47.4733, lon: 8.3066, pop: 19000 },
      { name: 'Solothurn', lat: 47.2088, lon: 7.5372, pop: 17000 },
      { name: 'Zug', lat: 47.1724, lon: 8.5170, pop: 32000 },
      { name: 'Rapperswil-Jona', lat: 47.2268, lon: 8.8310, pop: 27000 },
      { name: 'Wettingen', lat: 47.4622, lon: 8.3254, pop: 21000 },
      { name: 'Allschwil', lat: 47.5507, lon: 7.5359, pop: 21000 },
      { name: 'Reinach BL', lat: 47.4932, lon: 7.5939, pop: 19000 },
      { name: 'Riehen', lat: 47.5787, lon: 7.6465, pop: 21000 },
      { name: 'Muttenz', lat: 47.5224, lon: 7.6446, pop: 18000 },
      { name: 'Pratteln', lat: 47.5212, lon: 7.6921, pop: 17000 },
      { name: 'Liestal', lat: 47.4842, lon: 7.7346, pop: 14000 },
      { name: 'Köniz', lat: 46.9244, lon: 7.4138, pop: 42000 },
      { name: 'Emmen', lat: 47.0764, lon: 8.3053, pop: 31000 },
      { name: 'Kriens', lat: 47.0342, lon: 8.2835, pop: 28000 },
      { name: 'Uster', lat: 47.3475, lon: 8.7215, pop: 35000 },
      { name: 'Dübendorf', lat: 47.3972, lon: 8.6181, pop: 29000 },
      { name: 'Dietikon', lat: 47.4041, lon: 8.3998, pop: 28000 },
      { name: 'Wädenswil', lat: 47.2303, lon: 8.6711, pop: 24000 },

      // ── Basel border region (France & Germany) ──────────────────────
      { name: 'Lörrach', lat: 47.6153, lon: 7.6615, pop: 50000 },
      { name: 'Weil am Rhein', lat: 47.5933, lon: 7.6214, pop: 30000 },
      { name: 'Saint-Louis', lat: 47.5856, lon: 7.5647, pop: 22000 },

      // ── Germany ─────────────────────────────────────────────────────
      { name: 'Berlin', lat: 52.5200, lon: 13.4050, pop: 3600000 },
      { name: 'Hamburg', lat: 53.5511, lon: 9.9937, pop: 1900000 },
      { name: 'Munich', lat: 48.1351, lon: 11.5820, pop: 1500000 },
      { name: 'Cologne', lat: 50.9375, lon: 6.9603, pop: 1080000 },
      { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, pop: 760000 },
      { name: 'Stuttgart', lat: 48.7758, lon: 9.1829, pop: 630000 },
      { name: 'Düsseldorf', lat: 51.2277, lon: 6.7735, pop: 620000 },
      { name: 'Dortmund', lat: 51.5136, lon: 7.4653, pop: 590000 },
      { name: 'Essen', lat: 51.4556, lon: 7.0116, pop: 580000 },
      { name: 'Leipzig', lat: 51.3397, lon: 12.3731, pop: 600000 },
      { name: 'Hanover', lat: 52.3759, lon: 9.7320, pop: 530000 },
      { name: 'Nuremberg', lat: 49.4521, lon: 11.0767, pop: 520000 },
      { name: 'Mannheim', lat: 49.4875, lon: 8.4660, pop: 310000 },
      { name: 'Karlsruhe', lat: 49.0069, lon: 8.4037, pop: 310000 },
      { name: 'Freiburg im Breisgau', lat: 47.9990, lon: 7.8421, pop: 230000 },
      { name: 'Konstanz', lat: 47.6603, lon: 9.1758, pop: 85000 },
      { name: 'Singen', lat: 47.7594, lon: 8.8406, pop: 48000 },
      { name: 'Offenburg', lat: 48.4721, lon: 7.9428, pop: 62000 },

      // ── France ──────────────────────────────────────────────────────
      { name: 'Paris', lat: 48.8566, lon: 2.3522, pop: 2161000 },
      { name: 'Lyon', lat: 45.7640, lon: 4.8357, pop: 515000 },
      { name: 'Marseille', lat: 43.2965, lon: 5.3698, pop: 870000 },
      { name: 'Toulouse', lat: 43.6047, lon: 1.4442, pop: 480000 },
      { name: 'Nice', lat: 43.7102, lon: 7.2620, pop: 340000 },
      { name: 'Strasbourg', lat: 48.5734, lon: 7.7521, pop: 280000 },
      { name: 'Mulhouse', lat: 47.7508, lon: 7.3359, pop: 110000 },
      { name: 'Colmar', lat: 48.0794, lon: 7.3558, pop: 70000 },
      { name: 'Belfort', lat: 47.6400, lon: 6.8600, pop: 47000 },
      { name: 'Besançon', lat: 47.2378, lon: 6.0241, pop: 120000 },
      { name: 'Dijon', lat: 47.3220, lon: 5.0415, pop: 160000 },

      // ── Austria ─────────────────────────────────────────────────────
      { name: 'Vienna', lat: 48.2082, lon: 16.3738, pop: 1900000 },
      { name: 'Graz', lat: 47.0707, lon: 15.4395, pop: 290000 },
      { name: 'Linz', lat: 48.3069, lon: 14.2858, pop: 205000 },
      { name: 'Salzburg', lat: 47.8095, lon: 13.0550, pop: 155000 },
      { name: 'Innsbruck', lat: 47.2692, lon: 11.4041, pop: 130000 },
      { name: 'Bregenz', lat: 47.5031, lon: 9.7471, pop: 30000 },
      { name: 'Feldkirch', lat: 47.2354, lon: 9.5978, pop: 34000 },
      { name: 'Dornbirn', lat: 47.4125, lon: 9.7417, pop: 50000 },

      // ── Italy (north) ──────────────────────────────────────────────
      { name: 'Milan', lat: 45.4642, lon: 9.1900, pop: 1400000 },
      { name: 'Turin', lat: 45.0703, lon: 7.6869, pop: 870000 },
      { name: 'Rome', lat: 41.9028, lon: 12.4964, pop: 2870000 },
      { name: 'Florence', lat: 43.7696, lon: 11.2558, pop: 380000 },
      { name: 'Bologna', lat: 44.4949, lon: 11.3426, pop: 390000 },
      { name: 'Venice', lat: 45.4408, lon: 12.3155, pop: 260000 },
      { name: 'Verona', lat: 45.4384, lon: 10.9916, pop: 260000 },
      { name: 'Genoa', lat: 44.4056, lon: 8.9463, pop: 580000 },
      { name: 'Bolzano', lat: 46.4983, lon: 11.3548, pop: 108000 },
      { name: 'Como', lat: 45.8081, lon: 9.0852, pop: 84000 },

      // ── Benelux ─────────────────────────────────────────────────────
      { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, pop: 870000 },
      { name: 'Rotterdam', lat: 51.9225, lon: 4.4792, pop: 650000 },
      { name: 'The Hague', lat: 52.0705, lon: 4.3007, pop: 545000 },
      { name: 'Brussels', lat: 50.8503, lon: 4.3517, pop: 1200000 },
      { name: 'Antwerp', lat: 51.2194, lon: 4.4025, pop: 530000 },
      { name: 'Luxembourg City', lat: 49.6117, lon: 6.1300, pop: 130000 },

      // ── UK & Ireland ────────────────────────────────────────────────
      { name: 'London', lat: 51.5074, lon: -0.1278, pop: 9000000 },
      { name: 'Manchester', lat: 53.4808, lon: -2.2426, pop: 550000 },
      { name: 'Birmingham', lat: 52.4862, lon: -1.8904, pop: 1150000 },
      { name: 'Edinburgh', lat: 55.9533, lon: -3.1883, pop: 525000 },

      // ── Iberia ──────────────────────────────────────────────────────
      { name: 'Madrid', lat: 40.4168, lon: -3.7038, pop: 3300000 },
      { name: 'Barcelona', lat: 41.3874, lon: 2.1686, pop: 1600000 },

      // ── Nordics ─────────────────────────────────────────────────────
      { name: 'Stockholm', lat: 59.3293, lon: 18.0686, pop: 980000 },
      { name: 'Copenhagen', lat: 55.6761, lon: 12.5683, pop: 640000 },
      { name: 'Oslo', lat: 59.9139, lon: 10.7522, pop: 690000 },
      { name: 'Helsinki', lat: 60.1699, lon: 24.9384, pop: 660000 },

      // ── Eastern Europe ──────────────────────────────────────────────
      { name: 'Warsaw', lat: 52.2297, lon: 21.0122, pop: 1790000 },
      { name: 'Prague', lat: 50.0755, lon: 14.4378, pop: 1310000 },
      { name: 'Budapest', lat: 47.4979, lon: 19.0402, pop: 1750000 },
      { name: 'Bucharest', lat: 44.4268, lon: 26.1025, pop: 1800000 },

      // ── North America ───────────────────────────────────────────────
      { name: 'New York', lat: 40.7128, lon: -74.0060, pop: 8300000 },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, pop: 3900000 },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298, pop: 2700000 },
      { name: 'Toronto', lat: 43.6532, lon: -79.3832, pop: 2930000 },
      { name: 'Montreal', lat: 45.5017, lon: -73.5673, pop: 1780000 },
      { name: 'Houston', lat: 29.7604, lon: -95.3698, pop: 2300000 },
      { name: 'Phoenix', lat: 33.4484, lon: -112.0740, pop: 1600000 },
      { name: 'Denver', lat: 39.7392, lon: -104.9903, pop: 710000 },
      { name: 'San Francisco', lat: 37.7749, lon: -122.4194, pop: 870000 },
      { name: 'Mexico City', lat: 19.4326, lon: -99.1332, pop: 9200000 },

      // ── Asia ────────────────────────────────────────────────────────
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, pop: 14000000 },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074, pop: 21500000 },
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737, pop: 24900000 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, pop: 12500000 },
      { name: 'Seoul', lat: 37.5665, lon: 126.9780, pop: 9700000 },
      { name: 'Singapore', lat: 1.3521, lon: 103.8198, pop: 5700000 },
      { name: 'Dubai', lat: 25.2048, lon: 55.2708, pop: 3300000 },

      // ── Oceania ─────────────────────────────────────────────────────
      { name: 'Sydney', lat: -33.8688, lon: 151.2093, pop: 5300000 },
      { name: 'Melbourne', lat: -37.8136, lon: 144.9631, pop: 5000000 },

      // ── South America ───────────────────────────────────────────────
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333, pop: 12300000 },
      { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, pop: 3100000 },
      { name: 'Lima', lat: -12.0464, lon: -77.0428, pop: 10000000 },

      // ── Africa ──────────────────────────────────────────────────────
      { name: 'Cairo', lat: 30.0444, lon: 31.2357, pop: 10000000 },
      { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, pop: 5800000 },
      { name: 'Cape Town', lat: -33.9249, lon: 18.4241, pop: 4600000 },
    ];
  }
}

module.exports = new LightPollutionService();
