/**
 * API Client — Axios configuration with JWT interceptor + auto-refresh
 *
 * Central HTTP client for all API calls. Features:
 * 1. Base URL pointing to API Gateway
 * 2. Request interceptor that attaches JWT from AsyncStorage
 * 3. Response interceptor with auto-refresh on 401
 * 4. X-User-Id header injection for service-to-service auth
 *
 * For Android emulator, use 10.0.2.2 instead of localhost
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:8080/api'  // Android emulator → host machine
  : 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token + User ID
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    const userData = await AsyncStorage.getItem('user_data');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject X-User-Id for service-to-service communication
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.userId) {
          config.headers['X-User-Id'] = user.userId.toString();
        }
      } catch {}
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — auto-refresh token on 401
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          // Save new tokens
          await AsyncStorage.setItem('auth_token', data.accessToken);
          await AsyncStorage.setItem('refresh_token', data.refreshToken);

          isRefreshing = false;
          onTokenRefreshed(data.accessToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — clear all auth data
        isRefreshing = false;
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('user_data');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
