import api from './axios';

export const createBookingApi = (data) => api.post('/api/bookings', data);
export const validatePromoCodeApi = (code, amount) =>
  api.get(`/api/bookings/promo/validate?code=${encodeURIComponent(code)}&amount=${amount}`);
export const getMyBookingsApi = () => api.get('/api/bookings/my');
export const getPreviousHelpersApi = () => api.get('/api/bookings/my-previous-helpers');
export const getHelperBookingsApi = () => api.get('/api/bookings/helper/my');
export const getAvailableJobsApi = () => api.get('/api/bookings/helper/available-jobs');
export const acceptJobApi = (id) => api.patch(`/api/bookings/${id}/accept`);
export const getBookingDetailApi = (id) => api.get(`/api/bookings/${id}`);
export const confirmBookingApi = (id) => api.patch(`/api/bookings/${id}/confirm`);
export const checkInApi = (id) => api.patch(`/api/bookings/${id}/checkin`);
export const checkOutApi = (id) => api.patch(`/api/bookings/${id}/checkout`);
export const cancelBookingApi  = (id) => api.patch(`/api/bookings/${id}/cancel`);
export const pricePreviewApi   = (params) => api.get('/api/bookings/price-preview', { params });
export const suggestHelpersApi    = (params) => api.get('/api/bookings/suggest-helpers', { params });
export const getBookingSuggestionsApi   = (id)     => api.get(`/api/bookings/${id}/suggestions`);
export const checkAvailabilityApi       = (params) => api.get('/api/bookings/check-availability', { params });
