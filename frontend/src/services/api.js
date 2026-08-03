import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pool_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (email, password, full_name, phone) =>
    api.post('/api/auth/register', { email, password, full_name, phone }),
  getProfile: () => api.get('/api/auth/me'),
  changePassword: (current_password, new_password, new_password_confirm) =>
    api.post('/api/auth/change-password', {
      current_password,
      new_password,
      new_password_confirm,
    }),
  logout: () => {
    localStorage.removeItem('pool_access_token');
    localStorage.removeItem('pool_access_user');
  },
};

export const adminAPI = {
  listUsers: () => api.get('/api/admin/users'),
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  changeUserStatus: (id, status) => api.post(`/api/admin/users/${id}/status`, { status }),
  getAccessLogs: (skip = 0, limit = 100) =>
    api.get(`/api/admin/access-logs?skip=${skip}&limit=${limit}`),
  getUserAccessLogs: (id, limit = 50) =>
    api.get(`/api/admin/users/${id}/access-logs?limit=${limit}`),
};

export default api;
