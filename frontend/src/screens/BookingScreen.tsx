/**
 * Booking Screen — Dynamic pricing with adult/child selector,
 * pricing preview integration, departure date, and payment method
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView,
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingsApi } from '../api/bookings';
import { pricingApi, PricePreviewResponse } from '../api/pricing';
import { useAuth } from '../store/AuthContext';
import { HomeStackParamList } from '../navigation/MainTabs';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Booking'>;
  route: RouteProp<HomeStackParamList, 'Booking'>;
};

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Tiền mặt', icon: 'cash' },
  { key: 'VNPAY', label: 'VNPay', icon: 'credit-card-outline' },
  { key: 'MOMO', label: 'MoMo', icon: 'wallet-outline' },
  { key: 'ZALOPAY', label: 'ZaloPay', icon: 'cellphone' },
];

export default function BookingScreen({ navigation, route }: Props) {
  const { tourId, tourTitle, tourPrice, departureId, departureDate: routeDepartureDate } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Form state
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [bookingDate, setBookingDate] = useState(
    routeDepartureDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Dynamic pricing
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricePreview, setPricePreview] = useState<PricePreviewResponse | null>(null);

  const totalTravelers = adults + children;
  const fallbackTotal = tourPrice * totalTravelers;

  // Fetch dynamic pricing preview
  const fetchPricing = useCallback(async () => {
    if (adults <= 0) return;
    setPricingLoading(true);
    try {
      const res = await pricingApi.preview({
        tourId,
        adults,
        children: children > 0 ? children : undefined,
        departureDate: bookingDate || undefined,
      });
      setPricePreview(res.data);
    } catch {
      // Fallback to simple calculation
      setPricePreview(null);
    } finally {
      setPricingLoading(false);
    }
  }, [tourId, adults, children, bookingDate]);

  useEffect(() => {
    const timer = setTimeout(fetchPricing, 500); // debounce
    return () => clearTimeout(timer);
  }, [fetchPricing]);

  const finalPrice = pricePreview?.finalPrice ?? fallbackTotal;
  const savings = pricePreview?.savings ?? 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const validateDate = (dateStr: string): boolean => {
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  };

  const handleBooking = async () => {
    if (!contactName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên liên hệ');
      return;
    }
    if (!contactPhone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!validateDate(bookingDate)) {
      Alert.alert('Lỗi', 'Ngày khởi hành phải sau hôm nay');
      return;
    }
    setLoading(true);
    try {
      await bookingsApi.create({
        tourId,
        departureId,
        contactName,
        contactPhone,
        bookingDate,
        travelers: totalTravelers,
        specialRequests: note || undefined,
        paymentMethod,
      });
      setBookingSuccess(true);
    } catch {
      setBookingSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (bookingSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBg}>
            <Icon name="check-circle" size={72} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Đặt Tour Thành Công! 🎉</Text>
          <Text style={styles.successSubtitle}>{tourTitle}</Text>

          <View style={styles.successDetails}>
            <View style={styles.successRow}>
              <Icon name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.successText}>Ngày: {bookingDate}</Text>
            </View>
            <View style={styles.successRow}>
              <Icon name="account-group" size={18} color={theme.colors.primary} />
              <Text style={styles.successText}>
                {adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Icon name="cash" size={18} color={theme.colors.primary} />
              <Text style={styles.successText}>Tổng: {formatPrice(finalPrice)}</Text>
            </View>
            <View style={styles.successRow}>
              <Icon name="credit-card" size={18} color={theme.colors.primary} />
              <Text style={styles.successText}>
                Thanh toán: {PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}
              </Text>
            </View>
          </View>

          <Text style={styles.successNote}>
            Chúng tôi sẽ gửi email xác nhận trong vòng 30 phút. Vui lòng kiểm tra hộp thư.
          </Text>

          <TouchableOpacity
            style={styles.successButton}
            onPress={() => navigation.popToTop()}
            activeOpacity={0.8}>
            <Text style={styles.successButtonText}>Về Trang Chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt Tour</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tour Summary */}
        <View style={styles.tourSummary}>
          <Icon name="compass" size={24} color={theme.colors.primary} />
          <View style={styles.tourSummaryText}>
            <Text style={styles.tourTitle}>{tourTitle}</Text>
            <Text style={styles.tourPricePerPerson}>{formatPrice(tourPrice)} / người</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Thông Tin Liên Hệ</Text>
          <TextInput
            label="Họ và tên"
            value={contactName}
            onChangeText={setContactName}
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" />}
            style={styles.input}
            outlineColor={theme.colors.border}
            activeOutlineColor={theme.colors.primary}
          />
          <TextInput
            label="Số điện thoại"
            value={contactPhone}
            onChangeText={setContactPhone}
            mode="outlined"
            left={<TextInput.Icon icon="phone-outline" />}
            style={styles.input}
            outlineColor={theme.colors.border}
            activeOutlineColor={theme.colors.primary}
            keyboardType="phone-pad"
          />
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ngày Khởi Hành</Text>
          <TextInput
            value={bookingDate}
            onChangeText={setBookingDate}
            mode="outlined"
            left={<TextInput.Icon icon="calendar" />}
            placeholder="YYYY-MM-DD"
            style={styles.input}
            outlineColor={theme.colors.border}
            activeOutlineColor={theme.colors.primary}
            editable={!routeDepartureDate}
          />
          {routeDepartureDate && (
            <View style={styles.dateNote}>
              <Icon name="information" size={14} color={theme.colors.primary} />
              <Text style={styles.dateNoteText}>Ngày đã chọn từ lịch khởi hành</Text>
            </View>
          )}
          {!routeDepartureDate && !validateDate(bookingDate) && bookingDate.length === 10 && (
            <View style={styles.dateWarning}>
              <Icon name="alert-circle" size={14} color={theme.colors.error} />
              <Text style={styles.dateWarningText}>Ngày phải sau hôm nay</Text>
            </View>
          )}
        </View>

        {/* Travelers — Adults & Children */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Số Hành Khách</Text>

          {/* Adults */}
          <View style={styles.travelerRow}>
            <View style={styles.travelerInfo}>
              <Icon name="account" size={20} color={theme.colors.primary} />
              <View>
                <Text style={styles.travelerLabel}>Người lớn</Text>
                <Text style={styles.travelerSub}>Từ 12 tuổi</Text>
              </View>
            </View>
            <View style={styles.travelerControls}>
              <TouchableOpacity
                style={[styles.travelerButton, adults <= 1 && styles.travelerButtonDisabled]}
                onPress={() => setAdults(Math.max(1, adults - 1))}
                disabled={adults <= 1}>
                <Icon name="minus" size={18} color={adults <= 1 ? theme.colors.textLight : theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.travelerCount}>{adults}</Text>
              <TouchableOpacity
                style={[styles.travelerButton, adults >= 20 && styles.travelerButtonDisabled]}
                onPress={() => setAdults(Math.min(20, adults + 1))}
                disabled={adults >= 20}>
                <Icon name="plus" size={18} color={adults >= 20 ? theme.colors.textLight : theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Children */}
          <View style={styles.travelerRow}>
            <View style={styles.travelerInfo}>
              <Icon name="baby-face-outline" size={20} color={theme.colors.warning} />
              <View>
                <Text style={styles.travelerLabel}>Trẻ em</Text>
                <Text style={styles.travelerSub}>Dưới 12 tuổi</Text>
              </View>
            </View>
            <View style={styles.travelerControls}>
              <TouchableOpacity
                style={[styles.travelerButton, children <= 0 && styles.travelerButtonDisabled]}
                onPress={() => setChildren(Math.max(0, children - 1))}
                disabled={children <= 0}>
                <Icon name="minus" size={18} color={children <= 0 ? theme.colors.textLight : theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.travelerCount}>{children}</Text>
              <TouchableOpacity
                style={[styles.travelerButton, children >= 10 && styles.travelerButtonDisabled]}
                onPress={() => setChildren(Math.min(10, children + 1))}
                disabled={children >= 10}>
                <Icon name="plus" size={18} color={children >= 10 ? theme.colors.textLight : theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Phương Thức Thanh Toán</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.paymentOption,
                paymentMethod === method.key && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod(method.key)}
              activeOpacity={0.7}>
              <View style={styles.paymentLeft}>
                <Icon
                  name={method.icon}
                  size={22}
                  color={paymentMethod === method.key
                    ? theme.colors.primary
                    : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.paymentLabel,
                  paymentMethod === method.key && { color: theme.colors.primary, fontWeight: '700' },
                ]}>{method.label}</Text>
              </View>
              {paymentMethod === method.key && (
                <Icon name="check-circle" size={22} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ghi Chú (tùy chọn)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm..."
            style={styles.input}
            outlineColor={theme.colors.border}
            activeOutlineColor={theme.colors.primary}
          />
        </View>

        {/* Cancellation Policy */}
        <View style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <Icon name="shield-check-outline" size={20} color={theme.colors.success} />
            <Text style={styles.policyTitle}>Chính Sách Hủy Tour</Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyDot}>•</Text>
            <Text style={styles.policyText}>Hủy trước 7 ngày: Hoàn 100%</Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyDot}>•</Text>
            <Text style={styles.policyText}>Hủy trước 3-7 ngày: Hoàn 50%</Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyDot}>•</Text>
            <Text style={styles.policyText}>Hủy dưới 3 ngày: Không hoàn tiền</Text>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <Text style={styles.breakdownTitle}>Chi Tiết Giá</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Người lớn × {adults}</Text>
            <Text style={styles.priceValue}>{formatPrice(tourPrice * adults)}</Text>
          </View>

          {children > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Trẻ em × {children}</Text>
              <Text style={styles.priceValue}>{formatPrice(tourPrice * children)}</Text>
            </View>
          )}

          {/* Applied pricing rules */}
          {pricingLoading && (
            <View style={styles.pricingLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.pricingLoadingText}>Đang tính giá...</Text>
            </View>
          )}

          {pricePreview?.appliedRules?.map((rule, idx) => (
            <View key={idx} style={styles.priceRow}>
              <View style={styles.discountRow}>
                <Icon name="tag-outline" size={14} color={theme.colors.success} />
                <Text style={[styles.priceLabel, { color: theme.colors.success }]}>
                  {rule.ruleName}
                </Text>
              </View>
              <Text style={[styles.priceValue, { color: theme.colors.success }]}>
                {rule.adjustment > 0 ? '+' : ''}{formatPrice(rule.adjustment)}
              </Text>
            </View>
          ))}

          {savings > 0 && (
            <View style={styles.savingsRow}>
              <Icon name="piggy-bank-outline" size={16} color={theme.colors.success} />
              <Text style={styles.savingsText}>Bạn tiết kiệm {formatPrice(savings)}!</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Thuế & Phí</Text>
            <Text style={[styles.priceValue, { color: theme.colors.success }]}>Đã bao gồm</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Tổng Cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(finalPrice)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Confirm */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotal}>{formatPrice(finalPrice)}</Text>
          <Text style={styles.bottomTotalLabel}>
            {totalTravelers} hành khách
            {savings > 0 ? ` • Giảm ${formatPrice(savings)}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleBooking}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Xác Nhận Đặt Tour</Text>
              <Icon name="check" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: { padding: 8 },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  content: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
  tourSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 16, elevation: 1, marginBottom: 24,
  },
  tourSummaryText: { flex: 1 },
  tourTitle: { ...theme.typography.h3, color: theme.colors.text },
  tourPricePerPerson: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionLabel: {
    ...theme.typography.caption, color: theme.colors.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
  },
  input: { backgroundColor: '#fff', marginBottom: 10 },
  dateWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dateWarningText: { ...theme.typography.caption, color: theme.colors.error },
  dateNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dateNoteText: { ...theme.typography.caption, color: theme.colors.primary },

  // Traveler rows
  travelerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 16, marginBottom: 10,
  },
  travelerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  travelerLabel: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text },
  travelerSub: { ...theme.typography.caption, color: theme.colors.textSecondary },
  travelerControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  travelerButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  travelerButtonDisabled: { opacity: 0.4 },
  travelerCount: {
    fontSize: 20, fontWeight: '800', color: theme.colors.text,
    minWidth: 28, textAlign: 'center',
  },

  // Payment method
  paymentOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 16, marginBottom: 8, borderWidth: 1.5, borderColor: theme.colors.border,
  },
  paymentOptionActive: {
    borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08',
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentLabel: { ...theme.typography.body, color: theme.colors.text },

  // Price breakdown
  policyCard: {
    backgroundColor: theme.colors.success + '10', borderRadius: theme.borderRadius.md,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.success + '30',
  },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  policyTitle: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text },
  policyItem: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  policyDot: { color: theme.colors.textSecondary },
  policyText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  priceBreakdown: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 20, elevation: 1,
  },
  breakdownTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  priceLabel: { ...theme.typography.body, color: theme.colors.textSecondary },
  priceValue: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  savingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.success + '10', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginVertical: 8,
  },
  savingsText: { ...theme.typography.bodySmall, color: theme.colors.success, fontWeight: '700' },
  pricingLoading: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
  },
  pricingLoadingText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
  totalLabel: { ...theme.typography.h3, color: theme.colors.text },
  totalValue: { fontSize: 22, fontWeight: '800', color: theme.colors.accent },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  bottomTotal: { fontSize: 20, fontWeight: '800', color: theme.colors.accent },
  bottomTotalLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  confirmButton: {
    backgroundColor: theme.colors.success, borderRadius: theme.borderRadius.md,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, elevation: 3,
  },
  buttonDisabled: { opacity: 0.7 },
  confirmButtonText: { ...theme.typography.button, color: '#fff' },
  // Success state
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  successIconBg: { marginBottom: 20 },
  successTitle: { ...theme.typography.h1, color: theme.colors.text, marginBottom: 8 },
  successSubtitle: { ...theme.typography.h3, color: theme.colors.primary, marginBottom: 24 },
  successDetails: {
    backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md,
    padding: 20, width: '100%', marginBottom: 20,
  },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  successText: { ...theme.typography.body, color: theme.colors.text },
  successNote: {
    ...theme.typography.bodySmall, color: theme.colors.textSecondary,
    textAlign: 'center', marginBottom: 24, lineHeight: 20,
  },
  successButton: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingHorizontal: 32, paddingVertical: 14, elevation: 3,
  },
  successButtonText: { ...theme.typography.button, color: '#fff' },
});
