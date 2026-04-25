import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentStatus } from '../api/payments';
import { usePaymentDetail } from '../hooks/usePayments';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PaymentDetail'>;
  route: RouteProp<RootStackParamList, 'PaymentDetail'>;
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function formatDate(date?: string) {
  if (!date) return '--';
  return new Date(date).toLocaleString('vi-VN');
}

function getStatusColor(status: PaymentStatus) {
  if (status === 'SUCCESS') return theme.colors.success;
  if (status === 'FAILED') return theme.colors.error;
  if (status === 'REFUNDED') return '#7C3AED';
  if (status === 'PROCESSING') return theme.colors.info;
  return theme.colors.warning;
}

export default function PaymentDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { paymentId } = route.params;
  const { data: payment, isLoading } = usePaymentDetail(paymentId);

  if (isLoading) {
    return (
      <View style={[styles.centerContent, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={[styles.centerContent, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        <Icon name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.emptyTitle}>Không tìm thấy giao dịch</Text>
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
        <Text style={styles.headerTitle}>Chi Tiết Thanh Toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Số tiền giao dịch</Text>
          <Text style={styles.amountValue}>{formatPrice(payment.amount)}</Text>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
              {STATUS_LABEL[payment.status]}
            </Text>
          </View>
        </View>

        <View style={styles.detailCard}>
          <Row label="Mã giao dịch" value={`#${payment.id}`} />
          <Row label="Booking ID" value={`#${payment.bookingId}`} />
          <Row label="Phương thức" value={payment.paymentMethod} />
          <Row label="Loại tiền" value={payment.currency} />
          <Row label="Provider Txn ID" value={payment.providerTransactionId || '--'} />
          <Row label="Thời gian tạo" value={formatDate(payment.createdAt)} />
          <Row label="Thanh toán lúc" value={formatDate(payment.paidAt)} />
          <Row label="Cập nhật lần cuối" value={formatDate(payment.updatedAt)} />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  content: { padding: 20, paddingBottom: 80 },
  amountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  amountLabel: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginBottom: 8 },
  amountValue: { ...theme.typography.priceLg, color: theme.colors.accent, marginBottom: 10 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    ...theme.shadows.sm,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  detailLabel: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  detailValue: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '700', marginLeft: 12, flexShrink: 1, textAlign: 'right' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, marginTop: 12 },
  backBtn: { marginTop: 18, backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  backBtnText: { ...theme.typography.button, color: theme.colors.text },
});
