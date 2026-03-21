import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.userId) config.headers['X-User-Id'] = user.userId.toString();
      } catch {}
    }
  }
  return config;
});

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('auth_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          isRefreshing = false;
          refreshSubscribers.forEach((cb) => cb(data.accessToken));
          refreshSubscribers = [];
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(original);
        }
      } catch {
        isRefreshing = false;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ── Service APIs ──
export const authApi = {
  login: (data: { username: string; password: string }) => apiClient.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) => apiClient.post('/auth/register', data),
};

export const toursApi = {
  list: (params?: Record<string, any>) => apiClient.get('/tours', { params }),
  getById: (id: number) => apiClient.get(`/tours/${id}`),
  create: (data: any) => apiClient.post('/tours', data),
  update: (id: number, data: any) => apiClient.put(`/tours/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tours/${id}`),
};

export const bookingsApi = {
  list: () => apiClient.get('/bookings'),
  getByUser: (userId: number) => apiClient.get(`/bookings/user/${userId}`),
  getById: (id: number) => apiClient.get(`/bookings/${id}`),
  cancel: (id: number) => apiClient.put(`/bookings/${id}/cancel`),
};

export const usersApi = {
  list: () => apiClient.get('/users'),
  getProfile: (userId: number) => apiClient.get(`/users/${userId}`),
  updateProfile: (userId: number, data: any) => apiClient.put(`/users/${userId}`, data),
};

export const expensesApi = {
  list: () => apiClient.get('/expenses'),
  getPending: () => apiClient.get('/expenses/pending'),
  getByTour: (tourId: number) => apiClient.get(`/expenses/tour/${tourId}`),
  approve: (id: number) => apiClient.put(`/expenses/${id}/approve`),
  reject: (id: number, reason?: string) => apiClient.put(`/expenses/${id}/reject`, { reason }),
};

export const pricingApi = {
  listRules: () => apiClient.get('/pricing/rules'),
  createRule: (data: any) => apiClient.post('/pricing/rules', data),
  updateRule: (id: number, data: any) => apiClient.put(`/pricing/rules/${id}`, data),
  deleteRule: (id: number) => apiClient.delete(`/pricing/rules/${id}`),
  listPromos: () => apiClient.get('/pricing/promos'),
  createPromo: (data: any) => apiClient.post('/pricing/promos', data),
  deletePromo: (id: number) => apiClient.delete(`/pricing/promos/${id}`),
};

export const analyticsApi = {
  getRevenue: (params?: Record<string, any>) => apiClient.get('/analytics/revenue', { params }),
  getCosts: (params?: Record<string, any>) => apiClient.get('/analytics/costs', { params }),
  getProfit: (params?: Record<string, any>) => apiClient.get('/analytics/profit', { params }),
  health: () => apiClient.get('/analytics/health'),
};

export const storageApi = {
  upload: (file: File, entityType: string, entityId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    return apiClient.post('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
