/**
 * Premium Booking Screen — Modern checkout flow with sleek cards
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePricingPreview } from '../hooks/usePricing';
import { useCreateBooking } from '../hooks/useBookings';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Booking'>;
  route: RouteProp<RootStackParamList, 'Booking'>;
};

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Tiền mặt', icon: 'cash-multiple', color: '#10B981', bg: '#D1FAE5' },
  { key: 'VNPAY', label: 'VNPay', icon: 'credit-card-scan', color: '#3B82F6', bg: '#DBEAFE' },
  { key: 'MOMO', label: 'MoMo', icon: 'wallet', color: '#db2777', bg: '#fce7f3' },
  { key: 'ZALOPAY', label: 'ZaloPay', icon: 'qrcode', color: '#2563EB', bg: '#EFF6FF' },
];

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
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newBookingId, setNewBookingId] = useState<number | null>(null);

  const totalTravelers = adults + children;
  const fallbackTotal = tourPrice * totalTravelers;

  const { data: pricePreview, isLoading: pricingLoading } = usePricingPreview({
    tourId, adults, children: children > 0 ? children : undefined,
    departureDate: bookingDate || undefined, promoCode: appliedPromo || undefined,
  });

  const { mutateAsync: createBooking, isPending: loading } = useCreateBooking();

  const finalPrice = pricePreview?.finalPrice ?? fallbackTotal;
  const savings = pricePreview?.savings ?? 0;

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
    if (!validateDate(bookingDate)) { Alert.alert('Lỗi', 'Ngày khởi hành phải sau hôm nay'); return; }
    
    try {
      const res = await createBooking({
        tourId, departureId, contactName, contactPhone, bookingDate,
        travelers: totalTravelers, specialRequests: note || undefined,
        paymentMethod, promoCode: appliedPromo || undefined,
      });
      setNewBookingId(res.id);
      setBookingSuccess(true);
    } catch {
      Alert.alert('Lỗi', 'Không thể đặt tour lúc này. Vui lòng thử lại.');
    }
  };

  if (bookingSuccess) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top }]}>
        <View style={styles.successCircle}>
          <Icon name="check" size={80} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Đặt Tour Thành Công!</Text>
        <Text style={styles.successSubtitle}>Mã đơn hàng: #{newBookingId || '10293'}</Text>

        <View style={styles.receiptCard}>
           <Text style={styles.receiptTourName}>{tourTitle}</Text>
           <View style={styles.receiptDashedLine} />
           
           <View style={styles.receiptRow}>
             <Text style={styles.receiptLabel}>Ngày đi</Text>
             <Text style={styles.receiptValue}>{bookingDate}</Text>
           </View>
           <View style={styles.receiptRow}>
             <Text style={styles.receiptLabel}>Khách</Text>
             <Text style={styles.receiptValue}>{adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}</Text>
           </View>
           <View style={styles.receiptRow}>
             <Text style={styles.receiptLabel}>Thanh toán qua</Text>
             <Text style={styles.receiptValue}>{PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}</Text>
           </View>
           <View style={[styles.receiptRow, { marginTop: 12, marginBottom: 0 }]}>
             <Text style={styles.receiptLabelTotal}>Tổng cộng</Text>
             <Text style={styles.receiptValueTotal}>{formatPrice(finalPrice)}</Text>
           </View>
        </View>

        <Text style={styles.successNote}>Thông tin chi tiết đã được gửi đến email của bạn.</Text>

        <View style={styles.successActionRow}>
          <TouchableOpacity style={styles.successBtnOutline} onPress={() => navigation.popToTop()}>
            <Text style={styles.successBtnOutlineText}>Về Trang Chủ</Text>
          </TouchableOpacity>
          {paymentMethod !== 'CASH' && newBookingId ? (
            <TouchableOpacity style={styles.successBtnPrimary} onPress={() => {
              // @ts-ignore
              navigation.replace('Payment', { bookingId: newBookingId });
            }}>
              <Text style={styles.successBtnPrimaryText}>Thanh Toán Ngay</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.successBtnPrimary} onPress={() => {
              // @ts-ignore
              navigation.navigate('MainTabs', { screen: 'MyTripsTab' });
            }}>
              <Text style={styles.successBtnPrimaryText}>Xem Chuyến Đi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="close" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông Tin Đặt Tour</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Tour Summary Ticket */}
          <View style={styles.tourTicket}>
            <View style={styles.ticketIconBg}><Icon name="wallet-travel" size={24} color={theme.colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketTitle} numberOfLines={2}>{tourTitle}</Text>
              <Text style={styles.ticketPrice}>{formatPrice(tourPrice)} / khách</Text>
            </View>
          </View>

          {/* User Info Form */}
          <Text style={styles.sectionHeader}>Thông Tin Liên Hệ</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput style={styles.inputField} value={contactName} onChangeText={setContactName} placeholder="Nhập tên người đại diện" />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput style={styles.inputField} value={contactPhone} onChangeText={setContactPhone} placeholder="Nhập số điện thoại" keyboardType="phone-pad" />
            </View>
          </View>

          {/* Departure Date */}
          <Text style={styles.sectionHeader}>Lịch Trình</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngày khởi hành</Text>
              <View style={styles.dateDisplayRow}>
                <TextInput 
                  style={[styles.inputField, { flex: 1, color: routeDepartureDate ? theme.colors.primary : theme.colors.text }]} 
                  value={bookingDate} onChangeText={setBookingDate} 
                  editable={!routeDepartureDate} placeholder="YYYY-MM-DD"
                />
                <Icon name="calendar-month" size={24} color={routeDepartureDate ? theme.colors.primary : theme.colors.textLight} />
              </View>
              {routeDepartureDate && <Text style={styles.lockedNote}>Đã chọn theo lịch khởi hành cố định.</Text>}
            </View>
          </View>

          {/* Travelers */}
          <Text style={styles.sectionHeader}>Số Lượng Khách</Text>
          <View style={styles.card}>
            <View style={styles.stepperRow}>
              <View>
                <Text style={styles.stepperLabel}>Người lớn</Text>
                <Text style={styles.stepperSub}>Từ 12 tuổi</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity style={[styles.stepperBtn, adults <= 1 && styles.stepperBtnDisabled]} disabled={adults <= 1} onPress={() => setAdults(a => Math.max(1, a - 1))}>
                  <Icon name="minus" size={20} color={adults <= 1 ? '#9CA3AF' : theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{adults}</Text>
                <TouchableOpacity style={[styles.stepperBtn, adults >= 20 && styles.stepperBtnDisabled]} disabled={adults >= 20} onPress={() => setAdults(a => Math.min(20, a + 1))}>
                  <Icon name="plus" size={20} color={adults >= 20 ? '#9CA3AF' : theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.stepperRow}>
              <View>
                <Text style={styles.stepperLabel}>Trẻ em</Text>
                <Text style={styles.stepperSub}>Dưới 12 tuổi</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity style={[styles.stepperBtn, children <= 0 && styles.stepperBtnDisabled]} disabled={children <= 0} onPress={() => setChildren(c => Math.max(0, c - 1))}>
                  <Icon name="minus" size={20} color={children <= 0 ? '#9CA3AF' : theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{children}</Text>
                <TouchableOpacity style={[styles.stepperBtn, children >= 10 && styles.stepperBtnDisabled]} disabled={children >= 10} onPress={() => setChildren(c => Math.min(10, c + 1))}>
                  <Icon name="plus" size={20} color={children >= 10 ? '#9CA3AF' : theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <Text style={styles.sectionHeader}>Phương Thức Thanh Toán</Text>
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map((method) => {
              const isActive = paymentMethod === method.key;
              return (
                <TouchableOpacity key={method.key} style={[styles.payCard, isActive && styles.payCardActive]} onPress={() => setPaymentMethod(method.key)} activeOpacity={0.8}>
                  <View style={styles.payCardHeader}>
                    <View style={[styles.payIconBg, { backgroundColor: isActive ? method.color : method.bg }]}>
                       <Icon name={method.icon} size={24} color={isActive ? '#fff' : method.color} />
                    </View>
                    <Icon name={isActive ? "check-circle" : "circle-outline"} size={22} color={isActive ? theme.colors.primary : theme.colors.border} />
                  </View>
                  <Text style={[styles.payCardLabel, isActive && styles.payCardLabelActive]}>{method.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note & Promo */}
          <Text style={styles.sectionHeader}>Khuyến Mãi & Ghi Chú</Text>
          <View style={styles.card}>
            <View style={styles.promoRow}>
              <Icon name="ticket-percent-outline" size={24} color={theme.colors.accent} style={{ marginRight: 10 }} />
              <TextInput style={[styles.inputField, { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 12, marginRight: 10 }]} value={promoCodeInput} onChangeText={setPromoCodeInput} placeholder="Nhập mã giảm giá..." autoCapitalize="characters" />
              <TouchableOpacity style={styles.applyBtn} disabled={!promoCodeInput.trim()} onPress={() => setAppliedPromo(promoCodeInput.trim().toUpperCase())}>
                <Text style={styles.applyBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
            {appliedPromo ? (
              <View style={styles.promoSuccessTag}>
                <Text style={styles.promoSuccessText}>Đã áp dụng mã {appliedPromo}</Text>
                <TouchableOpacity onPress={() => { setAppliedPromo(''); setPromoCodeInput(''); }}><Icon name="close" size={16} color={theme.colors.success} /></TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú thêm</Text>
              <TextInput style={[styles.inputField, { height: 60, textAlignVertical: 'top' }]} value={note} onChangeText={setNote} placeholder="Dị ứng, yêu cầu chay..." multiline />
            </View>
          </View>

          {/* Price Breakdown */}
          <Text style={styles.sectionHeader}>Chi Tiết Thanh Toán</Text>
          <View style={[styles.card, { paddingBottom: 16 }]}>
             <View style={styles.breakdownRow}>
               <Text style={styles.breakdownLabel}>Người lớn ({adults})</Text>
               <Text style={styles.breakdownValue}>{formatPrice(tourPrice * adults)}</Text>
             </View>
             {children > 0 && (
               <View style={styles.breakdownRow}>
                 <Text style={styles.breakdownLabel}>Trẻ em ({children})</Text>
                 <Text style={styles.breakdownValue}>{formatPrice(tourPrice * children)}</Text>
               </View>
             )}
             
             {pricingLoading && (
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                 <ActivityIndicator size="small" color={theme.colors.primary} />
                 <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>Đang tính Toán phần giảm giá...</Text>
               </View>
             )}

             {pricePreview?.appliedRules?.map((rule, idx) => (
                <View key={idx} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: theme.colors.success }]}>{rule.ruleName}</Text>
                  <Text style={[styles.breakdownValue, { color: theme.colors.success }]}>{rule.adjustment > 0 ? '+' : ''}{formatPrice(rule.adjustment)}</Text>
               </View>
             ))}

             <View style={[styles.breakdownRow, { marginBottom: 0 }]}>
               <Text style={styles.breakdownLabel}>Thuế & Phí</Text>
               <Text style={[styles.breakdownValue, { color: theme.colors.textSecondary }]}>Đã bao gồm</Text>
             </View>
             
             <View style={styles.dashedDivider} />

             <View style={[styles.breakdownRow, { marginBottom: 0 }]}>
               <Text style={styles.totalText}>Tổng Cộng</Text>
               <Text style={styles.totalValueLg}>{formatPrice(finalPrice)}</Text>
             </View>
             {savings > 0 && <Text style={styles.savingsSubtext}>(Bạn đã tiết kiệm được {formatPrice(savings)})</Text>}
          </View>

          <View style={styles.policyFooterRow}>
            <Icon name="shield-check" size={16} color={theme.colors.success} />
            <Text style={styles.policyFooterText}>Thanh toán an toàn, bảo mật 100%.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Checkout Bar */}
      <View style={styles.bottomCheckoutBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.checkoutTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.checkoutTotalValue}>{formatPrice(finalPrice)}</Text>
        </View>
        <TouchableOpacity style={[styles.checkoutBtn, loading && styles.saveBtnDisabled]} onPress={handleBooking} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>Xác Nhận Đặt</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { padding: 4 },
  headerTitle: { ...theme.typography.h2, fontSize: 18, color: theme.colors.text },
  
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  
  tourTicket: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, marginBottom: 24 },
  ticketIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  ticketTitle: { ...theme.typography.h3, fontSize: 16, color: theme.colors.text, marginBottom: 4 },
  ticketPrice: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, fontWeight: '600' },

  sectionHeader: { ...theme.typography.h3, fontSize: 16, color: theme.colors.text, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 24 },
  
  inputGroup: { paddingVertical: 4 },
  inputLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 6 },
  inputField: { fontSize: 16, fontWeight: '600', color: theme.colors.text, padding: 0, margin: 0, minHeight: 40 },
  divider: { height: 1, backgroundColor: theme.colors.surfaceVariant, marginVertical: 12 },
  dateDisplayRow: { flexDirection: 'row', alignItems: 'center' },
  lockedNote: { fontSize: 12, color: theme.colors.primary, marginTop: 4, fontStyle: 'italic' },

  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  stepperLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  stepperSub: { fontSize: 12, color: theme.colors.textSecondary },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  stepperBtnDisabled: { opacity: 0.5 },
  stepperValue: { fontSize: 18, fontWeight: '800', width: 24, textAlign: 'center' },

  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  payCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: theme.colors.border, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  payCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0A' },
  payCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  payIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  payCardLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  payCardLabelActive: { color: theme.colors.text, fontWeight: '800' },

  promoRow: { flexDirection: 'row', alignItems: 'center' },
  applyBtn: { backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  promoSuccessTag: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.success + '15', padding: 8, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start' },
  promoSuccessText: { color: theme.colors.success, fontSize: 13, fontWeight: '600' },

  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginBottom: 4 },
  breakdownLabel: { fontSize: 14, color: theme.colors.textSecondary },
  breakdownValue: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  dashedDivider: { height: 1, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', marginVertical: 12 },
  totalText: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  totalValueLg: { fontSize: 24, fontWeight: '900', color: theme.colors.primary },
  savingsSubtext: { textAlign: 'right', fontSize: 12, color: theme.colors.success, marginTop: 4, fontWeight: '600' },

  policyFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
  policyFooterText: { fontSize: 13, color: theme.colors.textSecondary, letterSpacing: 0.5 },

  bottomCheckoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, borderTopLeftRadius: 32, borderTopRightRadius: 32, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  checkoutTotalLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 2 },
  checkoutTotalValue: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
  checkoutBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24 },
  saveBtnDisabled: { opacity: 0.7 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Success Screen
  successContainer: { flex: 1, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  successTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  successSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 40 },
  receiptCard: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 24 },
  receiptTourName: { fontSize: 18, fontWeight: '800', color: theme.colors.text, textAlign: 'center', marginBottom: 20, lineHeight: 26 },
  receiptDashedLine: { height: 1, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', marginBottom: 20, marginHorizontal: -10 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  receiptLabel: { fontSize: 14, color: theme.colors.textSecondary },
  receiptValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  receiptLabelTotal: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  receiptValueTotal: { fontSize: 20, fontWeight: '900', color: theme.colors.primary },
  successNote: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  successActionRow: { flexDirection: 'row', gap: 16, width: '100%' },
  successBtnOutline: { flex: 1, paddingVertical: 16, borderRadius: 24, borderWidth: 1, borderColor: '#fff', alignItems: 'center' },
  successBtnOutlineText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBtnPrimary: { flex: 1, paddingVertical: 16, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center' },
  successBtnPrimaryText: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },
});
