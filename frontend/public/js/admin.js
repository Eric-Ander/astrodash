/**
 * Admin Panel Manager
 * Handles user management interface for administrators
 */

class AdminManager {
  constructor() {
    this.currentPage = 1;
    this.searchQuery = '';
    this.users = [];
    this.stats = null;
    this.initialized = false;
  }

  /**
   * Initialize admin panel
   */
  init() {
    if (this.initialized) return;
    this.setupEventListeners();
    this.initialized = true;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close modal
    const closeBtn = document.getElementById('closeAdminModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Close on outside click
    const modal = document.getElementById('adminModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Search input
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.currentPage = 1;
          this.loadUsers();
        }, 300);
      });
    }

    // Pagination
    document.getElementById('adminPrevPage')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadUsers();
      }
    });

    document.getElementById('adminNextPage')?.addEventListener('click', () => {
      this.currentPage++;
      this.loadUsers();
    });
  }

  /**
   * Open admin modal
   */
  async openModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    this.init();

    // Load data
    await Promise.all([
      this.loadStats(),
      this.loadUsers()
    ]);
  }

  /**
   * Close admin modal
   */
  closeModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('astroweather_token');
  }

  /**
   * Load user statistics
   */
  async loadStats() {
    const container = document.getElementById('adminStats');
    if (!container) return;

    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });

      if (!response.ok) throw new Error('Failed to load stats');

      this.stats = await response.json();

      container.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${this.stats.totalUsers}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.stats.adminCount}</div>
          <div class="stat-label">Admins</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.stats.activeLastWeek}</div>
          <div class="stat-label">Active (7d)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.stats.totalSavedLocations}</div>
          <div class="stat-label">Saved Locations</div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading stats:', error);
      container.innerHTML = '<div class="admin-error">Failed to load statistics</div>';
    }
  }

  /**
   * Load users list
   */
  async loadUsers() {
    const container = document.getElementById('adminUsersList');
    if (!container) return;

    container.innerHTML = '<div class="admin-loading">Loading users...</div>';

    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: 10
      });
      if (this.searchQuery) {
        params.append('search', this.searchQuery);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });

      if (!response.ok) throw new Error('Failed to load users');

      const data = await response.json();
      this.users = data.users;

      this.renderUsers(data.users, data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
      container.innerHTML = '<div class="admin-error">Failed to load users</div>';
    }
  }

  /**
   * Render users list
   */
  renderUsers(users, pagination) {
    const container = document.getElementById('adminUsersList');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = '<div class="admin-empty">No users found</div>';
      this.updatePagination(pagination);
      return;
    }

    const currentUserId = this.getCurrentUserId();

    container.innerHTML = users.map(user => `
      <div class="user-row" data-user-id="${user.id}">
        <div class="user-info">
          <div class="user-email">
            ${user.email}
            ${user.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            ${user.id === currentUserId ? '<span class="you-badge">You</span>' : ''}
          </div>
          <div class="user-details">
            ${user.name || 'No name'} ·
            Joined ${this.formatDate(user.createdAt)} ·
            ${user.savedLocationsCount} locations
          </div>
        </div>
        <div class="user-actions">
          ${user.id !== currentUserId ? `
            <button class="action-btn ${user.isAdmin ? 'demote' : 'promote'}"
                    onclick="adminManager.toggleAdmin(${user.id})"
                    title="${user.isAdmin ? 'Remove admin' : 'Make admin'}">
              ${user.isAdmin ? '👤' : '👑'}
            </button>
            <button class="action-btn reset"
                    onclick="adminManager.resetPassword(${user.id})"
                    title="Reset password">
              🔑
            </button>
            <button class="action-btn delete"
                    onclick="adminManager.deleteUser(${user.id}, '${user.email}')"
                    title="Delete user">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    this.updatePagination(pagination);
  }

  /**
   * Update pagination controls
   */
  updatePagination(pagination) {
    const pageInfo = document.getElementById('adminPageInfo');
    const prevBtn = document.getElementById('adminPrevPage');
    const nextBtn = document.getElementById('adminNextPage');

    if (pageInfo) {
      pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages || 1}`;
    }

    if (prevBtn) {
      prevBtn.disabled = pagination.page <= 1;
    }

    if (nextBtn) {
      nextBtn.disabled = pagination.page >= pagination.totalPages;
    }
  }

  /**
   * Get current user ID from token
   */
  getCurrentUserId() {
    try {
      const token = this.getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  }

  /**
   * Toggle admin status
   */
  async toggleAdmin(userId) {
    const user = this.users.find(u => u.id === userId);
    const action = user?.isAdmin ? 'remove admin privileges from' : 'grant admin privileges to';

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await this.loadUsers();
      await this.loadStats();
    } catch (error) {
      alert('Failed to update admin status: ' + error.message);
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(userId) {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      alert('Password reset successfully');
    } catch (error) {
      alert('Failed to reset password: ' + error.message);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId, email) {
    if (!confirm(`Are you sure you want to delete the user "${email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await this.loadUsers();
      await this.loadStats();
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Create global instance
const adminManager = new AdminManager();
