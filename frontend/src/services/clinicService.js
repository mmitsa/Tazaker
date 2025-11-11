import api from './api';

const clinicService = {
  /**
   * Get all clinics
   */
  getAllClinics: async (params) => {
    return await api.get('/clinics', { params });
  },

  /**
   * Get clinic by ID
   */
  getClinicById: async (id) => {
    return await api.get(`/clinics/${id}`);
  },

  /**
   * Create new clinic
   */
  createClinic: async (clinicData) => {
    return await api.post('/clinics', clinicData);
  },

  /**
   * Update clinic
   */
  updateClinic: async (id, clinicData) => {
    return await api.put(`/clinics/${id}`, clinicData);
  },

  /**
   * Update clinic status
   */
  updateClinicStatus: async (id, status) => {
    return await api.patch(`/clinics/${id}/status`, { status });
  },

  /**
   * Get active clinics
   */
  getActiveClinics: async () => {
    return await api.get('/clinics/active');
  },
};

export default clinicService;
