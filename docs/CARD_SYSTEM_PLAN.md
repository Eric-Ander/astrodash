# AstroDash Card Plugin System - Architecture & Implementation Plan

## Vision

AstroDash is a dashboard for amateur astronomers to plan observations. The dashboard
displays information through **cards** - self-contained, pluggable modules that each
cover a specific topic (weather, moon phase, light pollution, etc.). Cards can be
enabled/disabled per user and new cards can be added without modifying the core application.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Frontend)                 │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │              CardManager (ES Module)              │ │
│  │  - Discovers available cards from /api/cards      │ │
│  │  - Loads user preferences (DB or localStorage)    │ │
│  │  - Renders enabled cards into dashboard grid      │ │
│  │  - Provides shared context (location, auth, lang) │ │
│  └───┬───────────┬───────────┬───────────┬─────────┘ │
│      │           │           │           │            │
│  ┌───▼──┐   ┌───▼──┐   ┌───▼──┐   ┌───▼──┐         │
│  │Moon  │   │Wthr  │   │Bortle│   │Events│  ...     │
│  │Card  │   │Card  │   │Card  │   │Card  │          │
│  │(Lit) │   │(Lit) │   │(Lit) │   │(Lit) │          │
│  └──────┘   └──────┘   └──────┘   └──────┘          │
└─────────────────────────────────────────────────────┘
                         │ HTTP
┌─────────────────────────────────────────────────────┐
│                  Backend (Express.js)                 │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │            CardLoader (auto-discovery)            │ │
│  │  - Scans cards/ directory at startup              │ │
│  │  - Reads manifest.json from each card             │ │
│  │  - Mounts card routes under /api/cards/<id>/      │ │
│  │  - Serves card registry via /api/cards            │ │
│  └───┬───────────┬───────────┬───────────┬─────────┘ │
│      │           │           │           │            │
│  ┌───▼──┐   ┌───▼──┐   ┌───▼──┐   ┌───▼──┐         │
│  │Moon  │   │Wthr  │   │Bortle│   │Events│  ...     │
│  │routes│   │routes│   │routes│   │routes│          │
│  └───┬──┘   └───┬──┘   └───┬──┘   └───┬──┘          │
│      │           │           │           │            │
│  ┌───▼───────────▼───────────▼───────────▼─────────┐ │
│  │           Shared Services (existing)              │ │
│  │  weatherService, moonPhaseService,                │ │
│  │  lightPollutionService, astronomicalEventsService, │ │
│  │  astronomyScoreService                            │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │                SQLite Database                     │ │
│  │  + user_card_preferences table                    │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Key Architecture Decisions

### 1. Frontend: Lit (Web Components)

