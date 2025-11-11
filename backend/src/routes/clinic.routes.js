const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const { validateBody, validateParams } = require('../middleware/validation.middleware');
const { clinicSchemas, querySchemas } = require('../utils/validators');

/**
 * @route   GET /api/v1/clinics
 * @desc    Get all clinics
 * @access  Authenticated
 */
router.get('/', authenticate, clinicController.getAllClinics);

/**
 * @route   GET /api/v1/clinics/queue-status
 * @desc    Get queue status for all clinics
 * @access  Authenticated
 */
router.get('/queue-status', authenticate, clinicController.getQueueStatus);

/**
 * @route   GET /api/v1/clinics/:id
 * @desc    Get clinic by ID
 * @access  Authenticated
 */
router.get(
  '/:id',
  authenticate,
  validateParams(querySchemas.idParam),
  clinicController.getClinicById
);

/**
 * @route   POST /api/v1/clinics
 * @desc    Create new clinic
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(clinicSchemas.create),
  clinicController.createClinic
);

/**
 * @route   PUT /api/v1/clinics/:id
 * @desc    Update clinic
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(querySchemas.idParam),
  validateBody(clinicSchemas.update),
  clinicController.updateClinic
);

/**
 * @route   DELETE /api/v1/clinics/:id
 * @desc    Delete clinic
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(querySchemas.idParam),
  clinicController.deleteClinic
);

module.exports = router;
