const astronomicalEventsService = require('../services/astronomicalEventsService');
const weatherService = require('../services/weatherService');

class EventsController {
  /**
   * Get all astronomical events for a location
   */
  async getEvents(req, res) {
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

      // Get all astronomical events
      const events = await astronomicalEventsService.getAllEvents(lat, lon);

      // Build response
      const response = {
        location: {
          name: locationName || `${lat}, ${lon}`,
          coordinates: {
            lat: lat,
            lon: lon
          }
        },
        events: events
      };

      res.json(response);

    } catch (error) {
      console.error('Error in getEvents:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Failed to fetch astronomical events'
      });
    }
  }

  /**
   * Get ISS passes only
   */
  async getISSPasses(req, res) {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'Valid latitude and longitude are required'
        });
      }

      const passes = await astronomicalEventsService.getISSPasses(lat, lon);

      res.json({
        location: { lat, lon },
        iss_passes: passes
      });

    } catch (error) {
      console.error('Error in getISSPasses:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Failed to fetch ISS passes'
      });
    }
  }

  /**
   * Get meteor showers only
   */
  async getMeteorShowers(req, res) {
    try {
      const showers = astronomicalEventsService.getUpcomingMeteorShowers();

      res.json({
        meteor_showers: showers
      });

    } catch (error) {
      console.error('Error in getMeteorShowers:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Failed to fetch meteor showers'
      });
    }
  }
}

module.exports = new EventsController();
