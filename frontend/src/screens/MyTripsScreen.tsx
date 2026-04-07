/**
 * Premium My Trips Screen — Redesigned with Ticket-style cards
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingResponse } from '../api/bookings';
import { useUserBookings, useCancelBooking } from '../hooks/useBookings';
import { MainTabParamList } from '../navigation/MainTabs';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'MyTripsTab'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
  CONFIRMED: { color: '#059669', bgColor: '#D1FAE5', icon: 'check-decagram', label: 'Đã xác nhận' },
  PENDING: { color: '#D97706', bgColor: '#FEF3C7', icon: 'clock-outline', label: 'Chờ xử lý' },
  CANCELLED: { color: '#DC2626', bgColor: '#FEE2E2', icon: 'close-circle', label: 'Đã hủy' },
  COMPLETED: { color: '#2563EB', bgColor: '#DBEAFE', icon: 'flag-checkered', label: 'Đã hoàn thành' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'completed', label: 'Đã đi' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function MyTripsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: bookings = [], isLoading: loading, isRefetching, refetch } = useUserBookings();
  const { mutateAsync: cancelBooking } = useCancelBooking();

  const filteredBookings = bookings.filter(b => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'upcoming') return b.status === 'CONFIRMED' || b.status === 'PENDING';
    if (activeFilter === 'completed') return b.status === 'COMPLETED';
    if (activeFilter === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const handleCancelBooking = (booking: BookingResponse) => {
    Alert.alert(
      'Hủy Booking',
      `Bạn có chắc muốn hủy "${booking.tourTitle || `Tour #${booking.tourId}`}"?\n\nLưu ý: Chính sách hoàn tiền sẽ áp dụng theo quy định.`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy Booking',
          style: 'destructive',
          onPress: async () => {
             try {
               await cancelBooking(booking.id);
               Alert.alert('Đã Hủy', 'Booking đã được hủy thành công.');
             } catch {
               Alert.alert('Lỗi', 'Không thể hủy booking. Vui lòng thử lại.');
             }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderBooking = ({ item }: { item: BookingResponse }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const tourName = item.tourTitle || `Tour #${item.tourId}`;
    const canCancel = item.status === 'CONFIRMED' || item.status === 'PENDING';
    const isCompleted = item.status === 'COMPLETED';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Itinerary', { bookingId: item.id, tourTitle: tourName })}
        activeOpacity={0.95}>
        
        {/* Ticket Header Image */}
        <View style={styles.cardImageContainer}>
          <Image source={{ uri: item.tourImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600' }} style={styles.cardImage} />
          <View style={styles.cardOverlay} />
          <View style={[styles.badge, { backgroundColor: status.bgColor }]}>
             <Icon name={status.icon} size={14} color={status.color} />
             <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Ticket Content */}
        <View style={styles.cardContent}>
          <Text style={styles.tourName} numberOfLines={2}>{tourName}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{formatDate(item.bookingDate)}</Text>
            <View style={styles.dot} />
            <Text style={styles.infoText}>{item.travelers} hành khách</Text>
            <View style={styles.dot} />
            <Icon name="credit-card-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>{item.paymentMethod}</Text>
          </View>

          {/* Dotted separator for ticket effect */}
          <View style={styles.ticketSeparator}>
             <View style={styles.ticketNotchLeft} />
             <View style={styles.ticketDashedLine} />
             <View style={styles.ticketNotchRight} />
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Tổng thanh toán</Text>
              <Text style={styles.price}>{formatPrice(item.totalPrice)}</Text>
            </View>
            <View style={[styles.paymentStatusBadge, { backgroundColor: item.paymentStatus === 'PAID' ? '#10B98115' : '#F59E0B15' }]}>
               <Text style={[styles.paymentStatusText, { color: item.paymentStatus === 'PAID' ? '#10B981' : '#F59E0B' }]}>
                 {item.paymentStatus === 'PAID' ? 'Đã thu tiền' : 'Chưa thanh toán'}
               </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {canCancel && (
              <TouchableOpacity style={styles.btnOutline} onPress={() => handleCancelBooking(item)}>
                <Text style={styles.btnOutlineText}>Hủy chuyến</Text>
              </TouchableOpacity>
            )}
            {item.status === 'PENDING' && item.paymentStatus === 'UNPAID' && item.paymentMethod !== 'CASH' && (
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#F59E0B' }]} onPress={() => navigation.navigate('Payment', { bookingId: item.id })}>
                <Text style={styles.btnPrimaryText}>Thanh toán ngay</Text>
              </TouchableOpacity>
            )}
            {isCompleted && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => Alert.alert('Đánh Giá', `Vui lòng vào chi tiết tour để viết đánh giá cho "${tourName}".`)}>
                <Text style={styles.btnPrimaryText}>Đánh giá</Text>
              </TouchableOpacity>
            )}
            {!(item.status === 'PENDING' && item.paymentStatus === 'UNPAID' && item.paymentMethod !== 'CASH') && !isCompleted && !canCancel && (
              <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Itinerary', { bookingId: item.id, tourTitle: tourName })}>
                <Text style={styles.btnOutlineText}>Xem chi tiết</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chuyến Đi</Text>
      </View>

      {/* Modern Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}>
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Icon name="bag-suitcase-off-outline" size={64} color={theme.colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'all' ? 'Chưa có chuyến đi nào' : 'Không có dữ liệu'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? 'Khi bạn đặt vé, chuyến đi của bạn sẽ xuất hiện tại đây.'
                  : 'Hãy xem lại các mục khác nhé.'}
              </Text>
              {activeFilter === 'all' && (
                <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('HomeTab')}>
                  <Text style={styles.exploreBtnText}>Bắt đầu tìm kiếm</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { ...theme.typography.h1, fontSize: 32, color: theme.colors.text },
  
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  filterTab: { paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: theme.colors.primary },
  filterTabText: { ...theme.typography.body, color: theme.colors.textSecondary, fontWeight: '500' },
  filterTabTextActive: { color: theme.colors.text, fontWeight: '700' },

  list: { paddingHorizontal: 20, paddingBottom: 30 },
  
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 16,
    ...theme.shadows.md,
  },
  cardImageContainer: { height: 150, width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.2)' },
  badge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: '700' },

  cardContent: { padding: 20 },
  tourName: { ...theme.typography.h2, fontSize: 20, color: theme.colors.text, marginBottom: 8, lineHeight: 26 },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  infoText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, fontWeight: '500' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.textLight },

  ticketSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, marginHorizontal: -20, overflow: 'hidden' },
  ticketNotchLeft: { width: 10, height: 20, backgroundColor: theme.colors.background, borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  ticketNotchRight: { width: 10, height: 20, backgroundColor: theme.colors.background, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  ticketDashedLine: { flex: 1, height: 1, borderRadius: 1, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', marginHorizontal: 6 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  priceLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 2 },
  price: { fontSize: 20, fontWeight: '800', color: theme.colors.accent },
  paymentStatusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  paymentStatusText: { fontSize: 12, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnOutline: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  btnOutlineText: { ...theme.typography.button, color: theme.colors.textSecondary, fontSize: 13 },
  btnPrimary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.primary, alignItems: 'center' },
  btnPrimaryText: { ...theme.typography.button, color: '#fff', fontSize: 13 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 8 },
  emptySubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
  exploreBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, backgroundColor: theme.colors.text },
  exploreBtnText: { ...theme.typography.button, color: '#fff' },
});
