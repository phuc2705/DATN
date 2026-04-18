import api from './axios';

export const getNotificationsApi = (params) => api.get('/api/notifications', { params });
export const markAllReadApi = () => api.post('/api/notifications/read-all');
export const markOneReadApi = (notificationId) => api.patch(`/api/notifications/${notificationId}/read`);
