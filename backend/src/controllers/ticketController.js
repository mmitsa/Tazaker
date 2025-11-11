const Ticket = require('../models/Ticket');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const { query } = require('../config/database');
const { success, error, created, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { sendSMS, messageTemplates, formatPhoneNumber } = require('../config/sms');
const { emitTicketCreated, emitPatientCalled, emitServiceCompleted, emitQueueUpdate, emitTicketStatusChanged } = require('../websocket/socketEvents');

/**
 * Create new ticket
 */
const createTicket = async (req, res) => {
  try {
    const { clinic_id, patient_id, priority = 0, notes } = req.body;
    const issuedBy = req.user.userId;

    // Validate clinic exists
    const clinic = await Clinic.findById(clinic_id);
    if (!clinic) {
      return notFound(res, 'Clinic not found');
    }

    // Validate patient exists
    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return notFound(res, 'Patient not found');
    }

    // Generate ticket number
    const ticketCountResult = await query(
      `SELECT COUNT(*) FROM tickets WHERE clinic_id = $1 AND DATE(issued_at) = CURRENT_DATE`,
      [clinic_id]
    );
    const ticketCount = parseInt(ticketCountResult.rows[0].count);
    const ticketNumber = `${clinic.clinic_code}-${String(ticketCount + 1).padStart(3, '0')}`;

    // Calculate queue position
    const queuePosition = await Ticket.getWaitingCount(clinic_id) + 1;

    // Calculate estimated time
    const estimatedTime = queuePosition * clinic.average_time_per_patient;

    // Create ticket
    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      clinic_id,
      patient_id,
      issued_by: issuedBy,
      priority,
      queue_position: queuePosition,
      estimated_time: estimatedTime,
      notes,
    });

    // Send SMS notification
    try {
      const phone = formatPhoneNumber(patient.phone);
      const message = messageTemplates.ticketIssued(
        ticketNumber,
        clinic.clinic_name_ar,
        queuePosition,
        estimatedTime
      );

      const smsResult = await sendSMS(phone, message);

      // Log SMS result
      await query(
        `INSERT INTO sms_notifications (ticket_id, phone, message, notification_type, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          ticket.ticket_id,
          patient.phone,
          message,
          'issued',
          smsResult.success ? 'sent' : 'failed',
          smsResult.success ? new Date() : null,
        ]
      );
    } catch (smsError) {
      logger.error('SMS sending error:', smsError);
      // Don't fail the ticket creation if SMS fails
    }

    logger.info('Ticket created', {
      ticketId: ticket.ticket_id,
      ticketNumber,
      clinicId: clinic_id,
      patientId: patient_id,
    });

    // Emit WebSocket event for real-time updates
    emitTicketCreated({
      ticket_id: ticket.ticket_id,
      ticket_number: ticketNumber,
      clinic_id,
      patient_name: patient.full_name,
      queue_position: queuePosition,
      estimated_time: estimatedTime,
      priority,
      issued_at: ticket.issued_at,
    });

    // Emit queue update
    emitQueueUpdate(clinic_id, {
      waiting_count: queuePosition,
      estimated_time: estimatedTime,
    });

    return created(res, {
      ticket_id: ticket.ticket_id,
      ticket_number: ticketNumber,
      patient_name: patient.full_name,
      clinic_name: clinic.clinic_name_ar,
      queue_position: queuePosition,
      estimated_time: estimatedTime,
      priority,
      issued_at: ticket.issued_at,
    }, 'Ticket created successfully');
  } catch (err) {
    logger.error('Create ticket error:', err);
    return error(res, 'Failed to create ticket', 500);
  }
};

/**
 * Get ticket by ID
 */
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return notFound(res, 'Ticket not found');
    }

    return success(res, ticket);
  } catch (err) {
    logger.error('Get ticket error:', err);
    return error(res, 'Failed to get ticket', 500);
  }
};

/**
 * Get ticket by number
 */
const getTicketByNumber = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findByNumber(ticketNumber);

    if (!ticket) {
      return notFound(res, 'Ticket not found');
    }

    return success(res, ticket);
  } catch (err) {
    logger.error('Get ticket by number error:', err);
    return error(res, 'Failed to get ticket', 500);
  }
};

/**
 * Get clinic queue
 */
const getClinicQueue = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { status = 'waiting' } = req.query;

    // Validate clinic
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return notFound(res, 'Clinic not found');
    }

    // Get queue
    const queue = await Ticket.getClinicQueue(clinicId, status);

    // Get current serving
    const currentServing = await Ticket.getCurrentServing(clinicId);

    // Get waiting count
    const waitingCount = await Ticket.getWaitingCount(clinicId);

    return success(res, {
      clinic: {
        clinic_id: clinic.clinic_id,
        clinic_name_ar: clinic.clinic_name_ar,
        clinic_name_en: clinic.clinic_name_en,
      },
      current_serving: currentServing,
      queue,
      waiting_count: waitingCount,
    });
  } catch (err) {
    logger.error('Get clinic queue error:', err);
    return error(res, 'Failed to get clinic queue', 500);
  }
};

/**
 * Call next patient (for doctors)
 */
const callNextPatient = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Get doctor info
    const doctor = await Doctor.findByUserId(req.user.userId);
    if (!doctor) {
      return error(res, 'Doctor profile not found', 404);
    }

    // Verify doctor is assigned to this clinic
    if (doctor.clinic_id !== parseInt(clinicId)) {
      return error(res, 'You are not assigned to this clinic', 403);
    }

    // Get next ticket in queue
    const nextTicket = await Ticket.getNextInQueue(clinicId);

    if (!nextTicket) {
      return success(res, null, 'No patients in queue');
    }

    // Update ticket status to 'called'
    const updatedTicket = await Ticket.updateStatus(
      nextTicket.ticket_id,
      'called',
      {
        doctor_id: doctor.doctor_id,
        called_at: new Date(),
      }
    );

    // Update doctor status to 'busy'
    await Doctor.updateStatus(doctor.doctor_id, 'busy');

    // Send SMS to patient
    try {
      const clinic = await Clinic.findById(clinicId);
      const phone = formatPhoneNumber(nextTicket.patient_phone);
      const message = messageTemplates.ticketCalled(
        nextTicket.ticket_number,
        clinic.clinic_name_ar
      );

      const smsResult = await sendSMS(phone, message);

      await query(
        `INSERT INTO sms_notifications (ticket_id, phone, message, notification_type, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          nextTicket.ticket_id,
          nextTicket.patient_phone,
          message,
          'called',
          smsResult.success ? 'sent' : 'failed',
          smsResult.success ? new Date() : null,
        ]
      );
    } catch (smsError) {
      logger.error('SMS sending error:', smsError);
    }

    logger.info('Patient called', {
      ticketId: nextTicket.ticket_id,
      ticketNumber: nextTicket.ticket_number,
      doctorId: doctor.doctor_id,
    });

    // Emit WebSocket event for real-time updates
    const clinic = await Clinic.findById(clinicId);
    emitPatientCalled({
      ticket_id: updatedTicket.ticket_id,
      ticket_number: updatedTicket.ticket_number,
      clinic_id: clinicId,
      patient_name: nextTicket.patient_name,
      doctor_id: doctor.doctor_id,
      called_at: updatedTicket.called_at,
    }, clinic.clinic_name_ar);

    // Update queue
    const waitingCount = await Ticket.getWaitingCount(clinicId);
    emitQueueUpdate(clinicId, {
      waiting_count: waitingCount,
      current_ticket: updatedTicket.ticket_number,
    });

    return success(res, {
      ticket_id: updatedTicket.ticket_id,
      ticket_number: updatedTicket.ticket_number,
      patient_name: nextTicket.patient_name,
      patient_phone: nextTicket.patient_phone,
      called_at: updatedTicket.called_at,
    }, 'Patient called successfully');
  } catch (err) {
    logger.error('Call next patient error:', err);
    return error(res, 'Failed to call next patient', 500);
  }
};

