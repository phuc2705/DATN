import api from './axios';

export const confirmPaymentApi = (bookingId, data) =>
  api.post(`/api/payments/${bookingId}/confirm`, data);
export const createVNPayUrlApi = (bookingId) =>
  api.post(`/api/payments/${bookingId}/vnpay-url`);
export const getBankTransferInfoApi = (bookingId) =>
  api.get(`/api/payments/${bookingId}/bank-transfer`);
export const getMyPaymentsApi = () => api.get('/api/payments/my');
export const getHelperEarningsApi = () => api.get('/api/payments/helper/earnings');
