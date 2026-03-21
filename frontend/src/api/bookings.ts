/**
 * Bookings API — Booking Service endpoints
 *
 * POST /bookings              — Create booking (triggers Saga: booking→payment→confirm)
 * GET  /bookings/user/{userId} — User's bookings (enriched with tour info)
 * GET  /bookings/{id}         — Booking detail (enriched with tour info)
 * PUT  /bookings/{id}/cancel  — Cancel booking
 *
 * Note: Booking creation now triggers:
 *   1. booking.created event → Payment Service
 *   2. Payment Service processes → payment.success/failed event
 *   3. Booking Service confirms/cancels → booking.confirmed event
 *   4. Notification + Itinerary services react
 */
import apiClient from './client';

export interface Booking {
  id: number;
  userId: number;
  tourId: number;
  departureId?: number;
  bookingDate: string;
  travelers: number;
  status: string;           // PENDING | CONFIRMED | COMPLETED | CANCELLED
  totalPrice: number;
  contactName?: string;
  contactPhone?: string;
  specialRequests?: string;
  paymentMethod: string;     // CASH | VNPAY | MOMO | ZALOPAY
  paymentStatus: string;     // UNPAID | PAID | REFUNDED
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enriched booking response — includes tour details
 * from Tour Service via Feign Client.
 */
export interface BookingResponse extends Booking {
  tourTitle?: string;
  tourLocation?: string;
  tourImage?: string;
  tourDuration?: number;
  tourRating?: number;
}

export interface CreateBookingData {
  tourId: number;
  departureId?: number;
  bookingDate: string;
  travelers: number;
  contactName?: string;
  contactPhone?: string;
  specialRequests?: string;
  paymentMethod?: string;    // CASH | VNPAY | MOMO | ZALOPAY
}

export const bookingsApi = {
  /**
   * Create booking → triggers Saga pattern:
   * booking.created → Payment → payment.success → CONFIRMED
   */
  create: (data: CreateBookingData) =>
    apiClient.post<Booking>('/bookings', data),

  /** Get user's bookings with enriched tour info */
  getByUser: (userId: number) =>
    apiClient.get<BookingResponse[]>(`/bookings/user/${userId}`),

  /** Get booking detail with enriched tour info */
  getById: (id: number) =>
    apiClient.get<BookingResponse>(`/bookings/${id}`),

  /** Cancel booking */
  cancel: (id: number) =>
    apiClient.put<Booking>(`/bookings/${id}/cancel`),
};
