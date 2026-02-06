import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class LightPollutionCard extends BaseCard {
  static get cardStyles() {
    return css`
      /* Summary styles */
      .lp-summary {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .lp-summary-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .lp-summary-number {
        font-size: 1.4rem;
        font-weight: 700;
        color: white;
      }

      .lp-summary-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .lp-summary-location {
        font-size: 0.8rem;
        color: #aaa;
      }

      .lp-summary-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #eee;
      }

      .lp-summary-quality {
        display: inline-block;
        align-self: flex-start;
        padding: 2px 8px;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 600;
        color: white;
      }

      /* Full content styles */
      .location-name {
        text-align: center;
        font-size: 1rem;
        font-weight: 600;
        color: #eee;
        margin-bottom: 16px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }

      .bortle-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }

      .bortle-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }

      .bortle-number {
        font-size: 2.2rem;
        font-weight: 700;
        color: white;
      }

      .bortle-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.8);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .bortle-name {
        font-size: 1.2rem;
        font-weight: 700;
        color: #eee;
        text-align: center;
      }

      .bortle-quality {
        display: inline-block;
        padding: 4px 14px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
      }

      .bortle-scale {
        display: flex;
        gap: 3px;
        margin: 8px 0;
        width: 100%;
        max-width: 300px;
      }

      .scale-segment {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        opacity: 0.3;
        transition: opacity 0.3s ease;
      }

      .scale-segment.active {
        opacity: 1;
        box-shadow: 0 0 6px currentColor;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .info-item {
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        text-align: center;
      }

      .info-item.full-width {
        grid-column: 1 / -1;
      }

      .info-label {
        font-size: 0.75rem;
        color: #ccc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .info-value {
        font-size: 1rem;
        font-weight: 600;
        color: #eee;
      }

      .recommendation {
        margin-top: 16px;
        padding: 12px 16px;
        background: #0f3460;
        border-radius: 8px;
        border-left: 4px solid #e94560;
        font-size: 0.9rem;
        color: #ccc;
        line-height: 1.5;
      }

      .data-source {
        margin-top: 12px;
        text-align: center;
        font-size: 0.75rem;
        color: #888;
        font-style: italic;
      }

      @media (max-width: 768px) {
        .info-grid {
          grid-template-columns: 1fr;
        }

        .info-item.full-width {
          grid-column: 1;
        }
      }
    `;
  }

  getScaleColors() {
    return [
      '#001a00', '#003300', '#004d00', '#006600',
      '#808000', '#999900', '#cc9900', '#ff6600', '#ff0000',
    ];
  }

  renderSummary() {
    const d = this._data;
    if (!d) {
      return html`<div class="summary-row"><span style="color:#888">Search for a location</span></div>`;
    }

    const locationName = this.location?.name || d.nearest_city || '';

    return html`
      <div class="lp-summary">
        <div class="lp-summary-circle" style="background: ${d.color}">
          <span class="lp-summary-number">${d.bortle_class}</span>
        </div>
        <div class="lp-summary-info">
          ${locationName ? html`<span class="lp-summary-location">${locationName}</span>` : ''}
          <span class="lp-summary-name">${d.class_name}</span>
          <span class="lp-summary-quality" style="background: ${d.color}">${d.quality}</span>
        </div>
      </div>
    `;
  }

  renderContent() {
    const d = this._data;
    if (!d) {
      return html`<div class="card-empty">Search for a location to see light pollution data.</div>`;
    }

    const colors = this.getScaleColors();
    const locationName = this.location?.name || d.nearest_city || '';

    return html`
      ${locationName
        ? html`<div class="location-name">${locationName}</div>`
        : ''}

      <div class="bortle-display">
        <div class="bortle-circle" style="background: ${d.color}">
          <span class="bortle-number">${d.bortle_class}</span>
          <span class="bortle-label">Bortle</span>
        </div>
        <div class="bortle-name">${d.class_name}</div>
        <div class="bortle-quality" style="background: ${d.color}">${d.quality}</div>
        <div class="bortle-scale">
          ${colors.map(
            (color, i) => html`
              <div
                class="scale-segment ${i + 1 === d.bortle_class ? 'active' : ''}"
                style="background: ${color}; color: ${color}"
              ></div>
            `
          )}
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Limiting Magnitude</div>
          <div class="info-value">${d.limiting_magnitude}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Artificial Brightness</div>
          <div class="info-value">${d.artificial_brightness}</div>
        </div>
        <div class="info-item full-width">
          <div class="info-label">Milky Way Visibility</div>
          <div class="info-value">${d.milky_way_visibility}</div>
        </div>
        <div class="info-item full-width">
          <div class="info-label">Observation Conditions</div>
          <div class="info-value">${d.observations}</div>
        </div>
      </div>

      <div class="recommendation">${d.recommendation}</div>

      ${d.data_source === 'estimated'
        ? html`<div class="data-source">Based on estimated light pollution data</div>`
        : ''}
    `;
  }
}

customElements.define('light-pollution-card', LightPollutionCard);
