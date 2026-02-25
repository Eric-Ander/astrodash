/**
 * AI Controller
 *
 * Handles the /api/ai/chat endpoint and supporting AI-related routes.
 * Works for both authenticated users (personalised responses, gear profiles,
 * memory) and anonymous guests (read-only tool access, no persistence).
 */

const crypto  = require('crypto');
const aiService = require('../services/aiService');
const db = require('../config/database');

class AIController {

  // ---------------------------------------------------------------------------
  // POST /api/ai/chat
  // ---------------------------------------------------------------------------

  /**
   * Main chat endpoint.
   *
   * Body:
   *   message            {string}   Required. User's message (max 2 000 chars).
   *   conversationHistory {Array}   Optional. Previous messages in the
   *                                 { role, content } format (Anthropic SDK).
   *   location           {object}   Optional. { lat, lon, city? } for live data.
   *   sessionId          {string}   Optional. UUID that ties a multi-turn
   *                                 session together; generated if absent.
   *
   * Response:
   *   { text, sessionId, usage }
   */
  async chat(req, res) {
    try {
      const { message, conversationHistory = [], location, sessionId: incomingSessionId } = req.body;
      const userId = req.user?.userId || null;

      // ── Validate message ────────────────────────────────────────────────────
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'message is required'
        });
      }

      const trimmed = message.trim();
      if (trimmed.length === 0) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'message cannot be empty'
        });
      }

      if (trimmed.length > 2000) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'message exceeds the 2 000 character limit'
        });
      }

      // ── Session ID ──────────────────────────────────────────────────────────
      const sessionId = incomingSessionId || crypto.randomUUID();

      // ── Conversation history ────────────────────────────────────────────────
      // Accept whatever the client sends but cap at the last 10 full exchanges
      // (20 messages: 10 × user + 10 × assistant) to keep context windows sane.
      const MAX_HISTORY = 20;
      const history = Array.isArray(conversationHistory)
        ? conversationHistory.slice(-MAX_HISTORY)
        : [];

      // Build the full messages array for this turn:
      //   [… history …, { role: 'user', content: trimmed }]
      const messages = [
        ...history,
        { role: 'user', content: trimmed }
      ];

      // ── Log the incoming user message ────────────────────────────────────────
      aiService.logMessage(userId, sessionId, 'user', trimmed);

      // ── Call the AI service ─────────────────────────────────────────────────
      const result = await aiService.chat(userId, messages, location || null, sessionId);

      // ── Log the assistant reply ───────────────────────────────────────────────
      aiService.logMessage(userId, sessionId, 'assistant', result.text);

      // ── Return the response ─────────────────────────────────────────────────
      return res.json({
        text:      result.text,
        sessionId: sessionId,
        usage:     result.usage   // { input_tokens, output_tokens }
      });

    } catch (error) {
      return AIController._handleError(res, error);
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/ai/profile
  // Retrieve the current user's AI profile and all gear.
  // Requires authentication.
  // ---------------------------------------------------------------------------
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      // Profile
      const profile = db.prepare(
        'SELECT experience_level, preferred_targets, observer_notes, updated_at FROM user_ai_profiles WHERE user_id = ?'
      ).get(userId);

      // Gear
      const telescopes = db.prepare(
        'SELECT id, nickname, type, aperture_mm, focal_length_mm, f_ratio, notes, is_default, created_at FROM user_telescopes WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
      ).all(userId);

      const cameras = db.prepare(
        'SELECT id, nickname, type, sensor_width_mm, sensor_height_mm, pixel_size_um, is_color, is_default, created_at FROM user_cameras WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
      ).all(userId);

      const mounts = db.prepare(
        'SELECT id, nickname, type, has_tracking, has_guiding, is_default, created_at FROM user_mounts WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
      ).all(userId);

      const setups = db.prepare(`
        SELECT s.id, s.nickname, s.is_default, s.created_at,
               t.nickname AS telescope_nickname, t.focal_length_mm, t.aperture_mm,
               c.nickname AS camera_nickname, c.sensor_width_mm, c.sensor_height_mm,
               m.nickname AS mount_nickname
        FROM user_setups s
        LEFT JOIN user_telescopes t ON t.id = s.telescope_id
        LEFT JOIN user_cameras    c ON c.id = s.camera_id
        LEFT JOIN user_mounts     m ON m.id = s.mount_id
        WHERE s.user_id = ?
        ORDER BY s.is_default DESC, s.created_at ASC
      `).all(userId);

      return res.json({
        profile: profile ? {
          experience_level:  profile.experience_level,
          preferred_targets: profile.preferred_targets
            ? JSON.parse(profile.preferred_targets)
            : [],
          observer_notes: profile.observer_notes,
          updated_at:     profile.updated_at
        } : null,
        gear: { telescopes, cameras, mounts, setups }
      });

    } catch (error) {
      console.error('Error fetching AI profile:', error.message);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve profile'
      });
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/ai/history
  // Returns the last N conversation summaries for the logged-in user.
  // ---------------------------------------------------------------------------
  async getHistory(req, res) {
    try {
      const userId = req.user.userId;
      const limit  = Math.min(parseInt(req.query.limit) || 10, 50);

      const summaries = db.prepare(`
        SELECT id, session_date, summary, location_used, topics, created_at
        FROM ai_conversation_summaries
        WHERE user_id = ?
        ORDER BY session_date DESC
        LIMIT ?
      `).all(userId, limit);

      const parsed = summaries.map(s => ({
        ...s,
        topics: s.topics ? JSON.parse(s.topics) : []
      }));

      return res.json({ summaries: parsed });

    } catch (error) {
      console.error('Error fetching AI history:', error.message);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve history'
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  static _handleError(res, error) {
    console.error('AI controller error:', error.message);

    // Anthropic SDK surfaces specific error types we can translate into
    // meaningful HTTP responses.
    const msg = error.message || '';

    // Missing API key
    if (msg.includes('ANTHROPIC_API_KEY') || msg.includes('authentication')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'The AI service is not configured. Please contact the administrator.'
      });
    }

    // Rate-limit / overload from Anthropic
    if (
      error.status === 429 ||
      msg.includes('rate limit') ||
      msg.includes('overloaded')
    ) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'The AI service is currently busy. Please try again in a moment.'
      });
    }

    // Anthropic API errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return res.status(502).json({
        error: 'AI service error',
        message: 'The AI service returned an unexpected error. Please try again.'
      });
    }

    // Generic fallback
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
}

module.exports = new AIController();
