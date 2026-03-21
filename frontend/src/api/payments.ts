/**
 * Payments API — Payment Service endpoints
 *
 * GET /payments/{id}              — Payment detail
 * GET /payments/booking/{bookingId} — Payments for a booking
 * GET /payments/user/{userId}     — User's payment history
 *
 * Note: Payment processing happens automatically via Saga pattern
 *       (booking.created event → Payment Service processes → payment.success/failed)
 *       These endpoints are for QUERYING payment status only.
 */
import apiClient from './client';

export type PaymentMethod = 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'STRIPE' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: number;
  bookingId: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  providerTransactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  paymentId: number;
  type: 'CHARGE' | 'REFUND' | 'PARTIAL_REFUND';
  amount: number;
  status: string;
  createdAt: string;
}

export const paymentsApi = {
  /** Get payment by ID */
  getById: (id: number) =>
    apiClient.get<Payment>(`/payments/${id}`),

  /** Get all payments for a booking */
  getByBooking: (bookingId: number) =>
    apiClient.get<Payment[]>(`/payments/booking/${bookingId}`),

  /** Get user's payment history */
  getByUser: (userId: number) =>
    apiClient.get<Payment[]>(`/payments/user/${userId}`),
};
