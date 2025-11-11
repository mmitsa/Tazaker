const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class User {
  /**
   * Find user by ID
   */
  static async findById(userId) {
    try {
      const result = await query(
        'SELECT user_id, username, full_name, email, phone, role, is_active, last_login, created_at FROM users WHERE user_id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT user_id, username, full_name, email, phone, role, is_active FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  static async create(userData) {
    try {
      const {
        username,
        password,
        full_name,
        email,
        phone,
        role,
      } = userData;

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING user_id, username, full_name, email, phone, role, is_active, created_at`,
        [username, passwordHash, full_name, email, phone, role]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(userId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic UPDATE query
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(userId);

      const result = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $${paramIndex}
         RETURNING user_id, username, full_name, email, phone, role, is_active, updated_at`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting is_active = false)
   */
  static async delete(userId) {
    try {
      const result = await query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING user_id',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Hard delete user (permanent)
   */
  static async hardDelete(userId) {
    try {
      const result = await query(
        'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error hard deleting user:', error);
      throw error;
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Update password
   */
  static async updatePassword(userId, newPassword) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);

      const result = await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id',
        [passwordHash, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId) {
    try {
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination
   */
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (filters.role) {
        conditions.push(`role = $${paramIndex}`);
        values.push(filters.role);
        paramIndex++;
      }

      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${paramIndex}`);
        values.push(filters.is_active);
        paramIndex++;
      }

      if (filters.search) {
        conditions.push(`(full_name ILIKE $${paramIndex} OR username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        values.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count);

      // Get users
      values.push(limit, offset);
      const result = await query(
        `SELECT user_id, username, full_name, email, phone, role, is_active, last_login, created_at
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      );

      return {
        users: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  static async getByRole(role) {
    try {
      const result = await query(
        'SELECT user_id, username, full_name, email, phone, role, is_active FROM users WHERE role = $1 AND is_active = true ORDER BY full_name',
        [role]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username, excludeUserId = null) {
    try {
      const conditions = ['username = $1'];
      const values = [username];

      if (excludeUserId) {
        conditions.push('user_id != $2');
        values.push(excludeUserId);
      }

      const result = await query(
        `SELECT EXISTS(SELECT 1 FROM users WHERE ${conditions.join(' AND ')}) as exists`,
        values
      );

      return result.rows[0].exists;
    } catch (error) {
      logger.error('Error checking username exists:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  static async emailExists(email, excludeUserId = null) {
    try {
      const conditions = ['email = $1'];
      const values = [email];

      if (excludeUserId) {
        conditions.push('user_id != $2');
        values.push(excludeUserId);
      }

      const result = await query(
        `SELECT EXISTS(SELECT 1 FROM users WHERE ${conditions.join(' AND ')}) as exists`,
        values
      );

      return result.rows[0].exists;
    } catch (error) {
      logger.error('Error checking email exists:', error);
      throw error;
    }
  }
}

module.exports = User;