/**
 * Start serving patient
 */
const startServing = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return notFound(res, 'Ticket not found');
    }

    if (ticket.status !== 'called') {
      return error(res, 'Ticket must be in called state', 400);
    }

    const updatedTicket = await Ticket.updateStatus(id, 'serving', {
      serving_started_at: new Date(),
    });

    logger.info('Started serving patient', { ticketId: id });

    // Emit WebSocket event
    emitTicketStatusChanged({
      ticket_id: updatedTicket.ticket_id,
      ticket_number: updatedTicket.ticket_number,
      clinic_id: updatedTicket.clinic_id,
      status: 'serving',
      updated_at: updatedTicket.serving_started_at,
    });

    return success(res, updatedTicket, 'Started serving patient');
  } catch (err) {
    logger.error('Start serving error:', err);
    return error(res, 'Failed to start serving', 500);
  }
};

/**
 * Complete ticket
 */
const completeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return notFound(res, 'Ticket not found');
    }

    if (!['called', 'serving'].includes(ticket.status)) {
      return error(res, 'Ticket must be called or serving', 400);
    }

    // Calculate actual service time
    const servingStarted = ticket.serving_started_at || ticket.called_at;
    const actualServiceTime = servingStarted
      ? Math.round((new Date() - new Date(servingStarted)) / 60000)
      : null;

    const updatedTicket = await Ticket.updateStatus(id, 'completed', {
      completed_at: new Date(),
      actual_service_time: actualServiceTime,
      notes,
    });

    // Update doctor status back to online
    if (ticket.doctor_id) {
      await Doctor.updateStatus(ticket.doctor_id, 'online');
    }

    logger.info('Ticket completed', {
      ticketId: id,
      actualServiceTime,
    });

    // Emit WebSocket events
    emitServiceCompleted({
      ticket_id: updatedTicket.ticket_id,
      ticket_number: updatedTicket.ticket_number,
      clinic_id: updatedTicket.clinic_id,
      doctor_id: updatedTicket.doctor_id,
      actual_service_time: actualServiceTime,
      completed_at: updatedTicket.completed_at,
    });

    // Update queue
    const waitingCount = await Ticket.getWaitingCount(ticket.clinic_id);
    emitQueueUpdate(ticket.clinic_id, {
      waiting_count: waitingCount,
    });

    return success(res, updatedTicket, 'Ticket completed successfully');
  } catch (err) {
    logger.error('Complete ticket error:', err);
    return error(res, 'Failed to complete ticket', 500);
  }
};

