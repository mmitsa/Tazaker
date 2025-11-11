const { query } = require('../config/database');
const logger = require('../utils/logger');

class Patient {
  static async findById(patientId) {
    try {
      const result = await query(
        'SELECT * FROM patients WHERE patient_id = $1',
        [patientId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding patient by ID:', error);
      throw error;
    }
  }

  static async findByMRN(mrn) {
    try {
      const result = await query(
        'SELECT * FROM patients WHERE medical_record_number = $1',
        [mrn]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding patient by MRN:', error);
      throw error;
    }
  }

  static async findByNationalId(nationalId) {
    try {
      const result = await query(
        'SELECT * FROM patients WHERE national_id = $1',
        [nationalId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding patient by national ID:', error);
      throw error;
    }
  }

  static async findByPhone(phone) {
    try {
      const result = await query(
        'SELECT * FROM patients WHERE phone = $1',
        [phone]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding patient by phone:', error);
      throw error;
    }
  }

  static async create(patientData) {
    try {
      const {
        medical_record_number,
        full_name,
        phone,
        national_id,
        date_of_birth,
        gender,
        email,
      } = patientData;

      const result = await query(
        `INSERT INTO patients (medical_record_number, full_name, phone, national_id, date_of_birth, gender, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [medical_record_number, full_name, phone, national_id, date_of_birth, gender, email]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating patient:', error);
      throw error;
    }
  }

  static async update(patientId, updateData) {
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

      values.push(patientId);

      const result = await query(
        `UPDATE patients SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE patient_id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating patient:', error);
      throw error;
    }
  }

  static async search(searchParams) {
    try {
      const { mrn, phone, national_id, name } = searchParams;
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (mrn) {
        conditions.push(`medical_record_number ILIKE $${paramIndex}`);
        values.push(`%${mrn}%`);
        paramIndex++;
      }

      if (phone) {
        conditions.push(`phone LIKE $${paramIndex}`);
        values.push(`%${phone}%`);
        paramIndex++;
      }

      if (national_id) {
        conditions.push(`national_id = $${paramIndex}`);
        values.push(national_id);
        paramIndex++;
      }

      if (name) {
        conditions.push(`full_name ILIKE $${paramIndex}`);
        values.push(`%${name}%`);
        paramIndex++;
      }

      if (conditions.length === 0) {
        return [];
      }

      const result = await query(
        `SELECT * FROM patients WHERE ${conditions.join(' OR ')} LIMIT 20`,
        values
      );

      return result.rows;
    } catch (error) {
      logger.error('Error searching patients:', error);
      throw error;
    }
  }

  static async getAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const countResult = await query('SELECT COUNT(*) FROM patients');
      const total = parseInt(countResult.rows[0].count);

      const result = await query(
        'SELECT * FROM patients ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      return {
        patients: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Error getting all patients:', error);
      throw error;
    }
  }
}

module.exports = Patient;
