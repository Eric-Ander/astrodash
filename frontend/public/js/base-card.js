import { LitElement, html, css } from 'lit';

/**
 * BaseCard - Abstract base class for all AstroDash card plugins.
 *
 * Provides shared reactive properties (location, authState, language),
 * a standard card chrome (title, icon, loading/error states), and
 * helper methods for data fetching and i18n.
 *
 * Cards start in a collapsed state showing a summary view. Clicking
 * the card header or summary expands it to show full content.
 *
 * Card implementations extend this and override:
 *   - cardStyles (static getter) - card-specific CSS
 *   - renderSummary() - compact summary for collapsed state
 *   - renderContent() - full card body when expanded
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
    _expanded: { type: Boolean, state: true },
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
      padding: 16px 20px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease;
    }

    .card-header:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .card-header-icon {
      font-size: 1.4rem;
    }

    .card-header-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--card-title-color, #00d4ff);
      margin: 0;
      flex: 1;
    }

    .card-expand-icon {
      font-size: 0.75rem;
      color: #888;
      transition: transform 0.25s ease;
    }

    .card-expand-icon.expanded {
      transform: rotate(180deg);
    }

    /* ── Collapsed summary view ── */
    .card-summary {
      padding: 0 20px 16px;
      min-height: 60px;
      cursor: pointer;
    }

    /* ── Expanded full content ── */
    .card-body {
      padding: 0 20px 20px;
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 2000px;
      }
    }

    .card-loading {
      text-align: center;
      padding: 30px 20px;
      color: #ccc;
    }

    .card-loading .spinner {
      width: 32px;
      height: 32px;
      margin: 0 auto 10px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--card-title-color, #00d4ff);
      border-radius: 50%;
      animation: card-spin 1s linear infinite;
    }

    @keyframes card-spin {
      to {
        transform: rotate(360deg);
      }
    }

    .card-error {
      padding: 16px 20px;
      color: #ff6b6b;
      text-align: center;
      font-size: 0.9rem;
    }

    .card-empty {
      padding: 24px 20px;
      color: #ccc;
      text-align: center;
      font-size: 0.95rem;
    }

    /* ── Summary styles (can be used by cards) ── */
    .summary-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .summary-metric {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #ccc;
    }

    .summary-metric .value {
      font-weight: 700;
      color: #eee;
    }

    .summary-metric .label {
      font-size: 0.75rem;
      color: #999;
    }

    .summary-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      color: white;
    }

    .summary-highlight {
      font-size: 1.5rem;
      font-weight: 700;
      color: #00d4ff;
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
    this._expanded = false;
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
   * Toggle expanded/collapsed state.
   */
  toggleExpanded() {
    this._expanded = !this._expanded;
  }

  /**
   * Override in subclasses to render a compact summary view.
   * Shown when the card is collapsed.
   */
  renderSummary() {
    // Default: show a hint to expand
    return html`<div class="summary-row"><span style="color:#888">Click to view details</span></div>`;
  }

  /**
   * Override in subclasses to render the full card body.
   * Shown when the card is expanded.
   */
  renderContent() {
    return html`<div class="card-empty">No data</div>`;
  }

  render() {
    return html`
      <div class="card">
        ${this.cardTitle || this.cardIcon
          ? html`
              <div class="card-header" @click=${this.toggleExpanded}>
                ${this.cardIcon
                  ? html`<span class="card-header-icon">${this.cardIcon}</span>`
                  : ''}
                ${this.cardTitle
                  ? html`<h3 class="card-header-title">${this.cardTitle}</h3>`
                  : ''}
                <span class="card-expand-icon ${this._expanded ? 'expanded' : ''}">▼</span>
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
            : this._expanded
              ? html`<div class="card-body">${this.renderContent()}</div>`
              : html`<div class="card-summary" @click=${this.toggleExpanded}>${this.renderSummary()}</div>`}
      </div>
    `;
  }
}
