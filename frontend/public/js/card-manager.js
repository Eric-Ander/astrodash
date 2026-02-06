/**
 * CardManager - Discovers, loads, and manages card plugins on the dashboard.
 *
 * Responsibilities:
 * 1. Fetch the card registry from /api/cards
 * 2. Load user preferences (DB for logged-in, localStorage for anonymous)
 * 3. Dynamically import each card's Lit component
 * 4. Render enabled cards into the #cardDashboard container
 * 5. Push shared context (location, auth, language) to all cards
 * 6. Listen for location/auth/language changes and propagate them
 */

const STORAGE_KEY = 'astrodash_card_prefs';

class CardManager {
  constructor() {
    this.registry = [];
    this.preferences = new Map();
    this.activeCards = new Map(); // cardId -> DOM element
    this.container = null;

    // Shared context
    this.location = null;
    this.authState = { isLoggedIn: false, userId: null };
    this.language = 'en';

    this.init();
  }

  async init() {
    this.container = document.getElementById('cardDashboard');
    if (!this.container) {
      console.error('CardManager: #cardDashboard container not found');
      return;
    }

    try {
      // 1. Fetch the card registry
      await this.fetchRegistry();

      if (this.registry.length === 0) {
        // No cards discovered yet - hide the dashboard
        return;
      }

      // 2. Load user preferences
      await this.loadPreferences();

      // 3. Import and render enabled cards
      await this.renderCards();

      // 4. Show the dashboard
      this.container.classList.remove('hidden');

      // 5. Wire up event listeners for context changes
      this.setupEventListeners();

      console.log(`CardManager initialized with ${this.activeCards.size} active card(s)`);
    } catch (err) {
      console.error('CardManager initialization error:', err);
    }
  }

  /**
   * Fetch the list of available cards from the backend.
   */
  async fetchRegistry() {
    try {
      const res = await fetch('/api/cards');
      if (!res.ok) throw new Error('Failed to fetch card registry');
      const data = await res.json();
      this.registry = data.cards || [];
    } catch (err) {
      console.error('CardManager: could not load card registry:', err);
      this.registry = [];
    }
  }

