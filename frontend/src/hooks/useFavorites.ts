import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../api/favorites';
import { useAuthStore } from '../store/useAuthStore';
import { toursApi, Tour } from '../api/tours';

export function useFavorites() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get favorite mappings
      const favRes = await favoritesApi.getByUser(userId);
      const favItems = favRes.data;
      if (favItems.length === 0) return [];

      // Fetch corresponding tours
      const toursRes = await toursApi.list();
      const favTourIds = new Set(favItems.map(f => f.tourId));
      return toursRes.data.filter(t => favTourIds.has(t.id));
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useMutation({
    mutationFn: async (tourId: number) => {
      if (!userId) throw new Error('Not logged in');
      const res = await favoritesApi.toggle(tourId);
      return { tourId, favorited: res.data.favorited };
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
        queryClient.invalidateQueries({ queryKey: ['favoriteCheck'] });
      }
    },
  });
}

export function useCheckFavorite(tourId: number) {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['favoriteCheck', tourId, user?.userId],
    queryFn: async () => {
      if (!user?.userId) return false;
      const res = await favoritesApi.check(tourId);
      return res.data.favorited;
    },
    enabled: !!user?.userId && !!tourId,
  });
}
