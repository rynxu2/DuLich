import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBookingDetail } from '../hooks/useBookings';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

export default function PaymentScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: booking, isLoading } = useBookingDetail(bookingId);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.textLight }}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Icon name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={{ marginTop: 12, color: theme.colors.text }}>Không tìm thấy đơn đặt tour</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Quay Lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác Nhận Đặt Tour</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successCircle}>
            <Icon name="check-circle" size={64} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Đặt tour thành công!</Text>
          <Text style={styles.successSubtitle}>
            {booking.paymentMethod === 'SEPAY'
              ? 'Đã thanh toán qua chuyển khoản ngân hàng'
              : booking.paymentMethod === 'VTCPAY'
              ? 'Đã thanh toán qua thẻ ngân hàng'
              : 'Vui lòng thanh toán tiền mặt khi gặp hướng dẫn viên'}
          </Text>
        </View>

        {/* Booking Info Card */}
        <View style={styles.bookingCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Mã Đơn (Booking ID)</Text>
            <Text style={styles.cardValue}>#{booking.id}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Tour</Text>
            <Text style={[styles.cardValue, {flex: 1, textAlign: 'right', marginLeft: 16}]} numberOfLines={2}>
              {booking.tourTitle || `Tour ID #${booking.tourId}`}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Phương thức</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon
                name={booking.paymentMethod === 'SEPAY' ? 'bank-transfer' : booking.paymentMethod === 'VTCPAY' ? 'credit-card' : 'cash'}
                size={18}
                color={booking.paymentMethod === 'SEPAY' ? '#2563EB' : booking.paymentMethod === 'VTCPAY' ? '#DC2626' : theme.colors.success}
              />
              <Text style={styles.cardValue}>
                {booking.paymentMethod === 'SEPAY' ? 'Chuyển khoản' : booking.paymentMethod === 'VTCPAY' ? 'Thẻ ATM/Visa' : 'Tiền mặt'}
              </Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Trạng thái</Text>
            <View style={[
              styles.statusBadge,
              booking.paymentStatus === 'PAID'
                ? { backgroundColor: theme.colors.success + '20' }
                : { backgroundColor: theme.colors.warning + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                booking.paymentStatus === 'PAID'
                  ? { color: theme.colors.success }
                  : { color: theme.colors.warning }
              ]}>
                {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.totalLabel}>Tổng Tiền</Text>
            <Text style={styles.totalValue}>{formatPrice(booking.totalPrice)}</Text>
          </View>
        </View>

        {/* Payment Instructions — only for CASH */}
        {booking.paymentMethod === 'CASH' && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Hướng dẫn thanh toán</Text>
            
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepText}>Lưu lại mã đơn hàng <Text style={{ fontWeight: '700' }}>#{booking.id}</Text></Text>
            </View>
            
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepText}>Thanh toán tiền mặt khi gặp hướng dẫn viên vào ngày khởi hành</Text>
            </View>
            
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepText}>Nhận biên lai xác nhận thanh toán từ nhân viên</Text>
            </View>
          </View>
        )}

        {/* Note */}
        <View style={styles.alertBox}>
          <Icon name="information" size={20} color={theme.colors.warning} />
          <Text style={styles.alertText}>
            {(booking.paymentMethod === 'SEPAY' || booking.paymentMethod === 'VTCPAY') && booking.paymentStatus === 'PAID'
              ? 'Giao dịch đã được xác nhận. Vui lòng giữ biên lai điện tử này.'
              : 'Đơn hàng sẽ được giữ chỗ trong 24 giờ. Nếu không thanh toán, đơn sẽ tự động hủy.'}
          </Text>
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}>
          <Icon name="home" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>Về Trang Chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  backBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.surfaceVariant, borderRadius: 20 },
  backBtnText: { ...theme.typography.button, color: theme.colors.text },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  content: { padding: 20, paddingBottom: 100 },

  successSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 24 },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 8 },
  successSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center' },

  bookingCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
    marginBottom: 20,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  cardLabel: { ...theme.typography.body, color: theme.colors.textSecondary },
  cardValue: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  statusBadge: { backgroundColor: theme.colors.warning + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { ...theme.typography.caption, color: theme.colors.warning, fontWeight: '700' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
  totalLabel: { ...theme.typography.h3, color: theme.colors.text },
  totalValue: { fontSize: 24, fontWeight: '800', color: theme.colors.accent },

  instructionCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20,
    elevation: 1, marginBottom: 20,
  },
  instructionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepText: { ...theme.typography.body, color: theme.colors.text, flex: 1, lineHeight: 22 },

  alertBox: {
    flexDirection: 'row', gap: 10, backgroundColor: theme.colors.warning + '15',
    padding: 16, borderRadius: theme.borderRadius.md,
    borderWidth: 1, borderColor: theme.colors.warning + '40',
  },
  alertText: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1, lineHeight: 20 },

  bottomBar: {
    padding: 20, backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  homeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  homeButtonText: { ...theme.typography.button, color: '#fff' },
});
