/**
 * Standard API response format
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Additional error details
 */
const error = (res, message = 'Error occurred', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors
 */
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Conflict response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const conflict = (res, message = 'Resource conflict') => {
  return res.status(409).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Created response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const created = (res, data = null, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * No content response
 * @param {Object} res - Express response object
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @param {string} message - Success message
 */
const paginated = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
      hasMore: page < totalPages,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Custom response with custom status code
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} body - Response body
 */
const custom = (res, statusCode, body) => {
  return res.status(statusCode).json({
    ...body,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  created,
  noContent,
  paginated,
  custom,
};
