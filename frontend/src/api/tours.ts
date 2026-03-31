/**
 * Tours API — Tour Service endpoints
 *
 * GET    /tours              — List all (or search ?keyword=&category=)
 * GET    /tours/{id}         — Tour detail (includes images & departures)
 * POST   /tours              — Create tour (admin)
 * PUT    /tours/{id}         — Update tour (admin)
 * DELETE /tours/{id}         — Delete tour (admin)
 */
import apiClient from './client';

export interface TourImage {
  id: number;
  imageUrl: string;
  caption?: string;
  displayOrder: number;
  createdAt: string;
}

export interface TourDeparture {
  id: number;
  departureDate: string;
  availableSlots: number;
  priceModifier: number;
  status: string;
  createdAt: string;
}

export interface Tour {
  id: number;
  title: string;
  description: string;
  location: string;
  category: string;
  price: number;
  originalPrice?: number;
  duration: number;
  maxParticipants: number;
  rating: number;
  reviewCount: number;
  itinerary: {
    days: Array<{
      day: number;
      activities: string[];
    }>;
  };
  imageUrl: string;
  isActive: boolean;
  images: TourImage[];
  departures: TourDeparture[];
  createdAt: string;
  updatedAt: string;
}

export interface TourListParams {
  keyword?: string;
  category?: string;
}

const listTours = (params?: TourListParams) =>
  apiClient.get<Tour[]>('/tours', { params });

export const toursApi = {
  list: listTours,

  getAll: () =>
    listTours(),

  search: (keyword: string) =>
    listTours({ keyword }),

  getById: (id: number) =>
    apiClient.get<Tour>(`/tours/${id}`),

  getByCategory: (category: string) =>
    listTours({ category }),

  create: (tour: Partial<Tour>) =>
    apiClient.post<Tour>('/tours', tour),

  update: (id: number, tour: Partial<Tour>) =>
    apiClient.put<Tour>(`/tours/${id}`, tour),

  delete: (id: number) =>
    apiClient.delete(`/tours/${id}`),

  // ── Capacity Management ──
  getAvailability: (departureId: number) =>
    apiClient.get<{ departureId: number; totalSlots: number; availableSlots: number; status: string }>(
      `/tours/departures/${departureId}/availability`
    ),

  reserveSeats: (departureId: number, bookingId: number, seats: number) =>
    apiClient.post(`/tours/departures/${departureId}/reserve`, null, {
      params: { bookingId, seats },
    }),

  confirmSeats: (departureId: number, bookingId: number, seats: number) =>
    apiClient.post(`/tours/departures/${departureId}/confirm`, null, {
      params: { bookingId, seats },
    }),

  releaseSeats: (departureId: number, bookingId: number, seats: number) =>
    apiClient.post(`/tours/departures/${departureId}/release`, null, {
      params: { bookingId, seats },
    }),
};
