/**
 * Auth API — Auth Service endpoints
 *
 * POST /auth/register   — Register new user (publishes user.registered event)
 * POST /auth/login      — Login & get JWT + refresh token
 * POST /auth/refresh    — Refresh access token
 *
 * Note: Profile management moved to User Service (users.ts)
 */
import apiClient from './client';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

/**
 * Auth Service now returns both accessToken and refreshToken.
 * The old `token` field has been replaced.
 */
export interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: LoginData) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
};
