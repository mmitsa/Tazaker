import api from './api';

const doctorService = {
  /**
   * Get all doctors
   */
  getAllDoctors: async (params) => {
    return await api.get('/doctors', { params });
  },

  /**
   * Get doctor by ID
   */
  getDoctorById: async (id) => {
    return await api.get(`/doctors/${id}`);
  },

  /**
   * Get doctor profile (current logged-in doctor)
   */
  getDoctorProfile: async () => {
    return await api.get('/doctors/profile');
  },

  /**
   * Get doctors by clinic
   */
  getDoctorsByClinic: async (clinicId) => {
    return await api.get(`/doctors/clinic/${clinicId}`);
  },

  /**
   * Get online doctors
   */
  getOnlineDoctors: async () => {
    return await api.get('/doctors/online');
  },

  /**
   * Update doctor status
   */
  updateDoctorStatus: async (status) => {
    return await api.patch('/doctors/status', { status });
  },

  /**
   * Update doctor availability
   */
  updateDoctorAvailability: async (isAvailable) => {
    return await api.patch('/doctors/availability', { is_available: isAvailable });
  },

  /**
   * Create new doctor
   */
  createDoctor: async (doctorData) => {
    return await api.post('/doctors', doctorData);
  },

  /**
   * Update doctor
   */
  updateDoctor: async (id, doctorData) => {
    return await api.put(`/doctors/${id}`, doctorData);
  },
};

export default doctorService;
