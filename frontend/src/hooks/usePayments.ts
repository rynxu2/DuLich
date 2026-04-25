import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments';
import { useAuthStore } from '../store/useAuthStore';

export function useUserPayments() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useQuery({
    queryKey: ['payments', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await paymentsApi.getByUser(userId);
      return res.data;
    },
    enabled: !!userId,
  });
}

export function usePaymentDetail(paymentId?: number) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      const res = await paymentsApi.getById(paymentId);
      return res.data;
    },
    enabled: !!paymentId,
  });
}