/**
 * Mark as no show
 */
const markNoShow = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return notFound(res, 'Ticket not found');
    }

    const updatedTicket = await Ticket.updateStatus(id, 'no_show');

    // Update doctor status back to online
    if (ticket.doctor_id) {
      await Doctor.updateStatus(ticket.doctor_id, 'online');
    }

    logger.info('Ticket marked as no show', { ticketId: id });

    // Emit WebSocket events
    emitTicketStatusChanged({
      ticket_id: updatedTicket.ticket_id,
      ticket_number: updatedTicket.ticket_number,
      clinic_id: updatedTicket.clinic_id,
      status: 'no_show',
      updated_at: new Date(),
    });

    // Update queue
    const waitingCount = await Ticket.getWaitingCount(ticket.clinic_id);
    emitQueueUpdate(ticket.clinic_id, {
      waiting_count: waitingCount,
    });

    return success(res, updatedTicket, 'Marked as no show');
  } catch (err) {
    logger.error('Mark no show error:', err);
    return error(res, 'Failed to mark as no show', 500);
  }
};

/**
 * Cancel ticket
 */
const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return notFound(res, 'Ticket not found');
    }

    if (ticket.status === 'completed') {
      return error(res, 'Cannot cancel completed ticket', 400);
    }

    const updatedTicket = await Ticket.updateStatus(id, 'cancelled', { notes });

    logger.info('Ticket cancelled', { ticketId: id });

    // Emit WebSocket events
    emitTicketStatusChanged({
      ticket_id: updatedTicket.ticket_id,
      ticket_number: updatedTicket.ticket_number,
      clinic_id: updatedTicket.clinic_id,
      status: 'cancelled',
      updated_at: new Date(),
    });

    // Update queue if ticket was in waiting state
    if (ticket.status === 'waiting') {
      const waitingCount = await Ticket.getWaitingCount(ticket.clinic_id);
      emitQueueUpdate(ticket.clinic_id, {
        waiting_count: waitingCount,
      });
    }

    return success(res, updatedTicket, 'Ticket cancelled');
  } catch (err) {
    logger.error('Cancel ticket error:', err);
    return error(res, 'Failed to cancel ticket', 500);
  }
};

/**
 * Get today's tickets
 */
const getTodayTickets = async (req, res) => {
  try {
    const { clinicId, doctorId } = req.query;

    const tickets = await Ticket.getTodayTickets(
      clinicId ? parseInt(clinicId) : null,
      doctorId ? parseInt(doctorId) : null
    );

    return success(res, { tickets, count: tickets.length });
  } catch (err) {
    logger.error('Get today tickets error:', err);
    return error(res, 'Failed to get tickets', 500);
  }
};

/**
 * Get tickets by date range
 */
const getTicketsByDateRange = async (req, res) => {
  try {
    const { start_date, end_date, clinic_id, doctor_id, status } = req.query;

    if (!start_date || !end_date) {
      return error(res, 'start_date and end_date are required', 400);
    }

    const tickets = await Ticket.getTicketsByDateRange(start_date, end_date, {
      clinic_id: clinic_id ? parseInt(clinic_id) : null,
      doctor_id: doctor_id ? parseInt(doctor_id) : null,
      status,
    });

    return success(res, { tickets, count: tickets.length });
  } catch (err) {
    logger.error('Get tickets by date range error:', err);
    return error(res, 'Failed to get tickets', 500);
  }
};

module.exports = {
  createTicket,
  getTicketById,
  getTicketByNumber,
  getClinicQueue,
  callNextPatient,
  startServing,
  completeTicket,
  markNoShow,
  cancelTicket,
  getTodayTickets,
  getTicketsByDateRange,
};
