import api from './axios';

export const getHelperReviewsApi = (helperId) => api.get(`/api/reviews/helper/${helperId}`);
export const createReviewApi = (data) => api.post('/api/reviews', data);
export const getMyReviewsApi = () => api.get('/api/reviews/my');
export const helperReviewCustomerApi = (data) => api.post('/api/reviews/helper-review', data);
export const getMyReceivedReviewsApi = ()     => api.get('/api/reviews/my-received');
