import api from './axios';

export const loginApi = (data) => api.post('/api/auth/login', data);
export const registerCustomerApi = (data) => api.post('/api/auth/register/customer', data);
export const registerHelperApi = (data) => api.post('/api/auth/register/helper', data);
export const getMeApi = () => api.get('/api/auth/me');
