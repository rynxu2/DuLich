/**
 * Notifications Screen — API-powered notifications with mark-all-read
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../hooks/useNotifications';
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

  // React Query Hooks
  const { data: notifications = [], isLoading: loading } = useNotifications();
  const { mutateAsync: markAsRead } = useMarkNotificationRead();
  const { mutateAsync: markAllAsRead } = useMarkAllNotificationsRead();
  const { mutateAsync: deleteNotification } = useDeleteNotification();

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

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
          <TouchableOpacity style={styles.markAllBtn} onPress={() => markAllAsRead()}>
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
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  headerTitle: { ...theme.typography.h1, color: theme.colors.text },
  headerSubtitle: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
    backgroundColor: theme.colors.primaryMuted,
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  notifCard: {
    flexDirection: 'row', gap: 14, backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl, padding: 16, marginBottom: 12,
    ...theme.shadows.sm,
  },
  notifCardUnread: {
    borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifTitle: { fontSize: 15, color: theme.colors.text, flex: 1 },
  notifTitleUnread: { fontWeight: '700' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary,
  },
  notifBody: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  notifTime: { fontSize: 11, fontWeight: '600', color: theme.colors.textLight, marginTop: 6 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 20 },
  emptySubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 40, lineHeight: 19 },
});
