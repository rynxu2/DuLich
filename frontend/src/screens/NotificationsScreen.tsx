/**
 * Notifications Screen — API-powered notifications with mark-all-read
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsApi, Notification } from '../api/notifications';
import { theme } from '../theme';

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  BOOKING_CONFIRMED: { icon: 'check-circle', color: theme.colors.success },
  BOOKING_CANCELLED: { icon: 'close-circle', color: theme.colors.error },
  PAYMENT_SUCCESS: { icon: 'cash-check', color: theme.colors.success },
  DEPARTURE_REMINDER: { icon: 'bell-ring-outline', color: theme.colors.warning },
  PROMO: { icon: 'tag-outline', color: theme.colors.accent },
  REVIEW_REPLY: { icon: 'message-reply-text-outline', color: theme.colors.primary },
  SYSTEM: { icon: 'information-outline', color: theme.colors.primaryLight },
};

function getIconForType(type: string) {
  return TYPE_ICONS[type] || TYPE_ICONS.SYSTEM;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Vừa xong';
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch { /* ignore */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* ignore */ }
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Thông Báo</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} chưa đọc</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Icon name="check-all" size={18} color={theme.colors.primary} />
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const { icon, color } = getIconForType(item.type);
          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              onPress={() => markAsRead(item.id)}
              activeOpacity={0.8}>
              <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                <Icon name={icon} size={22} color={color} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBody} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotification(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="close" size={16} color={theme.colors.textLight} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bell-off-outline" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyTitle}>Không có thông báo</Text>
            <Text style={styles.emptySubtitle}>Bạn sẽ nhận thông báo khi có cập nhật mới</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  headerTitle: { ...theme.typography.h1, color: theme.colors.text },
  headerSubtitle: { ...theme.typography.bodySmall, color: theme.colors.primary, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
  },
  markAllText: { ...theme.typography.caption, color: theme.colors.primary },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  notifCard: {
    flexDirection: 'row', gap: 14, backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 10, elevation: 1,
  },
  notifCardUnread: {
    borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '06',
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifTitle: { ...theme.typography.body, color: theme.colors.text, fontSize: 15, flex: 1 },
  notifTitleUnread: { fontWeight: '700' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary,
  },
  notifBody: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  notifTime: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: 6 },
  deleteBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textLight, marginTop: 16 },
  emptySubtitle: { ...theme.typography.bodySmall, color: theme.colors.textLight, marginTop: 4, textAlign: 'center' },
});
