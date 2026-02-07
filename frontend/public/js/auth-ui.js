// Authentication UI Controller
class AuthUIController {
    constructor() {
        this.authModal = document.getElementById('authModal');
        this.savedLocationsModal = document.getElementById('savedLocationsModal');
        this.currentLocation = null;
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.updateUIForAuthState();
    }

    setupEventListeners() {
        // Login button
        document.getElementById('loginButton')?.addEventListener('click', () => this.showAuthModal());

        // Close modals
        document.getElementById('closeAuthModal')?.addEventListener('click', () => this.hideAuthModal());
        document.getElementById('closeSavedLocationsModal')?.addEventListener('click', () => this.hideSavedLocationsModal());

        // Click outside modal to close
        this.authModal?.addEventListener('click', (e) => {
            if (e.target === this.authModal) this.hideAuthModal();
        });
        this.savedLocationsModal?.addEventListener('click', (e) => {
            if (e.target === this.savedLocationsModal) this.hideSavedLocationsModal();
        });

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });

        // Login form
        document.getElementById('loginSubmitBtn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Register form
        document.getElementById('registerSubmitBtn')?.addEventListener('click', () => this.handleRegister());
        document.getElementById('registerPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });

        // User menu
        document.getElementById('userMenuButton')?.addEventListener('click', () => this.toggleUserDropdown());
        document.getElementById('savedLocationsBtn')?.addEventListener('click', () => this.showSavedLocations());
        document.getElementById('adminPanelBtn')?.addEventListener('click', () => this.showAdminPanel());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

        // Save current location
        document.getElementById('saveCurrentLocationBtn')?.addEventListener('click', () => this.saveCurrentLocation());
    }

    // Show/Hide Modals
    showAuthModal(tab = 'login') {
        this.authModal.classList.remove('hidden');
        this.authModal.classList.add('active');
        this.switchAuthTab(tab);
    }

    hideAuthModal() {
        this.authModal.classList.add('hidden');
        this.authModal.classList.remove('active');
        this.clearAuthForms();
    }

    showSavedLocationsModal() {
        this.savedLocationsModal.classList.remove('hidden');
        this.savedLocationsModal.classList.add('active');
    }

    hideSavedLocationsModal() {
        this.savedLocationsModal.classList.add('hidden');
        this.savedLocationsModal.classList.remove('active');
    }

    // Switch between login and register tabs
    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    // Handle Login
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');
        const submitBtn = document.getElementById('loginSubmitBtn');

        errorEl.classList.add('hidden');

        if (!email || !password) {
            this.showError(errorEl, 'Please enter email and password');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            await window.authManager.login(email, password);

            this.hideAuthModal();
            this.updateUIForAuthState();
            this.showNotification('✅ Logged in successfully!');
        } catch (error) {
            this.showError(errorEl, error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    }

    // Handle Register
    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const errorEl = document.getElementById('registerError');
        const submitBtn = document.getElementById('registerSubmitBtn');

        errorEl.classList.add('hidden');

        if (!email || !password) {
            this.showError(errorEl, 'Please enter email and password');
            return;
        }

        if (password.length < 6) {
            this.showError(errorEl, 'Password must be at least 6 characters');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';

            await window.authManager.register(email, password, name);

            this.hideAuthModal();
            this.updateUIForAuthState();
            this.showNotification('✅ Account created successfully!');
        } catch (error) {
            this.showError(errorEl, error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    }

    // Handle Logout
    handleLogout() {
        window.authManager.logout();
    }

    // Update UI based on auth state
    async updateUIForAuthState() {
        const loginButton = document.getElementById('loginButton');
        const userMenu = document.getElementById('userMenu');
        const adminPanelBtn = document.getElementById('adminPanelBtn');

        if (window.authManager.isLoggedIn()) {
            loginButton.classList.add('hidden');
            userMenu.classList.remove('hidden');

            // Get user profile
            try {
                const user = await window.authManager.getProfile();
                document.getElementById('userName').textContent = user.name || user.email.split('@')[0];

                // Show admin button if user is admin
                if (user.isAdmin && adminPanelBtn) {
                    adminPanelBtn.classList.remove('hidden');
                } else if (adminPanelBtn) {
                    adminPanelBtn.classList.add('hidden');
                }
            } catch (error) {
                console.error('Failed to get profile:', error);
            }
        } else {
            loginButton.classList.remove('hidden');
            userMenu.classList.add('hidden');
            if (adminPanelBtn) {
                adminPanelBtn.classList.add('hidden');
            }
        }
    }

    // Toggle user dropdown
    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('hidden');
    }

    // Show admin panel
    showAdminPanel() {
        this.toggleUserDropdown();
        if (window.adminManager) {
            window.adminManager.openModal();
        }
    }

    // Show saved locations
    async showSavedLocations() {
        this.toggleUserDropdown();
        this.showSavedLocationsModal();

        const listEl = document.getElementById('savedLocationsList');
        listEl.innerHTML = '<div class="loading">Loading saved locations...</div>';

        try {
            const locations = await window.authManager.getLocations();

            if (locations.length === 0) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <p>No saved locations yet</p>
                        <small>Search for a location and click "Save This Location" to add it here</small>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = '';
            locations.forEach(location => {
                const item = this.createLocationItem(location);
                listEl.appendChild(item);
            });
        } catch (error) {
            listEl.innerHTML = `<div class="error-message">Failed to load locations: ${error.message}</div>`;
        }
    }

    // Create saved location item
    createLocationItem(location) {
        const item = document.createElement('div');
        item.className = 'saved-location-item';

        const notificationStatus = location.notifications_enabled 
            ? `<span class="notification-badge active" title="Notifications enabled">🔔</span>` 
            : `<span class="notification-badge" title="Notifications disabled">🔕</span>`;

        item.innerHTML = `
            <div class="location-info">
                <div class="location-name">
                    ${location.location_name}
                    ${notificationStatus}
                </div>
                <div class="location-coords">${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}</div>
                ${location.notifications_enabled ? `<div class="notification-threshold">Alert at ≤${location.cloud_threshold}% clouds</div>` : ''}
            </div>
            <div class="location-actions">
                <button class="location-action-btn favorite-btn ${location.is_favorite ? 'active' : ''}" 
                        data-id="${location.id}" 
                        title="Toggle favorite">
                    ⭐
                </button>
                <button class="location-action-btn settings-btn" 
                        data-id="${location.id}" 
                        title="Notification settings">
                    ⚙️
                </button>
                <button class="location-action-btn delete-btn" 
                        data-id="${location.id}" 
                        title="Delete location">
                    🗑️
                </button>
            </div>
        `;

        // Click to load location
        item.querySelector('.location-info').addEventListener('click', () => {
            this.loadLocation(location);
        });

        // Toggle favorite
        item.querySelector('.favorite-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.toggleFavorite(location.id);
        });

        // Open settings
        item.querySelector('.settings-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            this.showNotificationSettings(location);
        });

        // Delete location
        item.querySelector('.delete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${location.location_name}"?`)) {
                await this.deleteLocation(location.id);
            }
        });

        return item;
    }

    // Load a saved location
    loadLocation(location) {
        this.hideSavedLocationsModal();
        
        // Trigger forecast search
        if (window.astroApp) {
            window.astroApp.fetchForecast({ lat: location.lat, lon: location.lon });
        }

        this.showNotification(`📍 Loading ${location.location_name}...`);
    }

    // Toggle favorite
    async toggleFavorite(locationId) {
        try {
            await window.authManager.toggleFavorite(locationId);
            this.showSavedLocations(); // Refresh list
        } catch (error) {
            this.showNotification('❌ Failed to update favorite');
        }
    }

    // Delete location
    async deleteLocation(locationId) {
        try {
            await window.authManager.deleteLocation(locationId);
            this.showSavedLocations(); // Refresh list
            this.showNotification('🗑️ Location deleted');
        } catch (error) {
            this.showNotification('❌ Failed to delete location');
        }
    }

    // Save current location
    async saveCurrentLocation() {
        if (!this.currentLocation) {
            this.showNotification('❌ No location to save');
            return;
        }

        if (!window.authManager.isLoggedIn()) {
            this.showAuthModal('register');
            return;
        }

        try {
            await window.authManager.saveLocation(
                this.currentLocation.name,
                this.currentLocation.lat,
                this.currentLocation.lon,
                false
            );

            this.showNotification('✅ Location saved!');
        } catch (error) {
            if (error.message.includes('already saved')) {
                this.showNotification('ℹ️ Location already saved');
            } else {
                this.showNotification('❌ Failed to save location');
            }
        }
    }

    // Set current location (called by main app)
    setCurrentLocation(name, lat, lon) {
        this.currentLocation = { name, lat, lon };
        
        // Show save button if logged in
        const saveContainer = document.getElementById('saveLocationContainer');
        if (window.authManager.isLoggedIn()) {
            saveContainer.classList.remove('hidden');
        }
    }

    // Clear auth forms
    clearAuthForms() {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('registerError').classList.add('hidden');
    }

    // Show error message
    showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }

    // Show notification (simple version)
    showNotification(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-color);
            color: var(--text-color);
            padding: 15px 25px;
            border-radius: 8px;
            border: 2px solid var(--highlight-color);
            z-index: 3000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authUI = new AuthUIController();
});
