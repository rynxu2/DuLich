import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, CreateReviewData } from '../api/reviews';
import { useAuthStore } from '../store/useAuthStore';

// Note: Tour reviews are already fetched inside TourDetailScreen directly with useQuery

export function useUserReviews() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await reviewsApi.getByUser(userId);
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReviewData) => {
      const res = await reviewsApi.create(data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.tourId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'user'] });
      // Invalidate tour details to update rating average
      queryClient.invalidateQueries({ queryKey: ['tour', variables.tourId] });
    },
  });
}
