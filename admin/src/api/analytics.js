import api from './axios';
export const getAnalytics = (days) => api.get('/analytics', { params: { days } });
