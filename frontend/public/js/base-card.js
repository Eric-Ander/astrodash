import { LitElement, html, css } from 'lit';

/**
 * BaseCard - Abstract base class for all AstroDash card plugins.
 *
 * Provides shared reactive properties (location, authState, language),
 * a standard card chrome (title, icon, loading/error states), and
 * helper methods for data fetching and i18n.
 *
 * Card implementations extend this and override:
 *   - cardStyles (static getter) - card-specific CSS
 *   - renderContent() - card body when data is available
 *   - fetchCardData() - fetch data from the card's backend endpoint
 */
export class BaseCard extends LitElement {
  static properties = {
    // Shared context set by CardManager
    cardId: { type: String, attribute: 'card-id' },
    cardTitle: { type: String, attribute: 'card-title' },
    cardIcon: { type: String, attribute: 'card-icon' },
    location: { type: Object },
    authState: { type: Object },
    language: { type: String },

    // Internal state
    _data: { type: Object, state: true },
    _loading: { type: Boolean, state: true },
    _error: { type: String, state: true },
  };

  // Base styles shared by all cards
  static baseStyles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--card-bg, #16213e);
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      border: 2px solid var(--card-border, #4a5568);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .card:hover {
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 24px 0;
    }

    .card-header-icon {
      font-size: 1.5rem;
    }

    .card-header-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--card-title-color, #00d4ff);
      margin: 0;
    }

    .card-body {
      padding: 20px 24px 24px;
    }

    .card-loading {
      text-align: center;
      padding: 40px 20px;
      color: #ccc;
    }

    .card-loading .spinner {
      width: 36px;
      height: 36px;
      margin: 0 auto 12px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--card-title-color, #00d4ff);
      border-radius: 50%;
      animation: card-spin 1s linear infinite;
    }

    @keyframes card-spin {
      to { transform: rotate(360deg); }
    }

    .card-error {
      padding: 20px 24px;
      color: #ff6b6b;
      text-align: center;
      font-size: 0.9rem;
    }

    .card-empty {
      padding: 30px 24px;
      color: #ccc;
      text-align: center;
      font-size: 0.95rem;
    }
  `;

  // Subclasses override this to add card-specific styles
  static get cardStyles() {
    return css``;
  }

  static get styles() {
    return [this.baseStyles, this.cardStyles];
  }

  constructor() {
    super();
    this.location = null;
    this.authState = null;
    this.language = 'en';
    this._data = null;
    this._loading = false;
    this._error = null;
  }

  /**
   * React to property changes. When location changes, refetch data.
   */
  updated(changed) {
    if (changed.has('location') && this.location) {
      this.loadData();
    }
    if (changed.has('language')) {
      this.onLanguageChanged();
    }
  }

  /**
   * Fetch data from the card's backend endpoint.
   * Subclasses override this to customise the fetch logic.
   */
  async fetchCardData() {
    if (!this.cardId || !this.location) return null;

    const { lat, lon } = this.location;
    const res = await fetch(`/api/cards/${this.cardId}/data?lat=${lat}&lon=${lon}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to load ${this.cardTitle || this.cardId}`);
    }

    return res.json();
  }

  /**
   * Trigger a data load with loading/error state management.
   */
  async loadData() {
    this._loading = true;
    this._error = null;

    try {
      this._data = await this.fetchCardData();
    } catch (err) {
      console.error(`Card "${this.cardId}" data error:`, err);
      this._error = err.message;
    } finally {
      this._loading = false;
    }
  }

  /**
   * Called when the language changes. Subclasses can override to
   * refresh translations or re-fetch localised data.
   */
  onLanguageChanged() {
    // Default: no-op. Subclasses override if needed.
  }

  /**
   * Helper: translate a key using the global i18nManager if available.
   */
  t(key, params) {
    if (window.i18nManager) {
      return window.i18nManager.t(key, params);
    }
    return key;
  }

  /**
   * Override in subclasses to render the card body.
   */
  renderContent() {
    return html`<div class="card-empty">No data</div>`;
  }

  render() {
    return html`
      <div class="card">
        ${this.cardTitle || this.cardIcon
          ? html`
              <div class="card-header">
                ${this.cardIcon
                  ? html`<span class="card-header-icon">${this.cardIcon}</span>`
                  : ''}
                ${this.cardTitle
                  ? html`<h3 class="card-header-title">${this.cardTitle}</h3>`
                  : ''}
              </div>
            `
          : ''}

        ${this._loading
          ? html`
              <div class="card-loading">
                <div class="spinner"></div>
                <p>Loading...</p>
              </div>
            `
          : this._error
            ? html`<div class="card-error">${this._error}</div>`
            : html`<div class="card-body">${this.renderContent()}</div>`}
      </div>
    `;
  }
}
