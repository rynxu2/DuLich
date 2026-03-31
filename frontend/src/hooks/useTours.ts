import { useQuery } from '@tanstack/react-query';
import { toursApi, TourListParams } from '../api/tours';

export function useTours(params: TourListParams = {}) {
  return useQuery({
    queryKey: ['tours', params],
    queryFn: async () => {
      const { data } = await toursApi.list(params);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useTourDetail(tourId: number) {
  return useQuery({
    queryKey: ['tour', tourId],
    queryFn: async () => {
      const { data } = await toursApi.getById(tourId);
      return data;
    },
    enabled: !!tourId,
  });
}

export function useTourAvailability(departureId?: number) {
  return useQuery({
    queryKey: ['tourAvailability', departureId],
    queryFn: async () => {
      if (!departureId) return null;
      const { data } = await toursApi.getAvailability(departureId);
      return data;
    },
    enabled: !!departureId,
    refetchInterval: 10000, // Poll every 10 seconds for real-time seat availability
  });
}
