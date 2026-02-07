const axios = require('axios');
const db = require('../config/database');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_DURATION = parseInt(process.env.CACHE_DURATION) || 60; // minutes

class WeatherService {
  constructor() {
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get coordinates from city name using OpenWeather Geocoding API
   */
  async getCoordinatesFromCity(cityName) {
    try {
      const url = `http://api.openweathermap.org/geo/1.0/direct`;
      const response = await axios.get(url, {
        params: {
          q: cityName,
          limit: 1,
          appid: OPENWEATHER_API_KEY
        }
      });

      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        return {
          lat: location.lat,
          lon: location.lon,
          name: location.name,
          country: location.country,
          state: location.state || null
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching coordinates:', error.message);
      throw new Error('Failed to fetch coordinates for the city');
    }
  }

  /**
   * Search for cities matching a name - returns up to 10 results for disambiguation
   */
  async searchCities(cityName, limit = 10) {
    try {
      const url = `http://api.openweathermap.org/geo/1.0/direct`;
      const response = await axios.get(url, {
        params: {
          q: cityName,
          limit: limit,
          appid: OPENWEATHER_API_KEY
        }
      });

      if (response.data && response.data.length > 0) {
        return response.data.map(location => ({
          lat: location.lat,
          lon: location.lon,
          name: location.name,
          country: location.country,
          state: location.state || null,
          displayName: location.state
            ? `${location.name}, ${location.state}, ${location.country}`
            : `${location.name}, ${location.country}`
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching cities:', error.message);
      throw new Error('Failed to search for cities');
    }
  }

  /**
   * Check if we have valid cached forecast data
   */
  getCachedForecast(lat, lon) {
    try {
      const stmt = db.prepare(`
        SELECT forecast_data 
        FROM forecast_cache 
        WHERE latitude = ? 
          AND longitude = ? 
          AND expires_at > datetime('now')
        ORDER BY fetched_at DESC 
        LIMIT 1
      `);

      const result = stmt.get(lat, lon);
      
      if (result) {
        return JSON.parse(result.forecast_data);
      }
      
      return null;
    } catch (error) {
      console.error('Error reading cache:', error.message);
      return null;
    }
  }

  /**
   * Save forecast data to cache
   */
  cacheForecast(lat, lon, forecastData) {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + CACHE_DURATION);

      const stmt = db.prepare(`
        INSERT INTO forecast_cache (latitude, longitude, forecast_data, expires_at)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(lat, lon, JSON.stringify(forecastData), expiresAt.toISOString());
      
      // Clean up old cache entries (older than 24 hours)
      const cleanupStmt = db.prepare(`
        DELETE FROM forecast_cache 
        WHERE fetched_at < datetime('now', '-24 hours')
      `);
      cleanupStmt.run();
      
    } catch (error) {
      console.error('Error caching forecast:', error.message);
    }
  }

  /**
   * Fetch forecast data from OpenWeatherMap API
   */
  async fetchForecastFromAPI(lat, lon) {
    try {
      const url = `${this.baseUrl}/forecast`;
      const response = await axios.get(url, {
        params: {
          lat: lat,
          lon: lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching forecast from API:', error.message);
      throw new Error('Failed to fetch weather data from OpenWeatherMap');
    }
  }

  /**
   * Get weather forecast for coordinates
   */
  async getForecast(lat, lon) {
    // Try to get from cache first
    const cached = this.getCachedForecast(lat, lon);
    if (cached) {
      console.log('Returning cached forecast');
      return cached;
    }

    // Fetch from API if not in cache
    console.log('Fetching fresh forecast from API');
    const forecast = await this.fetchForecastFromAPI(lat, lon);
    
    // Cache the result
    this.cacheForecast(lat, lon, forecast);
    
    return forecast;
  }

  /**
   * Get tonight's forecast (18:00 - 05:00)
   */
  async getTonightForecast(lat, lon) {
    const forecast = await this.getForecast(lat, lon);
    
    if (!forecast || !forecast.list) {
      throw new Error('Invalid forecast data received');
    }

    // Get current date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Define tonight's time range (18:00 today to 05:00 tomorrow)
    const tonightStart = new Date(today);
    tonightStart.setHours(18, 0, 0, 0);
    
    const tonightEnd = new Date(today);
    tonightEnd.setDate(tonightEnd.getDate() + 1);
    tonightEnd.setHours(5, 0, 0, 0);

    // If it's past midnight but before 5 AM, adjust the range
    if (now.getHours() < 5) {
      tonightStart.setDate(tonightStart.getDate() - 1);
      tonightEnd.setDate(tonightEnd.getDate() - 1);
    }

    // Filter forecast data for tonight
    const tonightData = forecast.list.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate >= tonightStart && itemDate <= tonightEnd;
    });

    return {
      location: {
        lat: lat,
        lon: lon,
        city: forecast.city.name,
        country: forecast.city.country
      },
      tonight_start: tonightStart.toISOString(),
      tonight_end: tonightEnd.toISOString(),
      forecast: tonightData
    };
  }

  /**
   * Get multi-day night forecasts (18:00 - 05:00 for each night)
   * Returns forecasts for the specified number of nights
   */
  async getMultiDayNightForecast(lat, lon, days = 5) {
    const forecast = await this.getForecast(lat, lon);
    
    if (!forecast || !forecast.list) {
      throw new Error('Invalid forecast data received');
    }

    const now = new Date();
    const nightForecasts = [];

    // Generate forecast for each night
    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      baseDate.setDate(baseDate.getDate() + dayOffset);

      // Define night time range (18:00 to 05:00 next day)
      const nightStart = new Date(baseDate);
      nightStart.setHours(18, 0, 0, 0);
      
      const nightEnd = new Date(baseDate);
      nightEnd.setDate(nightEnd.getDate() + 1);
      nightEnd.setHours(5, 0, 0, 0);

      // Adjust for current time on first day
      if (dayOffset === 0 && now.getHours() < 5) {
        nightStart.setDate(nightStart.getDate() - 1);
        nightEnd.setDate(nightEnd.getDate() - 1);
      }

      // Filter forecast data for this night
      const nightData = forecast.list.filter(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate >= nightStart && itemDate <= nightEnd;
      });

      if (nightData.length > 0) {
        nightForecasts.push({
          date: baseDate.toISOString().split('T')[0],
          night_start: nightStart.toISOString(),
          night_end: nightEnd.toISOString(),
          forecast: nightData
        });
      }
    }

    return {
      location: {
        lat: lat,
        lon: lon,
        city: forecast.city.name,
        country: forecast.city.country
      },
      nights: nightForecasts
    };
  }
}

module.exports = new WeatherService();
