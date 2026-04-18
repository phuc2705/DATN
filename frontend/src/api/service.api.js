import api from './axios';

export const getAllServicesApi = () => api.get('/api/services');
export const searchHelpersApi = (serviceId, city) =>
  api.get(`/api/services/${serviceId}/helpers`, { params: { city } });
export const getHelperScheduleApi = (helperId) =>
  api.get(`/api/services/helpers/${helperId}/schedule`);
