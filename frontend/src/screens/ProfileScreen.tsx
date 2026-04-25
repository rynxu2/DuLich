/**
 * ProfileScreen — Gradient hero header, stat cards, grouped menus
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useFavorites } from '../hooks/useFavorites';
import { useProfileStats } from '../hooks/useProfileStats';
import { theme } from '../theme';
import { getMediaUrl } from '../utils/media';

type Props = { navigation: NativeStackNavigationProp<any> };

const STATS_CONFIG = [
  { key: 'trips', icon: 'bag-suitcase', label: 'Chuyến đi', color: theme.colors.primary },
  { key: 'reviews', icon: 'star-outline', label: 'Đánh giá', color: theme.colors.star },
  { key: 'favorites', icon: 'heart', label: 'Yêu thích', color: theme.colors.heart },
];

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { data: favorites = [], refetch: refetchFavorites } = useFavorites();
  const { data: profileStats, refetch: refetchStats } = useProfileStats();

  useFocusEffect(
    useCallback(() => {
      refetchFavorites();
      refetchStats();
    }, [refetchFavorites, refetchStats])
  );

  const statValues = {
    trips: profileStats?.trips ?? 0,
    reviews: profileStats?.reviews ?? 0,
    favorites: profileStats?.favorites ?? 0,
  };

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
        { icon: 'account-edit-outline', label: 'Thông tin cá nhân', color: theme.colors.primary, onPress: () => navigation.navigate('EditProfile') },
        { icon: 'heart-outline', label: 'Tour yêu thích', color: theme.colors.heart, onPress: () => navigation.navigate('FavoritesTab'), badge: favorites.length || undefined },
        { icon: 'credit-card-outline', label: 'Thanh toán & Hóa đơn', color: theme.colors.success, onPress: () => navigation.navigate('PaymentHistory') },
      ],
    },
    {
      title: 'Hỗ trợ',
      items: [
        { icon: 'headphones', label: 'Trung tâm trợ giúp', color: theme.colors.info, onPress: () => navigation.navigate('Feedback') },
        { icon: 'cog-outline', label: 'Cài đặt', color: theme.colors.textSecondary, onPress: () => navigation.navigate('Settings') },
        { icon: 'information-outline', label: 'Về DuLịch App', color: theme.colors.primary, onPress: () => Alert.alert('DuLịch App', 'Phiên bản 1.0.0\n\n© 2026 DuLịch App Team') },
      ],
    },
  ];

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.guestHero}
        >
          <View style={styles.guestIconCircle}>
            <Icon name="account-circle-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Chào mừng bạn!</Text>
          <Text style={styles.guestSub}>Đăng nhập để quản lý đặt chỗ{'\n'}và khám phá ưu đãi độc quyền</Text>
        </LinearGradient>
        <View style={styles.guestActions}>
          <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.guestBtnText}>Đăng Nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guestBtnOutline} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.guestBtnOutlineText}>Tạo Tài Khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[theme.colors.gradient.start, theme.colors.gradient.mid, theme.colors.gradient.end]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="pencil-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarRing}>
            {user.avatarUrl ? (
              <Image source={{ uri: getMediaUrl(user.avatarUrl) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Icon name="account" size={36} color={theme.colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName || user.username || 'Traveler'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Stats Cards ── */}
      <View style={styles.statsContainer}>
        {STATS_CONFIG.map((stat) => (
          <TouchableOpacity key={stat.key} style={styles.statCard} activeOpacity={0.8}>
            <View style={[styles.statIconCircle, { backgroundColor: stat.color + '18' }]}>
              <Icon name={stat.icon} size={18} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{statValues[stat.key as keyof typeof statValues]}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
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
                  <View style={[styles.menuIconCircle, { backgroundColor: item.color + '15' }]}>
                    <Icon name={item.icon} size={18} color={item.color} />
                  </View>
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

  // ── Guest ──
  guestHero: {
    paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40,
    alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  guestIconCircle: {
    width: 80, height: 80, borderRadius: 28,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, ...theme.shadows.lg,
  },
  guestTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  guestSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 21 },
  guestActions: {
    paddingHorizontal: 24, paddingTop: 32, gap: 12,
  },
  guestBtn: {
    backgroundColor: theme.colors.primary, height: 52,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadows.colored,
  },
  guestBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  guestBtnOutline: {
    height: 52, borderRadius: theme.borderRadius.xl,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.colors.primary,
  },
  guestBtnOutlineText: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },

  // ── Header ──
  header: {
    paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  editBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarRing: {
    padding: 3, borderRadius: 40,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff',
  },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 3 },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // ── Stats ──
  statsContainer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, marginTop: -20,
    marginBottom: 8,
  },
  statCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 16,
    ...theme.shadows.md,
  },
  statIconCircle: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },

  // ── Menu ──
  menuGroup: { paddingHorizontal: 20, marginTop: 20 },
  menuGroupLabel: {
    fontSize: 12, fontWeight: '700', color: theme.colors.textLight,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl, paddingHorizontal: 4,
    ...theme.shadows.sm,
  },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconCircle: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { fontSize: 15, color: theme.colors.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: {
    backgroundColor: theme.colors.primary, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, minWidth: 22, alignItems: 'center',
  },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 28, paddingVertical: 14,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.errorMuted,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: theme.colors.error },
  version: { fontSize: 11, color: theme.colors.textLight, textAlign: 'center', marginTop: 16 },
});
