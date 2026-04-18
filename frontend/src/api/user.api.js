import api from './axios';

export const getHelperProfileApi = (helperId) => api.get(`/api/users/helpers/${helperId}`);
export const updateProfileApi = (data) => api.put('/api/users/profile', data);
export const changePasswordApi = (data) => api.put('/api/users/change-password', data);
export const toggleAvailabilityApi = (isAvailable) =>
  api.patch('/api/users/helper/availability', { isAvailable });
