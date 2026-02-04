const authService = require('../services/authService');

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
    
    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
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
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // Token is invalid, but we continue without user
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
