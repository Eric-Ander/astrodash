const db = require('../config/database');

/**
 * CardPreferencesController - Manages per-user card layout and settings.
 *
 * Authenticated users store preferences in the database.
 * Anonymous users rely on localStorage on the frontend side.
 */
class CardPreferencesController {
  /**
   * GET /api/cards/preferences
   * Returns the authenticated user's card preferences.
   */
  getPreferences(req, res) {
    try {
      const userId = req.user.userId;

      const rows = db
        .prepare(
          `SELECT card_id, enabled, position, settings
           FROM user_card_preferences
           WHERE user_id = ?
           ORDER BY position ASC`
        )
        .all(userId);

      const preferences = rows.map((row) => ({
        cardId: row.card_id,
        enabled: row.enabled === 1,
        position: row.position,
        settings: JSON.parse(row.settings || '{}'),
      }));

      res.json({ preferences });
    } catch (error) {
      console.error('Error getting card preferences:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch card preferences',
      });
    }
  }

  /**
   * PUT /api/cards/preferences
   * Save the full card layout (replaces all preferences for this user).
   * Body: { preferences: [{ cardId, enabled, position, settings }] }
   */
  savePreferences(req, res) {
    try {
      const userId = req.user.userId;
      const { preferences } = req.body;

      if (!Array.isArray(preferences)) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'preferences must be an array',
        });
      }

      const upsert = db.prepare(
        `INSERT INTO user_card_preferences (user_id, card_id, enabled, position, settings, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, card_id) DO UPDATE SET
           enabled = excluded.enabled,
           position = excluded.position,
           settings = excluded.settings,
           updated_at = CURRENT_TIMESTAMP`
      );

      const saveAll = db.transaction((prefs) => {
        for (const pref of prefs) {
          upsert.run(
            userId,
            pref.cardId,
            pref.enabled ? 1 : 0,
            pref.position || 0,
            JSON.stringify(pref.settings || {})
          );
        }
      });

      saveAll(preferences);

      res.json({ message: 'Preferences saved', count: preferences.length });
    } catch (error) {
      console.error('Error saving card preferences:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to save card preferences',
      });
    }
  }

  /**
   * PATCH /api/cards/preferences/:cardId
   * Update a single card's preference (toggle, reorder, or change settings).
   * Body: any subset of { enabled, position, settings }
   */
  updateCardPreference(req, res) {
    try {
      const userId = req.user.userId;
      const { cardId } = req.params;
      const { enabled, position, settings } = req.body;

      // Check if preference already exists
      const existing = db
        .prepare(
          'SELECT id, enabled, position, settings FROM user_card_preferences WHERE user_id = ? AND card_id = ?'
        )
        .get(userId, cardId);

      if (existing) {
        // Update only provided fields
        const newEnabled = enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled;
        const newPosition = position !== undefined ? position : existing.position;
        const newSettings =
          settings !== undefined
            ? JSON.stringify(settings)
            : existing.settings;

        db.prepare(
          `UPDATE user_card_preferences
           SET enabled = ?, position = ?, settings = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND card_id = ?`
        ).run(newEnabled, newPosition, newSettings, userId, cardId);
      } else {
        // Insert new preference
        db.prepare(
          `INSERT INTO user_card_preferences (user_id, card_id, enabled, position, settings)
           VALUES (?, ?, ?, ?, ?)`
        ).run(
          userId,
          cardId,
          enabled !== undefined ? (enabled ? 1 : 0) : 1,
          position || 0,
          JSON.stringify(settings || {})
        );
      }

      res.json({ message: 'Card preference updated', cardId });
    } catch (error) {
      console.error('Error updating card preference:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update card preference',
      });
    }
  }
}

module.exports = new CardPreferencesController();
