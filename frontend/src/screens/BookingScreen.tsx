/**
 * Premium Booking Screen — Travel-themed checkout with boarding pass style,
 * gradient header, and immersive travel design language.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePricingPreview } from '../hooks/usePricing';
import { pricingApi } from '../api/pricing';
import { useCreateBooking } from '../hooks/useBookings';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Booking'>;
  route: RouteProp<RootStackParamList, 'Booking'>;
};

const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Tiền mặt', desc: 'Trả khi gặp HDV', icon: 'cash', color: '#16A34A', bg: '#DCFCE7' },
  { key: 'SEPAY', label: 'Chuyển khoản', desc: 'QR Banking', icon: 'bank-transfer', color: '#2563EB', bg: '#DBEAFE' },
];

const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.sectionIconBg}>
      <Icon name={icon} size={16} color={theme.colors.primary} />
    </View>
    <Text style={styles.sectionHeader}>{title}</Text>
  </View>
);

export default function BookingScreen({ navigation, route }: Props) {
  const { tourId, tourTitle, tourPrice, departureId, departureDate: routeDepartureDate } = route.params;
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [bookingDate, setBookingDate] = useState(
    routeDepartureDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [note, setNote] = useState('');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoInfo, setPromoInfo] = useState<{ description?: string; discountPercent?: number } | null>(null);

  const totalTravelers = adults + children;
  const fallbackTotal = tourPrice * totalTravelers;

  const { data: pricePreview, isLoading: pricingLoading } = usePricingPreview({
    tourId, adults, children: children > 0 ? children : undefined,
    departureDate: bookingDate || undefined, promoCode: appliedPromo || undefined,
  });

  const { mutateAsync: createBooking, isPending: loading } = useCreateBooking();

  const finalPrice = pricePreview?.finalPrice ?? fallbackTotal;
  const savings = pricePreview?.savings ?? 0;
  const adultUnitPrice = pricePreview?.adultPrice ?? tourPrice;
  const childUnitPrice = pricePreview?.childPrice ?? Math.round(tourPrice * 0.7);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const validateDate = (dateStr: string): boolean => {
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  };

  const handleBooking = async () => {
    if (!contactName.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên liên hệ'); return; }
    if (!contactPhone.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại'); return; }
    if (!VN_PHONE_REGEX.test(contactPhone.trim().replace(/\s/g, ''))) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam (VD: 0912345678)'); return;
    }
    if (!validateDate(bookingDate)) { Alert.alert('Lỗi', 'Ngày khởi hành phải sau hôm nay'); return; }
    
    try {
      const res = await createBooking({
        tourId, departureId, contactName, contactPhone, bookingDate,
        travelers: totalTravelers, adults, children: children > 0 ? children : undefined,
        specialRequests: note || undefined,
        paymentMethod, promoCode: appliedPromo || undefined,
      });

      // If SePay: navigate to SepayPayment screen with QR code
      if (paymentMethod === 'SEPAY' && res.checkoutUrl) {
        navigation.replace('SepayPayment', {
          bookingId: res.id,
          checkoutUrl: res.checkoutUrl,
          qrCode: res.qrCode || '',
          amount: res.totalPrice,
        });
      } else {
        navigation.replace('Payment', { bookingId: res.id });
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể đặt tour lúc này. Vui lòng thử lại.');
    }
  };



  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 4 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon name="compass-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.headerTitle}>Đặt Tour</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Boarding Pass Style Tour Ticket */}
          <View style={styles.ticketWrapper}>
            <View style={styles.ticketTop}>
              <View style={styles.ticketTopLeft}>
                <Icon name="airplane-takeoff" size={20} color={theme.colors.primary} />
                <Text style={styles.ticketLabel}>HÀNH TRÌNH</Text>
              </View>
              <View style={styles.ticketIdBadge}>
                <Text style={styles.ticketIdText}>#{tourId}</Text>
              </View>
            </View>
            <Text style={styles.ticketTitle} numberOfLines={2}>{tourTitle}</Text>
            <View style={styles.ticketDashed} />
            <View style={styles.ticketBottom}>
              <View style={styles.ticketInfoCol}>
                <Text style={styles.ticketInfoLabel}>GIÁ TỪ</Text>
                <Text style={styles.ticketInfoValue}>{formatPrice(tourPrice)}</Text>
              </View>
              <View style={styles.ticketInfoCol}>
                <Text style={styles.ticketInfoLabel}>NGÀY ĐI</Text>
                <Text style={styles.ticketInfoValue}>
                  {bookingDate ? new Date(bookingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '--/--'}
                </Text>
              </View>
              <View style={styles.ticketInfoCol}>
                <Text style={styles.ticketInfoLabel}>KHÁCH</Text>
                <Text style={styles.ticketInfoValue}>{totalTravelers}</Text>
              </View>
            </View>
            {/* Decorative notches */}
            <View style={[styles.ticketNotch, styles.ticketNotchLeft]} />
            <View style={[styles.ticketNotch, styles.ticketNotchRight]} />
          </View>

          {/* Contact Info */}
          <SectionHeader icon="passport" title="Thông Tin Liên Hệ" />
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <View style={styles.inputRow}>
                <Icon name="account-outline" size={20} color={theme.colors.textLight} style={{ marginRight: 8 }} />
                <TextInput style={styles.inputField} value={contactName} onChangeText={setContactName} placeholder="Nhập tên người đại diện" placeholderTextColor={theme.colors.textLight} />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <View style={styles.inputRow}>
                <Icon name="phone-outline" size={20} color={theme.colors.textLight} style={{ marginRight: 8 }} />
                <TextInput style={styles.inputField} value={contactPhone} onChangeText={setContactPhone} placeholder="Nhập số điện thoại" placeholderTextColor={theme.colors.textLight} keyboardType="phone-pad" />
              </View>
            </View>
          </View>

          {/* Departure Date */}
          <SectionHeader icon="calendar-range" title="Lịch Trình" />
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngày khởi hành</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateIconBox}>
                  <Icon name="calendar-month" size={22} color={routeDepartureDate ? '#fff' : theme.colors.primary} />
                </View>
                <TextInput 
                  style={[styles.inputField, { flex: 1, color: routeDepartureDate ? theme.colors.primary : theme.colors.text }]} 
                  value={bookingDate} onChangeText={setBookingDate} 
                  editable={!routeDepartureDate} placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>
              {routeDepartureDate && (
                <View style={styles.lockedBadge}>
                  <Icon name="lock-outline" size={12} color={theme.colors.primary} />
                  <Text style={styles.lockedNote}>Theo lịch khởi hành cố định</Text>
                </View>
              )}
            </View>
          </View>

          {/* Travelers */}
          <SectionHeader icon="account-group-outline" title="Số Lượng Khách" />
          <View style={styles.card}>
            <View style={styles.stepperRow}>
              <View style={styles.stepperInfo}>
                <View style={styles.stepperIconBg}>
                  <Icon name="account" size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.stepperLabel}>Người lớn</Text>
                  <Text style={styles.stepperSub}>Từ 12 tuổi</Text>
                </View>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity style={[styles.stepperBtn, adults <= 1 && styles.stepperBtnDisabled]} disabled={adults <= 1} onPress={() => setAdults(a => Math.max(1, a - 1))}>
                  <Icon name="minus" size={18} color={adults <= 1 ? theme.colors.textLight : theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{adults}</Text>
                <TouchableOpacity style={[styles.stepperBtn, adults >= 20 && styles.stepperBtnDisabled]} disabled={adults >= 20} onPress={() => setAdults(a => Math.min(20, a + 1))}>
                  <Icon name="plus" size={18} color={adults >= 20 ? theme.colors.textLight : theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.stepperRow}>
              <View style={styles.stepperInfo}>
                <View style={[styles.stepperIconBg, { backgroundColor: theme.colors.accentMuted }]}>
                  <Icon name="human-child" size={18} color={theme.colors.accent} />
                </View>
                <View>
                  <Text style={styles.stepperLabel}>Trẻ em</Text>
                  <Text style={styles.stepperSub}>Dưới 12 tuổi · Giảm 30%</Text>
                </View>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity style={[styles.stepperBtn, children <= 0 && styles.stepperBtnDisabled]} disabled={children <= 0} onPress={() => setChildren(c => Math.max(0, c - 1))}>
                  <Icon name="minus" size={18} color={children <= 0 ? theme.colors.textLight : theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{children}</Text>
                <TouchableOpacity style={[styles.stepperBtn, children >= 10 && styles.stepperBtnDisabled]} disabled={children >= 10} onPress={() => setChildren(c => Math.min(10, c + 1))}>
                  <Icon name="plus" size={18} color={children >= 10 ? theme.colors.textLight : theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <SectionHeader icon="wallet-outline" title="Thanh Toán" />
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map((method) => {
              const isActive = paymentMethod === method.key;
              return (
                <TouchableOpacity key={method.key} style={[styles.payCard, isActive && styles.payCardActive]} onPress={() => setPaymentMethod(method.key)} activeOpacity={0.8}>
                  <View style={styles.payCardTop}>
                    <View style={[styles.payIconBg, { backgroundColor: isActive ? method.color : method.bg }]}>
                       <Icon name={method.icon} size={22} color={isActive ? '#fff' : method.color} />
                    </View>
                    <View style={[styles.radioOuter, isActive && { borderColor: theme.colors.primary }]}>
                      {isActive && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <Text style={[styles.payCardLabel, isActive && styles.payCardLabelActive]}>{method.label}</Text>
                  <Text style={styles.payCardDesc}>{method.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note & Promo */}
          <SectionHeader icon="tag-outline" title="Khuyến Mãi & Ghi Chú" />
          <View style={styles.card}>
            <View style={styles.promoRow}>
              <View style={styles.promoInputWrapper}>
                <Icon name="ticket-percent-outline" size={20} color={theme.colors.accent} />
                <TextInput style={styles.promoInput} value={promoCodeInput} onChangeText={(t) => { setPromoCodeInput(t); setPromoError(''); }} placeholder="Nhập mã giảm giá..." placeholderTextColor={theme.colors.textLight} autoCapitalize="characters" />
              </View>
              <TouchableOpacity style={[styles.applyBtn, promoValidating && { opacity: 0.6 }]} disabled={!promoCodeInput.trim() || promoValidating} onPress={async () => {
                const code = promoCodeInput.trim().toUpperCase();
                setPromoValidating(true); setPromoError('');
                try {
                  const res = await pricingApi.validatePromo(code, user?.userId);
                  const data = res.data;
                  if (data.valid) {
                    setAppliedPromo(code);
                    setPromoInfo({ description: data.description, discountPercent: data.discountPercent ?? undefined });
                  } else {
                    setPromoError(data.message || 'Mã không hợp lệ');
                    setAppliedPromo('');
                    setPromoInfo(null);
                  }
                } catch {
                  setPromoError('Không thể kiểm tra mã. Thử lại sau.');
                } finally { setPromoValidating(false); }
              }}>
                {promoValidating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.applyBtnText}>Áp dụng</Text>}
              </TouchableOpacity>
            </View>
            {!!promoError && (
              <View style={styles.promoErrorRow}>
                <Icon name="alert-circle-outline" size={14} color={theme.colors.error} />
                <Text style={styles.promoErrorText}>{promoError}</Text>
              </View>
            )}
            {appliedPromo ? (
              <View style={styles.promoSuccessTag}>
                <Icon name="check-circle" size={16} color={theme.colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoSuccessText}>Đã áp dụng {appliedPromo}{promoInfo?.discountPercent ? ` (-${promoInfo.discountPercent}%)` : ''}</Text>
                  {promoInfo?.description ? <Text style={styles.promoSuccessDesc}>{promoInfo.description}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => { setAppliedPromo(''); setPromoCodeInput(''); setPromoInfo(null); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name="close-circle" size={18} color={theme.colors.success} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú thêm</Text>
              <View style={styles.noteInputWrapper}>
                <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="Dị ứng thực phẩm, yêu cầu đặc biệt..." placeholderTextColor={theme.colors.textLight} multiline />
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          <SectionHeader icon="receipt" title="Chi Tiết Thanh Toán" />
          <View style={styles.receiptCard}>
             <View style={styles.breakdownRow}>
               <Text style={styles.breakdownLabel}>Người lớn × {adults}</Text>
               <Text style={styles.breakdownValue}>{formatPrice(adultUnitPrice * adults)}</Text>
             </View>
             {children > 0 && (
               <View style={styles.breakdownRow}>
                 <Text style={styles.breakdownLabel}>Trẻ em × {children} <Text style={styles.discountNote}>(-30%)</Text></Text>
                 <Text style={styles.breakdownValue}>{formatPrice(childUnitPrice * children)}</Text>
               </View>
             )}
             
             {pricingLoading && (
               <View style={styles.loadingRow}>
                 <ActivityIndicator size="small" color={theme.colors.primary} />
                 <Text style={styles.loadingText}>Đang tính giá...</Text>
               </View>
             )}

             {pricePreview?.appliedRules?.map((rule, idx) => {
                const amount = rule.adjustedAmount ?? rule.adjustment ?? 0;
                return (
                  <View key={idx} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: amount < 0 ? theme.colors.success : '#F59E0B' }]}>{rule.ruleName}</Text>
                    <Text style={[styles.breakdownValue, { color: amount < 0 ? theme.colors.success : '#F59E0B' }]}>{amount > 0 ? '+' : ''}{formatPrice(amount)}</Text>
                  </View>
                );
             })}

             <View style={styles.breakdownRow}>
               <Text style={styles.breakdownLabel}>Thuế & Phí</Text>
               <Text style={[styles.breakdownValue, { color: theme.colors.textLight, fontWeight: '500' }]}>Đã bao gồm</Text>
             </View>
             
             <View style={styles.receiptDivider} />

             <View style={styles.totalRow}>
               <Text style={styles.totalLabel}>Tổng Cộng</Text>
               <Text style={styles.totalValue}>{formatPrice(finalPrice)}</Text>
             </View>
             {savings > 0 && (
               <View style={styles.savingsRow}>
                 <Icon name="gift-outline" size={14} color={theme.colors.success} />
                 <Text style={styles.savingsText}>Tiết kiệm {formatPrice(savings)}</Text>
               </View>
             )}
          </View>

          <View style={styles.trustRow}>
            <Icon name="shield-check-outline" size={16} color={theme.colors.success} />
            <Text style={styles.trustText}>
              {paymentMethod === 'SEPAY' ? 'Thanh toán an toàn qua SePay' : 'Thanh toán tiền mặt khi gặp HDV'}
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Checkout Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomLabel}>Tổng thanh toán</Text>
          <Text style={styles.bottomPrice}>{formatPrice(finalPrice)}</Text>
        </View>
        <TouchableOpacity style={[styles.bookBtn, loading && { opacity: 0.7 }]} onPress={handleBooking} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={[theme.colors.accent, theme.colors.accentDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.bookBtnText}>Xác Nhận Đặt</Text>
                <Icon name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  // Boarding Pass Ticket
  ticketWrapper: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 28,
    ...theme.shadows.md, position: 'relative', overflow: 'hidden',
  },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  ticketTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.primary, letterSpacing: 1.2 },
  ticketIdBadge: { backgroundColor: theme.colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  ticketIdText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  ticketTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, lineHeight: 24, marginBottom: 16 },
  ticketDashed: { height: 1, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', marginBottom: 16 },
  ticketBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketInfoCol: { alignItems: 'center' },
  ticketInfoLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.textLight, letterSpacing: 0.8, marginBottom: 4 },
  ticketInfoValue: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  ticketNotch: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.background },
  ticketNotchLeft: { left: -10, top: '60%' },
  ticketNotchRight: { right: -10, top: '60%' },

  // Section Headers
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 2 },
  sectionIconBg: { width: 28, height: 28, borderRadius: 8, backgroundColor: theme.colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: theme.colors.text, letterSpacing: 0.3 },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, ...theme.shadows.sm, marginBottom: 24 },

  // Inputs
  inputGroup: { paddingVertical: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6, letterSpacing: 0.2 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputField: { fontSize: 16, fontWeight: '600', color: theme.colors.text, padding: 0, margin: 0, minHeight: 36, flex: 1 },
  divider: { height: 1, backgroundColor: theme.colors.surfaceVariant, marginVertical: 14 },

  // Date
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: theme.colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  lockedNote: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },

  // Stepper
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  stepperInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  stepperLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  stepperSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperValue: { fontSize: 18, fontWeight: '800', width: 24, textAlign: 'center', color: theme.colors.text },

  // Payment
  paymentGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  payCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: theme.colors.borderLight, ...theme.shadows.sm },
  payCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryMuted },
  payCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  payIconBg: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  payCardLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  payCardLabelActive: { color: theme.colors.primaryDark },
  payCardDesc: { fontSize: 11, color: theme.colors.textSecondary },

  // Promo
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promoInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, borderRadius: 10, paddingHorizontal: 10, height: 42 },
  promoInput: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text, marginLeft: 8, padding: 0 },
  applyBtn: { backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  promoErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  promoErrorText: { color: theme.colors.error, fontSize: 12, fontWeight: '600' },
  promoSuccessTag: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.successMuted, padding: 10, borderRadius: 10, marginTop: 12 },
  promoSuccessText: { color: theme.colors.success, fontSize: 13, fontWeight: '700' },
  promoSuccessDesc: { color: theme.colors.success, fontSize: 11, marginTop: 2 },

  // Note
  noteInputWrapper: { backgroundColor: theme.colors.surfaceVariant, borderRadius: 10, padding: 10 },
  noteInput: { fontSize: 14, color: theme.colors.text, minHeight: 50, textAlignVertical: 'top', padding: 0 },

  // Receipt
  receiptCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, ...theme.shadows.sm, marginBottom: 16 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { fontSize: 14, color: theme.colors.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  discountNote: { fontSize: 11, color: theme.colors.textLight },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  loadingText: { fontSize: 13, color: theme.colors.textSecondary },
  receiptDivider: { height: 1, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', marginVertical: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  totalValue: { fontSize: 22, fontWeight: '900', color: theme.colors.primary },
  savingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 6 },
  savingsText: { fontSize: 12, fontWeight: '600', color: theme.colors.success },

  // Trust
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
  trustText: { fontSize: 13, color: theme.colors.textSecondary },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, ...theme.shadows.lg },
  bottomLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
  bottomPrice: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
  bookBtn: { borderRadius: 16, overflow: 'hidden' },
  bookBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 15 },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
