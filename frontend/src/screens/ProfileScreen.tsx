/**
 * ProfileScreen — Clean white header, simple stats, grouped menu
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useUserBookings } from '../hooks/useBookings';
import { useFavorites } from '../hooks/useFavorites';
import { useUserReviews } from '../hooks/useReviews';
import { theme } from '../theme';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { data: bookings = [] } = useUserBookings();
  const { data: favorites = [] } = useFavorites();
  const { data: reviews = [] } = useUserReviews();

  const handleLogout = () => {
    Alert.alert('Đăng Xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const MENUS = [
    {
      title: 'Tài khoản',
      items: [
        { icon: 'account-edit-outline', label: 'Thông tin cá nhân', onPress: () => navigation.navigate('EditProfile') },
        { icon: 'heart-outline', label: 'Tour yêu thích', onPress: () => navigation.navigate('Favorites'), badge: favorites.length || undefined },
        { icon: 'credit-card-outline', label: 'Thanh toán & Hóa đơn', onPress: () => Alert.alert('Thanh Toán', 'Sắp ra mắt!') },
      ],
    },
    {
      title: 'Hỗ trợ',
      items: [
        { icon: 'headphones', label: 'Trung tâm trợ giúp', onPress: () => navigation.navigate('Feedback') },
        { icon: 'cog-outline', label: 'Cài đặt', onPress: () => Alert.alert('Cài Đặt', 'Đang xây dựng!') },
        { icon: 'information-outline', label: 'Về DuLịch App', onPress: () => Alert.alert('DuLịch App', 'Phiên bản 1.0.0\n\n© 2026 DuLịch App Team') },
      ],
    },
  ];

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="account-circle-outline" size={80} color={theme.colors.textLight} />
        <Text style={styles.guestTitle}>Chào mừng bạn!</Text>
        <Text style={styles.guestSub}>Đăng nhập để quản lý đặt chỗ và khám phá ưu đãi</Text>
        <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.guestBtnText}>Đăng Nhập / Đăng Ký</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Icon name="pencil-outline" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Icon name="account" size={32} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName || user.username || 'Traveler'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.stat} onPress={() => navigation.navigate('MyTripsTab')}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Chuyến đi</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.stat} onPress={() => navigation.navigate('Feedback')}>
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.stat} onPress={() => navigation.navigate('Favorites')}>
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Menu Groups ── */}
      {MENUS.map((group, gi) => (
        <View key={gi} style={styles.menuGroup}>
          <Text style={styles.menuGroupLabel}>{group.title}</Text>
          <View style={styles.menuCard}>
            {group.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.menuItem, ii < group.items.length - 1 && styles.menuItemBorder]}
                onPress={item.onPress} activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Icon name={item.icon} size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.badge ? (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <Icon name="chevron-right" size={20} color={theme.colors.textLight} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Icon name="logout" size={18} color={theme.colors.error} />
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>

      <Text style={styles.version}>DuLịch App v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  guestTitle: { ...theme.typography.h2, color: theme.colors.text, marginTop: 16, marginBottom: 6 },
  guestSub: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
  guestBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: theme.borderRadius.full },
  guestBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.surfaceVariant },
  avatarFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primaryMuted },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  profileEmail: { fontSize: 13, color: theme.colors.textSecondary },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg, paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: theme.colors.border },

  menuGroup: { paddingHorizontal: 20, marginTop: 20 },
  menuGroupLabel: {
    fontSize: 12, fontWeight: '600', color: theme.colors.textLight,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg, paddingHorizontal: 16,
    ...theme.shadows.sm,
  },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: theme.colors.text },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 24, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.errorMuted,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: theme.colors.error },
  version: { fontSize: 11, color: theme.colors.textLight, textAlign: 'center', marginTop: 16 },
});
