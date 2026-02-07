/**
 * User Management Service
 * Provides CRUD operations for user administration
 */

const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Get all users with pagination
 */
const getAllUsers = (page = 1, limit = 20, search = '') => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      id, email, name, is_admin, created_at, last_login,
      (SELECT COUNT(*) FROM saved_locations WHERE user_id = users.id) as saved_locations_count
    FROM users
  `;

  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const params = [];

  if (search) {
    const searchClause = ' WHERE email LIKE ? OR name LIKE ?';
    query += searchClause;
    countQuery += searchClause;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const totalResult = db.prepare(countQuery).get(...params);
  const users = db.prepare(query).all(...params, limit, offset);

  return {
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin === 1,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      savedLocationsCount: user.saved_locations_count
    })),
    pagination: {
      page,
      limit,
      total: totalResult.total,
      totalPages: Math.ceil(totalResult.total / limit)
    }
  };
};

/**
 * Get a single user by ID with details
 */
const getUserById = (userId) => {
  const user = db.prepare(`
    SELECT id, email, name, is_admin, created_at, last_login
    FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    return null;
  }

  // Get saved locations count
  const locationsCount = db.prepare(
    'SELECT COUNT(*) as count FROM saved_locations WHERE user_id = ?'
  ).get(userId);

  // Get card preferences count
  const prefsCount = db.prepare(
    'SELECT COUNT(*) as count FROM user_card_preferences WHERE user_id = ?'
  ).get(userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.is_admin === 1,
    createdAt: user.created_at,
    lastLogin: user.last_login,
    savedLocationsCount: locationsCount.count,
    cardPreferencesCount: prefsCount.count
  };
};

/**
 * Update user details (admin can update any user)
 */
const updateUser = (userId, updates) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const allowedUpdates = ['name', 'email', 'is_admin'];
  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedUpdates.includes(key)) {
      setClauses.push(`${key} = ?`);
      // Convert isAdmin to is_admin format
      if (key === 'is_admin') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(userId);
  const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

  try {
    db.prepare(query).run(...values);
    return getUserById(userId);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Email already in use');
    }
    throw error;
  }
};

/**
 * Reset user password (admin function)
 */
const resetUserPassword = async (userId, newPassword) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);

  return { success: true, message: 'Password reset successfully' };
};

/**
 * Delete a user and all their data
 */
const deleteUser = (userId, adminUserId) => {
  // Prevent admin from deleting themselves
  if (userId === adminUserId) {
    throw new Error('Cannot delete your own account');
  }

  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Use a transaction to delete user and related data
  const deleteTransaction = db.transaction(() => {
    // Delete saved locations
    db.prepare('DELETE FROM saved_locations WHERE user_id = ?').run(userId);

    // Delete card preferences
    db.prepare('DELETE FROM user_card_preferences WHERE user_id = ?').run(userId);

    // Delete the user
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  deleteTransaction();

  return { success: true, deletedEmail: user.email };
};

/**
 * Toggle admin status for a user
 */
const toggleAdminStatus = (userId, adminUserId) => {
  // Prevent admin from demoting themselves
  if (userId === adminUserId) {
    throw new Error('Cannot change your own admin status');
  }

  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const newStatus = user.is_admin === 1 ? 0 : 1;
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newStatus, userId);

  return {
    userId,
    isAdmin: newStatus === 1
  };
};

/**
 * Get user statistics
 */
const getUserStats = () => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as totalUsers,
      SUM(CASE WHEN is_admin = 1 THEN 1 ELSE 0 END) as adminCount,
      SUM(CASE WHEN last_login >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as activeLastWeek,
      SUM(CASE WHEN last_login >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as activeLastMonth
    FROM users
  `).get();

  const locationsStats = db.prepare(`
    SELECT COUNT(*) as totalLocations FROM saved_locations
  `).get();

  return {
    totalUsers: stats.totalUsers,
    adminCount: stats.adminCount,
    activeLastWeek: stats.activeLastWeek,
    activeLastMonth: stats.activeLastMonth,
    totalSavedLocations: locationsStats.totalLocations
  };
};

/**
 * Create initial admin user if no admins exist
 */
const ensureAdminExists = async (email, password, name = 'Admin') => {
  // Check if any admin exists
  const adminExists = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
  if (adminExists) {
    return { created: false, message: 'Admin already exists' };
  }

  // Check if user with email exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    // Promote existing user to admin
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existingUser.id);
    return { created: false, promoted: true, message: 'Existing user promoted to admin' };
  }

  // Create new admin user
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = db.prepare(`
    INSERT INTO users (email, password_hash, name, is_admin, created_at)
    VALUES (?, ?, ?, 1, datetime('now'))
  `).run(email, passwordHash, name);

  return { created: true, userId: result.lastInsertRowid };
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  deleteUser,
  toggleAdminStatus,
  getUserStats,
  ensureAdminExists
};
