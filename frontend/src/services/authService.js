import api from './api';

const authService = {
  /**
   * Login with username and password
   */
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Logout
   */
  logout: async () => {
    return await api.post('/auth/logout');
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken) => {
    return await api.post('/auth/refresh', { refreshToken });
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  /**
   * Change password
   */
  changePassword: async (passwords) => {
    return await api.put('/auth/change-password', passwords);
  },
};

export default authService;
