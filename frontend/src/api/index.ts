/**
 * API Barrel Export — All service clients in one import
 *
 * Usage:
 *   import { authApi, bookingsApi, paymentsApi } from '../api';
 *
 * Architecture:
 *   All requests go through API Gateway (port 8080)
 *   which routes to 12 microservices via Eureka.
 */

// ── Core Services ──
export { authApi } from './auth';
export type { RegisterData, LoginData, AuthResponse } from './auth';

export { usersApi } from './users';
export type { UserProfile, UpdateProfileData } from './users';

export { toursApi } from './tours';
export type { Tour, TourImage, TourDeparture, TourListParams } from './tours';

export { bookingsApi } from './bookings';
export type { Booking, BookingResponse, CreateBookingData } from './bookings';

export { paymentsApi } from './payments';
export type { Payment, Transaction, PaymentMethod, PaymentStatus } from './payments';

// ── Supporting Services ──
export { reviewsApi } from './reviews';
export type { Review, CreateReviewData } from './reviews';

export { itineraryApi } from './itinerary';
export type { ItineraryItem } from './itinerary';

export { notificationsApi } from './notifications';
export type { Notification, NotificationType } from './notifications';

export { favoritesApi } from './favorites';
export type { FavoriteTour } from './favorites';

// ── Advanced Services ──
export { analyticsApi } from './analytics';
export type { RevenueData, KPIData } from './analytics';

export { guidesApi } from './guides';
export type { GuideSchedule } from './guides';

export { realtimeApi } from './realtime';
export type { ChatMessage, TrackingUpdate } from './realtime';

export { adminApi } from './admin';
export type { SystemStatus } from './admin';

// ── New Business Services ──
export { expensesApi } from './expenses';
export type { Expense, ExpenseCategory, ExpenseStatus, CreateExpenseData } from './expenses';

export { pricingApi } from './pricing';
export type { PricingRule, PromoCode, PricePreviewParams, PricePreviewResponse } from './pricing';

export { storageApi } from './storage';
export type { FileUploadResponse } from './storage';

// ── Client ──
export { default as apiClient } from './client';
