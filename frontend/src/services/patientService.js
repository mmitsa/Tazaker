import api from './api';

const patientService = {
  /**
   * Get all patients
   */
  getAllPatients: async (params) => {
    return await api.get('/patients', { params });
  },

  /**
   * Search patients
   */
  searchPatients: async (query) => {
    return await api.get('/patients/search', {
      params: { query },
    });
  },

  /**
   * Get patient by ID
   */
  getPatientById: async (id) => {
    return await api.get(`/patients/${id}`);
  },

  /**
   * Create new patient
   */
  createPatient: async (patientData) => {
    return await api.post('/patients', patientData);
  },

  /**
   * Update patient
   */
  updatePatient: async (id, patientData) => {
    return await api.put(`/patients/${id}`, patientData);
  },
};

export default patientService;
