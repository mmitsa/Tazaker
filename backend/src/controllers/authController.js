const User = require('../models/User');
const { generateTokensPair } = require('../config/jwt');
const { success, error, unauthorized } = require('../utils/response');
const logger = require('../utils/logger');
const redis = require('../config/redis');

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findByUsername(username);

    if (!user) {
      return unauthorized(res, 'Invalid username or password');
    }

    // Check if user is active
    if (!user.is_active) {
      return unauthorized(res, 'Account is inactive. Please contact administrator.');
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      logger.warn('Failed login attempt', { username });
      return unauthorized(res, 'Invalid username or password');
    }

    // Generate tokens
    const tokens = generateTokensPair(user);

    // Update last login
    await User.updateLastLogin(user.user_id);

    // Store refresh token in Redis
    await redis.set(
      `refresh_token:${user.user_id}`,
      tokens.refreshToken,
      7 * 24 * 60 * 60 // 7 days
    );

    logger.info('User logged in successfully', {
      userId: user.user_id,
      username: user.username,
      role: user.role,
    });

    // Remove sensitive data
    delete user.password_hash;

    return success(res, {
      user: {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    }, 'Login successful');
  } catch (err) {
    logger.error('Login error:', err);
    return error(res, 'Login failed', 500);
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Remove refresh token from Redis
    await redis.del(`refresh_token:${userId}`);

    logger.info('User logged out', { userId });

    return success(res, null, 'Logout successful');
  } catch (err) {
    logger.error('Logout error:', err);
    return error(res, 'Logout failed', 500);
  }
};

/**
 * Get current user info
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    return success(res, {
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login,
    });
  } catch (err) {
    logger.error('Get me error:', err);
    return error(res, 'Failed to get user info', 500);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByUsername(req.user.username);

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    // Verify old password
    const isPasswordValid = await User.verifyPassword(oldPassword, user.password_hash);

    if (!isPasswordValid) {
      return unauthorized(res, 'Current password is incorrect');
    }

    // Update password
    await User.updatePassword(userId, newPassword);

    // Invalidate all refresh tokens
    await redis.del(`refresh_token:${userId}`);

    logger.info('Password changed successfully', { userId });

    return success(res, null, 'Password changed successfully. Please login again.');
  } catch (err) {
    logger.error('Change password error:', err);
    return error(res, 'Failed to change password', 500);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return unauthorized(res, 'Refresh token required');
    }

    // Verify refresh token
    const { verifyRefreshToken } = require('../config/jwt');
    const decoded = verifyRefreshToken(token);

    // Check if token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (!storedToken || storedToken !== token) {
      return unauthorized(res, 'Invalid refresh token');
    }

    // Get user
    const user = await User.findById(decoded.userId);

    if (!user || !user.is_active) {
      return unauthorized(res, 'User not found or inactive');
    }

    // Generate new tokens
    const tokens = generateTokensPair(user);

    // Update refresh token in Redis
    await redis.set(
      `refresh_token:${user.user_id}`,
      tokens.refreshToken,
      7 * 24 * 60 * 60
    );

    logger.info('Token refreshed', { userId: user.user_id });

    return success(res, tokens, 'Token refreshed successfully');
  } catch (err) {
    logger.error('Refresh token error:', err);
    return unauthorized(res, 'Invalid or expired refresh token');
  }
};

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
  refreshToken,
};
