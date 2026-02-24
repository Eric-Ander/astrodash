const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './data/astroweather.db';
const dbDir = path.dirname(dbPath);

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
const initDb = () => {
  // Locations table for future use
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Forecast cache table to reduce API calls
  db.exec(`
    CREATE TABLE IF NOT EXISTS forecast_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      forecast_data TEXT NOT NULL,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )
  `);

  // Create index for faster cache lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_forecast_cache_coords 
    ON forecast_cache(latitude, longitude, expires_at)
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Migration: Add is_admin column if it doesn't exist (for existing databases)
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasIsAdmin = columns.some(col => col.name === 'is_admin');
  if (!hasIsAdmin) {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
    console.log('Added is_admin column to users table');
  }

  // Saved locations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      location_name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      notifications_enabled INTEGER DEFAULT 0,
      cloud_threshold INTEGER DEFAULT 20,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Index for user locations
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_saved_locations_user 
    ON saved_locations(user_id)
  `);

  // Index for notifications
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_saved_locations_notifications
    ON saved_locations(notifications_enabled, user_id)
  `);

  // User card preferences table - stores per-user card layout and settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_card_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      position INTEGER DEFAULT 0,
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, card_id)
    )
  `);

  // Index for efficient card preference lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_card_prefs
    ON user_card_preferences(user_id, enabled)
  `);

  // ── AI Assistant tables ──────────────────────────────────────────────────

  // User AI profile – experience level, preferred targets, observer notes
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_ai_profiles (
      user_id          INTEGER PRIMARY KEY,
      experience_level TEXT    DEFAULT 'beginner',
      preferred_targets TEXT   DEFAULT '[]',
      observer_notes   TEXT    DEFAULT '',
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Telescopes (multiple per user)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_telescopes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      nickname        TEXT,
      type            TEXT,
      aperture_mm     INTEGER,
      focal_length_mm INTEGER,
      f_ratio         REAL,
      notes           TEXT,
      is_default      INTEGER DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Cameras (multiple per user)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_cameras (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL,
      nickname         TEXT,
      type             TEXT,
      sensor_width_mm  REAL,
      sensor_height_mm REAL,
      pixel_size_um    REAL,
      is_color         INTEGER DEFAULT 1,
      is_default       INTEGER DEFAULT 0,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Mounts (multiple per user)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_mounts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      nickname     TEXT,
      type         TEXT,
      has_tracking INTEGER DEFAULT 0,
      has_guiding  INTEGER DEFAULT 0,
      is_default   INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Named setups – a combination of telescope + camera + mount
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_setups (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      nickname     TEXT    NOT NULL,
      telescope_id INTEGER,
      camera_id    INTEGER,
      mount_id     INTEGER,
      is_default   INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)      REFERENCES users(id)           ON DELETE CASCADE,
      FOREIGN KEY (telescope_id) REFERENCES user_telescopes(id) ON DELETE SET NULL,
      FOREIGN KEY (camera_id)    REFERENCES user_cameras(id)    ON DELETE SET NULL,
      FOREIGN KEY (mount_id)     REFERENCES user_mounts(id)     ON DELETE SET NULL
    )
  `);

  // Per-session conversation summaries (cross-session memory)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_conversation_summaries (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      session_date  DATE    NOT NULL,
      summary       TEXT    NOT NULL,
      location_used TEXT,
      topics        TEXT    DEFAULT '[]',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Full conversation log (for future analytics / fine-tuning)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_conversation_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER,
      session_id TEXT    NOT NULL,
      role       TEXT    NOT NULL,
      content    TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes for AI tables
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_telescopes_user
      ON user_telescopes(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_cameras_user
      ON user_cameras(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_mounts_user
      ON user_mounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_setups_user
      ON user_setups(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_summaries_user
      ON ai_conversation_summaries(user_id, session_date);
    CREATE INDEX IF NOT EXISTS idx_ai_logs_session
      ON ai_conversation_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_ai_logs_user
      ON ai_conversation_logs(user_id);
  `);

  console.log('Database initialized successfully');
};

// Initialize tables
initDb();

module.exports = db;
