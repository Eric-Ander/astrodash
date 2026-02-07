const weatherService = require('../services/weatherService');
const astronomyScoreService = require('../services/astronomyScoreService');
const moonPhaseService = require('../services/moonPhaseService');
const lightPollutionService = require('../services/lightPollutionService');

class WeatherController {
  /**
   * Get tonight's astronomical weather forecast
   * Accepts either lat/lon coordinates or city name
   */
  async getForecast(req, res) {
    try {
      let lat, lon, locationName;

      // Check if coordinates are provided
      if (req.query.lat && req.query.lon) {
        lat = parseFloat(req.query.lat);
        lon = parseFloat(req.query.lon);

        // Validate coordinates
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
          });
        }
      } 
      // Check if city name is provided
      else if (req.query.city) {
        const cityName = req.query.city.trim();
        
        if (!cityName) {
          return res.status(400).json({
            error: 'Invalid city name',
            message: 'City name cannot be empty'
          });
        }

        // Get coordinates from city name
        const location = await weatherService.getCoordinatesFromCity(cityName);
        
        if (!location) {
          return res.status(404).json({
            error: 'Location not found',
            message: `Could not find coordinates for city: ${cityName}`
          });
        }

        lat = location.lat;
        lon = location.lon;
        locationName = location.state 
          ? `${location.name}, ${location.state}, ${location.country}`
          : `${location.name}, ${location.country}`;
      } 
      else {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Please provide either lat/lon coordinates or a city name'
        });
      }

      // Get tonight's forecast
      const tonightForecast = await weatherService.getTonightForecast(lat, lon);

      // Process forecast with astronomy scores
      const processedData = astronomyScoreService.processNightForecast(
        tonightForecast.forecast
      );

      // Get moon phase information
      const moonPhase = moonPhaseService.calculateMoonPhase(new Date());
      const moonTimes = moonPhaseService.estimateMoonTimes(new Date(), lat, lon);
      const moonInterference = moonPhaseService.checkMoonInterference(new Date());

      // Get light pollution data
      const lightPollution = await lightPollutionService.getLightPollution(lat, lon);

      // Build response
      const response = {
        location: {
          name: locationName || tonightForecast.location.city,
          coordinates: {
            lat: tonightForecast.location.lat,
            lon: tonightForecast.location.lon
          },
          country: tonightForecast.location.country
        },
        tonight: {
          start: tonightForecast.tonight_start,
          end: tonightForecast.tonight_end
        },
        light_pollution: lightPollution,
        moon: {
          phase: moonPhase.phase_name,
          illumination: moonPhase.illumination,
          age_days: moonPhase.age_days,
          emoji: moonPhase.emoji,
          visibility_impact: moonPhase.visibility_impact,
          rise_time: moonTimes.rise,
          set_time: moonTimes.set,
          interference: moonInterference,
          recommendation: moonPhase.visibility_impact.description
        },
        summary: processedData.summary,
        best_observation_time: processedData.best_time,
        hourly_forecast: processedData.hourly_forecast
      };

      res.json(response);

    } catch (error) {
      console.error('Error in getForecast:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Failed to fetch weather forecast'
      });
    }
  }

  /**
   * Get multi-day astronomical weather forecast
   * Accepts either lat/lon coordinates or city name
   * Optional days parameter (default: 5)
   */
  async getMultiDayForecast(req, res) {
    try {
      let lat, lon, locationName;
      const days = parseInt(req.query.days) || 5;

      // Validate days parameter
      if (days < 1 || days > 5) {
        return res.status(400).json({
          error: 'Invalid days parameter',
          message: 'Days must be between 1 and 5'
        });
      }

      // Check if coordinates are provided
      if (req.query.lat && req.query.lon) {
        lat = parseFloat(req.query.lat);
        lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
          });
        }
      } 
      // Check if city name is provided
      else if (req.query.city) {
        const cityName = req.query.city.trim();
        
        if (!cityName) {
          return res.status(400).json({
            error: 'Invalid city name',
            message: 'City name cannot be empty'
          });
        }

        const location = await weatherService.getCoordinatesFromCity(cityName);
        
        if (!location) {
          return res.status(404).json({
            error: 'Location not found',
            message: `Could not find coordinates for city: ${cityName}`
          });
        }

        lat = location.lat;
        lon = location.lon;
        locationName = location.state 
          ? `${location.name}, ${location.state}, ${location.country}`
          : `${location.name}, ${location.country}`;
      } 
      else {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Please provide either lat/lon coordinates or a city name'
        });
      }

      // Get multi-day forecast
      const multiDayForecast = await weatherService.getMultiDayNightForecast(lat, lon, days);

      // Get moon phases for each night
      const startDate = new Date();
      const moonPhases = moonPhaseService.getMultiDayMoonPhases(startDate, days);

      // Process each night's forecast
      const processedNights = multiDayForecast.nights.map((night, index) => {
        const processedData = astronomyScoreService.processNightForecast(night.forecast);
        
        return {
          date: night.date,
          night_start: night.night_start,
          night_end: night.night_end,
          moon: moonPhases[index],
          summary: processedData.summary,
          best_observation_time: processedData.best_time,
          hourly_forecast: processedData.hourly_forecast
        };
      });

      // Build response
      const response = {
        location: {
          name: locationName || multiDayForecast.location.city,
          coordinates: {
            lat: multiDayForecast.location.lat,
            lon: multiDayForecast.location.lon
          },
          country: multiDayForecast.location.country
        },
        nights: processedNights
      };

      res.json(response);

    } catch (error) {
      console.error('Error in getMultiDayForecast:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Failed to fetch multi-day weather forecast'
      });
    }
  }

  /**
   * Search for cities by name - returns multiple results for disambiguation
   */
  async searchCities(req, res) {
    try {
      const cityName = req.query.city?.trim();

      if (!cityName) {
        return res.status(400).json({
          error: 'Missing parameter',
          message: 'City name is required'
        });
      }

      const cities = await weatherService.searchCities(cityName, 10);

      if (cities.length === 0) {
        return res.status(404).json({
          error: 'No results found',
          message: `No cities found matching: ${cityName}`
        });
      }

      res.json({
        query: cityName,
        count: cities.length,
        cities: cities
      });

    } catch (error) {
      console.error('Error in searchCities:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Failed to search for cities'
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    res.json({
      status: 'ok',
      service: 'AstroWeather API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new WeatherController();
