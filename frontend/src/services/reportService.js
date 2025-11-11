import api from './api';

const reportService = {
  /**
   * Get daily statistics
   */
  getDailyStatistics: async (date) => {
    return await api.get('/reports/daily-statistics', {
      params: { date },
    });
  },

  /**
   * Get clinic performance report
   */
  getClinicPerformance: async (params) => {
    return await api.get('/reports/clinic-performance', { params });
  },

  /**
   * Get doctor performance report
   */
  getDoctorPerformance: async (params) => {
    return await api.get('/reports/doctor-performance', { params });
  },

  /**
   * Get wait time analytics
   */
  getWaitTimeAnalytics: async (params) => {
    return await api.get('/reports/wait-time-analytics', { params });
  },

  /**
   * Get queue analytics
   */
  getQueueAnalytics: async (clinicId) => {
    return await api.get('/reports/queue-analytics', {
      params: { clinic_id: clinicId },
    });
  },

  /**
   * Get SMS statistics
   */
  getSMSStatistics: async (params) => {
    return await api.get('/reports/sms-statistics', { params });
  },

  /**
   * Get patient visit history
   */
  getPatientVisitHistory: async (patientId, params) => {
    return await api.get(`/reports/patient/${patientId}/visits`, { params });
  },

  /**
   * Get system overview
   */
  getSystemOverview: async () => {
    return await api.get('/reports/system-overview');
  },
};

export default reportService;
