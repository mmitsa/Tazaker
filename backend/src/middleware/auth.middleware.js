const { verifyAccessToken } = require('../config/jwt');
const { unauthorized } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return unauthorized(res, 'No authorization token provided');
    }

    // Extract token (format: "Bearer TOKEN")
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return unauthorized(res, 'Invalid authorization format. Use: Bearer TOKEN');
    }

    const token = parts[1];

    // Verify token
    try {
      const decoded = verifyAccessToken(token);

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };

      logger.debug('User authenticated', {
        userId: req.user.userId,
        role: req.user.role,
      });

      next();
    } catch (error) {
      if (error.message === 'Token has expired') {
        return unauthorized(res, 'Token has expired');
      } else if (error.message === 'Invalid token') {
        return unauthorized(res, 'Invalid token');
      }
      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return unauthorized(res, 'Authentication failed');
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't fail if absent
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];

      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
        };
      } catch (error) {
        // Token invalid or expired, but we continue anyway
        logger.warn('Optional auth: Invalid token', error.message);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
