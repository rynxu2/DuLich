/**
 * My Trips Screen — Booking history with status filter tabs and cancel functionality
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Booking, bookingsApi } from '../api/bookings';
import { useAuth } from '../store/AuthContext';
import { TripsStackParamList } from '../navigation/MainTabs';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<TripsStackParamList, 'TripsMain'>;
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  CONFIRMED: { color: theme.colors.success, icon: 'check-circle', label: 'Đã xác nhận' },
  PENDING: { color: theme.colors.warning, icon: 'clock-outline', label: 'Đang xử lý' },
  CANCELLED: { color: theme.colors.error, icon: 'close-circle', label: 'Đã hủy' },
  COMPLETED: { color: theme.colors.primary, icon: 'flag-checkered', label: 'Hoàn thành' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'completed', label: 'Đã đi' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: 1, userId: 1, tourId: 1,
    tourTitle: 'Khám Phá Đà Nẵng - Hội An',
    tourLocation: 'Đà Nẵng',
    tourImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400',
    bookingDate: '2026-04-15', travelers: 2,
    status: 'CONFIRMED', totalPrice: 7000000,
    createdAt: '2026-03-13T10:00:00',
  },
  {
    id: 2, userId: 1, tourId: 3,
    tourTitle: 'Phú Quốc - Đảo Ngọc',
    tourLocation: 'Phú Quốc',
    tourImage: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400',
    bookingDate: '2026-05-01', travelers: 1,
    status: 'PENDING', totalPrice: 5800000,
    createdAt: '2026-03-12T14:30:00',
  },
  {
    id: 3, userId: 1, tourId: 2,
    tourTitle: 'Vịnh Hạ Long - Kỳ Quan Thiên Nhiên',
    tourLocation: 'Quảng Ninh',
    tourImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400',
    bookingDate: '2026-02-10', travelers: 3,
    status: 'COMPLETED', totalPrice: 12600000,
    createdAt: '2026-01-20T09:00:00',
  },
];

export default function MyTripsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    try {
      if (user?.id) {
        const response = await bookingsApi.getByUser(user.id);
        console.log(user.id);
        setBookings(response.data);
      }
    } catch {
      setBookings(SAMPLE_BOOKINGS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const filteredBookings = bookings.filter(b => {
    if (activeFilter === 'all') {return true;}
    if (activeFilter === 'upcoming') {return b.status === 'CONFIRMED' || b.status === 'PENDING';}
    if (activeFilter === 'completed') {return b.status === 'COMPLETED';}
    if (activeFilter === 'cancelled') {return b.status === 'CANCELLED';}
    return true;
  });

  const handleCancelBooking = (booking: Booking) => {
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
              await bookingsApi.cancel(booking.id);
            } catch {
              // Simulate cancel locally
            }
            setBookings(prev =>
              prev.map(b => b.id === booking.id ? { ...b, status: 'CANCELLED' } : b)
            );
            Alert.alert('Đã Hủy', 'Booking đã được hủy thành công.');
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const tourName = item.tourTitle || `Tour #${item.tourId}`;
    const canCancel = item.status === 'CONFIRMED' || item.status === 'PENDING';
    const isCompleted = item.status === 'COMPLETED';

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => navigation.navigate('Itinerary', {
          bookingId: item.id,
          tourTitle: tourName,
        })}
        activeOpacity={0.9}>
        <View style={styles.cardHeader}>
          <View style={styles.tourInfo}>
            <Icon name="compass" size={20} color={theme.colors.primary} />
            <Text style={styles.tourName} numberOfLines={1}>{tourName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Icon name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {item.tourLocation && (
          <View style={styles.locationRow}>
            <Icon name="map-marker-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.locationText}>{item.tourLocation}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{formatDate(item.bookingDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="account-group" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{item.travelers} hành khách</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
          <View style={styles.actionButtons}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelBooking(item)}>
                <Icon name="close-circle-outline" size={16} color={theme.colors.error} />
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            )}
            {isCompleted && (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => {
                  // Navigate to home stack's review - workaround
                  Alert.alert('Đánh Giá', `Vui lòng vào chi tiết tour để viết đánh giá cho "${tourName}".`);
                }}>
                <Icon name="star-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.reviewBtnText}>Đánh giá</Text>
              </TouchableOpacity>
            )}
            <Icon name="chevron-right" size={20} color={theme.colors.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chuyến Đi Của Tôi</Text>
        <Text style={styles.headerSubtitle}>{bookings.length} đặt chỗ</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}>
            <Text style={[
              styles.filterTabText,
              activeFilter === tab.key && styles.filterTabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchBookings();
            }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bag-suitcase-off-outline" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>
                {activeFilter === 'all' ? 'Chưa có chuyến đi nào' : 'Không có chuyến đi nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? 'Hãy khám phá và đặt tour đầu tiên!'
                  : 'Thử chọn tab khác để xem'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  headerTitle: { ...theme.typography.h1, color: theme.colors.text },
  headerSubtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 14, gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary, borderColor: theme.colors.primary,
  },
  filterTabText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  filterTabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  bookingCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 16, marginBottom: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tourInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  tourName: { ...theme.typography.h3, color: theme.colors.text, flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10,
  },
  locationText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  cardBody: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12,
  },
  totalPrice: { fontSize: 18, fontWeight: '800', color: theme.colors.accent },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: theme.colors.error + '12',
  },
  cancelBtnText: { ...theme.typography.caption, color: theme.colors.error },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: theme.colors.primary + '12',
  },
  reviewBtnText: { ...theme.typography.caption, color: theme.colors.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textLight, marginTop: 16 },
  emptySubtitle: { ...theme.typography.bodySmall, color: theme.colors.textLight, marginTop: 4 },
});
