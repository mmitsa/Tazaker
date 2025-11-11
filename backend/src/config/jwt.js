const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'hospital-queue-system',
  audience: 'hospital-users',
};

/**
 * Generate access token
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const token = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    logger.error('Error verifying access token:', error);
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    logger.error('Error verifying refresh token:', error);
    throw error;
  }
};

/**
 * Decode token without verification (use with caution)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token:', error);
    throw error;
  }
};

/**
 * Get token expiry time
 * @param {string} token - JWT token
 * @returns {Date} Expiry date
 */
const getTokenExpiry = (token) => {
  try {
    const decoded = decodeToken(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    logger.error('Error getting token expiry:', error);
    throw error;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
const isTokenExpired = (token) => {
  try {
    const expiry = getTokenExpiry(token);
    return expiry < new Date();
  } catch (error) {
    return true;
  }
};

/**
 * Generate tokens pair (access + refresh)
 * @param {Object} user - User object
 * @returns {Object} Object containing access and refresh tokens
 */
const generateTokensPair = (user) => {
  const payload = {
    userId: user.user_id,
    username: user.username,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: jwtConfig.expiresIn,
  };
};

module.exports = {
  jwtConfig,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiry,
  isTokenExpired,
  generateTokensPair,
};
