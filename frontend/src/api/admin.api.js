import api from './axios';

export const getAdminStatsApi = () => api.get('/api/admin/stats');
export const getAdminUsersApi = (params) => api.get('/api/admin/users', { params });
export const toggleUserStatusApi = (userId, isActive) =>
  api.patch(`/api/admin/users/${userId}/status`, { isActive });
export const verifyHelperApi = (helperId) => api.patch(`/api/admin/helpers/${helperId}/verify`);
export const getAdminBookingsApi = (params) => api.get('/api/admin/bookings', { params });
export const getAdminPaymentsApi = (params) => api.get('/api/admin/payments', { params });
