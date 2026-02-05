import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class WeatherSummaryCard extends BaseCard {
  static get cardStyles() {
    return css`
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
      }

      .summary-item {
        text-align: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }

      .summary-item h4 {
        font-size: 0.85rem;
        color: #ccc;
        margin: 0 0 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .quality-badge {
        display: inline-block;
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 1.2rem;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }

      .score {
        font-size: 1.8rem;
        font-weight: 700;
        color: #00d4ff;
      }

      .value {
        font-size: 1.6rem;
        font-weight: 600;
        color: #eee;
      }

      .sub-text {
        font-size: 0.85rem;
        color: #ccc;
        margin-top: 4px;
      }

      .best-time-item {
        background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
        border: 2px solid #e94560;
      }

      @media (max-width: 768px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  getScoreColor(score) {
    if (score >= 90) return '#00ff00';
    if (score >= 75) return '#7fff00';
    if (score >= 60) return '#ffff00';
    if (score >= 45) return '#ffa500';
    if (score >= 30) return '#ff6600';
    return '#ff0000';
  }

  renderContent() {
    const d = this._data;
    if (!d) {
      return html`<div class="card-empty">Search for a location to see sky conditions.</div>`;
    }

    const s = d.summary;
    const best = d.best_observation_time;
    const color = this.getScoreColor(s.average_score);

    return html`
      <div class="summary-grid">
        <div class="summary-item">
          <h4>Overall Quality</h4>
          <div class="quality-badge" style="background: ${color}">
            ${s.overall_quality}
          </div>
          <div class="score">${s.average_score}/100</div>
        </div>
        <div class="summary-item">
          <h4>Average Clouds</h4>
          <div class="value">${s.average_cloud_coverage}%</div>
        </div>
        <div class="summary-item best-time-item">
          <h4>Best Observation Time</h4>
          <div class="value">${best ? best.time : 'N/A'}</div>
          ${best
            ? html`<div class="sub-text">Score: ${best.score}/100 (${best.quality_rating})</div>`
            : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('weather-summary-card', WeatherSummaryCard);
