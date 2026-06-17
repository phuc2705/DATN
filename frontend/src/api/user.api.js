import api from './axios';

export const getHelperProfileApi = (helperId) => api.get(`/api/users/helpers/${helperId}`);
export const updateProfileApi = (data) => api.put('/api/users/profile', data);
export const changePasswordApi = (data) => api.put('/api/users/change-password', data);
export const toggleAvailabilityApi = (isAvailable) =>
  api.patch('/api/users/helper/availability', { isAvailable });

export const getHelperScheduleApi    = ()         => api.get('/api/users/helper/schedule');
export const updateHelperScheduleApi = (data)     => api.put('/api/users/helper/schedule', data);

export const getHelperShiftsApi  = ()         => api.get('/api/users/helper/shifts');
export const registerShiftApi    = (data)     => api.post('/api/users/helper/shifts', data);
export const cancelShiftApi      = (shiftId)  => api.delete(`/api/users/helper/shifts/${shiftId}`);

export const getHelperWalletApi  = (params)   => api.get('/api/users/helper/wallet', { params });
