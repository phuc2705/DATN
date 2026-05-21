import api from './axios';

export const getAdminStatsApi = () => api.get('/api/admin/stats');
export const getAdminUsersApi = (params) => api.get('/api/admin/users', { params });
export const toggleUserStatusApi = (userId, isActive) =>
  api.patch(`/api/admin/users/${userId}/status`, { isActive });
export const verifyHelperApi = (helperId) => api.patch(`/api/admin/helpers/${helperId}/verify`);
export const getAdminBookingsApi = (params) => api.get('/api/admin/bookings', { params });
export const getAdminPaymentsApi = (params) => api.get('/api/admin/payments', { params });
export const getAdminServicesApi = () => api.get('/api/admin/services');
export const updateServiceApi = (id, data) => api.put(`/api/admin/services/${id}`, data);
export const deleteServiceApi = (id) => api.delete(`/api/admin/services/${id}`);
export const getAdminPromotionsApi = () => api.get('/api/admin/promotions');
export const createPromotionApi = (data) => api.post('/api/admin/promotions', data);
export const updatePromotionApi = (id, data) => api.patch(`/api/admin/promotions/${id}`, data);
export const assignHelperApi = (bookingId, helperId) =>
  api.patch(`/api/admin/bookings/${bookingId}/assign`, { helperId });
export const getAvailableHelpersApi = (bookingId) =>
  api.get('/api/admin/helpers/available', { params: bookingId ? { bookingId } : {} });
export const cancelAdminBookingApi = (bookingId) =>
  api.patch(`/api/admin/bookings/${bookingId}/cancel`);
