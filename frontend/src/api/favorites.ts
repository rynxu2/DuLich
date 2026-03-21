/**
 * Favorites API — User Service endpoints
 *
 * GET    /favorites/user/{userId}   — User's favorites list
 * POST   /favorites                 — Add favorite
 * DELETE /favorites/{userId}/{tourId} — Remove favorite
 *
 * Note: Favorites are now managed by User Service (not Identity Service)
 */
import apiClient from './client';

export interface FavoriteTour {
  id: number;
  userId: number;
  tourId: number;
  createdAt: string;
}

export const favoritesApi = {
  /** Get user's favorites list */
  getByUser: (userId: number) =>
    apiClient.get<FavoriteTour[]>(`/favorites/user/${userId}`),

  /** Add tour to favorites */
  add: (userId: number, tourId: number) =>
    apiClient.post<FavoriteTour>('/favorites', { userId, tourId }),

  /** Remove tour from favorites */
  remove: (userId: number, tourId: number) =>
    apiClient.delete(`/favorites/${userId}/${tourId}`),

  // ── Legacy compatibility ──
  getMyFavorites: () =>
    apiClient.get<FavoriteTour[]>('/favorites'),

  toggle: (tourId: number) =>
    apiClient.post<{ favorited: boolean }>(`/favorites/toggle/${tourId}`),

  check: (tourId: number) =>
    apiClient.get<{ favorited: boolean }>(`/favorites/check/${tourId}`),
};
