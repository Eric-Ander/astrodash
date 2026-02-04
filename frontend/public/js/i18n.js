// i18n Initialization and Translation Management

class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.initialized = false;
    }

    async init() {
        // Initialize i18next
        await i18next
            .use(i18nextHttpBackend)
            .init({
                lng: this.getSavedLanguage(),
                fallbackLng: 'en',
                backend: {
                    loadPath: '/locales/{{lng}}.json'
                },
                interpolation: {
                    escapeValue: false
                }
            });

        this.currentLanguage = i18next.language;
        this.initialized = true;
        this.updateContent();
        this.setupLanguageSelector();
    }

    getSavedLanguage() {
        return localStorage.getItem('astroweather_language') || 'en';
    }

    saveLanguage(lang) {
        localStorage.setItem('astroweather_language', lang);
    }

    setupLanguageSelector() {
        const selector = document.getElementById('languageSelect');
        if (selector) {
            selector.value = this.currentLanguage;
            selector.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }

    async changeLanguage(lang) {
        await i18next.changeLanguage(lang);
        this.currentLanguage = lang;
        this.saveLanguage(lang);
        this.updateContent();
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
        
        // Trigger a custom event so other parts of the app can respond
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    updateContent() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            
            // Check if it's a placeholder update
            if (key.startsWith('[placeholder]')) {
                const actualKey = key.replace('[placeholder]', '');
                element.placeholder = i18next.t(actualKey);
            } else {
                element.textContent = i18next.t(key);
            }
        });
    }

    // Translation helpers for dynamic content
    t(key, options = {}) {
        if (!this.initialized) {
            return key; // Return key if not initialized yet
        }
        return i18next.t(key, options);
    }

    // Translate quality ratings
    translateQuality(quality) {
        const qualityMap = {
            'Excellent': 'quality.excellent',
            'Very Good': 'quality.veryGood',
            'Good': 'quality.good',
            'Fair': 'quality.fair',
            'Poor': 'quality.poor',
            'Very Poor': 'quality.veryPoor'
        };
        
        return this.t(qualityMap[quality] || quality);
    }

    // Translate moon phase names
    translateMoonPhase(phaseName) {
        return this.t(`moonPhases.${phaseName}`, phaseName);
    }

    // Format numbers according to locale
    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat(this.currentLanguage, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    // Format dates according to locale
    formatDate(date) {
        return new Intl.DateTimeFormat(this.currentLanguage, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    // Format time according to locale
    formatTime(date) {
        return new Intl.DateTimeFormat(this.currentLanguage, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    }
}

// Create global i18nManager instance immediately
window.i18nManager = new I18nManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await window.i18nManager.init();
    console.log('i18n initialized, language:', window.i18nManager.currentLanguage);
});
