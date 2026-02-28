import api from './axios';
export const submitReview = (data) => api.post('/reviews', data);
export const getReviews = (freelancerId) => api.get(`/reviews/${freelancerId}`);
