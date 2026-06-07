import api from './axios';

export const confirmPaymentApi = (bookingId, data) =>
  api.post(`/api/payments/${bookingId}/confirm`, data);
export const createVNPayUrlApi = (bookingId) =>
  api.post(`/api/payments/${bookingId}/vnpay-url`);
// Đặt cọc 70% qua VNPay (khách hàng mới / uy tín thấp)
export const createVNPayDepositUrlApi = (bookingId) =>
  api.post(`/api/payments/${bookingId}/vnpay-deposit`);
// Thanh toán 30% còn lại qua VNPay (sau khi dịch vụ hoàn thành)
export const createVNPayRemainingUrlApi = (bookingId) =>
  api.post(`/api/payments/${bookingId}/vnpay-remaining`);
// Xác nhận thanh toán 30% còn lại bằng tiền mặt
export const confirmRemainingPaymentApi = (bookingId) =>
  api.post(`/api/payments/${bookingId}/confirm-remaining`);
export const getBankTransferInfoApi = (bookingId) =>
  api.get(`/api/payments/${bookingId}/bank-transfer`);
export const getMyPaymentsApi = () => api.get('/api/payments/my');
export const getHelperEarningsApi = () => api.get('/api/payments/helper/earnings');
