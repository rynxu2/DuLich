/**
 * Reviews API — Review Service endpoints (separated from Booking Service)
 *
 * GET    /reviews/tour/{tourId}  — Reviews for a tour
 * GET    /reviews/user/{userId}  — User's reviews
 * POST   /reviews                — Create review (publishes review.submitted event)
 * DELETE /reviews/{id}           — Delete review
 *
 * Note: Review Service now publishes review.submitted events
 *       which Tour Service subscribes to for rating updates.
 */
import apiClient from './client';

export interface Review {
  id: number;
  userId: number;
  tourId: number;
  bookingId?: number;
  rating: number;
  title?: string;
  comment?: string;
  isAnonymous: boolean;
  status: string;           // PUBLISHED | HIDDEN | FLAGGED
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  tourId: number;
  bookingId?: number;
  rating: number;
  title?: string;
  comment?: string;
}

export const reviewsApi = {
  /** Get reviews for a tour */
  getByTour: (tourId: number) =>
    apiClient.get<Review[]>(`/reviews/tour/${tourId}`),

  /** Get user's reviews */
  getByUser: (userId: number) =>
    apiClient.get<Review[]>(`/reviews/user/${userId}`),

  /** Create review (triggers review.submitted event → Tour rating update) */
  create: (data: CreateReviewData) =>
    apiClient.post<Review>('/reviews', data),

  /** Delete review */
  delete: (id: number) =>
    apiClient.delete(`/reviews/${id}`),

  // ── Legacy compatibility ──
  getMyReviews: () =>
    apiClient.get<Review[]>('/reviews/me'),
};
