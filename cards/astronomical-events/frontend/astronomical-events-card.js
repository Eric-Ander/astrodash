import { html, css } from 'lit';
import { BaseCard } from '/js/base-card.js';

class AstronomicalEventsCard extends BaseCard {
  static get cardStyles() {
    return css`
      /* Summary styles */
      .events-summary {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .summary-events {
        font-size: 0.85rem;
        color: #ccc;
      }

      /* Full content styles */
      .events-sections {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .section {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        overflow: hidden;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.2);
        font-size: 1rem;
        font-weight: 700;
        color: #00d4ff;
      }

      .section-icon {
        font-size: 1.2rem;
      }

      .section-body {
        padding: 12px 16px;
      }

      .event-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .event-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 10px;
        background: #0f3460;
        border-radius: 8px;
        transition: transform 0.2s ease;
      }

      .event-item:hover {
        transform: translateX(4px);
      }

      .event-emoji {
        font-size: 1.5rem;
      }

      .event-info {
        min-width: 0;
      }

      .event-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #eee;
      }

      .event-desc {
        font-size: 0.8rem;
        color: #ccc;
        margin-top: 2px;
      }

      .event-meta {
        font-size: 0.75rem;
        color: #aaa;
        margin-top: 2px;
      }

      .event-badge {
        text-align: center;
        padding: 6px 12px;
        border-radius: 8px;
        background: rgba(233, 69, 96, 0.2);
        white-space: nowrap;
      }

      .badge-value {
        font-size: 0.95rem;
        font-weight: 700;
        color: #e94560;
      }

      .badge-label {
        font-size: 0.65rem;
        color: #ccc;
        text-transform: uppercase;
      }

      /* Solar times grid */
      .solar-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
      }

      .solar-item {
        text-align: center;
        padding: 10px;
        background: #0f3460;
        border-radius: 8px;
      }

      .solar-label {
        font-size: 0.7rem;
        color: #ccc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .solar-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #eee;
      }

      .solar-highlight {
        border: 1px solid #e94560;
      }

      .empty-section {
        padding: 12px;
        text-align: center;
        color: #888;
        font-size: 0.85rem;
        font-style: italic;
      }

      @media (max-width: 768px) {
        .event-item {
          grid-template-columns: auto 1fr;
          gap: 10px;
        }

        .event-badge {
          grid-column: 1 / -1;
          text-align: left;
          display: flex;
          gap: 6px;
          align-items: baseline;
        }

        .solar-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
    `;
  }

  renderSummary() {
    const d = this._data;
    if (!d) {
      return html`<div class="summary-row"><span style="color:#888">Search for a location</span></div>`;
    }

    const issCount = d.iss_passes?.length || 0;
    const showerCount = d.meteor_showers?.length || 0;
    const moonEvent = d.moon_events?.[0];
    const solar = d.solar_events;

    const summaryParts = [];
    if (issCount > 0) summaryParts.push(`${issCount} ISS pass${issCount > 1 ? 'es' : ''}`);
    if (showerCount > 0) summaryParts.push(`${showerCount} meteor shower${showerCount > 1 ? 's' : ''}`);
    if (moonEvent) summaryParts.push(`${moonEvent.name} in ${moonEvent.days_until}d`);

    return html`
      <div class="events-summary">
        ${solar
          ? html`
              <span class="summary-metric">
                <span class="label">Dark:</span>
                <span class="value">${solar.astronomical_twilight_end_formatted}</span>
                <span>-</span>
                <span class="value">${solar.astronomical_twilight_begin_formatted}</span>
              </span>
            `
          : ''}
        <span class="summary-events">${summaryParts.join(' · ') || 'No events'}</span>
      </div>
    `;
  }

