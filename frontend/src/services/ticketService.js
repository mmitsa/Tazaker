import api from './api';

const ticketService = {
  /**
   * Create new ticket
   */
  createTicket: async (ticketData) => {
    return await api.post('/tickets', ticketData);
  },

  /**
   * Get ticket by ID
   */
  getTicketById: async (id) => {
    return await api.get(`/tickets/${id}`);
  },

  /**
   * Get ticket by number
   */
  getTicketByNumber: async (ticketNumber) => {
    return await api.get(`/tickets/number/${ticketNumber}`);
  },

  /**
   * Get clinic queue
   */
  getClinicQueue: async (clinicId, status = 'waiting') => {
    return await api.get(`/tickets/clinic/${clinicId}/queue`, {
      params: { status },
    });
  },

  /**
   * Call next patient (doctor)
   */
  callNextPatient: async (clinicId) => {
    return await api.post(`/tickets/clinic/${clinicId}/call-next`);
  },

  /**
   * Start serving patient
   */
  startServing: async (ticketId) => {
    return await api.put(`/tickets/${ticketId}/start-serving`);
  },

  /**
   * Complete ticket
   */
  completeTicket: async (ticketId, data) => {
    return await api.put(`/tickets/${ticketId}/complete`, data);
  },

  /**
   * Mark ticket as no show
   */
  markNoShow: async (ticketId) => {
    return await api.put(`/tickets/${ticketId}/no-show`);
  },

  /**
   * Cancel ticket
   */
  cancelTicket: async (ticketId, data) => {
    return await api.put(`/tickets/${ticketId}/cancel`, data);
  },

  /**
   * Get today's tickets
   */
  getTodayTickets: async (params) => {
    return await api.get('/tickets/today', { params });
  },

  /**
   * Get tickets by date range
   */
  getTicketsByDateRange: async (params) => {
    return await api.get('/tickets/date-range', { params });
  },
};

export default ticketService;
