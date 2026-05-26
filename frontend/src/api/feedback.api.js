import api from './axios';

export const createFeedbackApi  = (data)   => api.post('/api/feedback', data);
export const getMyFeedbacksApi  = ()       => api.get('/api/feedback/my');
export const getAdminFeedbacksApi = (params) => api.get('/api/admin/feedbacks', { params });
export const updateFeedbackApi  = (id, data) => api.patch(`/api/admin/feedbacks/${id}`, data);
