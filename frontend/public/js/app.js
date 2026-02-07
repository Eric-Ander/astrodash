// AstroWeather Frontend Application

class AstroWeather {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentLat = null;
        this.currentLon = null;
        this.currentCity = null;
        this.init();
        
        // Make app globally accessible for auth integration
        window.astroApp = this;
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
    }

    setupEventListeners() {
        // City search form
        document.getElementById('cityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const city = document.getElementById('cityInput').value.trim();
            if (city) {
                this.searchCity(city);
            }
        });

        // City selection modal close button
        document.getElementById('closeCitySelectModal')?.addEventListener('click', () => {
            this.closeCitySelectModal();
        });

        // Close city select modal on outside click
        document.getElementById('citySelectModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'citySelectModal') {
                this.closeCitySelectModal();
            }
        });

        // Coordinates search form
        document.getElementById('coordinatesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const lat = document.getElementById('latInput').value;
            const lon = document.getElementById('lonInput').value;
            if (lat && lon) {
                this.currentLat = lat;
                this.currentLon = lon;
                this.currentCity = null;
                this.fetchForecast({ lat, lon });
            }
        });
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const forms = document.querySelectorAll('.search-form');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;

                // Remove active class from all buttons and forms
                tabButtons.forEach(btn => btn.classList.remove('active'));
                forms.forEach(form => form.classList.remove('active'));

                // Add active class to clicked button and corresponding form
                button.classList.add('active');
                document.getElementById(`${tabName}Form`).classList.add('active');
            });
        });
    }

    /**
     * Search for cities and handle disambiguation
     */
    async searchCity(cityName) {
        this.showLoading();
        this.hideError();

        try {
            const response = await fetch(`${this.apiBaseUrl}/weather/geocode?city=${encodeURIComponent(cityName)}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'City not found');
            }

            const data = await response.json();
            this.hideLoading();

            if (data.count === 1) {
                // Only one result - use it directly
                const city = data.cities[0];
                this.currentCity = city.displayName;
                this.currentLat = city.lat;
                this.currentLon = city.lon;
                this.fetchForecast({ lat: city.lat, lon: city.lon });
            } else {
                // Multiple results - show selection modal
                this.showCitySelectModal(data.cities);
            }

        } catch (error) {
            console.error('Error searching city:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    /**
     * Show city selection modal with multiple options
     */
    showCitySelectModal(cities) {
        const modal = document.getElementById('citySelectModal');
        const listContainer = document.getElementById('citySelectList');

        if (!modal || !listContainer) return;

        // Build the city list
        listContainer.innerHTML = cities.map((city, index) => `
            <div class="city-select-item" tabindex="0" data-index="${index}">
                <div>
                    <div class="city-select-name">${city.name}</div>
                    <div class="city-select-details">
                        ${city.state ? city.state + ', ' : ''}${city.country}
                    </div>
                </div>
                <div class="city-select-coords">
                    ${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°
                </div>
            </div>
        `).join('');

        // Add click handlers
        listContainer.querySelectorAll('.city-select-item').forEach((item, index) => {
            item.addEventListener('click', () => this.selectCity(cities[index]));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectCity(cities[index]);
                }
            });
        });

        modal.classList.remove('hidden');
        modal.classList.add('active');
    }

    /**
     * Close city selection modal
     */
    closeCitySelectModal() {
        const modal = document.getElementById('citySelectModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    }

    /**
     * Handle city selection from disambiguation modal
     */
    selectCity(city) {
        this.closeCitySelectModal();
        this.currentCity = city.displayName;
        this.currentLat = city.lat;
        this.currentLon = city.lon;

        // Update the city input field
        document.getElementById('cityInput').value = city.displayName;

        // Fetch forecast for selected city
        this.fetchForecast({ lat: city.lat, lon: city.lon });
    }

    async fetchForecast(params) {
        this.showLoading();
        this.hideError();

        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.apiBaseUrl}/weather/forecast?${queryString}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch forecast');
            }

            const data = await response.json();
            this.hideLoading();

            // Store resolved coordinates
            this.currentLat = data.location.coordinates.lat;
            this.currentLon = data.location.coordinates.lon;
            this.currentLocationName = data.location.name;

            // Display location info
            this.displayLocationInfo(data.location);

            // Update card system with new location
            if (window.cardManager) {
                window.cardManager.setLocation({
                    lat: this.currentLat,
                    lon: this.currentLon,
                    name: this.currentLocationName,
                });
            }

            // Notify authUI about current location for save functionality
            if (window.authUI) {
                window.authUI.setCurrentLocation(
                    data.location.name,
                    data.location.coordinates.lat,
                    data.location.coordinates.lon
                );
            }

            // Events are now handled by the card system

        } catch (error) {
            console.error('Error fetching forecast:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    async fetchEvents(params) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.apiBaseUrl}/events?${queryString}`);
            
            if (!response.ok) {
                console.error('Failed to fetch events');
                return;
            }

            const data = await response.json();
            this.displayEvents(data.events);

        } catch (error) {
            console.error('Error fetching events:', error);
            // Don't show error to user - events are supplementary
        }
    }

    displayResults(data) {
        // Display location information
        document.getElementById('locationName').textContent = data.location.name;
        
        const tonightStart = new Date(data.tonight.start);
        const tonightEnd = new Date(data.tonight.end);
        
        const tonightLabel = window.i18nManager ? i18nManager.t('location.tonight') : 'Tonight';
        document.getElementById('tonightRange').textContent = 
            `${tonightLabel}: ${this.formatTime(tonightStart)} - ${this.formatTime(tonightEnd)}`;

        // Display summary
        this.displaySummary(data.summary, data.best_observation_time);

        // Display moon phase
        this.displayMoonPhase(data.moon);

        // Display light pollution
        if (data.light_pollution) {
            this.displayLightPollution(data.light_pollution);
        }

        // Display hourly forecast
        this.displayHourlyForecast(data.hourly_forecast);
        
        // Show tonight's forecast, hide multi-day
        document.getElementById('hourlyForecast').classList.remove('hidden');
        document.getElementById('multiDayForecast').classList.add('hidden');
        
        const titleEl = document.getElementById('forecastTitle');
        if (window.i18nManager) {
            titleEl.textContent = i18nManager.t('forecast.tonightTitle');
        } else {
            titleEl.textContent = "Tonight's 3-Hour Forecast";
        }
    }

    displayMoonPhase(moon) {
        document.getElementById('moonEmoji').textContent = moon.emoji;
        // Translate moon phase name
        const moonPhaseEl = document.getElementById('moonPhase');
        if (window.i18nManager) {
            moonPhaseEl.textContent = i18nManager.translateMoonPhase(moon.phase);
        } else {
            moonPhaseEl.textContent = moon.phase;
        }
        moonPhaseEl.removeAttribute('data-i18n'); // Remove loading state translation
        
        document.getElementById('moonIllumination').textContent = `${moon.illumination}%`;
        
        const moonImpactEl = document.getElementById('moonImpact');
        moonImpactEl.textContent = moon.visibility_impact.rating;
        moonImpactEl.removeAttribute('data-i18n'); // Remove loading state translation
        
        document.getElementById('moonRecommendation').textContent = moon.recommendation;
    }

    displayLightPollution(lightPollution) {
        document.getElementById('bortleClass').textContent = lightPollution.bortle_class;
        document.getElementById('bortleEmoji').textContent = lightPollution.emoji;
        
        const bortleNameEl = document.getElementById('bortleName');
        bortleNameEl.textContent = lightPollution.class_name;
        bortleNameEl.removeAttribute('data-i18n'); // Remove loading state translation
        
        // Use translated quality if available
        const qualityEl = document.getElementById('bortleQuality');
        if (window.i18nManager) {
            qualityEl.textContent = i18nManager.translateQuality(lightPollution.quality);
        } else {
            qualityEl.textContent = lightPollution.quality;
        }
        
        document.getElementById('bortleMagnitude').textContent = lightPollution.limiting_magnitude;
        document.getElementById('bortleDescription').textContent = lightPollution.description;
        document.getElementById('bortleRecommendation').textContent = lightPollution.recommendation;
        
        // Update badge color based on Bortle class
        const badge = document.getElementById('bortleBadge');
        badge.style.background = `linear-gradient(135deg, ${lightPollution.color} 0%, ${this.adjustColor(lightPollution.color, 20)} 100%)`;
    }

    adjustColor(color, percent) {
        // Lighten color for gradient
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    displayEvents(events) {
        const container = document.getElementById('astronomicalEvents');
        container.innerHTML = '';

        const allEvents = [];

        // Get translation helper
        const t = window.i18nManager ? (key) => i18nManager.t(key) : (key) => key;

        // Add ISS passes
        if (events.iss_passes && events.iss_passes.length > 0) {
            events.iss_passes.slice(0, 3).forEach(pass => {
                allEvents.push(this.createEventCard({
                    type: 'iss',
                    icon: '🛰️',
                    title: t('events.issPass'),
                    details: [
                        { label: t('events.time'), value: pass.rise_time_local },
                        { label: t('events.duration'), value: `${pass.duration_minutes} ${t('events.minutes')}` }
                    ],
                    description: pass.description
                }));
            });
        }

        // Add meteor showers
        if (events.meteor_showers && events.meteor_showers.length > 0) {
            events.meteor_showers.slice(0, 2).forEach(shower => {
                allEvents.push(this.createEventCard({
                    type: 'meteor',
                    icon: '☄️',
                    title: shower.name,
                    details: [
                        { label: t('events.peak'), value: shower.peak_date_formatted },
                        { label: t('events.daysUntilPeak'), value: shower.days_until_peak },
                        { label: t('events.zhr'), value: shower.zhr }
                    ],
                    description: shower.description,
                    countdown: shower.days_until_peak
                }));
            });
        }

        // Add moon events
        if (events.moon_events && events.moon_events.length > 0) {
            events.moon_events.forEach(moonEvent => {
                // Translate moon event name (New Moon, Full Moon)
                const translatedName = window.i18nManager ? i18nManager.translateMoonPhase(moonEvent.name) : moonEvent.name;
                
                allEvents.push(this.createEventCard({
                    type: 'moon',
                    icon: moonEvent.emoji,
                    title: translatedName,
                    details: [
                        { label: t('events.date'), value: moonEvent.date_formatted },
                        { label: t('events.daysAway'), value: moonEvent.days_until }
                    ],
                    description: moonEvent.description,
                    countdown: moonEvent.days_until
                }));
            });
        }

        // Add solar events
        if (events.solar_events) {
            const solar = events.solar_events;
            allEvents.push(this.createEventCard({
                type: 'solar',
                icon: '🌅',
                title: 'Today\'s Sun Times', // Keep in English or translate if needed
                details: [
                    { label: t('events.sunrise'), value: solar.sunrise_formatted },
                    { label: t('events.sunset'), value: solar.sunset_formatted },
                    { label: t('events.astronomicalTwilight'), value: `${solar.astronomical_twilight_begin_formatted} - ${solar.astronomical_twilight_end_formatted}` },
                    { label: t('events.dayLength'), value: `${solar.day_length_hours} ${t('events.hours')}` }
                ],
                description: 'Astronomical twilight marks the darkest sky conditions'
            }));
        }

        // Display all events
        allEvents.forEach(card => container.appendChild(card));

        if (allEvents.length === 0) {
            const noEventsText = t('events.noEvents');
            container.innerHTML = `<div class="events-loading">${noEventsText}</div>`;
        }
    }

    createEventCard(event) {
        const card = document.createElement('div');
        card.className = `event-card ${event.type}`;

        let detailsHTML = '';
        event.details.forEach(detail => {
            detailsHTML += `
                <div class="event-detail-row">
                    <span class="event-detail-label">${detail.label}:</span>
                    <span class="event-detail-value">${detail.value}</span>
                </div>
            `;
        });

        let countdownHTML = '';
        if (event.countdown !== undefined && event.countdown <= 30) {
            const days = event.countdown;
            let label;
            if (window.i18nManager) {
                if (days === 0) {
                    label = i18nManager.t('events.today');
                } else if (days === 1) {
                    label = i18nManager.t('events.tomorrow');
                } else {
                    label = i18nManager.t('events.inDays', { count: days });
                }
            } else {
                label = days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`;
            }
            countdownHTML = `<span class="event-countdown">${label}</span>`;
        }

        card.innerHTML = `
            <div class="event-header">
                <span class="event-icon">${event.icon}</span>
                <span class="event-title">${event.title}</span>
            </div>
            <div class="event-details">
                ${detailsHTML}
            </div>
            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            ${countdownHTML}
        `;

        return card;
    }

    displaySummary(summary, bestTime) {
        // Overall quality - translate if i18n available
        const qualityBadge = document.getElementById('overallQuality');
        if (window.i18nManager) {
            qualityBadge.textContent = i18nManager.translateQuality(summary.overall_quality);
        } else {
            qualityBadge.textContent = summary.overall_quality;
        }
        qualityBadge.style.background = this.getScoreColor(summary.average_score);

        // Average score
        document.getElementById('averageScore').textContent = `${summary.average_score}/100`;

        // Average clouds
        document.getElementById('averageClouds').textContent = `${summary.average_cloud_coverage}%`;

        // Best observation time
        if (bestTime) {
            document.getElementById('bestTime').textContent = bestTime.time;
            document.getElementById('bestTimeScore').textContent = 
                `Score: ${bestTime.score}/100 (${bestTime.quality_rating})`;
        } else {
            document.getElementById('bestTime').textContent = 'N/A';
            document.getElementById('bestTimeScore').textContent = '';
        }
    }

    displayHourlyForecast(forecast) {
        const container = document.getElementById('hourlyForecast');
        container.innerHTML = '';

        forecast.forEach(hour => {
            const forecastItem = this.createForecastItem(hour);
            container.appendChild(forecastItem);
        });
    }

    createForecastItem(hour) {
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.style.borderLeftColor = hour.score_color;

        // Get translated labels
        const i18n = window.i18nManager;
        const tempLabel = i18n ? i18n.t('forecast.temperature') : 'Temperature';
        const cloudsLabel = i18n ? i18n.t('forecast.clouds') : 'Clouds';
        const visLabel = i18n ? i18n.t('forecast.visibility') : 'Visibility';
        const humidityLabel = i18n ? i18n.t('forecast.humidity') : 'Humidity';
        const windLabel = i18n ? i18n.t('forecast.wind') : 'Wind';
        const rainLabel = i18n ? i18n.t('forecast.rainChance') : 'Rain Chance';
        
        // Translate quality rating
        const qualityRating = i18n ? i18n.translateQuality(hour.quality_rating) : hour.quality_rating;

        console.log('Creating forecast item with labels:', { tempLabel, cloudsLabel, qualityRating });

        item.innerHTML = `
            <div class="forecast-time">
                <div class="time">${hour.time}</div>
                <div class="weather-icon">${this.getWeatherEmoji(hour.weather.icon)}</div>
            </div>
            
            <div class="forecast-details">
                <div class="detail-item">
                    <span class="detail-label">${tempLabel}</span>
                    <span class="detail-value">${hour.temperature.current}°C</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${cloudsLabel}</span>
                    <span class="detail-value">${hour.clouds}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${visLabel}</span>
                    <span class="detail-value">${hour.visibility_km} km</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${humidityLabel}</span>
                    <span class="detail-value">${hour.humidity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${windLabel}</span>
                    <span class="detail-value">${hour.wind_speed} m/s</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${rainLabel}</span>
                    <span class="detail-value">${hour.precipitation_probability}%</span>
                </div>
            </div>
            
            <div class="forecast-score">
                <div class="score-circle" style="background: ${hour.score_color}">
                    ${hour.astronomy_score}
                </div>
                <div class="score-rating">${qualityRating}</div>
            </div>
        `;

        return item;
    }

    getWeatherEmoji(iconCode) {
        const emojiMap = {
            '01n': '🌙', // clear night
            '02n': '🌤️', // few clouds night
            '03n': '☁️', // scattered clouds
            '04n': '☁️', // broken clouds
            '09n': '🌧️', // shower rain
            '10n': '🌧️', // rain
            '11n': '⛈️', // thunderstorm
            '13n': '🌨️', // snow
            '50n': '🌫️', // mist
            '01d': '☀️', // clear day
            '02d': '⛅', // few clouds day
            '03d': '☁️', // scattered clouds
            '04d': '☁️', // broken clouds
            '09d': '🌧️', // shower rain
            '10d': '🌧️', // rain
            '11d': '⛈️', // thunderstorm
            '13d': '🌨️', // snow
            '50d': '🌫️'  // mist
        };

        return emojiMap[iconCode] || '🌙';
    }

    getScoreColor(score) {
        if (score >= 90) return '#00ff00';
        if (score >= 75) return '#7fff00';
        if (score >= 60) return '#ffff00';
        if (score >= 45) return '#ffa500';
        if (score >= 30) return '#ff6600';
        return '#ff0000';
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    showLoading() {
        document.getElementById('loadingIndicator').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = `Error: ${message}`;
        errorElement.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    displayLocationInfo(location) {
        const container = document.getElementById('locationInfo');
        const nameEl = document.getElementById('locationName');
        const detailsEl = document.getElementById('locationDetails');

        if (!container || !nameEl || !detailsEl) return;

        // Build location name
        nameEl.textContent = location.name;

        // Build details string with available info
        const details = [];
        if (location.state) details.push(location.state);
        if (location.country) details.push(location.country);

        // Add coordinates
        const lat = location.coordinates?.lat;
        const lon = location.coordinates?.lon;
        if (lat !== undefined && lon !== undefined) {
            const latDir = lat >= 0 ? 'N' : 'S';
            const lonDir = lon >= 0 ? 'E' : 'W';
            details.push(`${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`);
        }

        detailsEl.textContent = details.join(' · ');

        // Show the container
        container.classList.remove('hidden');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AstroWeather();
});