Each card is a [Lit](https://lit.dev) custom element. Lit is a thin (~5KB) wrapper
around native Web Components that provides reactive properties, declarative templates,
and scoped CSS via Shadow DOM.

**Why Lit:**
- Each card naturally maps to a custom HTML element (`<moon-phase-card>`)
- Scoped CSS per card - no style conflicts between cards
- Reactive properties - when CardManager updates `location`, cards re-render automatically
- No build step required - works with ES modules via import maps
- Easy to learn from vanilla JS background
- Web standards-based - future-proof

**Loading via import map (no build tooling):**
```html
<script type="importmap">
{
  "imports": {
    "lit": "https://cdn.jsdelivr.net/npm/lit@3/+esm",
    "lit/": "https://cdn.jsdelivr.net/npm/lit@3/"
  }
}
</script>
```

### 2. Backend: Shared services + card route adapters

Existing services (`weatherService`, `moonPhaseService`, etc.) stay in
`backend/src/services/`. They contain shared business logic and external API
integrations that multiple cards may need.

Each card has a thin `routes.js` that imports shared services and exposes
card-specific API endpoints. This avoids card-to-card backend coupling while
keeping services testable and reusable.

### 3. Card preferences: per-user in database

Logged-in users get their card preferences stored in a `user_card_preferences`
table. Anonymous users fall back to `localStorage` for session persistence, with
defaults from each card's `manifest.json`.

### 4. Card communication: top-down context + event bus

**Primary flow (top-down):** CardManager owns shared state (location, auth, language)
and passes it to cards as Lit reactive properties. When the user searches for a city,
CardManager updates all cards.

**Secondary flow (events):** Native `CustomEvent` on the document for optional
card-to-card signals. No card should require events from another card to function.
Events are for progressive enhancement only.

---

## Directory Structure

```
astrodash/
├── cards/                              # ALL CARDS LIVE HERE
│   ├── weather-summary/
│   │   ├── manifest.json
│   │   ├── backend/
│   │   │   └── routes.js              # Thin adapter calling shared services
│   │   └── frontend/
│   │       └── weather-summary-card.js # Lit component
│   │
│   ├── moon-phase/
│   │   ├── manifest.json
│   │   ├── backend/
│   │   │   └── routes.js
│   │   └── frontend/
│   │       └── moon-phase-card.js
│   │
│   ├── hourly-forecast/
│   │   ├── manifest.json
│   │   ├── backend/
│   │   │   └── routes.js
│   │   └── frontend/
│   │       └── hourly-forecast-card.js
│   │
│   ├── light-pollution/
│   │   ├── manifest.json
│   │   ├── backend/
│   │   │   └── routes.js
│   │   └── frontend/
│   │       └── light-pollution-card.js
│   │
│   └── astronomical-events/
│       ├── manifest.json
│       ├── backend/
│       │   └── routes.js
│       └── frontend/
│           └── astronomical-events-card.js
│
├── backend/
│   └── src/
│       ├── app.js                      # + CardLoader integration
│       ├── services/                   # STAYS - shared domain services
│       │   ├── weatherService.js
│       │   ├── moonPhaseService.js
│       │   ├── lightPollutionService.js
│       │   ├── astronomicalEventsService.js
│       │   └── astronomyScoreService.js
│       ├── card-loader.js              # NEW - auto-discovers cards
│       ├── controllers/
│       │   └── cardPreferencesController.js  # NEW - user card settings API
│       ├── routes/
│       │   └── api.js                  # + card preferences routes
│       └── config/
│           └── database.js             # + user_card_preferences table
│
├── frontend/
│   └── public/
│       ├── index.html                  # Simplified - dynamic card container
│       ├── js/
│       │   ├── card-manager.js         # NEW - discovers, loads, manages cards
│       │   ├── base-card.js            # NEW - Lit base class for all cards
│       │   ├── auth.js                 # STAYS
│       │   ├── auth-ui.js              # STAYS
│       │   └── i18n.js                 # STAYS
│       └── css/
│           └── styles.css              # Core styles only (layout, header, search)
│
└── docker-compose*.yml                 # + cards volume mount
```

---

## manifest.json Format

Each card declares its metadata and requirements:

```json
{
  "id": "moon-phase",
  "name": "Moon Phase",
  "description": "Current moon phase, illumination, and observation impact",
  "version": "1.0.0",
  "icon": "🌙",
  "category": "astronomy",
  "defaultEnabled": true,
  "defaultPosition": 2,
  "requiresAuth": false,
  "requiresLocation": true,
  "dataSource": {
    "endpoint": "/data",
    "refreshInterval": 3600
  },
  "size": {
    "default": "medium",
    "options": ["small", "medium", "large"]
  }
}
```

**Fields:**
- `id` - Unique identifier, matches directory name
- `defaultEnabled` - Shown by default for new/anonymous users
- `defaultPosition` - Order on dashboard (lower = higher)
- `requiresAuth` - Card only available to logged-in users
- `requiresLocation` - Card needs lat/lon to fetch data
- `dataSource.endpoint` - Relative to `/api/cards/<id>/`
- `size` - Card width in the dashboard grid

---

## Database Schema Addition

```sql
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
);

CREATE INDEX IF NOT EXISTS idx_user_card_prefs
  ON user_card_preferences(user_id, enabled);
```

---

## API Endpoints (New)

### Card Registry
```
GET  /api/cards                     # List all available cards (from manifests)
```

### Card Data (per card, auto-mounted by CardLoader)
```
GET  /api/cards/moon-phase/data     # Moon phase data for location
GET  /api/cards/weather-summary/data
GET  /api/cards/hourly-forecast/data
GET  /api/cards/light-pollution/data
GET  /api/cards/astronomical-events/data
```

### Card Preferences (authenticated)
```
GET    /api/cards/preferences           # Get user's card preferences
PUT    /api/cards/preferences           # Save full card layout
PATCH  /api/cards/preferences/:cardId   # Toggle or update single card
```

### Batch Data (performance optimization)
```
POST /api/cards/batch                   # Fetch data for multiple cards at once
     Body: { "cards": ["moon-phase", "weather-summary"], "lat": 47.3, "lon": 8.5 }
```

---

## Card Lifecycle

```
1. Server starts
   └─ CardLoader scans cards/ directory
      ├─ Reads each manifest.json
      ├─ Validates manifest
      ├─ Mounts backend routes under /api/cards/<id>/
      └─ Builds card registry (in-memory list of available cards)

2. User opens browser
   └─ index.html loads CardManager (ES module)
      ├─ Fetches card registry: GET /api/cards
      ├─ If logged in: fetches preferences: GET /api/cards/preferences
      │  Else: reads localStorage or uses manifest defaults
      ├─ Filters to enabled cards, sorts by position
      ├─ Dynamically imports each card's frontend component
      │   import('/cards/<id>/frontend/<id>-card.js')
      └─ Renders <card-id-card> elements into dashboard grid

3. User searches for location
   └─ CardManager updates shared location context
      └─ Each card reacts to location property change
         └─ Fetches own data: GET /api/cards/<id>/data?lat=...&lon=...
            └─ Renders updated content

4. User toggles card on/off
   └─ CardManager updates preference
      ├─ If logged in: PATCH /api/cards/preferences/<cardId>
      └─ Else: update localStorage
```

---

## Frontend Data Flow

```
                     ┌──────────────┐
                     │  Search Bar  │
                     └──────┬───────┘
                            │ location = { lat, lon, name }
                     ┌──────▼───────┐
                     │ CardManager  │
                     │              │
                     │ - location   │ ◄── shared context (properties)
                     │ - authState  │
                     │ - language   │
                     └──┬───┬───┬──┘
                        │   │   │     Lit reactive properties
              ┌─────────┘   │   └─────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Card A   │ │ Card B   │ │ Card C   │
        │          │ │          │ │          │
        │ Fetches  │ │ Fetches  │ │ Fetches  │
        │ own data │ │ own data │ │ own data │
        └──────────┘ └──────────┘ └──────────┘
```

---

## Existing Code Migration Map

| Current Code | Becomes | Notes |
|---|---|---|
| `index.html` lines 140-155 (summary section) | `cards/weather-summary/frontend/weather-summary-card.js` | Lit template |
| `index.html` lines 158-180 (moon section) | `cards/moon-phase/frontend/moon-phase-card.js` | Lit template |
| `index.html` lines 183-192 (forecast section) | `cards/hourly-forecast/frontend/hourly-forecast-card.js` | Lit template |
| `index.html` lines 195-223 (bortle section) | `cards/light-pollution/frontend/light-pollution-card.js` | Lit template |
| `index.html` lines 226-231 (events section) | `cards/astronomical-events/frontend/astronomical-events-card.js` | Lit template |
| `app.js` `displaySummary()` | `weather-summary-card.js` `render()` | Logic moves into card |
| `app.js` `displayMoonPhase()` | `moon-phase-card.js` `render()` | Logic moves into card |
| `app.js` `displayHourlyForecast()` | `hourly-forecast-card.js` `render()` | Logic moves into card |
| `app.js` `displayLightPollution()` | `light-pollution-card.js` `render()` | Logic moves into card |
| `app.js` `displayEvents()` | `astronomical-events-card.js` `render()` | Logic moves into card |
| `styles.css` `.moon-card` etc. | Inside each Lit component (scoped) | Shadow DOM scoping |
| `weatherController.getForecast()` | Per-card route handlers | Decomposed into card endpoints |

---

## Implementation Phases

### Phase 1: Foundation (card infrastructure)

Build the card system plumbing without touching existing functionality.

**Backend:**
1. Create `backend/src/card-loader.js` - scans `cards/` directory, reads manifests, mounts routes
2. Add `user_card_preferences` table to `database.js`
3. Create card preferences API (controller + routes)
4. Integrate CardLoader into `app.js` at startup
5. Create `GET /api/cards` registry endpoint

**Frontend:**
6. Add Lit import map to `index.html`
7. Create `base-card.js` - Lit base class with shared properties and helper methods
8. Create `card-manager.js` - discovers cards, manages layout, handles preferences
9. Add `<div id="card-dashboard">` container to `index.html`

**Deploy to staging**, verify the infrastructure works alongside existing code.

### Phase 2: First card migration (moon-phase)

Migrate one card end-to-end to validate the architecture.

1. Create `cards/moon-phase/manifest.json`
2. Create `cards/moon-phase/backend/routes.js` (calls existing `moonPhaseService`)
3. Create `cards/moon-phase/frontend/moon-phase-card.js` (Lit component)
4. Move moon CSS into the Lit component's scoped styles
5. Verify the card loads and displays correctly via the card system
6. **Deploy to staging**, test thoroughly

### Phase 3: Remaining card migrations

Convert the other 4 existing sections into cards:

1. `weather-summary` card
2. `hourly-forecast` card (most complex - includes multi-day toggle)
3. `light-pollution` card
4. `astronomical-events` card

After each: deploy to staging and verify.

### Phase 4: Remove legacy code

1. Remove hardcoded HTML sections from `index.html`
2. Remove `display*` methods from `app.js` (or retire `app.js` entirely)
3. Remove card-specific CSS from `styles.css` (now scoped in components)
4. Remove old monolithic `/api/weather/forecast` endpoint (keep for backwards
   compatibility during transition, remove when all cards use their own endpoints)

**Deploy to staging**, then **deploy to production**.

### Phase 5: Card management UI

1. Add card settings panel (toggle cards on/off, drag to reorder)
2. Connect to card preferences API
3. Add localStorage fallback for anonymous users
4. Card size options (small/medium/large)

### Phase 6: New cards

With the system in place, adding new cards is straightforward:

- **Seeing/Transparency card** - atmospheric seeing conditions
- **Satellite tracker card** - ISS and visible satellite passes with map
- **Night vision mode card** - toggle red theme for the entire dashboard
- **Equipment profile card** - limiting magnitude based on telescope specs
- **Observation planner card** - best nights this week with calendar view
- **Deep-sky objects card** - what's visible tonight based on location + equipment

Each new card is just a new directory in `cards/` with a manifest, backend routes
(optional), and a Lit frontend component.

---

## Docker / Deployment Changes

### docker-compose.yml (production)
```yaml
volumes:
  - ./backend/data:/app/data
  - ./frontend/public:/app/frontend/public:ro
  - ./cards:/app/cards:ro          # ADD THIS
```

### docker-compose.staging.yml
Already has `./cards:/app/cards:ro` (line 19).

### Dockerfile
No changes needed - cards are mounted as volumes, not baked into the image.

### nginx.conf
Add cache headers for `.js` files served from `/cards/`:
```
location /cards/ {
    alias /app/cards/;
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

### Deployment workflow
```
1. Develop card on feature branch
2. Test locally (docker compose up)
3. Deploy to staging (staging.astrodash.ch)
4. Verify on staging
5. Merge to main
6. Deploy to production (astrodash.ch)
```

---

## Example: Creating a New Card

To add a "Seeing Conditions" card:

### 1. Create directory structure
```
cards/seeing-conditions/
  manifest.json
  backend/
    routes.js
  frontend/
    seeing-conditions-card.js
```

### 2. Write manifest.json
```json
{
  "id": "seeing-conditions",
  "name": "Seeing Conditions",
  "description": "Atmospheric seeing and transparency forecast",
  "version": "1.0.0",
  "icon": "🌬️",
  "category": "weather",
  "defaultEnabled": true,
  "defaultPosition": 5,
  "requiresAuth": false,
  "requiresLocation": true,
  "dataSource": {
    "endpoint": "/data",
    "refreshInterval": 1800
  },
  "size": { "default": "medium", "options": ["small", "medium", "large"] }
}
```

### 3. Write backend routes
```javascript
const express = require('express');
const router = express.Router();
const weatherService = require('../../../backend/src/services/weatherService');

router.get('/data', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const coords = city
      ? await weatherService.getCoordinatesFromCity(city)
      : { lat: parseFloat(lat), lon: parseFloat(lon) };

    // Calculate seeing conditions from weather data
    const forecast = await weatherService.getForecast(coords.lat, coords.lon);
    const seeing = calculateSeeing(forecast);

    res.json(seeing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 4. Write Lit frontend component
```javascript
import { LitElement, html, css } from 'lit';

class SeeingConditionsCard extends LitElement {
  static properties = {
    location: { type: Object },
    data: { type: Object, state: true },
  };

  static styles = css`
    :host { display: block; }
    .card { /* card-specific styles */ }
  `;

  updated(changed) {
    if (changed.has('location') && this.location) {
      this.fetchData();
    }
  }

  async fetchData() {
    const { lat, lon } = this.location;
    const res = await fetch(`/api/cards/seeing-conditions/data?lat=${lat}&lon=${lon}`);
    this.data = await res.json();
  }

  render() {
    if (!this.data) return html`<div class="card">Waiting for location...</div>`;
    return html`
      <div class="card">
        <h3>🌬️ Seeing Conditions</h3>
        <!-- render seeing data -->
      </div>
    `;
  }
}

customElements.define('seeing-conditions-card', SeeingConditionsCard);
```

### 5. Restart server, card appears automatically

No changes to core code. The CardLoader discovers it, mounts routes, and the
frontend CardManager loads and displays it.

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Breaking existing functionality during migration | Phases 1-3 run in parallel with existing code. Old UI stays functional until Phase 4. |
| Performance: N cards = N API calls | Batch endpoint (`POST /api/cards/batch`). Existing service-level caching reduces API calls. |
| Lit CDN unavailability | Pin exact version. Consider self-hosting lit.js as fallback. |
| Card isolation: broken card breaks dashboard | CardManager catches errors per card. Failed cards show error state, others continue. |
| Database migrations on staging vs production | Schema changes are idempotent (`CREATE TABLE IF NOT EXISTS`). Same pattern used today. |

---

## Success Criteria

After full implementation:
- [ ] New cards can be added by creating a directory in `cards/` - zero changes to core code
- [ ] Users can enable/disable cards from a settings panel
- [ ] Card order is customizable per user
- [ ] Anonymous users see a sensible default dashboard
- [ ] Each card loads its own data independently
- [ ] A broken card does not crash the dashboard
- [ ] All existing functionality preserved (weather, moon, forecast, bortle, events)
- [ ] Works on mobile (responsive card grid)
- [ ] Staging and production deploy seamlessly
