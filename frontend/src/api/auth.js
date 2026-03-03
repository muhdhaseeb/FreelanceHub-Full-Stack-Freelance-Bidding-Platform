import api from './axios';
export const loginUser    = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const getMe        = ()     => api.get('/auth/me');
export const deleteAccount = (password) => api.delete('/auth/account', { data: { password } });
