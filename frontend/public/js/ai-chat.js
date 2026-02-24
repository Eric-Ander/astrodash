/**
 * AstroDash AI Chat Panel
 *
 * A slide-in drawer (from the left) that connects to POST /api/ai/chat.
 * Works for both guest users (read-only tools) and authenticated users
 * (gear profiles, memory, personalised responses).
 *
 * Dependencies (expected as window globals):
 *   window.authManager   – provides isLoggedIn() + getToken()
 *   window.astroApp      – provides currentLat, currentLon, currentCity
 *   window.i18nManager   – provides t(key)
 */

class AIChatPanel {
  constructor() {
    // DOM refs
    this._panel      = document.getElementById('aiChatPanel');
    this._backdrop   = document.getElementById('aiChatBackdrop');
    this._messagesEl = document.getElementById('aiChatMessages');
    this._suggestEl  = document.getElementById('aiChatSuggestions');
    this._inputEl    = document.getElementById('aiChatInput');
    this._sendBtn    = document.getElementById('aiChatSend');
    this._triggerBtn = document.getElementById('aiChatTrigger');
    this._closeBtn   = document.getElementById('aiChatClose');

    // State
    this.conversationHistory = [];
    this.isLoading           = false;

    // Session ID lives for the browser-tab lifetime only (not persisted)
    this.sessionId = sessionStorage.getItem('astrodash_ai_session') || null;

    this._init();
  }

  /* ── Initialisation ─────────────────────────────────────────────────── */

