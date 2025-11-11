const Joi = require('joi');

/**
 * Common validation schemas
 */

// User validation schemas
const userSchemas = {
  login: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(6),
  }),

  register: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    full_name: Joi.string().required().min(3).max(100),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    role: Joi.string().valid('super_admin', 'admin', 'doctor', 'receptionist').required(),
  }),

  update: Joi.object({
    full_name: Joi.string().min(3).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    is_active: Joi.boolean().optional(),
  }),

  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  }),
};

// Patient validation schemas
const patientSchemas = {
  create: Joi.object({
    medical_record_number: Joi.string().max(50).optional(),
    full_name: Joi.string().required().min(3).max(100),
    phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
    national_id: Joi.string().max(20).optional(),
    date_of_birth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    email: Joi.string().email().optional(),
  }),

  update: Joi.object({
    full_name: Joi.string().min(3).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    national_id: Joi.string().max(20).optional(),
    date_of_birth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    email: Joi.string().email().optional(),
  }),

  search: Joi.object({
    mrn: Joi.string().optional(),
    phone: Joi.string().optional(),
    national_id: Joi.string().optional(),
    name: Joi.string().optional(),
  }).or('mrn', 'phone', 'national_id', 'name'),
};

// Ticket validation schemas
const ticketSchemas = {
  create: Joi.object({
    clinic_id: Joi.number().integer().positive().required(),
    patient_id: Joi.number().integer().positive().required(),
    priority: Joi.number().integer().min(0).max(2).default(0),
    notes: Joi.string().max(500).optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show')
      .required(),
    notes: Joi.string().max(500).optional(),
  }),

  call: Joi.object({
    doctor_id: Joi.number().integer().positive().optional(),
  }),

  complete: Joi.object({
    actual_service_time: Joi.number().integer().positive().optional(),
    notes: Joi.string().max(500).optional(),
  }),
};

// Clinic validation schemas
const clinicSchemas = {
  create: Joi.object({
    clinic_name_ar: Joi.string().required().min(3).max(100),
    clinic_name_en: Joi.string().required().min(3).max(100),
    clinic_code: Joi.string().required().min(2).max(10).uppercase(),
    department: Joi.string().max(50).optional(),
    average_time_per_patient: Joi.number().integer().positive().default(15),
    working_hours_start: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    working_hours_end: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  }),

  update: Joi.object({
    clinic_name_ar: Joi.string().min(3).max(100).optional(),
    clinic_name_en: Joi.string().min(3).max(100).optional(),
    department: Joi.string().max(50).optional(),
    status: Joi.string().valid('active', 'inactive', 'closed').optional(),
    average_time_per_patient: Joi.number().integer().positive().optional(),
    working_hours_start: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    working_hours_end: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  }),
};

// Doctor validation schemas
const doctorSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    clinic_id: Joi.number().integer().positive().required(),
    specialization: Joi.string().max(100).optional(),
    license_number: Joi.string().max(50).required(),
  }),

  update: Joi.object({
    clinic_id: Joi.number().integer().positive().optional(),
    specialization: Joi.string().max(100).optional(),
    is_available: Joi.boolean().optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('online', 'busy', 'break', 'offline').required(),
  }),
};

// Report validation schemas
const reportSchemas = {
  daily: Joi.object({
    date: Joi.date().optional(),
    clinic_id: Joi.number().integer().positive().optional(),
    doctor_id: Joi.number().integer().positive().optional(),
  }),

  dateRange: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
    clinic_id: Joi.number().integer().positive().optional(),
    doctor_id: Joi.number().integer().positive().optional(),
  }),
};

// Query params validation
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().positive().default(1),
    limit: Joi.number().integer().positive().max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('asc'),
  }),

  idParam: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

/**
 * Validate data against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @returns {Object} Validation result
 */
const validate = (data, schema) => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};

/**
 * Format Joi validation errors
 * @param {Object} error - Joi validation error
 * @returns {Array} Formatted error array
 */
const formatValidationErrors = (error) => {
  if (!error || !error.details) {
    return [];
  }

  return error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
  }));
};

/**
 * Validation middleware generator
 * @param {Object} schema - Joi schema
 * @param {string} source - Data source (body, query, params)
 * @returns {Function} Express middleware
 */
const validationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = validate(req[source], schema);

    if (error) {
      const errors = formatValidationErrors(error);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req[source] = value;
    next();
  };
};

module.exports = {
  userSchemas,
  patientSchemas,
  ticketSchemas,
  clinicSchemas,
  doctorSchemas,
  reportSchemas,
  querySchemas,
  validate,
  formatValidationErrors,
  validationMiddleware,
};
