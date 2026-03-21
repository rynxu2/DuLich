/**
 * Itinerary Screen — Timeline UI with activity checklist and personal notes
 *
 * Flow:
 * 1. Fetch booking details via bookingsApi.getById(bookingId)
 * 2. Use confirmed bookingId to fetch itinerary via itineraryApi.getByBooking()
 * 3. Display timeline with check/note functionality
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput as RNTextInput, Share, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimelineItem from '../components/TimelineItem';
import { ItineraryItem, itineraryApi } from '../api/itinerary';
import { Booking, bookingsApi } from '../api/bookings';
import { TripsStackParamList } from '../navigation/MainTabs';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<TripsStackParamList, 'Itinerary'>;
  route: RouteProp<TripsStackParamList, 'Itinerary'>;
};

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch booking details first
        const bookingRes = await bookingsApi.getById(bookingId);
        const bookingData = bookingRes.data;
        console.log('Booking data:', bookingData);
        setBooking(bookingData);

        // Step 2: Use confirmed bookingId to fetch itinerary
        try {
          const itineraryRes = await itineraryApi.getByBooking(bookingData.id);
          console.log('Itinerary data:', itineraryRes.data);
          setItems(itineraryRes.data || []);
        } catch {
          // Itinerary might not exist yet for this booking
          setItems([]);
        }
      } catch {
        setError('Không thể tải thông tin booking. Vui lòng thử lại.');
        setBooking(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  const toggleCheck = async (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newStatus = item.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';

    // Optimistic update
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: newStatus } : i
    ));

    // Sync with server
    try {
      await itineraryApi.update(itemId, { status: newStatus });
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, status: item.status } : i
      ));
    }
  };

  const handleShare = async () => {
    const title = booking ? tourTitle : tourTitle;
    let shareText = `📋 Lịch Trình: ${title}\n\n`;

    if (booking) {
      shareText += `📅 Ngày đi: ${formatDate(booking.bookingDate)}\n`;
      shareText += `👥 Số khách: ${booking.travelers}\n\n`;
    }

    const grouped = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
      if (!acc[item.dayNumber]) {acc[item.dayNumber] = [];}
      acc[item.dayNumber].push(item);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([day, dayItems]) => {
      shareText += `📅 Ngày ${day}:\n`;
      dayItems.forEach(item => {
        const checked = item.status === 'COMPLETED' ? '✅' : '⬜';
        shareText += `  ${checked} ${item.startTime} - ${item.activityTitle}`;
        if (item.location) {shareText += ` (${item.location})`;}
        shareText += '\n';
      });
      shareText += '\n';
    });

    try {
      await Share.share({ message: shareText, title: `Lịch trình ${title}` });
    } catch {
      Alert.alert('Lỗi', 'Không thể chia sẻ lịch trình');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const grouped = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    if (!acc[item.dayNumber]) {acc[item.dayNumber] = [];}
    acc[item.dayNumber].push(item);
    return acc;
  }, {});

  const totalItems = items.length;
  const completedItems = items.filter(i => i.status === 'COMPLETED').length;
  const progress = totalItems > 0 ? completedItems / totalItems : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={styles.hTitle}>Lịch Trình</Text>
          <Text style={styles.hSub} numberOfLines={1}>{tourTitle}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Icon name="share-variant" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch trình...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={48} color={theme.colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              setError(null);
              bookingsApi.getById(bookingId)
                .then(res => {
                  setBooking(res.data);
                  return itineraryApi.getByBooking(res.data.id);
                })
                .then(res => setItems(res.data || []))
                .catch(() => setError('Không thể tải lịch trình.'))
                .finally(() => setLoading(false));
            }}>
            <Icon name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Booking Info Card */}
          {booking && (
            <View style={styles.bookingInfoCard}>
              <View style={styles.bookingInfoRow}>
                <View style={styles.bookingInfoItem}>
                  <Icon name="calendar" size={16} color={theme.colors.primary} />
                  <Text style={styles.bookingInfoText}>{formatDate(booking.bookingDate)}</Text>
                </View>
                <View style={styles.bookingInfoItem}>
                  <Icon name="account-group" size={16} color={theme.colors.primary} />
                  <Text style={styles.bookingInfoText}>{booking.travelers} khách</Text>
                </View>
                <View style={styles.bookingInfoItem}>
                  <Icon name="cash" size={16} color={theme.colors.accent} />
                  <Text style={styles.bookingInfoText}>{formatPrice(booking.totalPrice)}</Text>
                </View>
              </View>
              {booking.status && (
                <View style={[
                  styles.bookingStatusBadge,
                  { backgroundColor: (STATUS_LABELS[booking.status]?.color || theme.colors.textLight) + '20' },
                ]}>
                  <Text style={[
                    styles.bookingStatusText,
                    { color: STATUS_LABELS[booking.status]?.color || theme.colors.textLight },
                  ]}>
                    {STATUS_LABELS[booking.status]?.label || booking.status}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Progress Bar */}
          {items.length > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Tiến trình</Text>
                <Text style={styles.progressPercent}>{completedItems}/{totalItems}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          )}

          {/* Itinerary Timeline */}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="calendar-blank-outline" size={64} color={theme.colors.textLight} />
                <Text style={styles.emptyTitle}>Chưa có lịch trình</Text>
                <Text style={styles.emptySubtitle}>
                  Lịch trình chi tiết sẽ được cập nhật khi gần ngày khởi hành.
                </Text>
              </View>
            ) : (
              Object.entries(grouped).map(([day, dayItems]) => {
                const dayCompleted = dayItems.filter(i => i.status === 'COMPLETED').length;
                return (
                  <View key={day} style={styles.daySection}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Ngày {day}</Text>
                      </View>
                      <Text style={styles.dayProgress}>{dayCompleted}/{dayItems.length} hoàn thành</Text>
                      <View style={styles.dayLine} />
                    </View>
                    {dayItems.map((item, idx) => (
                      <View key={item.id}>
                        <TouchableOpacity
                          style={styles.checkableItem}
                          onPress={() => toggleCheck(item.id)}
                          activeOpacity={0.8}>
                          <Icon
                            name={item.status === 'COMPLETED' ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                            size={24}
                            color={item.status === 'COMPLETED' ? theme.colors.success : theme.colors.textLight}
                          />
                          <View style={[
                            styles.itemContent,
                            item.status === 'SKIPPED' && styles.itemChecked
                          ]}>
                            <TimelineItem
                              activityTitle={item.activityTitle}
                              description={item.description}
                              startTime={item.startTime}
                              location={item.location}
                              isLast={idx === dayItems.length - 1}
                              status={item.status as 'PLANNED' | 'COMPLETED' | 'SKIPPED'}
                            />
                          </View>
                        </TouchableOpacity>

                        {/* Personal Note */}
                        <View style={styles.noteSection}>
                          {editingNoteId === item.id ? (
                            <View style={styles.noteInput}>
                              <RNTextInput
                                value={notes[item.id] || ''}
                                onChangeText={(text) => setNotes(prev => ({ ...prev, [item.id]: text }))}
                                placeholder="Ghi chú..."
                                style={styles.noteTextInput}
                                placeholderTextColor={theme.colors.textLight}
                                autoFocus
                              />
                              <TouchableOpacity
                                onPress={() => setEditingNoteId(null)}
                                style={styles.noteSaveBtn}>
                                <Icon name="check" size={18} color={theme.colors.primary} />
                              </TouchableOpacity>
                            </View>
                          ) : notes[item.id] ? (
                            <TouchableOpacity
                              style={styles.noteDisplay}
                              onPress={() => setEditingNoteId(item.id)}>
                              <Icon name="note-outline" size={14} color={theme.colors.primary} />
                              <Text style={styles.noteText}>{notes[item.id]}</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.addNoteBtn}
                              onPress={() => setEditingNoteId(item.id)}>
                              <Icon name="plus" size={14} color={theme.colors.textLight} />
                              <Text style={styles.addNoteText}>Thêm ghi chú</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  backBtn: { padding: 8 },
  hTitle: { ...theme.typography.h3, color: theme.colors.text },
  hSub: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  shareBtn: { padding: 8 },

  // Loading / Error
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 12 },
  errorText: { ...theme.typography.body, color: theme.colors.textLight, marginTop: 12, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.primary, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 16,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Booking info
  bookingInfoCard: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  bookingInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  bookingInfoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bookingInfoText: { ...theme.typography.bodySmall, color: theme.colors.text, fontWeight: '500' },
  bookingStatusBadge: {
    alignSelf: 'flex-start', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 10,
  },
  bookingStatusText: { fontSize: 12, fontWeight: '700' },

  // Progress
  progressSection: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  progressPercent: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700' },
  progressBarBg: {
    height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceVariant,
  },
  progressBarFill: {
    height: 6, borderRadius: 3, backgroundColor: theme.colors.success,
  },

  // Content
  content: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textLight, marginTop: 16 },
  emptySubtitle: {
    ...theme.typography.bodySmall, color: theme.colors.textLight,
    marginTop: 6, textAlign: 'center', paddingHorizontal: 40,
  },

  // Day section
  daySection: { marginBottom: 24 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  dayBadge: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  dayBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dayProgress: { ...theme.typography.caption, color: theme.colors.textSecondary },
  dayLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  checkableItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemContent: { flex: 1 },
  itemChecked: { opacity: 0.5 },

  // Notes
  noteSection: { marginLeft: 32, marginBottom: 8, marginTop: -12 },
  noteInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.surfaceVariant, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  noteTextInput: { flex: 1, fontSize: 13, color: theme.colors.text, padding: 0 },
  noteSaveBtn: { padding: 4 },
  noteDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 4,
  },
  noteText: { ...theme.typography.bodySmall, color: theme.colors.primary, fontStyle: 'italic' },
  addNoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4,
  },
  addNoteText: { ...theme.typography.caption, color: theme.colors.textLight },
});
