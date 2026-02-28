import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

/**
 * REQUEST INTERCEPTOR — Attaches JWT to every outgoing request.
 * Token is stored in localStorage (set on login).
 * This ensures protected API routes receive the Authorization header
 * automatically without adding it manually in every component.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR — Handles 401 Unauthorized globally.
 * If the server returns 401 (expired/invalid token), we:
 * 1. Clear local storage
 * 2. Redirect to login page
 * This prevents stale sessions and forces re-authentication.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
