import api from './axios';
export const createPaymentIntent = (data) => api.post('/payments/create-intent', data);
export const confirmPayment = (paymentIntentId) => api.post('/payments/confirm', { paymentIntentId });
export const releasePayment = (jobId) => api.post(`/payments/release/${jobId}`);
export const getPaymentForJob = (jobId) => api.get(`/payments/job/${jobId}`);