  _init() {
    // Restore panel open/closed state
    if (localStorage.getItem('astrodash_ai_panel_open') === 'true') {
      this._openPanel(/* animate = */ false);
    }

    this._triggerBtn.addEventListener('click', () => this._toggle());
    this._closeBtn.addEventListener('click',   () => this._closePanel());
    this._backdrop.addEventListener('click',   () => this._closePanel());

    this._sendBtn.addEventListener('click', () => this._sendMessage());

    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    });

    this._inputEl.addEventListener('input', () => this._autoResize());

    // React when the user logs in or out
    document.addEventListener('authStateChanged', () => this._onAuthChanged());

    // React when the UI language changes
    document.addEventListener('languageChanged', () => this._onLanguageChanged());

    // Render welcome + suggestion chips
    this._showWelcome();
  }

  /* ── Panel open / close ──────────────────────────────────────────────── */

  _openPanel(animate = true) {
    if (!animate) {
      // Snap into place on page-load restore — no CSS transition
      this._panel.style.transition = 'none';
      this._panel.classList.add('open');
      // Re-enable transition on next paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._panel.style.transition = '';
        });
      });
    } else {
      this._panel.classList.add('open');
    }

    this._backdrop.classList.add('visible');
    this._triggerBtn.setAttribute('aria-expanded', 'true');
    this._triggerBtn.classList.add('panel-open');
    localStorage.setItem('astrodash_ai_panel_open', 'true');

    // Move focus into the input after slide animation
    setTimeout(() => this._inputEl.focus(), animate ? 360 : 0);
  }

  _closePanel() {
    this._panel.classList.remove('open');
    this._backdrop.classList.remove('visible');
    this._triggerBtn.setAttribute('aria-expanded', 'false');
    this._triggerBtn.classList.remove('panel-open');
    localStorage.setItem('astrodash_ai_panel_open', 'false');
  }

  _toggle() {
    this._panel.classList.contains('open') ? this._closePanel() : this._openPanel();
  }

  /* ── Welcome message & suggestion chips ─────────────────────────────── */

  _showWelcome() {
    this._appendMessage('assistant', this._t('ai.welcome'), /* animate = */ false);
    this._renderSuggestions();
  }

  _renderSuggestions() {
    const isLoggedIn = window.authManager?.isLoggedIn() ?? false;

    const chips = [
      { label: this._t('ai.suggest1'), prompt: this._t('ai.suggest1Prompt') },
      { label: this._t('ai.suggest2'), prompt: this._t('ai.suggest2Prompt') },
      { label: this._t('ai.suggest3'), prompt: this._t('ai.suggest3Prompt') },
    ];

    if (isLoggedIn) {
      chips.push({ label: this._t('ai.suggest4'), prompt: this._t('ai.suggest4Prompt') });
    }

    this._suggestEl.innerHTML = chips.map(c =>
      `<button class="ai-suggestion-chip" data-prompt="${this._escapeAttr(c.prompt)}">${c.label}</button>`
    ).join('');

    this._suggestEl.querySelectorAll('.ai-suggestion-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this._inputEl.value = btn.dataset.prompt;
        this._autoResize();
        this._sendMessage();
      });
    });

    // Guest notice
    const notice = this._suggestEl.querySelector('.ai-guest-notice');
    if (!isLoggedIn && !notice) {
      const p = document.createElement('p');
      p.className = 'ai-guest-notice';
      p.textContent = this._t('ai.guestNotice');
      this._suggestEl.appendChild(p);
    }
  }

  _onAuthChanged() {
    this._renderSuggestions();
  }

  _onLanguageChanged() {
    // Rebuild suggestion chips in the new language
    this._renderSuggestions();
    // Update input placeholder
    this._inputEl.placeholder = this._t('ai.inputPlaceholder');
  }

  /* ── Message rendering ───────────────────────────────────────────────── */

  /**
   * Append a chat bubble to the messages area.
   * @param {'user'|'assistant'} role
   * @param {string} text  Plain text (will be escaped and formatted)
   * @param {boolean} animate  Whether to apply the slide-in animation
   * @returns {HTMLElement}
   */
  _appendMessage(role, text, animate = true) {
    const div = document.createElement('div');
    div.className = `ai-message ai-message--${role}${animate ? '' : ' ai-no-anim'}`;

    if (role === 'assistant') {
      div.innerHTML = `
        <span class="ai-message-avatar" aria-hidden="true">🔭</span>
        <div class="ai-message-bubble">${this._renderText(text)}</div>
      `;
    } else {
      div.innerHTML = `
        <div class="ai-message-bubble">${this._escapeHTML(text)}</div>
      `;
    }

    this._messagesEl.appendChild(div);
    this._scrollToBottom();
    return div;
  }

  /**
   * Convert plain AI text into safe HTML:
   *   1. Escape HTML entities
   *   2. Convert newlines to <br>
   *   3. Style source-attribution badges (📡 📖 🔭 ✏️)
   */
  _renderText(text) {
    let html = this._escapeHTML(text);

    // Newlines → line breaks
    html = html.replace(/\n/g, '<br>');

    // Source attribution line styling
    // Matches:  📡 Live weather data from OpenWeatherMap
    html = html.replace(
      /(📡|📖|✏️)\s*([^<]+?)(?=<br>|$)/g,
      (_, emoji, label) =>
        `<span class="ai-source-badge">${emoji} ${label.trim()}</span>`
    );

    return html;
  }

  /* ── Typing indicator ────────────────────────────────────────────────── */

  _showTypingIndicator() {
    const div = document.createElement('div');
    div.id = 'aiTypingIndicator';
    div.className = 'ai-message ai-message--assistant';
    div.setAttribute('aria-label', 'AI is thinking');
    div.innerHTML = `
      <span class="ai-message-avatar" aria-hidden="true">🔭</span>
      <div class="ai-message-bubble">
        <span class="ai-typing-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
      </div>
    `;
    this._messagesEl.appendChild(div);
    this._scrollToBottom();
  }

  _removeTypingIndicator() {
    document.getElementById('aiTypingIndicator')?.remove();
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
    });
  }

  /* ── Sending messages ────────────────────────────────────────────────── */

  async _sendMessage() {
    const text = this._inputEl.value.trim();
    if (!text || this.isLoading) return;

    // Clear input
    this._inputEl.value = '';
    this._autoResize();

    // Hide suggestion chips after first real message
    if (!this._suggestEl.classList.contains('ai-suggestions--hidden')) {
      this._suggestEl.classList.add('ai-suggestions--hidden');
    }

    // Render user bubble
    this._appendMessage('user', text);

    // Lock UI
    this.isLoading       = true;
    this._inputEl.disabled = true;
    this._sendBtn.disabled = true;
    this._showTypingIndicator();

    try {
      const result = await this._callAPI(text);

      this._removeTypingIndicator();
      this._appendMessage('assistant', result.text);

      // Persist session ID for multi-turn continuity
      if (result.sessionId) {
        this.sessionId = result.sessionId;
        sessionStorage.setItem('astrodash_ai_session', this.sessionId);
      }

      // Append to conversation history (kept for context on next call)
      this.conversationHistory.push(
        { role: 'user',      content: text        },
        { role: 'assistant', content: result.text }
      );

      // Cap at 20 messages (10 back-and-forths)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

    } catch (err) {
      this._removeTypingIndicator();
      this._appendMessage('assistant', `⚠️ ${err.message || this._t('ai.errorGeneric')}`);
    } finally {
      this.isLoading         = false;
      this._inputEl.disabled = false;
      this._sendBtn.disabled = false;
      this._inputEl.focus();
    }
  }

  async _callAPI(message) {
    const token    = window.authManager?.getToken() || null;
    const location = this._getCurrentLocation();

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/ai/chat', {
      method:  'POST',
      headers,
      body:    JSON.stringify({
        message,
        conversationHistory: this.conversationHistory,
        location,
        sessionId: this.sessionId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error(this._t('ai.errorRateLimit'));
      if (res.status === 503) throw new Error(this._t('ai.errorUnavailable'));
      throw new Error(err.message || this._t('ai.errorGeneric'));
    }

    return res.json();
  }

  _getCurrentLocation() {
    const app = window.astroApp;
    if (!app || app.currentLat == null) return null;
    return {
      lat:  app.currentLat,
      lon:  app.currentLon,
      city: app.currentCity || app.currentLocationName || null
    };
  }

  /* ── Textarea auto-resize ────────────────────────────────────────────── */

  _autoResize() {
    this._inputEl.style.height = 'auto';
    const max = 120; // px
    this._inputEl.style.height = Math.min(this._inputEl.scrollHeight, max) + 'px';
  }

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  _t(key) {
    return window.i18nManager ? window.i18nManager.t(key) : key;
  }

  _escapeHTML(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  _escapeAttr(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Initialise once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.aiChatPanel = new AIChatPanel();
});
