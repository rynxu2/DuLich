/**
 * Users API — User Service endpoints
 *
 * GET  /users/{userId}/profile  — Get user profile
 * PUT  /users/{userId}/profile  — Update user profile
 *
 * Note: Auth (login/register) is now in auth.ts (Auth Service)
 *       Favorites are now in favorites.ts (also User Service)
 */
import apiClient from './client';

export interface UserProfile {
  id: number;
  userId: number;
  username?: string;       // from Auth Service
  email?: string;          // from Auth Service
  role?: string;           // from Auth Service
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
}

export const usersApi = {
  getProfile: (userId: number) =>
    apiClient.get<UserProfile>(`/users/${userId}/profile`),

  updateProfile: (userId: number, data: UpdateProfileData) =>
    apiClient.put<UserProfile>(`/users/${userId}/profile`, data),
};
