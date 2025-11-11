const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { success, error, created, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all doctors
 */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.getAll();

    return success(res, { doctors, count: doctors.length });
  } catch (err) {
    logger.error('Get all doctors error:', err);
    return error(res, 'Failed to get doctors', 500);
  }
};

/**
 * Get doctor by ID
 */
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return notFound(res, 'Doctor not found');
    }

    return success(res, doctor);
  } catch (err) {
    logger.error('Get doctor error:', err);
    return error(res, 'Failed to get doctor', 500);
  }
};

/**
 * Get doctors by clinic
 */
const getDoctorsByClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const doctors = await Doctor.findByClinicId(clinicId);

    return success(res, { doctors, count: doctors.length });
  } catch (err) {
    logger.error('Get doctors by clinic error:', err);
    return error(res, 'Failed to get doctors', 500);
  }
};

/**
 * Get available doctors
 */
const getAvailableDoctors = async (req, res) => {
  try {
    const { clinicId } = req.query;

    const doctors = await Doctor.getAvailableDoctors(
      clinicId ? parseInt(clinicId) : null
    );

    return success(res, { doctors, count: doctors.length });
  } catch (err) {
    logger.error('Get available doctors error:', err);
    return error(res, 'Failed to get available doctors', 500);
  }
};

/**
 * Get current doctor profile
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const doctor = await Doctor.findByUserId(userId);

    if (!doctor) {
      return notFound(res, 'Doctor profile not found');
    }

    return success(res, doctor);
  } catch (err) {
    logger.error('Get my profile error:', err);
    return error(res, 'Failed to get profile', 500);
  }
};

/**
 * Update doctor status
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.userId;

    const doctor = await Doctor.findByUserId(userId);

    if (!doctor) {
      return notFound(res, 'Doctor profile not found');
    }

    const updatedDoctor = await Doctor.updateStatus(doctor.doctor_id, status);

    logger.info('Doctor status updated', {
      doctorId: doctor.doctor_id,
      status,
    });

    return success(res, updatedDoctor, 'Status updated successfully');
  } catch (err) {
    logger.error('Update doctor status error:', err);
    return error(res, 'Failed to update status', 500);
  }
};

/**
 * Set availability
 */
const setAvailability = async (req, res) => {
  try {
    const { is_available } = req.body;
    const userId = req.user.userId;

    const doctor = await Doctor.findByUserId(userId);

    if (!doctor) {
      return notFound(res, 'Doctor profile not found');
    }

    const updatedDoctor = await Doctor.setAvailability(
      doctor.doctor_id,
      is_available
    );

    logger.info('Doctor availability updated', {
      doctorId: doctor.doctor_id,
      isAvailable: is_available,
    });

    return success(res, updatedDoctor, 'Availability updated successfully');
  } catch (err) {
    logger.error('Set availability error:', err);
    return error(res, 'Failed to set availability', 500);
  }
};

/**
 * Create doctor profile (Admin only)
 */
const createDoctor = async (req, res) => {
  try {
    const doctorData = req.body;

    // Validate user exists and is doctor role
    const user = await User.findById(doctorData.user_id);
    if (!user) {
      return notFound(res, 'User not found');
    }

    if (user.role !== 'doctor') {
      return error(res, 'User must have doctor role', 400);
    }

    // Check if doctor profile already exists
    const existing = await Doctor.findByUserId(doctorData.user_id);
    if (existing) {
      return error(res, 'Doctor profile already exists for this user', 409);
    }

    const doctor = await Doctor.create(doctorData);

    logger.info('Doctor profile created', {
      doctorId: doctor.doctor_id,
      userId: doctorData.user_id,
    });

    return created(res, doctor, 'Doctor profile created successfully');
  } catch (err) {
    logger.error('Create doctor error:', err);
    return error(res, 'Failed to create doctor profile', 500);
  }
};

/**
 * Update doctor profile (Admin only)
 */
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return notFound(res, 'Doctor not found');
    }

    const updatedDoctor = await Doctor.update(id, updateData);

    logger.info('Doctor profile updated', { doctorId: id });

    return success(res, updatedDoctor, 'Doctor profile updated successfully');
  } catch (err) {
    logger.error('Update doctor error:', err);
    return error(res, 'Failed to update doctor profile', 500);
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorsByClinic,
  getAvailableDoctors,
  getMyProfile,
  updateStatus,
  setAvailability,
  createDoctor,
  updateDoctor,
};