  /**
   * Load card preferences.
   * - Logged-in users: fetch from API
   * - Anonymous users: read from localStorage
   * - Fallback: use manifest defaults
   */
  async loadPreferences() {
    // Check if user is logged in via the existing auth system
    const token = localStorage.getItem('astroweather_token');
    if (token) {
      this.authState = { isLoggedIn: true };
      try {
        const res = await fetch('/api/cards/preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          for (const pref of data.preferences) {
            this.preferences.set(pref.cardId, pref);
          }
          return;
        }
      } catch (err) {
        console.warn('CardManager: could not load server preferences, using local:', err);
      }
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        for (const pref of prefs) {
          this.preferences.set(pref.cardId, pref);
        }
        return;
      }
    } catch (err) {
      // Ignore parse errors
    }

    // Fallback: build defaults from registry
    this.applyDefaults();
  }

  /**
   * Build default preferences from the card manifests.
   */
  applyDefaults() {
    for (const card of this.registry) {
      if (!this.preferences.has(card.id)) {
        this.preferences.set(card.id, {
          cardId: card.id,
          enabled: card.defaultEnabled,
          position: card.defaultPosition,
          settings: {},
        });
      }
    }
  }

  /**
   * Get the ordered list of enabled cards.
   */
  getEnabledCards() {
    // Make sure every registry card has at least a default preference
    this.applyDefaults();

    return this.registry
      .filter((card) => {
        const pref = this.preferences.get(card.id);
        return pref && pref.enabled;
      })
      .sort((a, b) => {
        const posA = this.preferences.get(a.id)?.position ?? a.defaultPosition;
        const posB = this.preferences.get(b.id)?.position ?? b.defaultPosition;
        return posA - posB;
      });
  }

  /**
   * Dynamically import each card's frontend component and render it.
   */
  async renderCards() {
    const enabled = this.getEnabledCards();

    for (const card of enabled) {
      try {
        // Dynamically import the card component (registers the custom element)
        await import(card.frontendEntry);

        // Create the custom element
        const tagName = `${card.id}-card`;
        const el = document.createElement(tagName);

        // Set shared context
        el.cardId = card.id;
        el.cardTitle = card.name;
        el.cardIcon = card.icon;
        el.location = this.location;
        el.authState = this.authState;
        el.language = this.language;

        this.container.appendChild(el);
        this.activeCards.set(card.id, el);
      } catch (err) {
        console.error(`CardManager: failed to load card "${card.id}":`, err);
        // Render a placeholder error card
        this.renderCardError(card);
      }
    }
  }

  /**
   * Render an error placeholder when a card fails to load.
   */
  renderCardError(card) {
    const el = document.createElement('div');
    el.className = 'card-load-error';
    el.innerHTML = `
      <div style="background: #16213e; border-radius: 12px; border: 2px solid #ff6b6b;
                  padding: 24px; text-align: center; color: #ff6b6b;">
        <p>${card.icon || ''} ${card.name || card.id}</p>
        <p style="font-size: 0.85rem; color: #ccc; margin-top: 8px;">
          Failed to load card
        </p>
      </div>
    `;
    this.container.appendChild(el);
  }

  /**
   * Update the location context and push it to all active cards.
   * Also shows the card dashboard if it was hidden.
   */
  setLocation(location) {
    this.location = location;

    // Show the card dashboard
    if (this.container) {
      this.container.classList.remove('hidden');
    }

    for (const [, el] of this.activeCards) {
      el.location = location;
    }
  }

  /**
   * Update the auth state and push it to all active cards.
   */
  setAuthState(authState) {
    this.authState = authState;
    for (const [, el] of this.activeCards) {
      el.authState = authState;
    }
  }

  /**
   * Update the language and push it to all active cards.
   */
  setLanguage(language) {
    this.language = language;
    for (const [, el] of this.activeCards) {
      el.language = language;
    }
  }

  /**
   * Save current preferences to server (if logged in) or localStorage.
   */
  async savePreferences() {
    const prefs = Array.from(this.preferences.values());

    // Save to localStorage always (as fallback)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (err) {
      // Ignore
    }

    // Save to server if logged in
    const token = localStorage.getItem('astroweather_token');
    if (token) {
      try {
        await fetch('/api/cards/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ preferences: prefs }),
        });
      } catch (err) {
        console.warn('CardManager: failed to save preferences to server:', err);
      }
    }
  }

  /**
   * Toggle a card's enabled state.
   */
  async toggleCard(cardId, enabled) {
    const pref = this.preferences.get(cardId);
    if (pref) {
      pref.enabled = enabled;
    }

    if (!enabled && this.activeCards.has(cardId)) {
      // Remove the card element
      const el = this.activeCards.get(cardId);
      el.remove();
      this.activeCards.delete(cardId);
    } else if (enabled && !this.activeCards.has(cardId)) {
      // Load and add the card
      const card = this.registry.find((c) => c.id === cardId);
      if (card) {
        try {
          await import(card.frontendEntry);
          const tagName = `${card.id}-card`;
          const el = document.createElement(tagName);
          el.cardId = card.id;
          el.cardTitle = card.name;
          el.cardIcon = card.icon;
          el.location = this.location;
          el.authState = this.authState;
          el.language = this.language;
          this.container.appendChild(el);
          this.activeCards.set(card.id, el);
        } catch (err) {
          console.error(`CardManager: failed to load card "${cardId}":`, err);
        }
      }
    }

    await this.savePreferences();
  }

  /**
   * Wire up listeners for events from the legacy app and auth system.
   */
  setupEventListeners() {
    // Listen for language changes (fired by i18n.js)
    window.addEventListener('languageChanged', (e) => {
      this.setLanguage(e.detail?.language || 'en');
    });

    // Listen for auth state changes
    window.addEventListener('authStateChanged', (e) => {
      this.setAuthState(e.detail || { isLoggedIn: false });
      // Reload preferences when user logs in/out
      this.loadPreferences();
    });

    // Bridge: listen for the legacy app's forecast results to extract location.
    // The legacy AstroWeather class stores location on window.astroApp.
    // We intercept the search to also feed cards.
    this.interceptLocationSearch();
  }

  /**
   * No longer needed - app.js now calls setLocation() directly.
   * Kept as empty method for backwards compatibility.
   */
  interceptLocationSearch() {
    // Legacy MutationObserver removed - app.js calls setLocation() directly
  }
}

// Make globally accessible for card management UI and debugging
window.cardManager = new CardManager();

export default CardManager;
