# AstroDash Architecture

> **Beginner-Friendly Architecture Guide**

## 🏗️ The Big Picture

Think of AstroDash like a restaurant:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  FRONTEND (Dining Room)                        │
│  What users see and interact with              │
│  - HTML pages                                   │
│  - JavaScript for interactivity                 │
│  - CSS for styling                              │
│                                                 │
└────────────┬────────────────────────────────────┘
             │
             │ HTTP Requests (orders)
             │
┌────────────▼────────────────────────────────────┐
│                                                 │
│  BACKEND (Kitchen)                             │
│  Where the work happens                         │
│  - API endpoints (receives orders)              │
│  - Services (prepares data)                     │
│  - Controllers (coordinates)                    │
│                                                 │
└────────────┬────────────────────────────────────┘
             │
             │ Queries/Stores
             │
┌────────────▼────────────────────────────────────┐
│                                                 │
│  DATABASE (Pantry)                             │
│  Where data is stored                           │
│  - User accounts                                │
│  - Saved locations                              │
│  - Notification settings                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 📁 Directory Structure Explained

```
astrodash/
│
├── backend/                    # Server-side code
│   ├── src/
│   │   ├── app.js             # Main application (the boss)
│   │   ├── server.js          # Starts the server
│   │   │
│   │   ├── routes/            # Define URL endpoints
│   │   │   └── api.js         # "/api/weather", "/api/auth", etc.
│   │   │
│   │   ├── controllers/       # Handle requests
│   │   │   ├── weatherController.js    # Weather endpoints
│   │   │   └── authController.js       # Login/register
│   │   │
│   │   ├── services/          # Business logic
│   │   │   ├── weatherService.js       # Fetch weather data
│   │   │   ├── authService.js          # User authentication
│   │   │   └── cardManager.js          # Load plugin cards
│   │   │
│   │   ├── middleware/        # Code that runs between request/response
│   │   │   └── auth.js        # Check if user is logged in
│   │   │
│   │   └── config/            # Configuration
│   │       └── database.js    # Database setup
│   │
│   ├── .env                   # Secret configuration (not in Git!)
│   ├── package.json           # Lists dependencies
│   └── Dockerfile             # Instructions to build Docker image
│
├── frontend/                  # Client-side code
│   └── public/
│       ├── index.html         # Main webpage
│       ├── css/
│       │   └── styles.css     # All styling
│       ├── js/
│       │   ├── app.js         # Main JavaScript
│       │   ├── auth.js        # Authentication logic
│       │   └── auth-ui.js     # Login/register UI
│       └── locales/           # Translations
│           ├── en.json        # English
│           ├── de.json        # German
│           └── ...
│
├── cards/                     # Plugin cards (features)
│   ├── weather/
│   │   ├── manifest.json      # Card info
│   │   ├── backend/
│   │   │   ├── service.js     # Weather logic
│   │   │   └── routes.js      # Weather API
│   │   └── frontend/
│   │       └── WeatherCard.jsx
│   └── moon/
│       └── ...
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # This file
│   ├── API.md                 # API documentation
│   └── CARDS.md               # How to create cards
│
├── docker-compose.yml         # Tells Docker how to run everything
├── README.md                  # Main documentation
└── .gitignore                 # Files Git should ignore
```

## 🔄 How a Request Works

Let's trace what happens when a user searches for weather:

```
1. USER TYPES CITY
   ↓
   Browser: "London, UK"
   
2. FRONTEND SENDS REQUEST
   ↓
   JavaScript: fetch('/api/weather/forecast?city=London')
   
3. BACKEND RECEIVES REQUEST
   ↓
   app.js → routes/api.js → weatherController.js
   
4. CONTROLLER CALLS SERVICE
   ↓
   weatherController → weatherService.js
   
5. SERVICE GETS DATA
   ↓
   weatherService.js:
   - Calls OpenWeatherMap API
   - Calculates astronomy scores
   - Formats response
   
6. RESPONSE SENT BACK
   ↓
   JSON data → Frontend
   
7. FRONTEND DISPLAYS DATA
   ↓
   JavaScript updates the page
   Browser shows weather cards
```

## 🔌 The Plugin Card System

### Traditional Approach (Bad)
```javascript
// Everything hardcoded in one file
function showWeather() { /* code */ }
function showMoon() { /* code */ }
function showISS() { /* code */ }
// Adding features requires editing core code!
```

### Plugin Approach (Good)
```
cards/
├── weather/        # Independent module
├── moon/           # Independent module
└── iss/            # Independent module

Each card:
- Works independently
- Can be added/removed without touching core
- Can be versioned separately
- Easy to test
```

### How Cards Are Loaded

```javascript
// backend/src/services/cardManager.js

class CardManager {
  loadCards() {
    // 1. Scan cards/ directory
    const cardFolders = fs.readdirSync('./cards');
    
    // 2. For each card:
    for (const folder of cardFolders) {
      // Read manifest.json
      const manifest = require(`./cards/${folder}/manifest.json`);
      
      // If enabled, load it
      if (manifest.enabled) {
        this.registerCard(folder, manifest);
      }
    }
  }
}

// Now all cards are available!
```

## 🗄️ Database Schema

