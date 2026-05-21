import api from './axios';

export const getAllServicesApi = () => api.get('/api/services');
export const getServiceByIdApi = (serviceId) => api.get(`/api/services/${serviceId}`);
export const getServiceReviewsApi = (serviceId, params) =>
  api.get(`/api/services/${serviceId}/reviews`, { params });
export const searchHelpersApi = (serviceId, city) =>
  api.get(`/api/services/${serviceId}/helpers`, { params: { city } });
export const getHelperScheduleApi = (helperId) =>
  api.get(`/api/services/helpers/${helperId}/schedule`);
