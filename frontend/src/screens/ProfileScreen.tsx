/**
 * Premium Profile Screen — Redesigned with modern groups, stats, and a beautiful header
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useUserBookings } from '../hooks/useBookings';
import { useFavorites } from '../hooks/useFavorites';
import { useUserReviews } from '../hooks/useReviews';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const COVER_IMAGE = 'https://images.unsplash.com/photo-1506744626753-14cad6d7cb49?w=800'; // Beautiful nature cover

export default function ProfileScreen({ navigation }: Props) {
  const { user, login, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const { data: bookings = [] } = useUserBookings();
  const { data: favorites = [] } = useFavorites();
  const { data: reviews = [] } = useUserReviews();

  const stats = {
    bookings: bookings.length,
    favorites: favorites.length,
    reviews: reviews.length,
  };

  const handleLogout = () => {
    Alert.alert('Đăng Xuất', 'Bạn có chắc muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const RENDER_MENU = [
    {
      title: 'Tài Khoản',
      items: [
        { icon: 'account-edit-outline', label: 'Thông tin cá nhân', onPress: () => navigation.navigate('EditProfile'), color: '#3B82F6', iconBg: '#EFF6FF' },
        { icon: 'heart-outline', label: 'Tour yêu thích', onPress: () => navigation.navigate('Favorites'), badge: stats.favorites, color: '#EC4899', iconBg: '#FDF2F8' },
        { icon: 'credit-card-outline', label: 'Thanh toán & Hóa đơn', onPress: () => Alert.alert('Thanh Toán', 'Tính năng sẽ sớm ra mắt!'), color: '#10B981', iconBg: '#ECFDF5' },
      ]
    },
    {
      title: 'Cài Đặt & Hỗ Trợ',
      items: [
        { icon: 'headphones', label: 'Trung tâm trợ giúp', onPress: () => navigation.navigate('Feedback'), color: '#F59E0B', iconBg: '#FFFBEB' },
        { icon: 'cog-outline', label: 'Cài đặt ứng dụng', onPress: () => Alert.alert('Cài Đặt', 'Tính năng đang được xây dựng!'), color: '#6366F1', iconBg: '#EEF2FF' },
        { icon: 'information-outline', label: 'Về DuLịch App', onPress: () => Alert.alert('DuLịch App', 'Phiên bản 1.0.0\n\nỨng dụng đặt tour du lịch Việt Nam.\n\n© 2026 DuLịch App Team'), color: '#8B5CF6', iconBg: '#F5F3FF' },
      ]
    }
  ];

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="account-circle-outline" size={100} color={theme.colors.border} />
        <Text style={styles.guestTitle}>Chào mừng bạn!</Text>
        <Text style={styles.guestSubtitle}>Đăng nhập để quản lý mã đặt chỗ, xem tour yêu thích và thiết lập hồ sơ.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
           <Text style={styles.loginBtnText}>Đăng Nhập / Đăng Ký</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Cover and Avatar Header */}
      <View style={styles.headerArea}>
        <Image source={{ uri: COVER_IMAGE }} style={styles.coverImage} />
        <View style={styles.coverOverlay} />
        
        {/* Actions on Top */}
        <View style={[styles.topActions, { top: insets.top + 10 }]}>
           <Text style={styles.headerTitle}>Hồ Sơ</Text>
           <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
             <Icon name="pencil-circle" size={36} color="#ffffff" style={styles.editIconShadow} />
           </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                <Icon name="account" size={48} color={theme.colors.textLight} />
              </View>
            )}
            {/* VIP/Role Badge overlapping avatar */}
            <View style={styles.vipBadge}>
              <Icon name="crown" size={12} color="#fff" />
              <Text style={styles.vipBadgeText}>{user.role || 'GUEST'}</Text>
            </View>
          </View>

          <Text style={styles.username}>{user.fullName || user.username || 'Traveler'}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone && <Text style={styles.phone}>{user.phone}</Text>}
        </View>
      </View>

      {/* Stats Blocks */}
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statBlock} onPress={() => navigation.navigate('MyTripsTab')}>
          <View style={[styles.statIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name="bag-suitcase" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.statValue}>{stats.bookings}</Text>
          <Text style={styles.statLabel}>Chuyến đi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statBlock} onPress={() => navigation.navigate('Feedback')}>
          <View style={[styles.statIconBg, { backgroundColor: theme.colors.star + '20' }]}>
            <Icon name="star" size={24} color={theme.colors.star} />
          </View>
          <Text style={styles.statValue}>{stats.reviews}</Text>
          <Text style={styles.statLabel}>Đánh giá</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statBlock} onPress={() => navigation.navigate('Favorites')}>
          <View style={[styles.statIconBg, { backgroundColor: theme.colors.error + '15' }]}>
            <Icon name="heart" size={24} color={theme.colors.error} />
          </View>
          <Text style={styles.statValue}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>Yêu thích</Text>
        </TouchableOpacity>
      </View>

      {/* Grouped Menus */}
      <View style={styles.menuGroupsWrapper}>
        {RENDER_MENU.map((group, groupIndex) => (
          <View key={`group-${groupIndex}`} style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            
            <View style={styles.menuGroupCard}>
              {group.items.map((item, index) => (
                <TouchableOpacity 
                  key={`item-${index}`} 
                  style={[styles.menuItem, index < group.items.length - 1 && styles.menuItemBorder]} 
                  onPress={item.onPress} 
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIconBg, { backgroundColor: item.iconBg }]}>
                      <Icon name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge ? (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                    <Icon name="chevron-right" size={22} color={theme.colors.border} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Icon name="logout" size={22} color={theme.colors.error} />
        <Text style={styles.logoutText}>Đăng Xuất Tài Khoản</Text>
      </TouchableOpacity>

      <Text style={styles.version}>DuLịch App Phiên bản 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  
  guestTitle: { ...theme.typography.h1, color: theme.colors.text, marginTop: 20, marginBottom: 8 },
  guestSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginBottom: 30, lineHeight: 22 },
  loginBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 24, elevation: 3 },
  loginBtnText: { ...theme.typography.button, color: '#fff', fontSize: 16 },

  headerArea: { paddingBottom: 24, backgroundColor: '#fff', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  coverImage: { width: '100%', height: 180, position: 'absolute', top: 0 },
  coverOverlay: { width: '100%', height: 180, position: 'absolute', top: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  
  topActions: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  headerTitle: { ...theme.typography.h2, color: '#fff', fontSize: 24, letterSpacing: 0.5 },
  editIconShadow: { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  avatarSection: { alignItems: 'center', marginTop: 120 },
  avatarContainer: { marginBottom: 16, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  vipBadge: { position: 'absolute', bottom: -6, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  vipBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' },

  username: { ...theme.typography.h1, fontSize: 26, color: theme.colors.text, marginBottom: 4 },
  email: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: 2 },
  phone: { ...theme.typography.body, color: theme.colors.textSecondary },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, gap: 12 },
  statBlock: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  statIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '500' },

  menuGroupsWrapper: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 },
  menuGroup: { marginBottom: 24 },
  menuGroupTitle: { ...theme.typography.h3, color: theme.colors.textSecondary, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8, marginBottom: 12 },
  menuGroupCard: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { ...theme.typography.body, color: theme.colors.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: { backgroundColor: theme.colors.error, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  menuBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, marginBottom: 20, paddingVertical: 16, backgroundColor: '#FEF2F2', borderRadius: 20 },
  logoutText: { ...theme.typography.h3, color: theme.colors.error, fontSize: 16 },
  
  version: { ...theme.typography.caption, color: theme.colors.textLight, textAlign: 'center', marginBottom: 40 },
});
