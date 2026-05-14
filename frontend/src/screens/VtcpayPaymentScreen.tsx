/**
 * VTC Pay Payment Screen — Card payment via WebView
 *
 * Displays VTC Pay checkout page in a WebView for ATM/Visa/MasterCard payments.
 * Detects payment completion via URL redirect and polls payment status as fallback.
 * Includes a "Simulate Payment" button for dev/testing.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, AppState,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paymentsApi } from '../api/payments';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VtcpayPayment'>;
  route: RouteProp<RootStackParamList, 'VtcpayPayment'>;
};

const POLL_INTERVAL = 5000;

export default function VtcpayPaymentScreen({ navigation, route }: Props) {
  const { bookingId, checkoutUrl, amount } = route.params;
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'checkout' | 'success' | 'failed' | 'loading'>('checkout');
  const [simulating, setSimulating] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webviewRef = useRef<WebView>(null);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await paymentsApi.getByBooking(bookingId);
      const payments = res.data;
      const vtcPayment = payments.find(p => p.paymentMethod === 'VTCPAY');

      if (vtcPayment) {
        if (vtcPayment.status === 'SUCCESS') {
          setStatus('success');
          return true;
        }
        if (vtcPayment.status === 'FAILED') {
          setStatus('failed');
          return true;
        }
      }
    } catch {
      // Silent — will retry
    }
    return false;
  }, [bookingId]);

  // Start polling as fallback (in case IPN updates before redirect)
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const done = await checkPaymentStatus();
      if (done && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkPaymentStatus]);

  // Check on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && status === 'checkout') {
        checkPaymentStatus();
      }
    });
    return () => sub.remove();
  }, [checkPaymentStatus, status]);

  // Stop polling on terminal state
  useEffect(() => {
    if (status !== 'checkout' && status !== 'loading') {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [status]);

  // Detect VTC Pay redirect to return URL
  const handleNavigationChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // Detect deep link redirect (from VtcpayReturnController)
    if (url.includes('dulich://') || url.includes('/payments/vtcpay/return')) {
      setStatus('loading');

      // Parse status from URL
      if (url.includes('status=SUCCESS')) {
        setStatus('success');
      } else if (url.includes('status=FAILED')) {
        setStatus('failed');
      } else {
        // Fallback: poll to get actual status
        setTimeout(() => checkPaymentStatus(), 1500);
      }
      return false; // prevent WebView from navigating to deep link
    }
    return true;
  };

  // Simulate payment
  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await paymentsApi.simulateVtcpayPayment(bookingId);
      await checkPaymentStatus();
    } catch {
      Alert.alert('Lỗi', 'Không thể giả lập thanh toán');
    } finally {
      setSimulating(false);
    }
  };

  // SUCCESS screen
  if (status === 'success') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <View style={styles.successCircle}>
            <Icon name="check-circle" size={80} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Thanh toán thành công!</Text>
          <Text style={styles.successSubtitle}>
            Đơn hàng #{bookingId} đã được thanh toán{'\n'}qua thẻ ngân hàng
          </Text>
          <Text style={styles.successAmount}>{formatPrice(amount)}</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.replace('Payment', { bookingId })}>
            <Icon name="receipt" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Xem Chi Tiết Đơn Hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}>
            <Icon name="home" size={20} color={theme.colors.text} />
            <Text style={styles.secondaryBtnText}>Về Trang Chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // FAILED screen
  if (status === 'failed') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
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
        </View>
      </View>
    );
  }

  // LOADING screen
  if (status === 'loading') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang xác nhận thanh toán...</Text>
        </View>
      </View>
    );
  }

  // CHECKOUT screen (WebView)
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Hủy thanh toán?',
            'Bạn có chắc muốn thoát? Giao dịch sẽ không được hoàn tất.',
            [
              { text: 'Ở lại', style: 'cancel' },
              { text: 'Thoát', onPress: () => navigation.goBack(), style: 'destructive' },
            ]
          );
        }} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon name="credit-card-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Thanh Toán Thẻ</Text>
        </View>
        <Text style={styles.headerAmount}>{formatPrice(amount)}</Text>
      </View>

      {/* WebView */}
      <View style={styles.webviewContainer}>
        {webviewLoading && (
          <View style={styles.webviewLoader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.webviewLoaderText}>Đang tải trang thanh toán...</Text>
          </View>
        )}
        <WebView
          ref={webviewRef}
          source={{ html: checkoutUrl, baseUrl: 'https://alpha1.vtcpay.vn' }}
          style={styles.webview}
          onLoadEnd={() => setWebviewLoading(false)}
          onShouldStartLoadWithRequest={(req) => handleNavigationChange(req as WebViewNavigation)}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          scalesPageToFit
          mixedContentMode="compatibility"
        />
      </View>

      {/* Bottom bar: Simulate button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={handleSimulate}
          disabled={simulating}
          activeOpacity={0.8}>
          {simulating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="flash" size={18} color="#fff" />
              <Text style={styles.simulateBtnText}>Giả Lập Thanh Toán (Demo)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backButton: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  headerAmount: { fontSize: 15, fontWeight: '800', color: theme.colors.accent },

  // WebView
  webviewContainer: { flex: 1 },
  webview: { flex: 1 },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.background, zIndex: 10,
  },
  webviewLoaderText: { marginTop: 12, ...theme.typography.body, color: theme.colors.textSecondary },

  // Loading
  loadingText: { marginTop: 16, ...theme.typography.body, color: theme.colors.textSecondary },

  // Bottom bar
  bottomBar: {
    padding: 12, paddingBottom: 20, backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  simulateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: theme.borderRadius.md,
    elevation: 2, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  simulateBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Success / Fail states
  successCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: theme.colors.success + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 8 },
  successSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  successAmount: { fontSize: 28, fontWeight: '900', color: theme.colors.success, marginBottom: 32 },

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
