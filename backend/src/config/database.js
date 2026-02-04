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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

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

  console.log('Database initialized successfully');
};

// Initialize tables
initDb();

module.exports = db;
