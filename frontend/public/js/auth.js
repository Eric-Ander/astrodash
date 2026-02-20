// Authentication Manager
class AuthManager {
    constructor() {
        this.token = this.getToken();
        this.user = null;
        this.API_BASE = window.location.origin + '/api';
    }

    // Get token from localStorage
    getToken() {
        return localStorage.getItem('astroweather_token');
    }

    // Save token to localStorage
    saveToken(token) {
        localStorage.setItem('astroweather_token', token);
        this.token = token;
    }

    // Remove token
    clearToken() {
        localStorage.removeItem('astroweather_token');
        this.token = null;
        this.user = null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.token;
    }

    // Register new user
    async register(email, password, name = '') {
        try {
            const response = await fetch(`${this.API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            this.saveToken(data.token);
            this.user = data.user;
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            this.saveToken(data.token);
            this.user = data.user;
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout user
    logout() {
        this.clearToken();
        window.location.reload();
    }

    // Get user profile
    async getProfile() {
        try {
            if (!this.token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${this.API_BASE}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get profile');
            }

            this.user = data.user;
            return data.user;
        } catch (error) {
            console.error('Get profile error:', error);
            // Token might be expired, clear it
            if (error.message.includes('token')) {
                this.clearToken();
            }
            throw error;
        }
    }

    // Save a location
    async saveLocation(locationName, lat, lon, isFavorite = false) {
        try {
            if (!this.token) {
                throw new Error('Please login to save locations');
            }

            const response = await fetch(`${this.API_BASE}/locations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    location_name: locationName,
                    lat,
                    lon,
                    is_favorite: isFavorite
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save location');
            }

            return data;
        } catch (error) {
            console.error('Save location error:', error);
            throw error;
        }
    }

    // Get saved locations
    async getLocations() {
        try {
            if (!this.token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${this.API_BASE}/locations`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get locations');
            }

            return data.locations;
        } catch (error) {
            console.error('Get locations error:', error);
            throw error;
        }
    }

    // Delete a location
    async deleteLocation(locationId) {
        try {
            if (!this.token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${this.API_BASE}/locations/${locationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete location');
            }

            return data;
        } catch (error) {
            console.error('Delete location error:', error);
            throw error;
        }
    }

    // Toggle favorite
    async toggleFavorite(locationId) {
        try {
            if (!this.token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${this.API_BASE}/locations/${locationId}/favorite`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to toggle favorite');
            }

            return data;
        } catch (error) {
            console.error('Toggle favorite error:', error);
            throw error;
        }
    }

    // Update notification settings for a location
    async updateNotificationSettings(locationId, enabled, cloudThreshold) {
        try {
            if (!this.token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${this.API_BASE}/locations/${locationId}/notifications`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    enabled,
                    cloud_threshold: cloudThreshold
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update notification settings');
            }

            return data;
        } catch (error) {
            console.error('Update notification settings error:', error);
            throw error;
        }
    }

    // Send test notification email
    async sendTestNotification() {
        try {
            if (!this.token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${this.API_BASE}/notifications/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send test email');
            }

            return data;
        } catch (error) {
            console.error('Send test notification error:', error);
            throw error;
        }
    }
}

// Create global instance
window.authManager = new AuthManager();
