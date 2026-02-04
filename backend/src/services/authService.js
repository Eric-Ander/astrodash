const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Register a new user
   */
  async register(email, password, name = null) {
    try {
      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, name, created_at)
        VALUES (?, ?, ?, ?)
      `).run(email, passwordHash, name, Date.now());

      const userId = result.lastInsertRowid;

      // Generate JWT token
      const token = this.generateToken(userId, email);

      return {
        user: {
          id: userId,
          email,
          name
        },
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Find user
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), user.id);

      // Generate JWT token
      const token = this.generateToken(user.id, user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId, email) {
    return jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  getUserById(userId) {
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(userId);
    return user || null;
  }
}

module.exports = new AuthService();
