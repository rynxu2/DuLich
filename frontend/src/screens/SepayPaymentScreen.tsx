/**
 * SePay Payment Screen — Bank transfer via VietQR
 * 
 * Displays a VietQR code for bank transfer and polls payment status.
 * Includes a "Simulate Payment" button for dev/testing.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, Alert, AppState,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paymentsApi } from '../api/payments';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SepayPayment'>;
  route: RouteProp<RootStackParamList, 'SepayPayment'>;
};

const POLL_INTERVAL = 4000; // 4 seconds
const TIMEOUT_MINUTES = 15;

export default function SepayPaymentScreen({ navigation, route }: Props) {
  const { bookingId, checkoutUrl, qrCode, amount } = route.params;
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'waiting' | 'success' | 'failed' | 'timeout'>('waiting');
  const [elapsed, setElapsed] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await paymentsApi.getByBooking(bookingId);
      const payments = res.data;
      const sepayPayment = payments.find(p => p.paymentMethod === 'SEPAY');
      
      if (sepayPayment) {
        if (sepayPayment.status === 'SUCCESS') {
          setStatus('success');
          return true;
        }
        if (sepayPayment.status === 'FAILED') {
          setStatus('failed');
          return true;
        }
      }
    } catch (e) {
      // Silent fail — will retry on next poll
    }
    return false;
  }, [bookingId]);

  // Start polling when screen mounts
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const done = await checkPaymentStatus();
      if (done && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, POLL_INTERVAL);

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= TIMEOUT_MINUTES * 60) {
          setStatus('timeout');
          return prev; // Stop incrementing after timeout
        }
        return next;
      });
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkPaymentStatus]);

  // Also check when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && status === 'waiting') {
        checkPaymentStatus();
      }
    });
    return () => subscription.remove();
  }, [checkPaymentStatus, status]);

  // Stop polling on terminal states
  useEffect(() => {
    if (status !== 'waiting') {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [status]);

  // Auto-redirect to order detail on success
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Navigate when countdown reaches 0 (outside of state setter)
  useEffect(() => {
    if (redirectCountdown === 0 && status === 'success') {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'MyTripsTab' } }] });
    }
  }, [redirectCountdown, status, navigation]);

  const formatElapsed = () => {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate payment (dev/demo)
  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await paymentsApi.simulatePayment(bookingId);
      // Poll immediately to detect the change
      await checkPaymentStatus();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể giả lập thanh toán');
    } finally {
      setSimulating(false);
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <View style={styles.successCircle}>
            <Icon name="check-circle" size={80} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Thanh toán thành công!</Text>
          <Text style={styles.successSubtitle}>
            Đơn hàng #{bookingId} đã được thanh toán{'\n'}qua chuyển khoản ngân hàng
          </Text>
          <Text style={styles.successAmount}>{formatPrice(amount)}</Text>

          <View style={styles.redirectNotice}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.redirectText}>
              Tự động chuyển đến Chuyến đi sau {redirectCountdown}s...
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'MyTripsTab' } }] })}>
            <Icon name="bag-suitcase" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Xem Chuyến Đi Ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}>
            <Icon name="home" size={20} color={theme.colors.text} />
            <Text style={styles.secondaryBtnText}>Về Trang Chủ</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <View style={styles.failCircle}>
            <Icon name="close-circle" size={80} color={theme.colors.error} />
          </View>
          <Text style={styles.failTitle}>Thanh toán thất bại</Text>
          <Text style={styles.failSubtitle}>
            Giao dịch không thể hoàn tất.{'\n'}Vui lòng thử lại hoặc chọn phương thức khác.
          </Text>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Quay Lại</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Waiting / Timeout state
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Hủy thanh toán?',
            'Bạn có chắc muốn thoát? Đơn hàng sẽ chờ thanh toán trong 15 phút.',
            [
              { text: 'Ở lại', style: 'cancel' },
              { text: 'Thoát', onPress: () => navigation.goBack(), style: 'destructive' },
            ]
          );
        }} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Display */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Số tiền thanh toán</Text>
          <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
          <View style={styles.timerRow}>
            <Icon name="clock-outline" size={16} color={status === 'timeout' ? theme.colors.error : theme.colors.textSecondary} />
            <Text style={[styles.timerText, status === 'timeout' && { color: theme.colors.error }]}>
              {status === 'timeout' ? 'Hết thời gian!' : formatElapsed()}
            </Text>
          </View>
        </View>

        {/* QR Code Section */}
        {qrCode ? (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Quét mã QR để chuyển khoản</Text>
            <View style={styles.qrContainer}>
              <Image source={{ uri: qrCode }} style={styles.qrImage} resizeMode="contain" />
            </View>
            <Text style={styles.qrHint}>
              Mở app ngân hàng → Quét QR → Xác nhận chuyển khoản
            </Text>
            <View style={styles.bankInfo}>
              <Icon name="bank" size={16} color={theme.colors.primary} />
              <Text style={styles.bankInfoText}>TPBank • VietQR</Text>
            </View>
          </View>
        ) : null}

        {/* Status Indicator */}
        <View style={styles.statusCard}>
          {status === 'timeout' ? (
            <Icon name="clock-alert-outline" size={20} color={theme.colors.error} />
          ) : (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
          <Text style={[styles.statusText, status === 'timeout' && { color: theme.colors.error }]}>
            {status === 'timeout' ? 'Hết thời gian chờ thanh toán' : 'Đang chờ xác nhận thanh toán...'}
          </Text>
        </View>

        {/* Simulate Button (Dev/Demo) */}
        <TouchableOpacity
          style={[styles.simulateBtn, status === 'timeout' && { opacity: 0.5 }]}
          onPress={handleSimulate}
          disabled={simulating || status === 'timeout'}
          activeOpacity={0.8}>
          {simulating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="flash" size={20} color="#fff" />
              <Text style={styles.simulateBtnText}>Giả Lập Thanh Toán (Demo)</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Hướng dẫn</Text>
          
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Mở app ngân hàng trên điện thoại</Text>
          </View>
          
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Quét mã QR bên trên hoặc chuyển khoản thủ công</Text>
          </View>
          
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Hệ thống sẽ tự động xác nhận khi nhận được tiền</Text>
          </View>
        </View>

        {/* Warning */}
        {status === 'timeout' && (
          <View style={styles.alertBox}>
            <Icon name="alert" size={20} color={theme.colors.error} />
            <Text style={styles.alertText}>
              Đã quá thời gian chờ thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </Text>
          </View>
        )}

        <View style={styles.alertBox}>
          <Icon name="information" size={20} color={theme.colors.warning} />
          <Text style={styles.alertText}>
            Không đóng màn hình này cho đến khi thanh toán hoàn tất. Đơn hàng sẽ tự động hủy sau {TIMEOUT_MINUTES} phút.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  content: { padding: 20, paddingBottom: 60 },

  // Amount card
  amountCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 24, alignItems: 'center', marginBottom: 24,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  amountLabel: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 32, fontWeight: '900', color: theme.colors.accent, marginBottom: 8 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' },

  // QR card
  qrCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 20, alignItems: 'center', marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  qrTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  qrContainer: {
    width: 260, height: 260, backgroundColor: '#fff', borderRadius: 16,
    padding: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.colors.borderLight,
  },
  qrImage: { width: 244, height: 244 },
  qrHint: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12 },
  bankInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  bankInfoText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },

  // Status indicator
  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: theme.colors.primaryMuted, paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md, marginBottom: 16,
  },
  statusText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },

  // Simulate button
  simulateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#F59E0B', paddingVertical: 14, borderRadius: theme.borderRadius.md,
    marginBottom: 24,
    elevation: 2, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  simulateBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Instructions
  instructionCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 20, marginBottom: 20,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  instructionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepText: { ...theme.typography.body, color: theme.colors.text, flex: 1, lineHeight: 22 },

  // Alert
  alertBox: {
    flexDirection: 'row', gap: 10, backgroundColor: theme.colors.warning + '15',
    padding: 16, borderRadius: theme.borderRadius.md,
    borderWidth: 1, borderColor: theme.colors.warning + '40',
    marginBottom: 12,
  },
  alertText: { ...theme.typography.bodySmall, color: theme.colors.text, flex: 1, lineHeight: 20 },

  // Success/Fail states
  successCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: theme.colors.success + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 8 },
  successSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  successAmount: { fontSize: 28, fontWeight: '900', color: theme.colors.success, marginBottom: 20 },
  redirectNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.primaryMuted, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, marginBottom: 24 },
  redirectText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  failCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: theme.colors.error + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  failTitle: { ...theme.typography.h2, color: theme.colors.error, marginBottom: 8 },
  failSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },

  // Buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.colors.primary, paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: theme.borderRadius.md, width: '100%', marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.colors.surfaceVariant, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: theme.borderRadius.md, width: '100%',
  },
  secondaryBtnText: { ...theme.typography.button, color: theme.colors.text },
});
