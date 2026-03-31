import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { useAuthStore } from '../store/useAuthStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await notificationsApi.getAll();
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useUnreadCount() {
  const { user } = useAuthStore();
  const userId = user?.userId;

  return useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const res = await notificationsApi.getUnreadCount();
      return res.data.unreadCount;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30s as a fallback for missing WebSocket
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await notificationsApi.markAsRead(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.userId] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const res = await notificationsApi.markAllAsRead();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.userId] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (id: number) => {
      await notificationsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.userId] });
    },
  });
}
