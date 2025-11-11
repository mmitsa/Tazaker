const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole, requireDoctor, requireAdmin } = require('../middleware/role.middleware');
const { validateBody, validateParams } = require('../middleware/validation.middleware');
const { doctorSchemas, querySchemas } = require('../utils/validators');

/**
 * @route   GET /api/v1/doctors
 * @desc    Get all doctors
 * @access  Authenticated
 */
router.get('/', authenticate, doctorController.getAllDoctors);

/**
 * @route   GET /api/v1/doctors/available
 * @desc    Get available doctors
 * @access  Authenticated
 */
router.get('/available', authenticate, doctorController.getAvailableDoctors);

/**
 * @route   GET /api/v1/doctors/me
 * @desc    Get current doctor profile
 * @access  Doctor
 */
router.get('/me', authenticate, requireDoctor, doctorController.getMyProfile);

/**
 * @route   GET /api/v1/doctors/clinic/:clinicId
 * @desc    Get doctors by clinic
 * @access  Authenticated
 */
router.get(
  '/clinic/:clinicId',
  authenticate,
  validateParams(querySchemas.idParam),
  doctorController.getDoctorsByClinic
);

/**
 * @route   GET /api/v1/doctors/:id
 * @desc    Get doctor by ID
 * @access  Authenticated
 */
router.get(
  '/:id',
  authenticate,
  validateParams(querySchemas.idParam),
  doctorController.getDoctorById
);

/**
 * @route   PUT /api/v1/doctors/status
 * @desc    Update doctor status
 * @access  Doctor
 */
router.put(
  '/status',
  authenticate,
  requireDoctor,
  validateBody(doctorSchemas.updateStatus),
  doctorController.updateStatus
);

/**
 * @route   PUT /api/v1/doctors/availability
 * @desc    Set doctor availability
 * @access  Doctor
 */
router.put(
  '/availability',
  authenticate,
  requireDoctor,
  doctorController.setAvailability
);

/**
 * @route   POST /api/v1/doctors
 * @desc    Create doctor profile
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(doctorSchemas.create),
  doctorController.createDoctor
);

/**
 * @route   PUT /api/v1/doctors/:id
 * @desc    Update doctor profile
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(querySchemas.idParam),
  validateBody(doctorSchemas.update),
  doctorController.updateDoctor
);

module.exports = router;
