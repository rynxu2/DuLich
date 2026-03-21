/**
 * Profile Screen — User info, booking stats, settings with connected menu items
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../store/AuthContext';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ bookings: 0, reviews: 0, favorites: 0 });

  useFocusEffect(
    useCallback(() => {
      // Simulate stats loading
      setStats({ bookings: 3, reviews: 2, favorites: 2 });
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Đăng Xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: 'account-edit-outline', label: 'Chỉnh sửa hồ sơ', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'heart-outline', label: 'Tour yêu thích', onPress: () => navigation.navigate('Favorites'), badge: stats.favorites },
    { icon: 'credit-card-outline', label: 'Phương thức thanh toán', onPress: () => Alert.alert('Thanh Toán', 'Tính năng sẽ sớm ra mắt!') },
    { icon: 'headphones', label: 'Phản hồi & Hỗ trợ', onPress: () => navigation.navigate('Feedback') },
    { icon: 'cog-outline', label: 'Cài đặt', onPress: () => Alert.alert('Cài Đặt', 'Tính năng sẽ sớm ra mắt!') },
    { icon: 'information-outline', label: 'Về ứng dụng', onPress: () => Alert.alert('DuLịch App', 'Phiên bản 1.0.0\n\nỨng dụng đặt tour du lịch Việt Nam.\n\n© 2026 DuLịch App Team') },
  ];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="account" size={48} color="#fff" />
          </View>
        </View>
        <Text style={styles.username}>{user?.fullName || user?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <TouchableOpacity style={styles.statItem}>
          <Icon name="bag-suitcase" size={24} color={theme.colors.primary} />
          <Text style={styles.statValue}>{stats.bookings}</Text>
          <Text style={styles.statLabel}>Chuyến đi</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem}>
          <Icon name="star" size={24} color={theme.colors.star} />
          <Text style={styles.statValue}>{stats.reviews}</Text>
          <Text style={styles.statLabel}>Đánh giá</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Favorites')}>
          <Icon name="heart" size={24} color={theme.colors.accent} />
          <Text style={styles.statValue}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>Yêu thích</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <Icon name={item.icon} size={20} color={theme.colors.primary} />
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

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Icon name="logout" size={20} color={theme.colors.error} />
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>

      <Text style={styles.version}>DuLịch App v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  profileHeader: {
    alignItems: 'center', paddingVertical: 24,
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  avatarContainer: { marginBottom: 12 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  username: { ...theme.typography.h2, color: theme.colors.text },
  email: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  phone: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  roleBadge: {
    backgroundColor: theme.colors.primary + '15', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
  },
  roleText: { ...theme.typography.caption, color: theme.colors.primary },
  statsCard: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    paddingVertical: 18, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 6 },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: theme.colors.border },
  menuSection: { marginTop: 16 },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconBg: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { ...theme.typography.body, color: theme.colors.text },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: {
    backgroundColor: theme.colors.accent, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 24, paddingVertical: 14,
    borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.error,
  },
  logoutText: { ...theme.typography.button, color: theme.colors.error },
  version: { ...theme.typography.caption, color: theme.colors.textLight, textAlign: 'center', marginTop: 16, marginBottom: 32 },
});
