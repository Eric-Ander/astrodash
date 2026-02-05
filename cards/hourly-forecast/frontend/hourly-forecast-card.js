import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class HourlyForecastCard extends BaseCard {
  static properties = {
    ...BaseCard.properties,
    _multiDay: { type: Boolean, state: true },
  };

  static get cardStyles() {
    return css`
      .forecast-controls {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
      }

      .toggle-btn {
        padding: 8px 16px;
        background: #e94560;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .toggle-btn:hover {
        background: #d63651;
        transform: translateY(-2px);
      }

      .hour-list {
        display: grid;
        gap: 12px;
      }

      .hour-item {
        background: #0f3460;
        padding: 16px;
        border-radius: 8px;
        display: grid;
        grid-template-columns: 80px 1fr 80px;
        gap: 16px;
        align-items: center;
        border-left: 4px solid transparent;
        transition: all 0.3s ease;
      }

      .hour-item:hover {
        transform: translateX(4px);
      }

      .hour-time {
        text-align: center;
      }

      .hour-time .time {
        font-size: 1.2rem;
        font-weight: 700;
        color: #eee;
      }

      .hour-time .icon {
        font-size: 1.8rem;
        margin-top: 4px;
      }

      .hour-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 10px;
      }

      .detail {
        display: flex;
        flex-direction: column;
      }

      .detail-label {
        font-size: 0.75rem;
        color: #ccc;
      }

      .detail-value {
        font-size: 1rem;
        font-weight: 600;
        color: #eee;
      }

      .score-circle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        font-size: 1.2rem;
        font-weight: 700;
        color: white;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
      }

      .score-label {
        text-align: center;
        font-size: 0.8rem;
        color: #ccc;
        margin-top: 4px;
      }

      /* Multi-day styles */
      .night-card {
        background: #0f3460;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #e94560;
      }

      .night-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      }

      .night-date {
        font-size: 1.2rem;
        font-weight: 700;
        color: #00d4ff;
      }

      .night-moon {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .night-moon-emoji {
        font-size: 1.8rem;
      }

      .night-moon-info {
        font-size: 0.85rem;
        color: #ccc;
      }

      .night-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }

      .night-stat {
        text-align: center;
      }

      .night-stat-label {
        font-size: 0.75rem;
        color: #ccc;
      }

      .night-stat-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #eee;
      }

      @media (max-width: 768px) {
        .hour-item {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .hour-time {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hour-details {
          grid-template-columns: 1fr 1fr;
        }

        .detail {
          text-align: center;
        }

        .score-circle {
          width: 50px;
          height: 50px;
          font-size: 1rem;
        }
      }
    `;
  }

  constructor() {
    super();
    this._multiDay = false;
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
    this.loadData();
  }

  renderHourItem(hour) {
    return html`
      <div class="hour-item" style="border-left-color: ${hour.score_color}">
        <div class="hour-time">
          <div class="time">${hour.time}</div>
          <div class="icon">${this.getWeatherEmoji(hour.weather?.icon)}</div>
        </div>
        <div class="hour-details">
          <div class="detail">
            <span class="detail-label">Temp</span>
            <span class="detail-value">${hour.temperature?.current}°C</span>
          </div>
          <div class="detail">
            <span class="detail-label">Clouds</span>
            <span class="detail-value">${hour.clouds}%</span>
          </div>
          <div class="detail">
            <span class="detail-label">Visibility</span>
            <span class="detail-value">${hour.visibility_km} km</span>
          </div>
          <div class="detail">
            <span class="detail-label">Humidity</span>
            <span class="detail-value">${hour.humidity}%</span>
          </div>
          <div class="detail">
            <span class="detail-label">Wind</span>
            <span class="detail-value">${hour.wind_speed} m/s</span>
          </div>
          <div class="detail">
            <span class="detail-label">Rain</span>
            <span class="detail-value">${hour.precipitation_probability}%</span>
          </div>
        </div>
        <div>
          <div class="score-circle" style="background: ${hour.score_color}">
            ${hour.astronomy_score}
          </div>
          <div class="score-label">${hour.quality_rating}</div>
        </div>
      </div>
    `;
  }

  renderNight(night) {
    const date = new Date(night.date);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    });

    return html`
      <div class="night-card">
        <div class="night-header">
          <div class="night-date">${dateStr}</div>
          <div class="night-moon">
            <span class="night-moon-emoji">${night.moon?.emoji}</span>
            <span class="night-moon-info">${night.moon?.phase_name}<br>${night.moon?.illumination}%</span>
          </div>
        </div>
        <div class="night-summary">
          <div class="night-stat">
            <div class="night-stat-label">Sky Quality</div>
            <div class="night-stat-value">${night.summary?.overall_quality}</div>
          </div>
          <div class="night-stat">
            <div class="night-stat-label">Avg Score</div>
            <div class="night-stat-value">${night.summary?.average_score}/100</div>
          </div>
          <div class="night-stat">
            <div class="night-stat-label">Avg Clouds</div>
            <div class="night-stat-value">${night.summary?.average_cloud_coverage}%</div>
          </div>
          <div class="night-stat">
            <div class="night-stat-label">Best Time</div>
            <div class="night-stat-value">${night.best_observation_time?.time || 'N/A'}</div>
          </div>
        </div>
        <div class="hour-list">
          ${night.hourly_forecast?.map((h) => this.renderHourItem(h))}
        </div>
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
          ${this._multiDay ? 'View Tonight Only' : 'View 5-Night Forecast'}
        </button>
      </div>
      ${d.mode === 'multiday'
        ? d.nights?.map((n) => this.renderNight(n))
        : html`
            <div class="hour-list">
              ${d.hourly_forecast?.map((h) => this.renderHourItem(h))}
            </div>
          `}
    `;
  }
}

customElements.define('hourly-forecast-card', HourlyForecastCard);
