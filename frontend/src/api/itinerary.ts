/**
 * Itinerary API — Itinerary Service endpoints
 *
 * GET  /itinerary/{bookingId} — Get all activities for a booking
 * POST /itinerary             — Create single entry
 * POST /itinerary/bulk        — Create multiple entries at once
 * PUT  /itinerary/{id}        — Update an entry
 */
import apiClient from './client';

export interface ItineraryItem {
  id: number;
  bookingId: number;
  dayNumber: number;
  activityTitle: string;
  description: string;
  startTime: string;
  endTime?: string;
  location: string;
  status: string;           // PLANNED | COMPLETED | SKIPPED
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const itineraryApi = {
  getByBooking: (bookingId: number) =>
    apiClient.get<ItineraryItem[]>(`/itinerary/${bookingId}`),

  create: (item: Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<ItineraryItem>('/itinerary', item),

  createBulk: (items: Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>[]) =>
    apiClient.post<ItineraryItem[]>('/itinerary/bulk', items),

  update: (id: number, item: Partial<ItineraryItem>) =>
    apiClient.put<ItineraryItem>(`/itinerary/${id}`, item),
};
