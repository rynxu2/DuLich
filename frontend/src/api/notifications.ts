/**
 * Notifications API — Notification Service endpoints
 *
 * GET    /notifications              — User's notifications
 * GET    /notifications/unread-count — Unread count
 * PUT    /notifications/{id}/read    — Mark one as read
 * PUT    /notifications/read-all     — Mark all as read
 * DELETE /notifications/{id}         — Delete notification
 *
 * Notification Service now subscribes to RabbitMQ events:
 * - booking.confirmed → BOOKING_CONFIRMED notification
 * - payment.success → PAYMENT_SUCCESS notification
 * - payment.failed → PAYMENT_FAILED notification
 */
import apiClient from './client';

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'DEPARTURE_REMINDER'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REVIEW_REPLY'
  | 'PROMO'
  | 'SYSTEM';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  referenceType?: string;   // BOOKING | TOUR | REVIEW | PAYMENT
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: () =>
    apiClient.get<Notification[]>('/notifications'),

  getUnreadCount: () =>
    apiClient.get<{ unreadCount: number }>('/notifications/unread-count'),

  markAsRead: (id: number) =>
    apiClient.put<Notification>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.put<{ updated: number }>('/notifications/read-all'),

  delete: (id: number) =>
    apiClient.delete(`/notifications/${id}`),
};
