const { query } = require('../config/database');
const logger = require('../utils/logger');

class Clinic {
  static async findById(clinicId) {
    try {
      const result = await query(
        'SELECT * FROM clinics WHERE clinic_id = $1',
        [clinicId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding clinic by ID:', error);
      throw error;
    }
  }

  static async findByCode(clinicCode) {
    try {
      const result = await query(
        'SELECT * FROM clinics WHERE clinic_code = $1',
        [clinicCode]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding clinic by code:', error);
      throw error;
    }
  }

  static async create(clinicData) {
    try {
      const {
        clinic_name_ar,
        clinic_name_en,
        clinic_code,
        department,
        average_time_per_patient,
        working_hours_start,
        working_hours_end,
      } = clinicData;

      const result = await query(
        `INSERT INTO clinics (clinic_name_ar, clinic_name_en, clinic_code, department, average_time_per_patient, working_hours_start, working_hours_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [clinic_name_ar, clinic_name_en, clinic_code, department, average_time_per_patient, working_hours_start, working_hours_end]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating clinic:', error);
      throw error;
    }
  }

  static async update(clinicId, updateData) {
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

      values.push(clinicId);

      const result = await query(
        `UPDATE clinics SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE clinic_id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating clinic:', error);
      throw error;
    }
  }

  static async delete(clinicId) {
    try {
      const result = await query(
        'DELETE FROM clinics WHERE clinic_id = $1 RETURNING clinic_id',
        [clinicId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error deleting clinic:', error);
      throw error;
    }
  }

  static async getAll(filters = {}) {
    try {
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }

      if (filters.department) {
        conditions.push(`department = $${paramIndex}`);
        values.push(filters.department);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await query(
        `SELECT * FROM clinics ${whereClause} ORDER BY clinic_name_en`,
        values
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting all clinics:', error);
      throw error;
    }
  }

  static async getQueueStatus() {
    try {
      const result = await query('SELECT * FROM v_clinic_queue_status ORDER BY clinic_id');
      return result.rows;
    } catch (error) {
      logger.error('Error getting clinic queue status:', error);
      throw error;
    }
  }
}

module.exports = Clinic;
