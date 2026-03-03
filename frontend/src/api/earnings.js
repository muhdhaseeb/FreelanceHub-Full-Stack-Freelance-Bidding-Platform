import api from './axios';
export const getEarnings = (days) => api.get('/earnings', { params: { days } });
