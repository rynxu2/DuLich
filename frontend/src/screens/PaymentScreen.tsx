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
        <Text style={{ marginTop: 12, color: theme.colors.textLight }}>Đang tải thông tin thanh toán...</Text>
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

  const getPaymentLogo = (method: string) => {
    switch(method) {
      case 'VNPAY': return 'credit-card-outline';
      case 'MOMO': return 'wallet-outline';
      case 'ZALOPAY': return 'cellphone';
      default: return 'cash';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán Đơn Hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.alertBox}>
          <Icon name="information" size={20} color={theme.colors.warning} />
          <Text style={styles.alertText}>
            Vui lòng hoàn tất thanh toán trong 30 phút để giữ chỗ. Quá thời gian, đơn sẽ tự động hủy.
          </Text>
        </View>

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
              <Icon name={getPaymentLogo(booking.paymentMethod)} size={18} color={theme.colors.primary} />
              <Text style={styles.cardValue}>{booking.paymentMethod}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.totalLabel}>Tổng Tiền</Text>
            <Text style={styles.totalValue}>{formatPrice(booking.totalPrice)}</Text>
          </View>
        </View>

        {/* QR Code Placeholder */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Quét Mã QR</Text>
          <Text style={styles.qrSubtitle}>Mở ứng dụng {booking.paymentMethod} để quét mã thanh toán</Text>
          <View style={styles.qrBox}>
            <Icon name="qrcode-scan" size={160} color={theme.colors.primary} />
            <Text style={styles.qrNote}>Mã QR tự động làm mới sau 5 phút</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.popToTop()}>
          <Text style={styles.cancelButtonText}>Thanh toán sau</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            // Mock payment confirm
            navigation.popToTop();
          }}>
          <Text style={styles.confirmButtonText}>Đã Thanh Toán</Text>
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
  content: { padding: 20 },
  alertBox: {
    flexDirection: 'row', gap: 10, backgroundColor: theme.colors.warning + '15',
    padding: 16, borderRadius: theme.borderRadius.md, marginBottom: 20,
    borderWidth: 1, borderColor: theme.colors.warning + '40',
  },
  alertText: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1, lineHeight: 20 },
  bookingCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
    marginBottom: 24,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  cardLabel: { ...theme.typography.body, color: theme.colors.textSecondary },
  cardValue: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
  totalLabel: { ...theme.typography.h3, color: theme.colors.text },
  totalValue: { fontSize: 24, fontWeight: '800', color: theme.colors.accent },
  qrSection: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 24, elevation: 1 },
  qrTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 6 },
  qrSubtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  qrBox: { alignItems: 'center', justifyContent: 'center', padding: 24, borderWidth: 2, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, borderStyle: 'dashed' },
  qrNote: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: 16 },
  bottomBar: {
    flexDirection: 'row', padding: 20, gap: 12, backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1, paddingVertical: 14, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant, alignItems: 'center',
  },
  cancelButtonText: { ...theme.typography.button, color: theme.colors.text },
  confirmButton: {
    flex: 2, paddingVertical: 14, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary, alignItems: 'center',
  },
  confirmButtonText: { ...theme.typography.button, color: '#fff' },
});
