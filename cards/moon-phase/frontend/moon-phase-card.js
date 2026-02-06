import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class MoonPhaseCard extends BaseCard {
  static get cardStyles() {
    return css`
      .card {
        border-color: #4a5568;
      }

      /* Summary styles */
      .moon-summary {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .moon-summary-emoji {
        font-size: 2.5rem;
      }

      .moon-summary-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .moon-summary-phase {
        font-size: 1rem;
        font-weight: 700;
        color: #eee;
      }

      .moon-summary-detail {
        font-size: 0.85rem;
        color: #ccc;
      }

      .moon-summary-impact {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.75rem;
        font-weight: 600;
        background: rgba(255, 215, 0, 0.2);
        color: #ffd700;
      }

      /* Full content styles */
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

  renderSummary() {
    const d = this._data;
    if (!d) {
      return html`<div class="summary-row"><span style="color:#888">Search for a location</span></div>`;
    }

    return html`
      <div class="moon-summary">
        <span class="moon-summary-emoji">${d.emoji}</span>
        <div class="moon-summary-info">
          <span class="moon-summary-phase">${d.phase}</span>
          <span class="moon-summary-detail">${d.illumination}% illumination</span>
          <span class="moon-summary-impact">${d.visibility_impact?.rating || 'Unknown'} impact</span>
        </div>
      </div>
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
