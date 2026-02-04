const db = require('../config/database');

class LocationsService {
  /**
   * Save a location for a user
   */
  saveLocation(userId, locationName, lat, lon, isFavorite = false) {
    try {
      // Check if location already exists for this user
      const existing = db.prepare(`
        SELECT id FROM saved_locations 
        WHERE user_id = ? AND lat = ? AND lon = ?
      `).get(userId, lat, lon);

      if (existing) {
        throw new Error('This location is already saved');
      }

      const result = db.prepare(`
        INSERT INTO saved_locations (user_id, location_name, lat, lon, is_favorite, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, locationName, lat, lon, isFavorite ? 1 : 0, Date.now());

      return {
        id: result.lastInsertRowid,
        location_name: locationName,
        lat,
        lon,
        is_favorite: isFavorite
      };
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }

  /**
   * Get all saved locations for a user
   */
  getUserLocations(userId) {
    try {
      const locations = db.prepare(`
        SELECT id, location_name, lat, lon, is_favorite, 
               notifications_enabled, cloud_threshold, created_at
        FROM saved_locations
        WHERE user_id = ?
        ORDER BY is_favorite DESC, created_at DESC
      `).all(userId);

      return locations.map(loc => ({
        id: loc.id,
        location_name: loc.location_name,
        lat: loc.lat,
        lon: loc.lon,
        is_favorite: Boolean(loc.is_favorite),
        notifications_enabled: Boolean(loc.notifications_enabled),
        cloud_threshold: loc.cloud_threshold,
        created_at: loc.created_at
      }));
    } catch (error) {
      console.error('Error getting user locations:', error);
      throw error;
    }
  }

  /**
   * Delete a saved location
   */
  deleteLocation(userId, locationId) {
    try {
      const result = db.prepare(`
        DELETE FROM saved_locations
        WHERE id = ? AND user_id = ?
      `).run(locationId, userId);

      if (result.changes === 0) {
        throw new Error('Location not found or you do not have permission to delete it');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(userId, locationId) {
    try {
      // Get current favorite status
      const location = db.prepare(`
        SELECT is_favorite FROM saved_locations
        WHERE id = ? AND user_id = ?
      `).get(locationId, userId);

      if (!location) {
        throw new Error('Location not found');
      }

      const newFavoriteStatus = location.is_favorite ? 0 : 1;

      db.prepare(`
        UPDATE saved_locations
        SET is_favorite = ?
        WHERE id = ? AND user_id = ?
      `).run(newFavoriteStatus, locationId, userId);

      return { is_favorite: Boolean(newFavoriteStatus) };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}

module.exports = new LocationsService();
