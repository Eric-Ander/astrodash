const authService = require('../services/authService');
const db = require('../config/database');

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and verifies it
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user from database to check admin status
    const user = db.prepare('SELECT id, email, is_admin FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Add user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin === 1
    };

    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid token',
      message: error.message
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that work with or without auth
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyToken(token);
      const user = db.prepare('SELECT id, email, is_admin FROM users WHERE id = ?').get(decoded.userId);

      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          isAdmin: user.is_admin === 1
        };
      }
    }

    next();
  } catch (error) {
    // Token is invalid, but we continue without user
    next();
  }
};

/**
 * Middleware to require admin privileges
 * Must be used after authenticateToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
};
