import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://autoassist.com.my/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  register: (data: any) => api.post('/users/register', data),
  login: (data: any) => api.post('/users/login', data),
};

// Workshops API
export const workshopsAPI = {
  getAll: () => api.get('/workshops'),
  getById: (id: number) => api.get(`/workshops/${id}`),
  create: (data: any) => api.post('/workshops', data),
  update: (id: number, data: any) => api.put(`/workshops/${id}`, data),
  delete: (id: number) => api.delete(`/workshops/${id}`),
  getAvailableImages: () => api.get('/workshops/images'),
};

// Products API
export const productsAPI = {
  getAll: (category?: string) => {
    const url = category ? `/products?category=${category}` : '/products';
    return api.get(url);
  },
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (filters?: { type?: string; status?: string; userId?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.userId) params.append('userId', filters.userId.toString());
    const query = params.toString();
    return api.get(`/transactions${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

// Vehicles API
export const vehiclesAPI = {
  getAll: (userId: number) => api.get(`/users/${userId}/vehicles`),
  getById: (userId: number, vehicleId: number) => api.get(`/users/${userId}/vehicles/${vehicleId}`),
  create: (userId: number, data: any) => api.post(`/users/${userId}/vehicles`, data),
  update: (userId: number, vehicleId: number, data: any) => api.put(`/users/${userId}/vehicles/${vehicleId}`, data),
  delete: (userId: number, vehicleId: number) => api.delete(`/users/${userId}/vehicles/${vehicleId}`),
};

// Notification Settings API
export const notificationsAPI = {
  get: (userId: number) => api.get(`/users/${userId}/notification-settings`),
  update: (userId: number, data: any) => api.put(`/users/${userId}/notification-settings`, data),
};

// Banners API
export const bannersAPI = {
  getAll: (activeOnly?: boolean) => {
    const url = activeOnly ? '/banners?activeOnly=true' : '/banners';
    return api.get(url);
  },
  getById: (id: number) => api.get(`/banners/${id}`),
  create: (data: any) => api.post('/banners', data),
  update: (id: number, data: any) => api.put(`/banners/${id}`, data),
  delete: (id: number) => api.delete(`/banners/${id}`),
};

export default api;

