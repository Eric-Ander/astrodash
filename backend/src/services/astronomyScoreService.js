/**
 * Calculate astronomy quality score based on weather conditions
 * Score ranges from 0-100, where 100 is perfect conditions for stargazing
 */
class AstronomyScoreService {
  /**
   * Calculate overall astronomy score for a single forecast item
   */
  calculateScore(forecastItem) {
    const cloudScore = this.calculateCloudScore(forecastItem.clouds?.all || 100);
    const visibilityScore = this.calculateVisibilityScore(forecastItem.visibility || 0);
    const humidityScore = this.calculateHumidityScore(forecastItem.main?.humidity || 100);
    const precipitationScore = this.calculatePrecipitationScore(forecastItem.pop || 0);

    // Weighted average
    const totalScore = (
      cloudScore * 0.50 +          // 50% weight - most important
      visibilityScore * 0.20 +     // 20% weight
      humidityScore * 0.15 +       // 15% weight
      precipitationScore * 0.15    // 15% weight
    );

    return {
      total: Math.round(totalScore),
      breakdown: {
        clouds: Math.round(cloudScore),
        visibility: Math.round(visibilityScore),
        humidity: Math.round(humidityScore),
        precipitation: Math.round(precipitationScore)
      }
    };
  }

  /**
   * Calculate cloud coverage score (0-50 points)
   * 0% clouds = 50 points, 100% clouds = 0 points
   */
  calculateCloudScore(cloudPercentage) {
    return 50 * (1 - cloudPercentage / 100);
  }

  /**
   * Calculate visibility score (0-20 points)
   * >10km = 20 points, <1km = 0 points
   */
  calculateVisibilityScore(visibilityMeters) {
    const visibilityKm = visibilityMeters / 1000;
    if (visibilityKm >= 10) return 20;
    if (visibilityKm <= 1) return 0;
    return 20 * (visibilityKm / 10);
  }

  /**
   * Calculate humidity score (0-15 points)
   * <40% = 15 points, >80% = 0 points
   */
  calculateHumidityScore(humidityPercentage) {
    if (humidityPercentage <= 40) return 15;
    if (humidityPercentage >= 80) return 0;
    return 15 * (1 - (humidityPercentage - 40) / 40);
  }

  /**
   * Calculate precipitation score (0-15 points)
   * 0% chance = 15 points, 100% chance = 0 points
   */
  calculatePrecipitationScore(precipitationProbability) {
    return 15 * (1 - precipitationProbability);
  }

  /**
   * Get quality rating text based on score
   */
  getQualityRating(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Get color code for score visualization
   */
  getScoreColor(score) {
    if (score >= 90) return '#00ff00'; // Bright green
    if (score >= 75) return '#7fff00'; // Light green
    if (score >= 60) return '#ffff00'; // Yellow
    if (score >= 45) return '#ffa500'; // Orange
    if (score >= 30) return '#ff6600'; // Dark orange
    return '#ff0000'; // Red
  }

  /**
   * Process entire night forecast with scores
   */
  processNightForecast(forecastData) {
    const processedForecast = forecastData.map(item => {
      const score = this.calculateScore(item);
      
      return {
        datetime: new Date(item.dt * 1000).toISOString(),
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        weather: {
          description: item.weather[0]?.description || 'Unknown',
          icon: item.weather[0]?.icon || '01n'
        },
        temperature: {
          current: Math.round(item.main.temp),
          feels_like: Math.round(item.main.feels_like)
        },
        clouds: item.clouds?.all || 0,
        visibility: item.visibility || 0,
        visibility_km: ((item.visibility || 0) / 1000).toFixed(1),
        humidity: item.main?.humidity || 0,
        wind_speed: item.wind?.speed || 0,
        precipitation_probability: Math.round((item.pop || 0) * 100),
        astronomy_score: score.total,
        score_breakdown: score.breakdown,
        quality_rating: this.getQualityRating(score.total),
        score_color: this.getScoreColor(score.total)
      };
    });

    // Calculate best observation time
    const bestTime = this.findBestObservationTime(processedForecast);

    return {
      hourly_forecast: processedForecast,
      best_time: bestTime,
      summary: this.generateNightSummary(processedForecast)
    };
  }

  /**
   * Find the best hour for astronomical observations
   */
  findBestObservationTime(processedForecast) {
    if (!processedForecast || processedForecast.length === 0) {
      return null;
    }

    const best = processedForecast.reduce((prev, current) => {
      return (current.astronomy_score > prev.astronomy_score) ? current : prev;
    });

    return {
      time: best.time,
      datetime: best.datetime,
      score: best.astronomy_score,
      quality_rating: best.quality_rating
    };
  }

  /**
   * Generate summary of the night's conditions
   */
  generateNightSummary(processedForecast) {
    if (!processedForecast || processedForecast.length === 0) {
      return {
        average_score: 0,
        average_cloud_coverage: 0,
        overall_quality: 'No Data'
      };
    }

    const avgScore = processedForecast.reduce((sum, item) => 
      sum + item.astronomy_score, 0) / processedForecast.length;
    
    const avgClouds = processedForecast.reduce((sum, item) => 
      sum + item.clouds, 0) / processedForecast.length;

    return {
      average_score: Math.round(avgScore),
      average_cloud_coverage: Math.round(avgClouds),
      overall_quality: this.getQualityRating(Math.round(avgScore)),
      total_hours: processedForecast.length
    };
  }
}

module.exports = new AstronomyScoreService();
