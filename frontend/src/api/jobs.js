import api from './axios';
export const getJobs      = (params) => api.get('/jobs', { params });
export const getJob       = (id)     => api.get(`/jobs/${id}`);
export const createJob    = (data)   => api.post('/jobs', data);
export const markJobComplete = (id)  => api.patch(`/jobs/${id}/complete`);
export const withdrawJob  = (id)     => api.patch(`/jobs/${id}/withdraw`);
