/**
 * AI Service – AstroAI powered by Claude
 *
 * Implements a multi-turn tool-use loop using the Anthropic SDK.
 * Claude calls the tools it needs (live sky data, DSO lookup, gear profile,
 * etc.), we execute them server-side, and return the fully-formed answer.
 *
 * Memory layers
 *  1. Session memory  – conversationHistory sent by the frontend each request
 *  2. User profile    – gear, experience, preferences loaded from DB at startup
 *  3. Summaries       – last N session summaries injected into the system prompt
 *  4. Full log        – every message silently appended to ai_conversation_logs
 */

const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/database');
const weatherService = require('./weatherService');
const astronomyScoreService = require('./astronomyScoreService');
const astronomicalEventsService = require('./astronomicalEventsService');
const moonPhaseService = require('./moonPhaseService');
const lightPollutionService = require('./lightPollutionService');
const dsoService = require('./dsoService');

const MAX_TOOL_ITERATIONS = 6; // safety cap on the agentic loop

class AIService {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.AI_MODEL || 'claude-3-5-haiku-20241022';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2048;
  }

  // ─── System Prompt ────────────────────────────────────────────────────────

  async buildSystemPrompt(userId, location) {
    let userSection = 'The user is browsing as a guest. No personal profile is available.';

    if (userId) {
      try {
        const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(userId);
        const profile = db.prepare(
          'SELECT experience_level, preferred_targets, observer_notes FROM user_ai_profiles WHERE user_id = ?'
        ).get(userId) || {};
        const gear = this.getUserGear(userId);
        const summaries = this.getRecentSummaries(userId, 4);
        const savedLocations = db.prepare(
          'SELECT location_name, lat, lon, is_favorite FROM saved_locations WHERE user_id = ? ORDER BY is_favorite DESC'
        ).all(userId);

        const telescopeLines = gear.telescopes.length > 0
          ? gear.telescopes.map(t =>
              `  • ${t.nickname || 'Unnamed telescope'}: ${t.type || ''} ${t.aperture_mm ? t.aperture_mm + 'mm aperture' : ''} ${t.focal_length_mm ? t.focal_length_mm + 'mm focal length' : ''} ${t.f_ratio ? 'f/' + t.f_ratio : ''}${t.is_default ? ' [default]' : ''}${t.notes ? ' — ' + t.notes : ''}`
            ).join('\n')
          : '  (no telescopes saved yet)';

        const cameraLines = gear.cameras.length > 0
          ? gear.cameras.map(c =>
              `  • ${c.nickname || 'Unnamed camera'}: ${c.type || ''} sensor ${c.sensor_width_mm || '?'}×${c.sensor_height_mm || '?'}mm, ${c.pixel_size_um || '?'}μm pixels, ${c.is_color ? 'colour' : 'mono'}${c.is_default ? ' [default]' : ''}`
            ).join('\n')
          : '  (no cameras saved yet)';

        const mountLines = gear.mounts.length > 0
          ? gear.mounts.map(m =>
              `  • ${m.nickname || 'Unnamed mount'}: ${m.type || ''}, tracking: ${m.has_tracking ? 'yes' : 'no'}, guiding: ${m.has_guiding ? 'yes' : 'no'}${m.is_default ? ' [default]' : ''}`
            ).join('\n')
          : '  (no mounts saved yet)';

        const setupLines = gear.setups.length > 0
          ? gear.setups.map(s =>
              `  • "${s.nickname}"${s.is_default ? ' [default]' : ''}`
            ).join('\n')
          : '  (no named setups saved yet)';

        const locationLines = savedLocations.length > 0
          ? savedLocations.map(l =>
              `  • ${l.location_name} (${parseFloat(l.lat).toFixed(2)}, ${parseFloat(l.lon).toFixed(2)})${l.is_favorite ? ' ⭐' : ''}`
            ).join('\n')
          : '  (no saved locations)';

        const summaryLines = summaries.length > 0
          ? summaries.map(s =>
              `  [${s.session_date}] ${s.summary}${s.location_used ? ' — at ' + s.location_used : ''}`
            ).join('\n')
          : '  (no previous sessions recorded)';

        userSection = `USER: ${user?.name || 'Registered user'}
EXPERIENCE LEVEL: ${profile.experience_level || 'not specified'}
PREFERRED TARGETS: ${profile.preferred_targets ? JSON.parse(profile.preferred_targets).join(', ') : 'not specified'}
OBSERVER NOTES: ${profile.observer_notes || 'none'}

TELESCOPES:
${telescopeLines}

CAMERAS:
${cameraLines}

MOUNTS:
${mountLines}

NAMED SETUPS:
${setupLines}

SAVED LOCATIONS:
${locationLines}

RECENT SESSIONS (newest first):
${summaryLines}`;
      } catch (err) {
        console.error('Error building user context for system prompt:', err.message);
      }
    }

    const locationSection = location
      ? `CURRENT SESSION LOCATION: ${location.name || 'Unknown'} (lat: ${location.lat}, lon: ${location.lon})`
      : 'CURRENT SESSION LOCATION: Not yet set. Ask the user for their location if it is needed to answer their question.';

    return `You are AstroAI, an expert astronomical assistant built into the AstroDash application — a dashboard that helps amateur astronomers plan their observing sessions.

═══ LANGUAGE ═══
Always respond in exactly the same language the user writes in.
You are fluent in English, German, French and Spanish.

═══ YOUR ROLE ═══
• Assess sky conditions for visual observing or astrophotography
• Answer questions about specific celestial objects (DSOs, planets, Moon, ISS, meteor showers)
• Calculate field of view and mosaic requirements from the user's saved gear
• Recommend optimal observation windows based on live forecast data
• Automatically save any equipment the user mentions to their profile
• Build a richer user profile over time through natural conversation

═══ TOOLS AND DATA SOURCES ═══
Always use your tools for live or object-specific data — never invent numbers.

• get_tonight_forecast / get_multiday_forecast → live sky quality (AstroDash / OpenWeatherMap)
• get_astronomical_events                      → ISS passes, meteor showers, moon phases, twilight
• get_dso_info                                 → verified object data (Messier Catalogue / NGC)
• get_user_gear                                → user's saved equipment
• save_user_gear                               → persist new or updated equipment from conversation
• update_user_profile                          → update experience level or preferred targets
• save_conversation_summary                    → call at session end to save a structured summary

═══ SOURCE ATTRIBUTION ═══
Label data sources briefly inline so the user can trust each figure:
  📡 "Tonight's score: 74/100 (AstroDash live)"
  📖 "M31 spans 3.2°×1° (Messier Catalogue)"
  🔭 "At 1200mm your FOV is 1.7°×1.1° (calculated from your gear)"
  ✏️ "I've saved your 8-inch Newt to your profile."

═══ EQUIPMENT HANDLING ═══
• When the user mentions gear not yet in their profile, call save_user_gear immediately, then confirm.
• If a user has multiple telescopes and the question is ambiguous, ask which one.
• The [default] telescope/camera/mount is used for calculations unless otherwise specified.
• Field-of-view formula: FOV (°) = 2 × arctan(sensor_size_mm / (2 × focal_length_mm))
• Always state the source when giving FOV calculations ("calculated from your gear profile").

═══ WHEN YOU DON'T KNOW ═══
If an object isn't in the DSO catalog, say so clearly and suggest:
  → SIMBAD: simbad.u-strasbg.fr (for obscure NGC/IC objects)
  → Stellarium: stellarium.org (for current sky charts)
  → Cloudy Nights: cloudynights.com (for equipment and technique advice)

═══ USER CONTEXT ═══
${userSection}

${locationSection}`;
  }

  // ─── Tool Definitions ─────────────────────────────────────────────────────

  getToolDefinitions(includeWriteTools = true) {
    const readTools = [
      {
        name: 'get_tonight_forecast',
        description: "Get tonight's astronomical sky conditions for a location. Returns hourly astronomy scores (0–100), cloud cover, seeing, humidity, wind, moon phase and interference, and light pollution (Bortle scale). Use for any question about tonight's observing.",
        input_schema: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: 'Latitude' },
            lon: { type: 'number', description: 'Longitude' },
          },
          required: ['lat', 'lon'],
        },
      },
      {
        name: 'get_multiday_forecast',
        description: "Get astronomical sky conditions for multiple nights (up to 5). Returns per-night summary scores, best observation windows, and moon phases. Use for questions like 'best night this week?' or 'when should I go out?'",
        input_schema: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: 'Latitude' },
            lon: { type: 'number', description: 'Longitude' },
            days: { type: 'number', description: 'Number of nights (1–5, default 5)' },
          },
          required: ['lat', 'lon'],
        },
      },
      {
        name: 'get_astronomical_events',
        description: "Get upcoming astronomical events: ISS visible passes, meteor showers, next new/full moon, and today's sunset/sunrise/twilight times.",
        input_schema: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: 'Latitude' },
            lon: { type: 'number', description: 'Longitude' },
          },
          required: ['lat', 'lon'],
        },
      },
      {
        name: 'get_dso_info',
        description: "Look up a deep sky object by name or designation (e.g. 'M31', 'Andromeda Galaxy', 'M42', 'Orion Nebula', 'Ring Nebula'). Returns angular size, magnitude, object type, best viewing months, imaging difficulty, and notes. Source: Messier Catalogue / NGC.",
        input_schema: {
          type: 'object',
          properties: {
            object_name: { type: 'string', description: "Messier number (e.g. 'M31'), NGC/IC designation (e.g. 'NGC 224'), or common name (e.g. 'Andromeda')" },
          },
          required: ['object_name'],
        },
      },
      {
        name: 'get_user_gear',
        description: "Retrieve the user's saved telescopes, cameras, mounts and named setups. Always call this before making FOV or imaging calculations.",
        input_schema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ];

    const writeTools = [
      {
        name: 'save_user_gear',
        description: "Save new or updated equipment to the user's profile. Call whenever the user mentions telescope, camera, or mount details not yet saved, or when they correct existing data. Always confirm what was saved in your response.",
        input_schema: {
          type: 'object',
          properties: {
            gear_type: {
              type: 'string',
              enum: ['telescope', 'camera', 'mount', 'setup'],
              description: 'Type of equipment to save',
            },
            action: {
              type: 'string',
              enum: ['add', 'update', 'set_default', 'delete'],
              description: 'Operation to perform',
            },
            data: {
              type: 'object',
              description: "Equipment details. Telescope: nickname, type (refractor/newt/sct/mak/dob/other), aperture_mm, focal_length_mm, f_ratio, notes. Camera: nickname, type (dslr/mirrorless/dedicated_astro/planetary/other), sensor_width_mm, sensor_height_mm, pixel_size_um, is_color (bool). Mount: nickname, type (eq-goto/eq-manual/altaz-goto/altaz-manual/dob/tracker), has_tracking (bool), has_guiding (bool). Setup: nickname, telescope_id, camera_id, mount_id.",
            },
            item_id: {
              type: 'number',
              description: 'DB id of item to update, set_default, or delete (not needed for add)',
            },
          },
          required: ['gear_type', 'action', 'data'],
        },
      },
      {
        name: 'update_user_profile',
        description: "Update the user's AI profile: experience level, preferred target types, or general observer notes. Call when the user indicates their experience or mentions what they like to observe.",
        input_schema: {
          type: 'object',
          properties: {
            experience_level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            },
            preferred_targets: {
              type: 'array',
              items: { type: 'string' },
              description: "e.g. ['galaxies', 'planetary', 'double stars', 'nebulae', 'globular clusters']",
            },
            observer_notes: {
              type: 'string',
              description: 'General freeform notes about the user',
            },
          },
          required: [],
        },
      },
      {
        name: 'save_conversation_summary',
        description: "Persist a structured summary of this session for long-term memory. Call at the end of every session (when the user says goodbye or the conversation is clearly wrapping up), or whenever significant new facts were learned about the user.",
        input_schema: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'Concise 1–3 sentence summary: what was discussed, what the user observed or planned, any key facts learned',
            },
            location_used: {
              type: 'string',
              description: 'Location name discussed in this session',
            },
            topics: {
              type: 'array',
              items: { type: 'string' },
              description: "e.g. ['M31 imaging', 'ISS pass', 'Orionids', 'gear setup']",
            },
          },
          required: ['summary'],
        },
      },
    ];

    return includeWriteTools ? [...readTools, ...writeTools] : readTools;
  }

  // ─── Tool Execution ───────────────────────────────────────────────────────

  async executeTool(toolName, toolInput, userId) {
    console.log(`[AstroAI] Tool: ${toolName}`, JSON.stringify(toolInput).slice(0, 120));
    try {
      switch (toolName) {

        case 'get_tonight_forecast': {
          const { lat, lon } = toolInput;
          const tonight = await weatherService.getTonightForecast(lat, lon);
          const processed = astronomyScoreService.processNightForecast(tonight.forecast);
          const moon = moonPhaseService.calculateMoonPhase(new Date());
          const moonTimes = moonPhaseService.estimateMoonTimes(new Date(), lat, lon);
          const lightPollution = await lightPollutionService.getLightPollution(lat, lon);
          return {
            location: tonight.location,
            tonight_window: { start: tonight.tonight_start, end: tonight.tonight_end },
            summary: processed.summary,
            best_observation_time: processed.best_time,
            hourly_forecast: processed.hourly_forecast.slice(0, 8).map(h => ({
              time: h.time,
              astronomy_score: h.astronomy_score,
              quality_rating: h.quality_rating,
              clouds_pct: h.clouds,
              wind_kmh: Math.round((h.wind_speed || 0) * 3.6),
              humidity_pct: h.humidity,
              precip_pct: h.precipitation_probability,
            })),
            moon: {
              phase: moon.phase_name,
              illumination_pct: Math.round((moon.illumination || 0) * 100),
              emoji: moon.emoji,
              rise: moonTimes?.rise || null,
              set: moonTimes?.set || null,
              interference: moon.visibility_impact?.level || 'unknown',
              recommendation: moon.visibility_impact?.description || '',
            },
            light_pollution: {
              bortle_class: lightPollution.bortle_class,
              class_name: lightPollution.class_name,
              limiting_magnitude: lightPollution.limiting_magnitude,
              quality: lightPollution.quality,
            },
            data_source: 'AstroDash / OpenWeatherMap',
          };
        }

        case 'get_multiday_forecast': {
          const { lat, lon, days = 5 } = toolInput;
          const clampedDays = Math.min(Math.max(parseInt(days) || 5, 1), 5);
          const multiDay = await weatherService.getMultiDayNightForecast(lat, lon, clampedDays);
          const moonPhases = moonPhaseService.getMultiDayMoonPhases(new Date(), clampedDays);
          const nights = multiDay.nights.map((night, i) => {
            const processed = astronomyScoreService.processNightForecast(night.forecast);
            const mp = moonPhases?.[i] || {};
            return {
              date: night.date,
              average_score: processed.summary?.average_score,
              overall_quality: processed.summary?.overall_quality,
              best_time: processed.best_time,
              moon_phase: mp.phase_name || 'unknown',
              moon_illumination_pct: mp.illumination != null ? Math.round(mp.illumination * 100) : null,
            };
          });
          return { location: multiDay.location, nights, data_source: 'AstroDash / OpenWeatherMap' };
        }

        case 'get_astronomical_events': {
          const { lat, lon } = toolInput;
          const events = await astronomicalEventsService.getAllEvents(lat, lon);
          return { ...events, data_source: 'AstroDash' };
        }

        case 'get_dso_info': {
          const { object_name } = toolInput;
          const obj = dsoService.findObject(object_name);
          if (!obj) {
            return {
              found: false,
              message: `"${object_name}" was not found in the local catalogue. For obscure objects try SIMBAD (simbad.u-strasbg.fr).`,
            };
          }
          return { found: true, object: obj, data_source: 'Messier Catalogue / NGC' };
        }

        case 'get_user_gear': {
          if (!userId) return { error: 'User not logged in', telescopes: [], cameras: [], mounts: [], setups: [] };
          return this.getUserGear(userId);
        }

        case 'save_user_gear': {
          if (!userId) return { error: 'User not logged in — gear cannot be saved. Ask them to log in.' };
          return this.saveGear(userId, toolInput);
        }

        case 'update_user_profile': {
          if (!userId) return { error: 'User not logged in — profile cannot be saved.' };
          return this.updateProfile(userId, toolInput);
        }

        case 'save_conversation_summary': {
          if (!userId) return { skipped: true, reason: 'User not logged in' };
          const { summary, location_used, topics = [] } = toolInput;
          this.saveConversationSummary(userId, summary, location_used, topics);
          return { saved: true };
        }

        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      console.error(`[AstroAI] Tool "${toolName}" error:`, err.message);
      return { error: err.message };
    }
  }

  // ─── Main Chat Method ─────────────────────────────────────────────────────

  /**
   * Run the agentic tool-use loop and return the final text response.
   *
   * @param {number|null}  userId              Authenticated user id, or null for guest
   * @param {object[]}     messages            Conversation history (role/content pairs)
   * @param {object|null}  location            { lat, lon, name } or null
   * @param {string}       sessionId           UUID for this session
   * @returns {{ text: string, usage: object|null, iterations: number }}
   */
  async chat(userId, messages, location, sessionId) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const systemPrompt = await this.buildSystemPrompt(userId, location);
    const tools = this.getToolDefinitions(!!userId); // write tools only for logged-in users
    let currentMessages = [...messages];
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        tools,
        messages: currentMessages,
      });

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
        const toolResults = [];

        for (const toolUse of toolUseBlocks) {
          const result = await this.executeTool(toolUse.name, toolUse.input, userId);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content },
          { role: 'user',      content: toolResults },
        ];
      } else {
        // Final text response
        const textBlock = response.content.find(b => b.type === 'text');
        const responseText = textBlock?.text || 'I was unable to generate a response. Please try again.';

        if (userId && sessionId) {
          this.logMessage(userId, sessionId, 'assistant', responseText);
        }

        return { text: responseText, usage: response.usage, iterations };
      }
    }

    // Fallback if the loop hits the cap
    return {
      text: 'I apologise — I ran into a problem processing all the data needed to answer your question. Please try rephrasing or ask again.',
      usage: null,
      iterations,
    };
  }

  // ─── Database Helpers ─────────────────────────────────────────────────────

  getUserGear(userId) {
    const telescopes = db.prepare(
      'SELECT * FROM user_telescopes WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
    ).all(userId);
    const cameras = db.prepare(
      'SELECT * FROM user_cameras WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
    ).all(userId);
    const mounts = db.prepare(
      'SELECT * FROM user_mounts WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
    ).all(userId);
    const setups = db.prepare(
      'SELECT * FROM user_setups WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
    ).all(userId);
    return { telescopes, cameras, mounts, setups };
  }

  getRecentSummaries(userId, limit = 4) {
    return db.prepare(
      'SELECT session_date, summary, location_used, topics FROM ai_conversation_summaries WHERE user_id = ? ORDER BY session_date DESC, id DESC LIMIT ?'
    ).all(userId, limit);
  }

  saveGear(userId, { gear_type, action, data, item_id }) {
    const tableMap = { telescope: 'user_telescopes', camera: 'user_cameras', mount: 'user_mounts', setup: 'user_setups' };
    const table = tableMap[gear_type];
    if (!table) return { error: `Unknown gear_type: ${gear_type}` };

    try {
      if (action === 'add') {
        if (data.is_default) {
          db.prepare(`UPDATE ${table} SET is_default = 0 WHERE user_id = ?`).run(userId);
        }
        let insertId;

        if (gear_type === 'telescope') {
          const r = db.prepare(
            'INSERT INTO user_telescopes (user_id, nickname, type, aperture_mm, focal_length_mm, f_ratio, notes, is_default) VALUES (?,?,?,?,?,?,?,?)'
          ).run(userId, data.nickname || null, data.type || null, data.aperture_mm || null, data.focal_length_mm || null, data.f_ratio || null, data.notes || null, data.is_default ? 1 : 0);
          insertId = r.lastInsertRowid;

        } else if (gear_type === 'camera') {
          const r = db.prepare(
            'INSERT INTO user_cameras (user_id, nickname, type, sensor_width_mm, sensor_height_mm, pixel_size_um, is_color, is_default) VALUES (?,?,?,?,?,?,?,?)'
          ).run(userId, data.nickname || null, data.type || null, data.sensor_width_mm || null, data.sensor_height_mm || null, data.pixel_size_um || null, data.is_color !== false ? 1 : 0, data.is_default ? 1 : 0);
          insertId = r.lastInsertRowid;

        } else if (gear_type === 'mount') {
          const r = db.prepare(
            'INSERT INTO user_mounts (user_id, nickname, type, has_tracking, has_guiding, is_default) VALUES (?,?,?,?,?,?)'
          ).run(userId, data.nickname || null, data.type || null, data.has_tracking ? 1 : 0, data.has_guiding ? 1 : 0, data.is_default ? 1 : 0);
          insertId = r.lastInsertRowid;

        } else if (gear_type === 'setup') {
          const r = db.prepare(
            'INSERT INTO user_setups (user_id, nickname, telescope_id, camera_id, mount_id, is_default) VALUES (?,?,?,?,?,?)'
          ).run(userId, data.nickname, data.telescope_id || null, data.camera_id || null, data.mount_id || null, data.is_default ? 1 : 0);
          insertId = r.lastInsertRowid;
        }

        return { success: true, action: 'added', gear_type, id: insertId };

      } else if (action === 'set_default') {
        db.prepare(`UPDATE ${table} SET is_default = 0 WHERE user_id = ?`).run(userId);
        db.prepare(`UPDATE ${table} SET is_default = 1 WHERE id = ? AND user_id = ?`).run(item_id, userId);
        return { success: true, action: 'set_default', gear_type, id: item_id };

      } else if (action === 'delete') {
        db.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`).run(item_id, userId);
        return { success: true, action: 'deleted', gear_type, id: item_id };

      } else if (action === 'update') {
        const allowed = ['nickname','type','aperture_mm','focal_length_mm','f_ratio','notes',
                         'sensor_width_mm','sensor_height_mm','pixel_size_um','is_color',
                         'has_tracking','has_guiding','is_default'];
        const pairs = Object.entries(data).filter(([k]) => allowed.includes(k));
        if (pairs.length === 0) return { error: 'No valid fields to update' };
        const setClauses = pairs.map(([k]) => `${k} = ?`).join(', ');
        const values = pairs.map(([, v]) => v);
        db.prepare(`UPDATE ${table} SET ${setClauses} WHERE id = ? AND user_id = ?`).run(...values, item_id, userId);
        return { success: true, action: 'updated', gear_type, id: item_id };
      }

      return { error: `Unknown action: ${action}` };
    } catch (err) {
      return { error: err.message };
    }
  }

  updateProfile(userId, { experience_level, preferred_targets, observer_notes }) {
    try {
      const exists = db.prepare('SELECT user_id FROM user_ai_profiles WHERE user_id = ?').get(userId);
      if (exists) {
        const pairs = [];
        const vals  = [];
        if (experience_level !== undefined)  { pairs.push('experience_level = ?');  vals.push(experience_level); }
        if (preferred_targets !== undefined) { pairs.push('preferred_targets = ?'); vals.push(JSON.stringify(preferred_targets)); }
        if (observer_notes    !== undefined) { pairs.push('observer_notes = ?');    vals.push(observer_notes); }
        pairs.push('updated_at = CURRENT_TIMESTAMP');
        if (pairs.length > 1) {
          db.prepare(`UPDATE user_ai_profiles SET ${pairs.join(', ')} WHERE user_id = ?`).run(...vals, userId);
        }
      } else {
        db.prepare(
          'INSERT INTO user_ai_profiles (user_id, experience_level, preferred_targets, observer_notes) VALUES (?,?,?,?)'
        ).run(
          userId,
          experience_level || 'beginner',
          JSON.stringify(preferred_targets || []),
          observer_notes   || ''
        );
      }
      return { success: true, updated: { experience_level, preferred_targets, observer_notes } };
    } catch (err) {
      return { error: err.message };
    }
  }

  logMessage(userId, sessionId, role, content) {
    try {
      db.prepare(
        'INSERT INTO ai_conversation_logs (user_id, session_id, role, content) VALUES (?,?,?,?)'
      ).run(
        userId || null,
        sessionId,
        role,
        typeof content === 'string' ? content : JSON.stringify(content)
      );
    } catch (err) {
      console.error('[AstroAI] Failed to log message:', err.message);
    }
  }

  saveConversationSummary(userId, summary, locationUsed, topics) {
    try {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(
        'INSERT INTO ai_conversation_summaries (user_id, session_date, summary, location_used, topics) VALUES (?,?,?,?,?)'
      ).run(userId, today, summary, locationUsed || null, JSON.stringify(topics || []));
    } catch (err) {
      console.error('[AstroAI] Failed to save conversation summary:', err.message);
    }
  }
}

module.exports = new AIService();
