/**
 * User Management Controller
 * Handles admin requests for user management
 */

const userManagementService = require('../services/userManagementService');

/**
 * GET /api/admin/users
 * List all users with pagination
 */
const listUsers = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || '';

    const result = userManagementService.getAllUsers(page, limit, search);

    res.json(result);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      error: 'Failed to list users',
      message: error.message
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Get a single user by ID
 */
const getUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = userManagementService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
};

/**
 * PATCH /api/admin/users/:id
 * Update user details
 */
const updateUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.isAdmin !== undefined) updates.is_admin = req.body.isAdmin;

    const user = userManagementService.updateUser(userId, updates);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
};

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password
 */
const resetPassword = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const result = await userManagementService.resetUserPassword(userId, password);
    res.json(result);
  } catch (error) {
    console.error('Error resetting password:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      error: 'Failed to reset password',
      message: error.message
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
const deleteUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = userManagementService.deleteUser(userId, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting user:', error);
    const status = error.message.includes('not found') ? 404 :
      error.message.includes('own account') ? 400 : 500;
    res.status(status).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
};

/**
 * POST /api/admin/users/:id/toggle-admin
 * Toggle admin status
 */
const toggleAdmin = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = userManagementService.toggleAdminStatus(userId, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error toggling admin status:', error);
    const status = error.message.includes('not found') ? 404 :
      error.message.includes('own admin') ? 400 : 500;
    res.status(status).json({
      error: 'Failed to toggle admin status',
      message: error.message
    });
  }
};

/**
 * GET /api/admin/stats
 * Get user statistics
 */
const getStats = (req, res) => {
  try {
    const stats = userManagementService.getUserStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
};

module.exports = {
  listUsers,
  getUser,
  updateUser,
  resetPassword,
  deleteUser,
  toggleAdmin,
  getStats
};