  renderISSPasses(passes) {
    if (!passes || passes.length === 0) {
      return html`<div class="empty-section">No upcoming ISS passes found</div>`;
    }

    return html`
      <div class="event-list">
        ${passes.map((pass) => {
          const riseDate = new Date(pass.rise_time);
          const dateStr = riseDate.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          });
          const timeStr = riseDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false,
          });

          return html`
            <div class="event-item">
              <span class="event-emoji">🛰️</span>
              <div class="event-info">
                <div class="event-name">ISS Pass</div>
                <div class="event-desc">${dateStr} at ${timeStr}</div>
              </div>
              <div class="event-badge">
                <div class="badge-value">${pass.duration_minutes}m</div>
                <div class="badge-label">Duration</div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  renderMeteorShowers(showers) {
    if (!showers || showers.length === 0) {
      return html`<div class="empty-section">No meteor showers in the next 60 days</div>`;
    }

    return html`
      <div class="event-list">
        ${showers.map(
          (shower) => html`
            <div class="event-item">
              <span class="event-emoji">☄️</span>
              <div class="event-info">
                <div class="event-name">${shower.name}</div>
                <div class="event-desc">${shower.description}</div>
                <div class="event-meta">
                  Active: ${shower.active_period} | ZHR: ${shower.zhr} | ${shower.best_viewing}
                </div>
              </div>
              <div class="event-badge">
                <div class="badge-value">${shower.days_until_peak}d</div>
                <div class="badge-label">Until Peak</div>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  renderMoonEvents(events) {
    if (!events || events.length === 0) {
      return html`<div class="empty-section">No upcoming moon events</div>`;
    }

    return html`
      <div class="event-list">
        ${events.map(
          (event) => html`
            <div class="event-item">
              <span class="event-emoji">${event.emoji}</span>
              <div class="event-info">
                <div class="event-name">${event.name}</div>
                <div class="event-desc">${event.description}</div>
                <div class="event-meta">${event.date_formatted}</div>
              </div>
              <div class="event-badge">
                <div class="badge-value">${event.days_until}d</div>
                <div class="badge-label">Away</div>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  renderSolarEvents(solar) {
    if (!solar) {
      return html`<div class="empty-section">No solar data available</div>`;
    }

    return html`
      <div class="solar-grid">
        <div class="solar-item">
          <div class="solar-label">Sunrise</div>
          <div class="solar-value">☀️ ${solar.sunrise_formatted}</div>
        </div>
        <div class="solar-item">
          <div class="solar-label">Sunset</div>
          <div class="solar-value">🌅 ${solar.sunset_formatted}</div>
        </div>
        <div class="solar-item solar-highlight">
          <div class="solar-label">Astro Twilight Start</div>
          <div class="solar-value">🌌 ${solar.astronomical_twilight_end_formatted}</div>
        </div>
        <div class="solar-item solar-highlight">
          <div class="solar-label">Astro Twilight End</div>
          <div class="solar-value">🌄 ${solar.astronomical_twilight_begin_formatted}</div>
        </div>
        <div class="solar-item">
          <div class="solar-label">Day Length</div>
          <div class="solar-value">${solar.day_length_hours}h</div>
        </div>
      </div>
    `;
  }

  renderContent() {
    const d = this._data;
    if (!d) {
      return html`<div class="card-empty">Search for a location to see astronomical events.</div>`;
    }

    return html`
      <div class="events-sections">
        <div class="section">
          <div class="section-header">
            <span class="section-icon">🌅</span>
            Twilight & Solar Times
          </div>
          <div class="section-body">
            ${this.renderSolarEvents(d.solar_events)}
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-icon">🌙</span>
            Moon Events
          </div>
          <div class="section-body">
            ${this.renderMoonEvents(d.moon_events)}
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-icon">☄️</span>
            Meteor Showers
          </div>
          <div class="section-body">
            ${this.renderMeteorShowers(d.meteor_showers)}
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-icon">🛰️</span>
            ISS Passes
          </div>
          <div class="section-body">
            ${this.renderISSPasses(d.iss_passes)}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('astronomical-events-card', AstronomicalEventsCard);
