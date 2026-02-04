// Dashboard Cards Management

class DashboardCards {
    constructor() {
        this.currentLocation = null;
        this.weatherData = null;
    }

    // Show dashboard with location data
    async show(location, weatherData) {
        this.currentLocation = location;
        this.weatherData = weatherData;

        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
            
            // Update cards
            this.updateConditionsCard();
            this.updateMoonCard();
        }
    }

    // Hide dashboard
    hide() {
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
    }

    // Update Tonight's Conditions Card
    updateConditionsCard() {
        const timeline = document.getElementById('conditionsTimeline');
        const locationSpan = document.getElementById('cardLocation');
        
        if (!timeline || !this.weatherData) return;

        // Set location
        if (locationSpan && this.currentLocation) {
            locationSpan.textContent = this.currentLocation.name;
        }

        // Get hourly forecast starting from 18:00 (6 PM)
        const timeSlots = this.getEveningTimeSlots();
        
        if (timeSlots.length === 0) {
            timeline.innerHTML = '<div class="loading">No evening data available</div>';
            return;
        }

        // Build the conditions display
        let html = '';
        
        // Time headers
        html += '<div class="condition-row">';
        html += '<div class="condition-label">Time</div>';
        html += '<div class="condition-values">';
        timeSlots.forEach(slot => {
            html += `<div class="time-slot"><div class="time-label">${slot.time}</div></div>`;
        });
        html += '</div></div>';

        // Cloud cover
        html += '<div class="condition-row">';
        html += '<div class="condition-label">☁️ Clouds</div>';
        html += '<div class="condition-values">';
        timeSlots.forEach(slot => {
            const quality = this.getCloudQuality(slot.clouds);
            html += `<div class="time-slot"><div class="condition-value ${quality}">${slot.clouds}%</div></div>`;
        });
        html += '</div></div>';

        // Seeing (based on wind speed)
        html += '<div class="condition-row">';
        html += '<div class="condition-label">👁️ Seeing</div>';
        html += '<div class="condition-values">';
        timeSlots.forEach(slot => {
            const seeing = this.calculateSeeing(slot.wind);
            html += `<div class="time-slot"><div class="condition-value ${seeing.quality}">${seeing.stars}</div></div>`;
        });
        html += '</div></div>';

        // Wind
        html += '<div class="condition-row">';
        html += '<div class="condition-label">💨 Wind</div>';
        html += '<div class="condition-values">';
        timeSlots.forEach(slot => {
            const quality = this.getWindQuality(slot.wind);
            html += `<div class="time-slot"><div class="condition-value ${quality}">${Math.round(slot.wind)} km/h</div></div>`;
        });
        html += '</div></div>';

        timeline.innerHTML = html;
    }

    // Get time slots starting from 18:00 with 3-hour intervals
    getEveningTimeSlots() {
        if (!this.weatherData || !this.weatherData.hourly) return [];

        const slots = [];
        const now = new Date();
        const targetHours = [18, 21, 0, 3]; // 18:00, 21:00, 00:00, 03:00

        this.weatherData.hourly.forEach(hour => {
            const hourDate = new Date(hour.dt * 1000);
            const hourOfDay = hourDate.getHours();
            
            // Only include today/tonight's slots
            if (targetHours.includes(hourOfDay)) {
                slots.push({
                    time: this.formatTime(hourDate),
                    clouds: hour.clouds || 0,
                    wind: hour.wind_speed || 0,
                    temp: hour.temp || 0
                });
            }
        });

        return slots.slice(0, 4); // Return only first 4 slots
    }

    // Format time (24-hour format)
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    // Get cloud cover quality
    getCloudQuality(clouds) {
        if (clouds <= 10) return 'excellent';
        if (clouds <= 30) return 'good';
        if (clouds <= 60) return 'fair';
        return 'poor';
    }

    // Calculate seeing based on wind speed
    calculateSeeing(windSpeed) {
        if (windSpeed <= 5) {
            return { stars: '★★★★★', quality: 'excellent' };
        } else if (windSpeed <= 10) {
            return { stars: '★★★★', quality: 'good' };
        } else if (windSpeed <= 20) {
            return { stars: '★★★', quality: 'fair' };
        } else {
            return { stars: '★★', quality: 'poor' };
        }
    }

    // Get wind quality
    getWindQuality(windSpeed) {
        if (windSpeed <= 5) return 'excellent';
        if (windSpeed <= 15) return 'good';
        if (windSpeed <= 25) return 'fair';
        return 'poor';
    }

    // Update Moon Card
    updateMoonCard() {
        const moonInfo = document.getElementById('moonInfo');
        if (!moonInfo || !this.weatherData) return;

        // Get moon data (we'll need to fetch this from backend)
        this.fetchMoonData().then(moonData => {
            if (!moonData) {
                moonInfo.innerHTML = '<div class="loading">Moon data unavailable</div>';
                return;
            }

            const html = `
                <div class="moon-icon">${this.getMoonEmoji(moonData.phase)}</div>
                <div class="moon-phase-name">${moonData.phaseName}</div>
                <div class="moon-illumination">${Math.round(moonData.illumination * 100)}% Illuminated</div>
                <div class="moon-times">
                    <div class="moon-time">
                        <div class="moon-time-label">Moonrise</div>
                        <div class="moon-time-value">${this.formatTime(new Date(moonData.moonrise * 1000))}</div>
                    </div>
                    <div class="moon-time">
                        <div class="moon-time-label">Moonset</div>
                        <div class="moon-time-value">${this.formatTime(new Date(moonData.moonset * 1000))}</div>
                    </div>
                </div>
            `;
            
            moonInfo.innerHTML = html;
        });
    }

    // Fetch moon data from backend
    async fetchMoonData() {
        if (!this.currentLocation) return null;

        try {
            const response = await fetch(
                `/api/weather/moon?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`
            );
            
            if (!response.ok) throw new Error('Failed to fetch moon data');
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching moon data:', error);
            return null;
        }
    }

    // Get moon emoji based on phase
    getMoonEmoji(phase) {
        // Phase is 0-1, where 0=new moon, 0.5=full moon
        if (phase < 0.05 || phase > 0.95) return '🌑'; // New Moon
        if (phase < 0.2) return '🌒'; // Waxing Crescent
        if (phase < 0.3) return '🌓'; // First Quarter
        if (phase < 0.45) return '🌔'; // Waxing Gibbous
        if (phase < 0.55) return '🌕'; // Full Moon
        if (phase < 0.7) return '🌖'; // Waning Gibbous
        if (phase < 0.8) return '🌗'; // Last Quarter
        return '🌘'; // Waning Crescent
    }
}

// Initialize dashboard cards and make it globally accessible
const dashboardCards = new DashboardCards();
window.dashboardCards = dashboardCards;