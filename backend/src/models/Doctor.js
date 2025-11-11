const { query } = require('../config/database');
const logger = require('../utils/logger');

class Doctor {
  static async findById(doctorId) {
    try {
      const result = await query(
        `SELECT d.*, u.full_name, u.email, u.phone, c.clinic_name_ar, c.clinic_name_en
         FROM doctors d
         JOIN users u ON d.user_id = u.user_id
         LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
         WHERE d.doctor_id = $1`,
        [doctorId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding doctor by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const result = await query(
        `SELECT d.*, c.clinic_name_ar, c.clinic_name_en
         FROM doctors d
         LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
         WHERE d.user_id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding doctor by user ID:', error);
      throw error;
    }
  }

  static async findByClinicId(clinicId) {
    try {
      const result = await query(
        `SELECT d.*, u.full_name, u.email
         FROM doctors d
         JOIN users u ON d.user_id = u.user_id
         WHERE d.clinic_id = $1 AND u.is_active = true`,
        [clinicId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error finding doctors by clinic:', error);
      throw error;
    }
  }

  static async create(doctorData) {
    try {
      const {
        user_id,
        clinic_id,
        specialization,
        license_number,
      } = doctorData;

      const result = await query(
        `INSERT INTO doctors (user_id, clinic_id, specialization, license_number)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user_id, clinic_id, specialization, license_number]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating doctor:', error);
      throw error;
    }
  }

  static async update(doctorId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(doctorId);

      const result = await query(
        `UPDATE doctors SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE doctor_id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating doctor:', error);
      throw error;
    }
  }

  static async updateStatus(doctorId, status) {
    try {
      const result = await query(
        'UPDATE doctors SET current_status = $1, updated_at = CURRENT_TIMESTAMP WHERE doctor_id = $2 RETURNING *',
        [status, doctorId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating doctor status:', error);
      throw error;
    }
  }

  static async setAvailability(doctorId, isAvailable) {
    try {
      const status = isAvailable ? 'online' : 'offline';
      const result = await query(
        'UPDATE doctors SET is_available = $1, current_status = $2, updated_at = CURRENT_TIMESTAMP WHERE doctor_id = $3 RETURNING *',
        [isAvailable, status, doctorId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error setting doctor availability:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const result = await query(
        `SELECT d.*, u.full_name, u.email, u.phone, u.is_active,
                c.clinic_name_ar, c.clinic_name_en, c.clinic_code
         FROM doctors d
         JOIN users u ON d.user_id = u.user_id
         LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
         ORDER BY u.full_name`
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting all doctors:', error);
      throw error;
    }
  }

  static async getAvailableDoctors(clinicId = null) {
    try {
      const conditions = ['d.is_available = true', 'u.is_active = true'];
      const values = [];

      if (clinicId) {
        conditions.push('d.clinic_id = $1');
        values.push(clinicId);
      }

      const result = await query(
        `SELECT d.*, u.full_name, c.clinic_name_ar, c.clinic_name_en
         FROM doctors d
         JOIN users u ON d.user_id = u.user_id
         LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY u.full_name`,
        values
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting available doctors:', error);
      throw error;
    }
  }
}

module.exports = Doctor;
