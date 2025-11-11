const { query } = require('../config/database');
const logger = require('../utils/logger');

class Ticket {
  static async findById(ticketId) {
    try {
      const result = await query(
        `SELECT t.*,
                p.full_name as patient_name, p.phone as patient_phone,
                c.clinic_name_ar, c.clinic_name_en, c.clinic_code,
                d.doctor_id, u.full_name as doctor_name
         FROM tickets t
         JOIN patients p ON t.patient_id = p.patient_id
         JOIN clinics c ON t.clinic_id = c.clinic_id
         LEFT JOIN doctors d ON t.doctor_id = d.doctor_id
         LEFT JOIN users u ON d.user_id = u.user_id
         WHERE t.ticket_id = $1`,
        [ticketId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding ticket by ID:', error);
      throw error;
    }
  }

  static async findByNumber(ticketNumber) {
    try {
      const result = await query(
        `SELECT t.*,
                p.full_name as patient_name, p.phone as patient_phone,
                c.clinic_name_ar, c.clinic_name_en
         FROM tickets t
         JOIN patients p ON t.patient_id = p.patient_id
         JOIN clinics c ON t.clinic_id = c.clinic_id
         WHERE t.ticket_number = $1`,
        [ticketNumber]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding ticket by number:', error);
      throw error;
    }
  }

  static async create(ticketData) {
    try {
      const {
        ticket_number,
        clinic_id,
        patient_id,
        issued_by,
        priority,
        queue_position,
        estimated_time,
        notes,
      } = ticketData;

      const result = await query(
        `INSERT INTO tickets (ticket_number, clinic_id, patient_id, issued_by, priority, queue_position, estimated_time, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [ticket_number, clinic_id, patient_id, issued_by, priority, queue_position, estimated_time, notes]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating ticket:', error);
      throw error;
    }
  }

  static async updateStatus(ticketId, status, additionalData = {}) {
    try {
      const fields = ['status = $1'];
      const values = [status, ticketId];
      let paramIndex = 2;

      // Add timestamp based on status
      if (status === 'called' && !additionalData.called_at) {
        fields.push('called_at = CURRENT_TIMESTAMP');
      }
      if (status === 'serving' && !additionalData.serving_started_at) {
        fields.push('serving_started_at = CURRENT_TIMESTAMP');
      }
      if (status === 'completed' && !additionalData.completed_at) {
        fields.push('completed_at = CURRENT_TIMESTAMP');
      }

      // Add additional fields
      for (const [key, value] of Object.entries(additionalData)) {
        if (value !== undefined) {
          paramIndex++;
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
      }

      const result = await query(
        `UPDATE tickets SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE ticket_id = $2
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating ticket status:', error);
      throw error;
    }
  }

  static async getClinicQueue(clinicId, status = 'waiting') {
    try {
      const result = await query(
        `SELECT t.*, p.full_name as patient_name, p.phone as patient_phone
         FROM tickets t
         JOIN patients p ON t.patient_id = p.patient_id
         WHERE t.clinic_id = $1 AND t.status = $2
         AND DATE(t.issued_at) = CURRENT_DATE
         ORDER BY t.priority DESC, t.issued_at ASC`,
        [clinicId, status]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting clinic queue:', error);
      throw error;
    }
  }

  static async getNextInQueue(clinicId) {
    try {
      const result = await query(
        `SELECT t.*, p.full_name as patient_name, p.phone as patient_phone
         FROM tickets t
         JOIN patients p ON t.patient_id = p.patient_id
         WHERE t.clinic_id = $1 AND t.status = 'waiting'
         AND DATE(t.issued_at) = CURRENT_DATE
         ORDER BY t.priority DESC, t.issued_at ASC
         LIMIT 1`,
        [clinicId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting next in queue:', error);
      throw error;
    }
  }

  static async getCurrentServing(clinicId) {
    try {
      const result = await query(
        `SELECT t.*, p.full_name as patient_name, p.phone as patient_phone
         FROM tickets t
         JOIN patients p ON t.patient_id = p.patient_id
         WHERE t.clinic_id = $1 AND t.status IN ('called', 'serving')
         AND DATE(t.issued_at) = CURRENT_DATE
         ORDER BY t.called_at DESC
         LIMIT 1`,
        [clinicId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting current serving ticket:', error);
      throw error;
    }
  }

  static async getQueuePosition(clinicId, ticketId) {
    try {
      const result = await query(
        `SELECT COUNT(*) + 1 as position
         FROM tickets t1
         JOIN tickets t2 ON t1.clinic_id = t2.clinic_id
         WHERE t1.ticket_id = $1
         AND t2.status = 'waiting'
         AND DATE(t2.issued_at) = CURRENT_DATE
         AND (t2.priority > t1.priority OR
              (t2.priority = t1.priority AND t2.issued_at < t1.issued_at))`,
        [ticketId]
      );
      return parseInt(result.rows[0]?.position || 0);
    } catch (error) {
      logger.error('Error getting queue position:', error);
      throw error;
    }
  }

  static async getWaitingCount(clinicId) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count
         FROM tickets
         WHERE clinic_id = $1 AND status = 'waiting'
         AND DATE(issued_at) = CURRENT_DATE`,
        [clinicId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting waiting count:', error);
      throw error;
    }
  }

  static async getTodayTickets(clinicId = null, doctorId = null) {
    try {
      const conditions = ['DATE(issued_at) = CURRENT_DATE'];
      const values = [];
      let paramIndex = 1;

      if (clinicId) {
        conditions.push(`clinic_id = $${paramIndex}`);
        values.push(clinicId);
        paramIndex++;
      }

      if (doctorId) {
        conditions.push(`doctor_id = $${paramIndex}`);
        values.push(doctorId);
        paramIndex++;
      }

      const result = await query(
        `SELECT t.*, p.full_name as patient_name, c.clinic_name_ar
         FROM tickets t
         JOIN patients p ON t.patient_id = p.patient_id
         JOIN clinics c ON t.clinic_id = c.clinic_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY t.issued_at DESC`,
        values
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting today tickets:', error);
      throw error;
    }
  }

  static async getTicketsByDateRange(startDate, endDate, filters = {}) {
    try {
      const conditions = ['DATE(issued_at) >= $1', 'DATE(issued_at) <= $2'];
      const values = [startDate, endDate];
      let paramIndex = 3;

      if (filters.clinic_id) {
        conditions.push(`clinic_id = $${paramIndex}`);
        values.push(filters.clinic_id);
        paramIndex++;
      }

      if (filters.doctor_id) {
        conditions.push(`doctor_id = $${paramIndex}`);
        values.push(filters.doctor_id);
        paramIndex++;
      }

      if (filters.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }

      const result = await query(
        `SELECT t.*, p.full_name as patient_name, c.clinic_name_ar
         FROM tickets t
         JOIN patients p ON t.patient_id = p.patient_id
         JOIN clinics c ON t.clinic_id = c.clinic_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY t.issued_at DESC`,
        values
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting tickets by date range:', error);
      throw error;
    }
  }

  static async delete(ticketId) {
    try {
      const result = await query(
        'DELETE FROM tickets WHERE ticket_id = $1 RETURNING ticket_id',
        [ticketId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error deleting ticket:', error);
      throw error;
    }
  }
}

module.exports = Ticket;
