import client from './client';

export interface GuideSchedule {
  id: number;
  guideUserId: number;
  tourId: number;
  bookingId: number;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
}

export const guidesApi = {
  getSchedulesByTour: (tourId: number) => client.get<GuideSchedule[]>(`/guides/schedules/tour/${tourId}`),
};
