const { emitToClinic, emitToDisplays, emitToRole, broadcast } = require('./socketHandler');
const logger = require('../utils/logger');

/**
 * Socket event emitters for real-time updates
 */

/**
 * Emit when new ticket is created
 */
const emitTicketCreated = (ticket) => {
  try {
    const data = {
      ticket_id: ticket.ticket_id,
      ticket_number: ticket.ticket_number,
      clinic_id: ticket.clinic_id,
      patient_name: ticket.patient_name,
      queue_position: ticket.queue_position,
      estimated_time: ticket.estimated_time,
      priority: ticket.priority,
      issued_at: ticket.issued_at,
    };

    // Emit to clinic subscribers
    emitToClinic(ticket.clinic_id, 'ticket:created', data);

    // Emit to display screens
    emitToDisplays('ticket:created', data);

    // Emit to receptionists and admins
    emitToRole('receptionist', 'ticket:created', data);
    emitToRole('admin', 'ticket:created', data);

    logger.info('Ticket created event emitted', {
      ticketId: ticket.ticket_id,
      clinicId: ticket.clinic_id,
    });
  } catch (error) {
    logger.error('Error emitting ticket created:', error);
  }
};

/**
 * Emit when patient is called
 */
const emitPatientCalled = (ticket, clinicName) => {
  try {
    const data = {
      ticket_id: ticket.ticket_id,
      ticket_number: ticket.ticket_number,
      clinic_id: ticket.clinic_id,
      clinic_name: clinicName,
      patient_name: ticket.patient_name,
      doctor_id: ticket.doctor_id,
      called_at: ticket.called_at,
    };

    // Emit to clinic subscribers
    emitToClinic(ticket.clinic_id, 'patient:called', data);

    // Emit to display screens (important!)
    emitToDisplays('patient:called', data);

    logger.info('Patient called event emitted', {
      ticketId: ticket.ticket_id,
      clinicId: ticket.clinic_id,
    });
  } catch (error) {
    logger.error('Error emitting patient called:', error);
  }
};

/**
 * Emit when service is completed
 */
const emitServiceCompleted = (ticket) => {
  try {
    const data = {
      ticket_id: ticket.ticket_id,
      ticket_number: ticket.ticket_number,
      clinic_id: ticket.clinic_id,
      doctor_id: ticket.doctor_id,
      actual_service_time: ticket.actual_service_time,
      completed_at: ticket.completed_at,
    };

    // Emit to clinic subscribers
    emitToClinic(ticket.clinic_id, 'service:completed', data);

    // Emit to display screens
    emitToDisplays('service:completed', data);

    logger.info('Service completed event emitted', {
      ticketId: ticket.ticket_id,
      clinicId: ticket.clinic_id,
    });
  } catch (error) {
    logger.error('Error emitting service completed:', error);
  }
};

/**
 * Emit when ticket status changes
 */
const emitTicketStatusChanged = (ticket) => {
  try {
    const data = {
      ticket_id: ticket.ticket_id,
      ticket_number: ticket.ticket_number,
      clinic_id: ticket.clinic_id,
      status: ticket.status,
      updated_at: ticket.updated_at,
    };

    // Emit to clinic subscribers
    emitToClinic(ticket.clinic_id, 'ticket:status_changed', data);

    // Emit to display screens
    emitToDisplays('ticket:status_changed', data);

    logger.debug('Ticket status changed event emitted', {
      ticketId: ticket.ticket_id,
      status: ticket.status,
    });
  } catch (error) {
    logger.error('Error emitting ticket status changed:', error);
  }
};

/**
 * Emit queue update
 */
const emitQueueUpdate = (clinicId, queueData) => {
  try {
    const data = {
      clinic_id: clinicId,
      waiting_count: queueData.waiting_count,
      current_ticket: queueData.current_ticket,
      next_ticket: queueData.next_ticket,
      estimated_time: queueData.estimated_time,
    };

    // Emit to clinic subscribers
    emitToClinic(clinicId, 'queue:updated', data);

    // Emit to display screens
    emitToDisplays('queue:updated', data);

    logger.debug('Queue update event emitted', { clinicId });
  } catch (error) {
    logger.error('Error emitting queue update:', error);
  }
};

/**
 * Emit doctor status change
 */
const emitDoctorStatusChanged = (doctor) => {
  try {
    const data = {
      doctor_id: doctor.doctor_id,
      clinic_id: doctor.clinic_id,
      current_status: doctor.current_status,
      is_available: doctor.is_available,
    };

    // Emit to clinic subscribers
    if (doctor.clinic_id) {
      emitToClinic(doctor.clinic_id, 'doctor:status_changed', data);
    }

    // Emit to display screens
    emitToDisplays('doctor:status_changed', data);

    // Emit to admins
    emitToRole('admin', 'doctor:status_changed', data);

    logger.info('Doctor status changed event emitted', {
      doctorId: doctor.doctor_id,
      status: doctor.current_status,
    });
  } catch (error) {
    logger.error('Error emitting doctor status changed:', error);
  }
};

/**
 * Emit clinic status change
 */
const emitClinicStatusChanged = (clinic) => {
  try {
    const data = {
      clinic_id: clinic.clinic_id,
      status: clinic.status,
      updated_at: clinic.updated_at,
    };

    // Emit to clinic subscribers
    emitToClinic(clinic.clinic_id, 'clinic:status_changed', data);

    // Emit to display screens
    emitToDisplays('clinic:status_changed', data);

    // Broadcast to all
    broadcast('clinic:status_changed', data);

    logger.info('Clinic status changed event emitted', {
      clinicId: clinic.clinic_id,
      status: clinic.status,
    });
  } catch (error) {
    logger.error('Error emitting clinic status changed:', error);
  }
};

/**
 * Emit display refresh (for manual refresh)
 */
const emitDisplayRefresh = () => {
  try {
    emitToDisplays('display:refresh', { timestamp: new Date().toISOString() });
    logger.debug('Display refresh event emitted');
  } catch (error) {
    logger.error('Error emitting display refresh:', error);
  }
};

module.exports = {
  emitTicketCreated,
  emitPatientCalled,
  emitServiceCompleted,
  emitTicketStatusChanged,
  emitQueueUpdate,
  emitDoctorStatusChanged,
  emitClinicStatusChanged,
  emitDisplayRefresh,
};
