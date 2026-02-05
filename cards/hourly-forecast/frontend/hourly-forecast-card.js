import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class HourlyForecastCard extends BaseCard {
  static properties = {
    ...BaseCard.properties,
    _multiDay: { type: Boolean, state: true },
    _expandedHours: { type: Object, state: true },
    _expandedNights: { type: Object, state: true },
  };

  static get cardStyles() {
    return css`
      .forecast-controls {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
      }

      .toggle-btn {
        padding: 6px 14px;
        background: #e94560;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toggle-btn:hover {
        background: #d63651;
      }

      /* ── Compact hour rows ── */
      .hour-table {
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        overflow: hidden;
      }

      .hour-row {
        display: grid;
        grid-template-columns: 54px 32px 1fr 44px;
        gap: 8px;
        align-items: center;
        padding: 8px 12px;
        background: #0f3460;
        cursor: pointer;
        user-select: none;
        transition: background 0.15s ease;
        border-left: 3px solid transparent;
      }

      .hour-row:hover {
        background: #133a6a;
      }

      .hour-row .time {
        font-size: 0.85rem;
        font-weight: 700;
        color: #eee;
      }

      .hour-row .icon {
        font-size: 1.1rem;
        text-align: center;
      }

      .hour-row .conditions {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.8rem;
        color: #ccc;
        overflow: hidden;
      }

      .cond-item {
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
      }

      .cond-label {
        color: #999;
        font-size: 0.7rem;
      }

      .score-badge {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
      }

      /* ── Expanded detail panel ── */
      .hour-detail {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 10px 12px 12px;
        background: #0a2a50;
        animation: slideDown 0.15s ease-out;
      }

      @keyframes slideDown {
        from { opacity: 0; max-height: 0; }
        to { opacity: 1; max-height: 200px; }
      }

      .detail-cell {
        text-align: center;
      }

      .detail-cell .label {
        font-size: 0.65rem;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .detail-cell .value {
        font-size: 0.85rem;
        font-weight: 600;
        color: #eee;
        margin-top: 2px;
      }

      /* ── Multi-day night cards ── */
      .nights-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .night-card {
        background: #0f3460;
        border-radius: 8px;
        overflow: hidden;
        border-left: 4px solid #e94560;
      }

      .night-header {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 12px;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        user-select: none;
        transition: background 0.15s ease;
      }

      .night-header:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      .night-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .night-date {
        font-size: 0.95rem;
        font-weight: 700;
        color: #00d4ff;
      }

      .night-meta {
        font-size: 0.75rem;
        color: #aaa;
      }

      .night-score {
        text-align: center;
      }

      .night-score-value {
        font-size: 1.3rem;
        font-weight: 700;
        color: #eee;
      }

      .night-score-label {
        font-size: 0.65rem;
        color: #aaa;
      }

      .night-moon {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .night-moon-emoji {
        font-size: 1.4rem;
      }

      .night-moon-info {
        font-size: 0.75rem;
        color: #ccc;
        line-height: 1.3;
      }

      .night-expand-icon {
        font-size: 0.7rem;
        color: #888;
        transition: transform 0.2s ease;
      }

      .night-expand-icon.open {
        transform: rotate(180deg);
      }

      .night-body {
        padding: 0 12px 12px;
      }

      .night-summary-bar {
        display: flex;
        gap: 16px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        margin-bottom: 8px;
        font-size: 0.75rem;
        color: #ccc;
        flex-wrap: wrap;
      }

      .night-summary-bar .stat {
        display: flex;
        gap: 4px;
      }

      .night-summary-bar .stat-label {
        color: #888;
      }

      .night-summary-bar .stat-value {
        color: #eee;
        font-weight: 600;
      }

      @media (max-width: 600px) {
        .hour-row {
          grid-template-columns: 48px 28px 1fr 36px;
          gap: 6px;
          padding: 7px 8px;
        }

        .hour-row .time {
          font-size: 0.8rem;
        }

        .hour-row .icon {
          font-size: 1rem;
        }

        .cond-item {
          font-size: 0.75rem;
        }

        .score-badge {
          width: 32px;
          height: 32px;
          font-size: 0.75rem;
        }

        .hour-detail {
          grid-template-columns: repeat(2, 1fr);
        }

        .night-header {
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .night-moon {
          display: none;
        }
      }
    `;
  }

  constructor() {
    super();
    this._multiDay = false;
    this._expandedHours = new Set();
    this._expandedNights = new Set();
  }

  getWeatherEmoji(iconCode) {
    const map = {
      '01n': '🌙', '02n': '🌤️', '03n': '☁️', '04n': '☁️',
      '09n': '🌧️', '10n': '🌧️', '11n': '⛈️', '13n': '🌨️', '50n': '🌫️',
      '01d': '☀️', '02d': '⛅', '03d': '☁️', '04d': '☁️',
      '09d': '🌧️', '10d': '🌧️', '11d': '⛈️', '13d': '🌨️', '50d': '🌫️',
    };
    return map[iconCode] || '🌙';
  }

  async fetchCardData() {
    if (!this.location) return null;
    const { lat, lon } = this.location;
    const days = this._multiDay ? 5 : 1;
    const res = await fetch(`/api/cards/hourly-forecast/data?lat=${lat}&lon=${lon}&days=${days}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load forecast');
    }
    return res.json();
  }

  toggleMultiDay() {
    this._multiDay = !this._multiDay;
    this._expandedHours = new Set();
    this._expandedNights = new Set();
    this.loadData();
  }

  toggleHour(key) {
    const next = new Set(this._expandedHours);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this._expandedHours = next;
  }

  toggleNight(index) {
    const next = new Set(this._expandedNights);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this._expandedNights = next;
  }

  renderHourRow(hour, key) {
    const expanded = this._expandedHours.has(key);
    return html`
      <div
        class="hour-row"
        style="border-left-color: ${hour.score_color}"
        @click=${() => this.toggleHour(key)}
      >
        <span class="time">${hour.time}</span>
        <span class="icon">${this.getWeatherEmoji(hour.weather?.icon)}</span>
        <span class="conditions">
          <span class="cond-item">
            <span class="cond-label">☁</span> ${hour.clouds}%
          </span>
          <span class="cond-item">
            <span class="cond-label">🌡</span> ${hour.temperature?.current}°
          </span>
          <span class="cond-item">
            <span class="cond-label">💧</span> ${hour.precipitation_probability}%
          </span>
        </span>
        <div class="score-badge" style="background: ${hour.score_color}">
          ${hour.astronomy_score}
        </div>
      </div>
      ${expanded
        ? html`
            <div class="hour-detail">
              <div class="detail-cell">
                <div class="label">Feels Like</div>
                <div class="value">${hour.temperature?.feels_like}°C</div>
              </div>
              <div class="detail-cell">
                <div class="label">Humidity</div>
                <div class="value">${hour.humidity}%</div>
              </div>
              <div class="detail-cell">
                <div class="label">Visibility</div>
                <div class="value">${hour.visibility_km} km</div>
              </div>
              <div class="detail-cell">
                <div class="label">Wind</div>
                <div class="value">${hour.wind_speed} m/s</div>
              </div>
              <div class="detail-cell">
                <div class="label">Quality</div>
                <div class="value">${hour.quality_rating}</div>
              </div>
              <div class="detail-cell">
                <div class="label">Weather</div>
                <div class="value">${hour.weather?.description}</div>
              </div>
            </div>
          `
        : ''}
    `;
  }

  renderNight(night, index) {
    const expanded = this._expandedNights.has(index);
    const date = new Date(night.date);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });

    return html`
      <div class="night-card">
        <div class="night-header" @click=${() => this.toggleNight(index)}>
          <div class="night-left">
            <div class="night-date">${dateStr}</div>
            <div class="night-meta">
              ${night.summary?.overall_quality || 'N/A'}
              &middot; Best: ${night.best_observation_time?.time || 'N/A'}
              &middot; Clouds: ${night.summary?.average_cloud_coverage ?? '?'}%
            </div>
          </div>
          <div class="night-moon">
            <span class="night-moon-emoji">${night.moon?.emoji}</span>
            <span class="night-moon-info">${night.moon?.phase_name}<br>${night.moon?.illumination}%</span>
          </div>
          <div class="night-score">
            <div class="night-score-value">${night.summary?.average_score ?? '?'}</div>
            <div class="night-score-label">AVG</div>
            <div class="night-expand-icon ${expanded ? 'open' : ''}">&#9660;</div>
          </div>
        </div>

        ${expanded
          ? html`
              <div class="night-body">
                <div class="hour-table">
                  ${night.hourly_forecast?.map((h, i) =>
                    this.renderHourRow(h, `n${index}-${i}`)
                  )}
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  renderContent() {
    const d = this._data;
    if (!d) {
      return html`<div class="card-empty">Search for a location to see the forecast.</div>`;
    }

    return html`
      <div class="forecast-controls">
        <button class="toggle-btn" @click=${this.toggleMultiDay}>
          ${this._multiDay ? 'Tonight Only' : '5-Night Forecast'}
        </button>
      </div>
      ${d.mode === 'multiday'
        ? html`
            <div class="nights-list">
              ${d.nights?.map((n, i) => this.renderNight(n, i))}
            </div>
          `
        : html`
            <div class="hour-table">
              ${d.hourly_forecast?.map((h, i) => this.renderHourRow(h, `t-${i}`))}
            </div>
          `}
    `;
  }
}

customElements.define('hourly-forecast-card', HourlyForecastCard);
