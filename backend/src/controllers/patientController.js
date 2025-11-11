const Patient = require('../models/Patient');
const { success, error, created, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all patients (with pagination)
 */
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await Patient.getAll(parseInt(page), parseInt(limit));

    return success(res, result);
  } catch (err) {
    logger.error('Get all patients error:', err);
    return error(res, 'Failed to get patients', 500);
  }
};

/**
 * Get patient by ID
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);

    if (!patient) {
      return notFound(res, 'Patient not found');
    }

    return success(res, patient);
  } catch (err) {
    logger.error('Get patient error:', err);
    return error(res, 'Failed to get patient', 500);
  }
};

/**
 * Search patients
 */
const searchPatients = async (req, res) => {
  try {
    const { mrn, phone, national_id, name } = req.query;

    if (!mrn && !phone && !national_id && !name) {
      return error(res, 'At least one search parameter is required', 400);
    }

    const patients = await Patient.search({ mrn, phone, national_id, name });

    return success(res, { patients, count: patients.length });
  } catch (err) {
    logger.error('Search patients error:', err);
    return error(res, 'Failed to search patients', 500);
  }
};

/**
 * Create new patient
 */
const createPatient = async (req, res) => {
  try {
    const patientData = req.body;

    // Check for duplicates
    if (patientData.national_id) {
      const existing = await Patient.findByNationalId(patientData.national_id);
      if (existing) {
        return error(res, 'Patient with this national ID already exists', 409);
      }
    }

    if (patientData.medical_record_number) {
      const existing = await Patient.findByMRN(patientData.medical_record_number);
      if (existing) {
        return error(res, 'Patient with this MRN already exists', 409);
      }
    }

    // Generate MRN if not provided
    if (!patientData.medical_record_number) {
      const { query } = require('../config/database');
      const result = await query('SELECT MAX(patient_id) as max_id FROM patients');
      const maxId = result.rows[0].max_id || 0;
      patientData.medical_record_number = `MRN-${String(maxId + 1).padStart(6, '0')}`;
    }

    const patient = await Patient.create(patientData);

    logger.info('Patient created', {
      patientId: patient.patient_id,
      mrn: patient.medical_record_number,
    });

    return created(res, patient, 'Patient created successfully');
  } catch (err) {
    logger.error('Create patient error:', err);
    return error(res, 'Failed to create patient', 500);
  }
};

/**
 * Update patient
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return notFound(res, 'Patient not found');
    }

    const updatedPatient = await Patient.update(id, updateData);

    logger.info('Patient updated', { patientId: id });

    return success(res, updatedPatient, 'Patient updated successfully');
  } catch (err) {
    logger.error('Update patient error:', err);
    return error(res, 'Failed to update patient', 500);
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  searchPatients,
  createPatient,
  updatePatient,
};
