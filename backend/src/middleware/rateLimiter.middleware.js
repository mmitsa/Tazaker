const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    timestamp: new Date().toISOString(),
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      username: req.body.username,
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes',
      retryAfter: req.rateLimit.resetTime,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Moderate rate limiter for ticket creation
 * 20 tickets per 5 minutes
 */
const ticketCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many tickets created, please slow down',
    timestamp: new Date().toISOString(),
  },
  handler: (req, res) => {
    logger.warn('Ticket creation rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
    });

    res.status(429).json({
      success: false,
      message: 'Too many tickets created, please try again later',
      retryAfter: req.rateLimit.resetTime,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * SMS rate limiter
 * 10 SMS per hour
 */
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => {
    // Rate limit by phone number if available
    return req.body.phone || req.ip;
  },
  message: {
    success: false,
    message: 'SMS limit exceeded for this phone number',
    timestamp: new Date().toISOString(),
  },
  handler: (req, res) => {
    logger.warn('SMS rate limit exceeded', {
      phone: req.body.phone,
      ip: req.ip,
    });

    res.status(429).json({
      success: false,
      message: 'Too many SMS requests, please try again later',
      retryAfter: req.rateLimit.resetTime,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Report generation limiter
 * 10 reports per 10 minutes
 */
const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  keyGenerator: (req) => {
    // Rate limit by user ID
    return req.user?.userId || req.ip;
  },
  message: {
    success: false,
    message: 'Report generation limit exceeded',
    timestamp: new Date().toISOString(),
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  ticketCreationLimiter,
  smsLimiter,
  reportLimiter,
};
