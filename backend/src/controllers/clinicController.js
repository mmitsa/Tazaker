const Clinic = require('../models/Clinic');
const { success, error, created, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all clinics
 */
const getAllClinics = async (req, res) => {
  try {
    const { status, department } = req.query;

    const clinics = await Clinic.getAll({ status, department });

    return success(res, { clinics, count: clinics.length });
  } catch (err) {
    logger.error('Get all clinics error:', err);
    return error(res, 'Failed to get clinics', 500);
  }
};

/**
 * Get clinic by ID
 */
const getClinicById = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id);

    if (!clinic) {
      return notFound(res, 'Clinic not found');
    }

    return success(res, clinic);
  } catch (err) {
    logger.error('Get clinic error:', err);
    return error(res, 'Failed to get clinic', 500);
  }
};

/**
 * Get clinic queue status (for all clinics)
 */
const getQueueStatus = async (req, res) => {
  try {
    const queueStatus = await Clinic.getQueueStatus();

    return success(res, { clinics: queueStatus });
  } catch (err) {
    logger.error('Get queue status error:', err);
    return error(res, 'Failed to get queue status', 500);
  }
};

/**
 * Create new clinic
 */
const createClinic = async (req, res) => {
  try {
    const clinicData = req.body;

    // Check if clinic code already exists
    const existing = await Clinic.findByCode(clinicData.clinic_code);
    if (existing) {
      return error(res, 'Clinic code already exists', 409);
    }

    const clinic = await Clinic.create(clinicData);

    logger.info('Clinic created', {
      clinicId: clinic.clinic_id,
      clinicCode: clinic.clinic_code,
    });

    return created(res, clinic, 'Clinic created successfully');
  } catch (err) {
    logger.error('Create clinic error:', err);
    return error(res, 'Failed to create clinic', 500);
  }
};

/**
 * Update clinic
 */
const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return notFound(res, 'Clinic not found');
    }

    const updatedClinic = await Clinic.update(id, updateData);

    logger.info('Clinic updated', { clinicId: id });

    return success(res, updatedClinic, 'Clinic updated successfully');
  } catch (err) {
    logger.error('Update clinic error:', err);
    return error(res, 'Failed to update clinic', 500);
  }
};

/**
 * Delete clinic
 */
const deleteClinic = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return notFound(res, 'Clinic not found');
    }

    await Clinic.delete(id);

    logger.info('Clinic deleted', { clinicId: id });

    return success(res, null, 'Clinic deleted successfully');
  } catch (err) {
    logger.error('Delete clinic error:', err);
    return error(res, 'Failed to delete clinic', 500);
  }
};

module.exports = {
  getAllClinics,
  getClinicById,
  getQueueStatus,
  createClinic,
  updateClinic,
  deleteClinic,
};
