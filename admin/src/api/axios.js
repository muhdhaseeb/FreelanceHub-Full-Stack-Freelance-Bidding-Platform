import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_BASE, timeout: 10000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});
export default api;
