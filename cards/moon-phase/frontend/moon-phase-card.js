import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class MoonPhaseCard extends BaseCard {
  static get cardStyles() {
    return css`
      .card {
        border-color: #4a5568;
      }

      .moon-content {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 24px;
        align-items: center;
      }

      .moon-emoji {
        font-size: 5rem;
        text-align: center;
      }

      .moon-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .moon-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .moon-label {
        color: #ccc;
        font-weight: 600;
      }

      .moon-value {
        color: #eee;
        font-weight: 700;
      }

      .moon-recommendation {
        margin-top: 10px;
        padding: 15px;
        background: rgba(255, 215, 0, 0.1);
        border-left: 4px solid #ffd700;
        border-radius: 4px;
        color: #eee;
        font-size: 0.95rem;
        line-height: 1.5;
      }

      .card-header-title {
        color: #ffd700;
      }

      @media (max-width: 768px) {
        .moon-content {
          grid-template-columns: 1fr;
          text-align: center;
          gap: 16px;
        }

        .moon-emoji {
          font-size: 3.5rem;
        }

        .moon-row {
          flex-direction: column;
          text-align: center;
          gap: 4px;
        }
      }
    `;
  }

  renderContent() {
    const d = this._data;
    if (!d) {
      return html`<div class="card-empty">Search for a location to see moon phase data.</div>`;
    }

    return html`
      <div class="moon-content">
        <div class="moon-emoji">${d.emoji}</div>
        <div class="moon-details">
          <div class="moon-row">
            <span class="moon-label">Phase</span>
            <span class="moon-value">${d.phase}</span>
          </div>
          <div class="moon-row">
            <span class="moon-label">Illumination</span>
            <span class="moon-value">${d.illumination}%</span>
          </div>
          <div class="moon-row">
            <span class="moon-label">Sky Impact</span>
            <span class="moon-value">${d.visibility_impact?.rating || ''}</span>
          </div>
          <div class="moon-recommendation">${d.recommendation}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('moon-phase-card', MoonPhaseCard);
