import api from './axios';

export const confirmPaymentApi = (bookingId, data) =>
  api.post(`/api/payments/${bookingId}/confirm`, data);
export const getMyPaymentsApi = () => api.get('/api/payments/my');
export const getHelperEarningsApi = () => api.get('/api/payments/helper/earnings');