We use SQLite - a simple, file-based database.

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  created_at DATETIME
);

-- Saved locations table
CREATE TABLE saved_locations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  location_name TEXT,
  lat REAL,
  lon REAL,
  is_favorite INTEGER,
  notifications_enabled INTEGER,
  cloud_threshold INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Forecast cache (reduces API calls)
CREATE TABLE forecast_cache (
  id INTEGER PRIMARY KEY,
  latitude REAL,
  longitude REAL,
  forecast_data TEXT,
  expires_at DATETIME
);
```

## 🔐 Authentication Flow

```
1. USER REGISTERS
   ↓
   POST /api/auth/register
   { email, password, name }
   ↓
   authService.register():
   - Hash password (bcrypt)
   - Save to database
   - Generate JWT token
   ↓
   Return: { user, token }

2. USER LOGS IN
   ↓
   POST /api/auth/login
   { email, password }
   ↓
   authService.login():
   - Find user in database
   - Verify password hash
   - Generate JWT token
   ↓
   Return: { user, token }

3. USER MAKES AUTHENTICATED REQUEST
   ↓
   GET /api/locations
   Header: Authorization: Bearer [token]
   ↓
   auth middleware:
   - Verify JWT token
   - Extract user ID
   - Continue to controller
   ↓
   Return: user's locations
```

## 🌐 Multi-Environment Setup

### Development (Your Computer)
```
Port: 3002
Database: backend/data/dev/astrodash.db
Branch: any
Purpose: Testing new features
```

### Staging (Server)
```
URL: staging.astrodash.ch
Port: 3001
Database: backend/data/staging/astrodash.db
Branch: develop
Purpose: Testing before production
```

### Production (Server)
```
URL: astrodash.ch
Port: 3000
Database: backend/data/prod/astrodash.db
Branch: main
Purpose: Live for users
```

### Workflow
```
1. Develop on your computer
2. Push to GitHub (develop branch)
3. Auto-deploy to staging
4. Test on staging
5. Merge to main branch
6. Auto-deploy to production
```

## 📦 Docker Architecture

```yaml
# docker-compose.yml

services:
  astrodash:
    build: ./backend           # Build from backend/Dockerfile
    container_name: astrodash
    ports:
      - "3000:3000"           # Outside:Inside
    volumes:
      - ./backend/data:/app/data              # Database persists
      - ./frontend/public:/app/frontend/public # Frontend files
      - ./cards:/app/cards                     # Plugin cards
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/astrodash.db
```

**What this means:**
- **build**: Create a container from Dockerfile
- **ports**: Map port 3000 inside to 3000 outside
- **volumes**: Share folders between host and container
  - Database survives container restarts
  - Frontend changes immediately visible
  - Cards can be added without rebuild
- **environment**: Pass configuration to container

## 🔄 Development vs Production

### Development Mode
```javascript
// Hot reload enabled
if (process.env.NODE_ENV === 'development') {
  // Watch for file changes
  // Auto-restart on changes
  // Verbose logging
  // Debug tools enabled
}
```

### Production Mode
```javascript
// Optimized for performance
if (process.env.NODE_ENV === 'production') {
  // No file watching
  // Minimal logging
  // Caching enabled
  // Error handling strict
}
```

## 🎯 Key Design Principles

### 1. Separation of Concerns
Each piece has one job:
- **Routes**: Define URLs
- **Controllers**: Handle requests
- **Services**: Business logic
- **Models**: Database operations

### 2. Modularity
Features are independent plugins:
- Easy to add
- Easy to remove
- Easy to test
- Easy to maintain

### 3. Configuration over Code
Settings in `.env`, not hardcoded:
```javascript
// Bad
const apiKey = "abc123";

// Good
const apiKey = process.env.OPENWEATHER_API_KEY;
```

### 4. Security by Default
- Passwords hashed (never stored plain)
- JWT tokens for authentication
- Input validation
- SQL injection prevention (prepared statements)

### 5. Progressive Enhancement
Works without JavaScript, better with it:
- Basic HTML works
- CSS improves appearance
- JavaScript adds interactivity

## 🐛 Common Gotchas

### 1. File Paths
```javascript
// Relative to current file
./config/database.js    // Same folder
../services/auth.js     // Parent folder
../../cards/weather     // Two levels up

// Absolute from project root
/app/data/astrodash.db  // In Docker container
```

### 2. Async/Await
```javascript
// Wrong - doesn't wait
function getData() {
  fetch('/api/data');  // Starts but doesn't wait
  return data;         // Returns undefined
}

// Right - waits for completion
async function getData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}
```

### 3. Environment Variables
```javascript
// Must be in .env file
OPENWEATHER_API_KEY=abc123

// Access in code
process.env.OPENWEATHER_API_KEY

// Default value if not set
process.env.API_KEY || 'default-key'
```

## 📚 Further Reading

- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Docker Documentation](https://docs.docker.com/)
- [JWT Introduction](https://jwt.io/introduction)

## 🤔 Questions?

If anything is unclear:
1. Check the inline code comments
2. Look at similar examples in the codebase
3. Search the docs/ folder
4. Create an issue on GitHub
5. Don't hesitate to ask!

---

**Remember:** Every expert was once a beginner. Take your time, experiment, and learn by doing!
