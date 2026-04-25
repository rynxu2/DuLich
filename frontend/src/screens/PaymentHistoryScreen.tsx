import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Payment, PaymentStatus } from '../api/payments';
import { useUserPayments } from '../hooks/usePayments';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PaymentHistory'>;
};

const STATUS_STYLE: Record<PaymentStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: '#D97706', bg: '#FEF3C7', icon: 'clock-outline' },
  PROCESSING: { label: 'Đang xử lý', color: theme.colors.info, bg: theme.colors.infoMuted, icon: 'progress-clock' },
  SUCCESS: { label: 'Thành công', color: theme.colors.success, bg: theme.colors.successMuted, icon: 'check-circle' },
  FAILED: { label: 'Thất bại', color: theme.colors.error, bg: theme.colors.errorMuted, icon: 'close-circle' },
  REFUNDED: { label: 'Đã hoàn tiền', color: '#7C3AED', bg: '#EDE9FE', icon: 'cash-refund' },
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function formatDate(date?: string) {
  if (!date) return '--';
  return new Date(date).toLocaleString('vi-VN');
}

export default function PaymentHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: payments = [], isLoading, isRefetching, refetch } = useUserPayments();

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const status = STATUS_STYLE[item.status];

    return (
      <TouchableOpacity
        style={styles.paymentCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('PaymentDetail', { paymentId: item.id })}
      >
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentId}>Giao dịch #{item.id}</Text>
            <Text style={styles.subText}>Booking #{item.bookingId}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.amount}>{formatPrice(item.amount)}</Text>
          <Text style={styles.method}>{item.paymentMethod}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.timeText}>Tạo lúc: {formatDate(item.createdAt)}</Text>
          <Icon name="chevron-right" size={20} color={theme.colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch Sử Thanh Toán</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
          <Icon
            name={isRefetching ? 'loading' : 'refresh'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Icon name="receipt-text-outline" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>Chưa có lịch sử thanh toán</Text>
              <Text style={styles.emptySubTitle}>Các giao dịch của bạn sẽ xuất hiện tại đây.</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backButton: { padding: 8 },
  refreshButton: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  listContent: { padding: 20, paddingBottom: 80 },
  paymentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  paymentId: { ...theme.typography.h3, color: theme.colors.text },
  subText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  amount: { ...theme.typography.price, color: theme.colors.accent },
  method: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, fontWeight: '700' },
  timeText: { ...theme.typography.caption, color: theme.colors.textLight },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, marginTop: 14 },
  emptySubTitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 6 },
});
