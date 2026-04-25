import { useQuery } from '@tanstack/react-query';
import { bookingsApi, ProfileStats } from '../api/bookings';
import { useAuthStore } from '../store/useAuthStore';

const EMPTY_STATS: ProfileStats = {
  trips: 0,
  reviews: 0,
  favorites: 0,
};

export function useProfileStats() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useQuery({
    queryKey: ['profileStats', userId],
    queryFn: async () => {
      if (!userId) return EMPTY_STATS;
      const res = await bookingsApi.getProfileStats(userId);
      return res.data;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
