/**
 * Guides API — Guide Service endpoints
 *
 * GET /guides/health — Service health
 *
 * Note: Guide assignment, availability calendar, and GPS tracking
 *       will be expanded as the Guide Service matures.
 */
import apiClient from '../api';

export interface GuideSchedule {
  id: number;
  guideUserId: number;
  tourId?: number;
  bookingId?: number;
  startDate: string;
  endDate: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export const guidesApi = {
  health: () =>
    apiClient.get('/guides/health'),
};
