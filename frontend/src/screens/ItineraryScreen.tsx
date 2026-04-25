/**
 * Premium Itinerary Screen — Beautiful timeline with progress ring and image header
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput as RNTextInput, Share, Alert, ImageBackground, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimelineItem from '../components/TimelineItem';
import { ItineraryItem, itineraryApi } from '../api/itinerary';
import { Booking, bookingsApi } from '../api/bookings';
import { guidesApi } from '../api/guides';
import { usersApi, UserProfile } from '../api/users';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Itinerary'>;
  route: RouteProp<RootStackParamList, 'Itinerary'>;
};

const BG_IMAGE = "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=1200&auto=format&fit=crop";
const { width } = Dimensions.get('window');

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Đang xử lý',  color: theme.colors.warning },
  CONFIRMED: { label: 'Đã xác nhận', color: theme.colors.success },
  COMPLETED: { label: 'Hoàn thành',  color: theme.colors.primary },
  CANCELLED: { label: 'Đã hủy',     color: theme.colors.error },
};

export default function ItineraryScreen({ navigation, route }: Props) {
  const { bookingId, tourTitle } = route.params;
  const insets = useSafeAreaInsets();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  const [guideProfile, setGuideProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        const bookingRes = await bookingsApi.getById(bookingId);
        setBooking(bookingRes.data);
        try {
          const itineraryRes = await itineraryApi.getByBooking(bookingRes.data.id);
          setItems(itineraryRes.data || []);
        } catch { setItems([]); }
        
        try {
          const schedulesRes = await guidesApi.getSchedulesByTour(bookingRes.data.tourId);
          const schedules = schedulesRes.data || [];
          const activeSchedule = schedules.find(s => s.bookingId === bookingRes.data.id && s.status !== 'CANCELLED');
          if (activeSchedule) {
            const profileRes = await usersApi.getProfile(activeSchedule.guideUserId);
            setGuideProfile(profileRes.data);
          }
        } catch (e) { console.log('Không thể lấy thông tin HDV', e); }
        
      } catch {
        setError('Không thể tải thông tin. Vui lòng thử lại.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [bookingId]);

  const toggleCheck = async (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newStatus = item.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
    try {
      await itineraryApi.update(itemId, { status: newStatus });
    } catch {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: item.status } : i));
    }
  };

  const handleShare = async () => {
    let shareText = `📋 Hành Trình: ${tourTitle}\n\n`;
    if (booking) {
      shareText += `📅 Khởi hành: ${new Date(booking.bookingDate).toLocaleDateString('vi-VN')}\n`;
      shareText += `👥 Số lượng: ${booking.travelers} khách\n\n`;
    }
    const grouped = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
      if (!acc[item.dayNumber]) acc[item.dayNumber] = [];
      acc[item.dayNumber].push(item); return acc;
    }, {});
    
    Object.entries(grouped).forEach(([day, dayItems]) => {
      shareText += `Ngày ${day}:\n`;
      dayItems.forEach(item => {
        shareText += ` - [${item.status === 'COMPLETED' ? 'x' : ' '}] ${item.startTime || ''} ${item.activityTitle}\n`;
      });
      shareText += '\n';
    });

    try {
      await Share.share({ message: shareText, title: `Lịch trình ${tourTitle}` });
    } catch { Alert.alert('Lỗi', 'Không thể chia sẻ'); }
  };

  const grouped = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    if (!acc[item.dayNumber]) acc[item.dayNumber] = [];
    acc[item.dayNumber].push(item);
    return acc;
  }, {});

  const totalItems = items.length;
  const completedItems = items.filter(i => i.status === 'COMPLETED').length;
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (loading) {
     return (
       <View style={styles.center}>
         <ActivityIndicator size="large" color={theme.colors.primary} />
         <Text style={styles.loadingText}>Đang chuẩn bị lịch trình...</Text>
       </View>
     );
  }

  if (error) {
     return (
       <View style={styles.center}>
         <Icon name="map-marker-off-outline" size={64} color={theme.colors.textLight} />
         <Text style={styles.errorText}>{error}</Text>
         <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
           <Text style={styles.retryText}>Quay lại</Text>
         </TouchableOpacity>
       </View>
     );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }} bounces={false}>
        {/* Header Cover Image */}
        <ImageBackground source={{ uri: BG_IMAGE }} style={styles.coverImage}>
          <View style={[styles.coverOverlay, { paddingTop: insets.top + 10 }]}>
            <View style={styles.topNav}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
                <Icon name="chevron-left" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.circleBtn}>
                <Icon name="export-variant" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 40, paddingHorizontal: 20 }}>
               <Text style={styles.headerSubtitle}>NHẬT KÝ HÀNH TRÌNH</Text>
               <Text style={styles.headerTitle} numberOfLines={2}>{tourTitle}</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Floating Info & Progress Board */}
        <View style={styles.boardWrapper}>
           <View style={styles.infoBoard}>
             <View style={styles.progressRow}>
               <View style={{ flex: 1 }}>
                 <Text style={styles.boardLabel}>Tiến độ chuyến đi</Text>
                 <Text style={styles.boardValue}>{completedItems} <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>/ {totalItems} hoạt động</Text></Text>
               </View>
               <View style={styles.progressRingBg}>
                 <Text style={styles.progressRingText}>{Math.round(progressPercent)}%</Text>
               </View>
             </View>
             <View style={styles.progressBarWrapper}>
               <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
             </View>

             <View style={styles.divider} />

             <View style={styles.bookingRow}>
               <View style={styles.bookingCol}>
                 <Icon name="calendar-month" size={16} color={theme.colors.primary} />
                 <Text style={styles.bookingText}>{booking ? new Date(booking.bookingDate).toLocaleDateString('vi-VN') : 'N/A'}</Text>
               </View>
               <View style={styles.bookingCol}>
                 <Icon name="account-group" size={16} color={theme.colors.primary} />
                 <Text style={styles.bookingText}>{booking?.travelers || 0} Hành khách</Text>
               </View>
             </View>
             
             {/* Guide Info Card */}
             {guideProfile && (
               <View style={styles.guideCard}>
                 <View style={styles.guideAvatarWrapper}>
                   {guideProfile.avatarUrl ? (
                     <ImageBackground source={{ uri: guideProfile.avatarUrl }} style={styles.guideAvatar} imageStyle={{ borderRadius: 24 }} />
                   ) : (
                     <View style={styles.guideAvatarPlaceholder}>
                       <Text style={styles.guideAvatarText}>{(guideProfile.fullName || guideProfile.username || 'G')[0]?.toUpperCase()}</Text>
                     </View>
                   )}
                   <View style={styles.guideBadge}><Icon name="shield-check" size={10} color="#fff" /></View>
                 </View>
                 <View style={styles.guideInfo}>
                   <Text style={styles.guideRole}>HƯỚNG DẪN VIÊN</Text>
                   <Text style={styles.guideName}>{guideProfile.fullName || guideProfile.username}</Text>
                   <Text style={styles.guidePhone}><Icon name="phone" size={12} /> {guideProfile.phone || 'Chưa cập nhật SĐT'}</Text>
                 </View>
                 <TouchableOpacity style={styles.guideContactBtn} onPress={() => Alert.alert('Liên hệ', 'Tính năng gọi điện đang được phát triển.')}>
                   <Icon name="phone-in-talk" size={20} color={theme.colors.primary} />
                 </TouchableOpacity>
               </View>
             )}
           </View>

           {/* Timeline Items */}
           <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
              {items.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="bag-suitcase-outline" size={64} color={theme.colors.border} />
                  <Text style={styles.emptyTitle}>Chưa có lịch trình</Text>
                  <Text style={styles.emptySubtitle}>Lịch trình chi tiết đang được cập nhật. Bạn vui lòng quay lại sau.</Text>
                </View>
              ) : (
                Object.entries(grouped).map(([day, dayItems]) => {
                  const dayCompleted = dayItems.filter(i => i.status === 'COMPLETED').length;
                  const isDayDone = dayItems.length > 0 && dayCompleted === dayItems.length;

                  return (
                    <View key={day} style={styles.dayGroup}>
                      <View style={styles.dayHeaderRow}>
                         <View style={[styles.dayBadge, isDayDone && { backgroundColor: theme.colors.success }]}>
                           <Text style={styles.dayBadgeText}>Ngày {day}</Text>
                         </View>
                         <Text style={styles.dayProgressText}>{dayCompleted}/{dayItems.length} hoàn thành</Text>
                         <View style={styles.dayLineDivider} />
                      </View>

                      {dayItems.map((item, idx) => (
                        <View key={item.id} style={{ marginBottom: 12 }}>
                           <TouchableOpacity activeOpacity={0.9} onPress={() => toggleCheck(item.id)}>
                             <TimelineItem
                               activityTitle={item.activityTitle}
                               description={item.description}
                               startTime={item.startTime}
                               location={item.location}
                               isLast={idx === dayItems.length - 1}
                               status={item.status as 'PLANNED' | 'COMPLETED' | 'SKIPPED'}
                             />
                           </TouchableOpacity>
                           
                           {/* Beautiful Note Section embedded */}
                           <View style={styles.noteWrapper}>
                             <View style={styles.noteLineIndent} />
                             <View style={styles.noteContentArea}>
                               {editingNoteId === item.id ? (
                                 <View style={styles.noteInputBox}>
                                   <RNTextInput
                                     value={notes[item.id] || ''}
                                     onChangeText={(text) => setNotes(prev => ({ ...prev, [item.id]: text }))}
                                     placeholder="Viết ghi chú cá nhân..."
                                     style={styles.noteTextInput}
                                     placeholderTextColor={theme.colors.textLight}
                                     autoFocus
                                   />
                                   <TouchableOpacity onPress={() => setEditingNoteId(null)} style={styles.noteSaveBtn}>
                                     <Text style={styles.noteSaveBtnText}>Xong</Text>
                                   </TouchableOpacity>
                                 </View>
                               ) : notes[item.id] ? (
                                 <TouchableOpacity style={styles.noteDisplayBox} onPress={() => setEditingNoteId(item.id)}>
                                   <Icon name="pencil-outline" size={14} color={theme.colors.primary} />
                                   <Text style={styles.noteTextValue}>{notes[item.id]}</Text>
                                 </TouchableOpacity>
                               ) : (
                                 <TouchableOpacity style={styles.addNoteBtn} onPress={() => setEditingNoteId(item.id)}>
                                   <Icon name="plus-circle-outline" size={16} color={theme.colors.textLight} />
                                   <Text style={styles.addNoteLabel}>Thêm ghi chú cá nhân</Text>
                                 </TouchableOpacity>
                               )}
                             </View>
                           </View>
                        </View>
                      ))}
                    </View>
                  );
                })
              )}
           </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 16 },
  errorText: { fontSize: 16, color: theme.colors.textSecondary, marginTop: 16, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '800' },

  coverImage: { width: '100%', height: 320 },
  coverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16 },
  
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  
  boardWrapper: { marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingTop: 20 },
  infoBoard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, marginTop: -60 },
  
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  boardLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  boardValue: { fontSize: 24, fontWeight: '900', color: theme.colors.primary },
  progressRingBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.success + '15', justifyContent: 'center', alignItems: 'center' },
  progressRingText: { color: theme.colors.success, fontSize: 13, fontWeight: '800' },
  
  progressBarWrapper: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 4 },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  
  bookingRow: { flexDirection: 'row', gap: 24 },
  bookingCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookingText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },

  guideCard: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  guideAvatarWrapper: { width: 48, height: 48, marginRight: 12 },
  guideAvatar: { width: 48, height: 48, borderRadius: 24 },
  guideAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  guideAvatarText: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  guideBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: theme.colors.success, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  guideInfo: { flex: 1 },
  guideRole: { fontSize: 10, fontWeight: '800', color: theme.colors.primary, letterSpacing: 0.5, marginBottom: 2 },
  guideName: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  guidePhone: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  guideContactBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textSecondary, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: theme.colors.textLight, textAlign: 'center', paddingHorizontal: 20 },

  dayGroup: { marginBottom: 32 },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dayBadge: { backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  dayBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  dayProgressText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  dayLineDivider: { flex: 1, height: 2, backgroundColor: '#E5E7EB', borderRadius: 1 },

  noteWrapper: { flexDirection: 'row', marginTop: -20, marginBottom: 10 },
  noteLineIndent: { width: 32, alignItems: 'center' },
  noteContentArea: { flex: 1, marginLeft: 10 },
  addNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  addNoteLabel: { fontSize: 13, color: theme.colors.textLight, fontWeight: '500' },
  
  noteInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', borderRadius: 12, paddingHorizontal: 12 },
  noteTextInput: { flex: 1, fontSize: 14, color: theme.colors.text, paddingVertical: 10 },
  noteSaveBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  noteSaveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  noteDisplayBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  noteTextValue: { fontSize: 14, color: '#D97706', fontStyle: 'italic', flex: 1 },
});
