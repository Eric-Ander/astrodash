import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class LightPollutionCard extends BaseCard {
  static get cardStyles() {
    return css`
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

  renderContent() {
    const d = this._data;
    if (!d) {
      return html`<div class="card-empty">Search for a location to see light pollution data.</div>`;
    }

    const colors = this.getScaleColors();

    return html`
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
