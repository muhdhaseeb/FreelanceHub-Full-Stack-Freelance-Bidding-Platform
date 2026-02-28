import api from './axios';
export const getMessages = (jobId) => api.get(`/messages/${jobId}`);
