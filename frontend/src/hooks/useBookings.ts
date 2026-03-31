import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, CreateBookingData } from '../api/bookings';
import { useAuthStore } from '../store/useAuthStore';

export function useUserBookings() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await bookingsApi.getByUser(userId);
      return res.data;
    },
    enabled: !!userId,
  });
}export function useBookingDetail(bookingId?: number) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const res = await bookingsApi.getById(bookingId);
      return res.data;
    },
    enabled: !!bookingId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const res = await bookingsApi.create(data);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate both user's bookings and specific tour availability
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['bookings', userId] });
      }
      queryClient.invalidateQueries({ queryKey: ['tourAvailability'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await bookingsApi.cancel(bookingId);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['tourAvailability', data.departureId] });
    },
  });
}
