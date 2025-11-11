const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validateQuery, validateParams } = require('../middleware/validation.middleware');
const { querySchemas } = require('../utils/validators');

/**
 * @route   GET /api/v1/reports/daily-statistics
 * @desc    Get daily statistics
 * @access  Admin, Super Admin
 */
router.get(
  '/daily-statistics',
  authenticate,
  requireRole(['admin', 'super_admin']),
  reportController.getDailyStatistics
);

/**
 * @route   GET /api/v1/reports/clinic-performance
 * @desc    Get clinic performance report
 * @access  Admin, Super Admin
 */
router.get(
  '/clinic-performance',
  authenticate,
  requireRole(['admin', 'super_admin']),
  reportController.getClinicPerformance
);

/**
 * @route   GET /api/v1/reports/doctor-performance
 * @desc    Get doctor performance report
 * @access  Admin, Super Admin
 */
router.get(
  '/doctor-performance',
  authenticate,
  requireRole(['admin', 'super_admin']),
  reportController.getDoctorPerformance
);

/**
 * @route   GET /api/v1/reports/wait-time-analytics
 * @desc    Get wait time analytics
 * @access  Admin, Super Admin
 */
router.get(
  '/wait-time-analytics',
  authenticate,
  requireRole(['admin', 'super_admin']),
  reportController.getWaitTimeAnalytics
);

/**
 * @route   GET /api/v1/reports/queue-analytics
 * @desc    Get real-time queue analytics
 * @access  Admin, Super Admin, Doctor
 */
router.get(
  '/queue-analytics',
  authenticate,
  requireRole(['doctor', 'admin', 'super_admin']),
  reportController.getQueueAnalytics
);

/**
 * @route   GET /api/v1/reports/sms-statistics
 * @desc    Get SMS notification statistics
 * @access  Admin, Super Admin
 */
router.get(
  '/sms-statistics',
  authenticate,
  requireRole(['admin', 'super_admin']),
  reportController.getSMSStatistics
);

/**
 * @route   GET /api/v1/reports/patient/:patient_id/visits
 * @desc    Get patient visit history
 * @access  Authenticated
 */
router.get(
  '/patient/:patient_id/visits',
  authenticate,
  validateParams(querySchemas.idParam),
  reportController.getPatientVisitHistory
);

/**
 * @route   GET /api/v1/reports/system-overview
 * @desc    Get system overview (dashboard summary)
 * @access  Admin, Super Admin
 */
router.get(
  '/system-overview',
  authenticate,
  requireRole(['admin', 'super_admin']),
  reportController.getSystemOverview
);

module.exports = router;
