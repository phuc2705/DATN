import api from './axios';

export const loginApi = (data) => api.post('/api/auth/login', data);
export const registerCustomerApi = (data) => api.post('/api/auth/register/customer', data);
export const registerHelperApi = ({ avatarFile, idCardFrontFile, idCardBackFile, serviceIds = [], ...fields }) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => v !== undefined && v !== null && formData.append(k, v));
  formData.append('serviceIds', JSON.stringify(serviceIds));
  if (avatarFile)       formData.append('avatar',      avatarFile);
  if (idCardFrontFile)  formData.append('idCardFront',  idCardFrontFile);
  if (idCardBackFile)   formData.append('idCardBack',   idCardBackFile);
  return api.post('/api/auth/register/helper', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getMeApi = () => api.get('/api/auth/me');
export const verifyOtpApi = (data) => api.post('/api/auth/verify-otp', data);
export const resendOtpApi = (data) => api.post('/api/auth/resend-otp', data);
export const firebaseLoginApi = (data) => api.post('/api/auth/firebase', data);
export const forgotPasswordApi = (data) => api.post('/api/auth/forgot-password', data);
export const resetPasswordApi = (data) => api.post('/api/auth/reset-password', data);
