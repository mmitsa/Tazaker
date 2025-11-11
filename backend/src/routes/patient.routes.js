const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation.middleware');
const { patientSchemas, querySchemas } = require('../utils/validators');

/**
 * @route   GET /api/v1/patients
 * @desc    Get all patients (paginated)
 * @access  Authenticated
 */
router.get(
  '/',
  authenticate,
  validateQuery(querySchemas.pagination),
  patientController.getAllPatients
);

/**
 * @route   GET /api/v1/patients/search
 * @desc    Search patients
 * @access  Authenticated
 */
router.get(
  '/search',
  authenticate,
  validateQuery(patientSchemas.search),
  patientController.searchPatients
);

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get patient by ID
 * @access  Authenticated
 */
router.get(
  '/:id',
  authenticate,
  validateParams(querySchemas.idParam),
  patientController.getPatientById
);

/**
 * @route   POST /api/v1/patients
 * @desc    Create new patient
 * @access  Receptionist, Admin
 */
router.post(
  '/',
  authenticate,
  requireRole(['receptionist', 'admin', 'super_admin']),
  validateBody(patientSchemas.create),
  patientController.createPatient
);

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    Update patient
 * @access  Receptionist, Admin
 */
router.put(
  '/:id',
  authenticate,
  requireRole(['receptionist', 'admin', 'super_admin']),
  validateParams(querySchemas.idParam),
  validateBody(patientSchemas.update),
  patientController.updatePatient
);

module.exports = router;
