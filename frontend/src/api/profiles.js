import api from './axios';
export const getProfile = (id) => api.get(`/profiles/${id}`);
export const updateProfile = (data) => api.patch('/profiles/me', data);
