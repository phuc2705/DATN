import api from './axios';

export const createBookingApi = (data) => api.post('/api/bookings', data);
export const getMyBookingsApi = () => api.get('/api/bookings/my');
export const getHelperBookingsApi = () => api.get('/api/bookings/helper/my');
export const getBookingDetailApi = (id) => api.get(`/api/bookings/${id}`);
export const confirmBookingApi = (id) => api.patch(`/api/bookings/${id}/confirm`);
export const checkInApi = (id) => api.patch(`/api/bookings/${id}/checkin`);
export const checkOutApi = (id) => api.patch(`/api/bookings/${id}/checkout`);
export const cancelBookingApi = (id) => api.patch(`/api/bookings/${id}/cancel`);
