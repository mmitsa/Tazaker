const { validationError } = require('../utils/response');
const { formatValidationErrors } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Data source (body, query, params)
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];

      // Validate data
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const errors = formatValidationErrors(error);

        logger.warn('Validation failed', {
          source,
          errors,
          url: req.originalUrl,
          method: req.method,
        });

        return validationError(res, errors);
      }

      // Replace original data with validated and sanitized data
      req[source] = value;

      next();
    } catch (err) {
      logger.error('Validation middleware error:', err);
      return res.status(500).json({
        success: false,
        message: 'Validation processing error',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Validate request body
 * @param {Object} schema - Joi schema
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 * @param {Object} schema - Joi schema
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 * @param {Object} schema - Joi schema
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate multiple sources
 * @param {Object} schemas - Object with schemas for different sources
 * Example: { body: bodySchema, query: querySchema }
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    try {
      const allErrors = [];

      // Validate each source
      for (const [source, schema] of Object.entries(schemas)) {
        const { error, value } = schema.validate(req[source], {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const errors = formatValidationErrors(error);
          allErrors.push(...errors.map((err) => ({
            ...err,
            source,
          })));
        } else {
          req[source] = value;
        }
      }

      if (allErrors.length > 0) {
        logger.warn('Multiple validation failed', {
          errors: allErrors,
          url: req.originalUrl,
          method: req.method,
        });

        return validationError(res, allErrors);
      }

      next();
    } catch (err) {
      logger.error('Multiple validation middleware error:', err);
      return res.status(500).json({
        success: false,
        message: 'Validation processing error',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateMultiple,
};
