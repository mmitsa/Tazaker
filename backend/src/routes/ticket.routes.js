const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole, requireDoctor } = require('../middleware/role.middleware');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation.middleware');
const { ticketSchemas, querySchemas } = require('../utils/validators');
const { ticketCreationLimiter } = require('../middleware/rateLimiter.middleware');

/**
 * @route   POST /api/v1/tickets
 * @desc    Create new ticket
 * @access  Receptionist, Admin
 */
router.post(
  '/',
  authenticate,
  requireRole(['receptionist', 'admin', 'super_admin']),
  ticketCreationLimiter,
  validateBody(ticketSchemas.create),
  ticketController.createTicket
);

/**
 * @route   GET /api/v1/tickets/:id
 * @desc    Get ticket by ID
 * @access  Authenticated
 */
router.get(
  '/:id',
  authenticate,
  validateParams(querySchemas.idParam),
  ticketController.getTicketById
);

/**
 * @route   GET /api/v1/tickets/number/:ticketNumber
 * @desc    Get ticket by number
 * @access  Authenticated
 */
router.get(
  '/number/:ticketNumber',
  authenticate,
  ticketController.getTicketByNumber
);

/**
 * @route   GET /api/v1/tickets/clinic/:clinicId/queue
 * @desc    Get clinic queue
 * @access  Authenticated
 */
router.get(
  '/clinic/:clinicId/queue',
  authenticate,
  validateParams(querySchemas.idParam),
  ticketController.getClinicQueue
);

/**
 * @route   POST /api/v1/tickets/clinic/:clinicId/call-next
 * @desc    Call next patient in queue
 * @access  Doctor
 */
router.post(
  '/clinic/:clinicId/call-next',
  authenticate,
  requireDoctor,
  validateParams(querySchemas.idParam),
  ticketController.callNextPatient
);

/**
 * @route   PUT /api/v1/tickets/:id/start-serving
 * @desc    Start serving patient
 * @access  Doctor
 */
router.put(
  '/:id/start-serving',
  authenticate,
  requireDoctor,
  validateParams(querySchemas.idParam),
  ticketController.startServing
);

/**
 * @route   PUT /api/v1/tickets/:id/complete
 * @desc    Complete ticket
 * @access  Doctor
 */
router.put(
  '/:id/complete',
  authenticate,
  requireDoctor,
  validateParams(querySchemas.idParam),
  validateBody(ticketSchemas.complete),
  ticketController.completeTicket
);

/**
 * @route   PUT /api/v1/tickets/:id/no-show
 * @desc    Mark as no show
 * @access  Doctor
 */
router.put(
  '/:id/no-show',
  authenticate,
  requireDoctor,
  validateParams(querySchemas.idParam),
  ticketController.markNoShow
);

/**
 * @route   PUT /api/v1/tickets/:id/cancel
 * @desc    Cancel ticket
 * @access  Receptionist, Admin
 */
router.put(
  '/:id/cancel',
  authenticate,
  requireRole(['receptionist', 'admin', 'super_admin']),
  validateParams(querySchemas.idParam),
  ticketController.cancelTicket
);

/**
 * @route   GET /api/v1/tickets/today
 * @desc    Get today's tickets
 * @access  Authenticated
 */
router.get(
  '/reports/today',
  authenticate,
  ticketController.getTodayTickets
);

/**
 * @route   GET /api/v1/tickets/reports/date-range
 * @desc    Get tickets by date range
 * @access  Admin, Doctor
 */
router.get(
  '/reports/date-range',
  authenticate,
  requireDoctor,
  ticketController.getTicketsByDateRange
);

module.exports = router;
