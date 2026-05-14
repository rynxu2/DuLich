import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, CreateBookingData, BookingResponse } from '../api/bookings';
import { useAuthStore } from '../store/useAuthStore';

const PAGE_SIZE = 10;

/** Fetch all bookings at once (legacy — used by MyTripsScreen) */
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
}

/** Infinite-scroll paginated bookings */
export function useUserBookingsPaginated() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useInfiniteQuery({
    queryKey: ['bookings-paginated', userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { content: [], totalPages: 0, last: true } as any;
      const res = await bookingsApi.getByUserPaginated(userId, pageParam, PAGE_SIZE);
      return res.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
    enabled: !!userId,
  });
}

export function useBookingDetail(bookingId?: number) {
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
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['bookings', userId] });
        queryClient.invalidateQueries({ queryKey: ['bookings-paginated', userId] });
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
      queryClient.invalidateQueries({ queryKey: ['bookings-paginated', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['tourAvailability', data.departureId] });
    },
  });
}
