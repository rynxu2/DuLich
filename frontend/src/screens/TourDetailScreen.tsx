/**
 * Premium Tour Detail Screen — Immersive image header, overlapping info panel,
 * vertical timeline itinerary, and modern departures selector.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Dimensions,
  FlatList, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { TourDeparture } from '../api/tours';
import { reviewsApi } from '../api/reviews';
import ReviewCard from '../components/ReviewCard';
import FavoriteButton from '../components/FavoriteButton';
import { useTourDetail, useTourAvailability } from '../hooks/useTours';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TourDetail'>;
  route: RouteProp<RootStackParamList, 'TourDetail'>;
};

const { width } = Dimensions.get('window');
const SLIDER_HEIGHT = width * 1.05; // 1:1.05 aspect ratio for taller header
const AUTO_SCROLL_INTERVAL = 4500;

export default function TourDetailScreen({ navigation, route }: Props) {
  const { tourId } = route.params;
  const insets = useSafeAreaInsets();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<TourDeparture | null>(null);

  // Image slider state
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Queries
  const { data: tour, isLoading: isTourLoading } = useTourDetail(tourId);
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', tourId],
    queryFn: async () => {
      const res = await reviewsApi.getByTour(tourId);
      return res.data;
    },
    enabled: !!tourId,
  });
  const { data: realTimeAvail } = useTourAvailability(selectedDeparture?.id);

  // Auto-select departure
  useEffect(() => {
    if (tour?.departures?.length && !selectedDeparture) {
      const firstAvailable = tour.departures.find(d => d.status === 'OPEN' && d.availableSlots > 0);
      if (firstAvailable) setSelectedDeparture(firstAvailable);
    }
  }, [tour, selectedDeparture]);

  // Build images
  const sliderImages = useCallback((): { uri: string }[] => {
    if (!tour) return [];
    const imgs: { uri: string }[] = [];
    if (tour.imageUrl) imgs.push({ uri: tour.imageUrl });
    if (tour.images?.length) {
      tour.images
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .forEach(img => imgs.push({ uri: img.imageUrl }));
    }
    if (!imgs.length) imgs.push({ uri: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800' });
    return imgs;
  }, [tour]);
  const images = sliderImages();

  // Auto-scroll logic
  useEffect(() => {
    if (images.length <= 1) return;
    autoScrollTimer.current = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % images.length;
        sliderRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
    return () => { if (autoScrollTimer.current) clearInterval(autoScrollTimer.current); };
  }, [images.length]);

  const onSliderScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeSlide) setActiveSlide(index);
  };
  const onSliderTouchStart = () => { if (autoScrollTimer.current) clearInterval(autoScrollTimer.current); };

  const formatPrice = (price?: number) => price ? new Intl.NumberFormat('vi-VN').format(price) + 'đ' : '0đ';
  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : (tour?.rating || 0);
  const displayReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  if (isTourLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tour) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Slider */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={sliderRef} data={images} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onScroll={onSliderScroll} scrollEventThrottle={16}
            onTouchStart={onSliderTouchStart}
            keyExtractor={(_, idx) => idx.toString()}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            renderItem={({ item }) => (
              <View>
                <Image source={{ uri: item.uri }} style={styles.heroImage} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={styles.heroGradient}
                />
              </View>
            )}
          />
          {images.length > 1 && (
            <View style={styles.paginationBadge}>
              <Text style={styles.paginationText}>{activeSlide + 1}/{images.length}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.glassBtn, { top: insets.top || 20, left: 16 }]} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.glassBtn, { top: insets.top || 20, right: 16, width: 44, height: 44, padding: 0 }]}>
            <FavoriteButton tourId={tour.id} style={{ padding: 10 }} />
          </View>
        </View>

        {/* Info Panel Overlapping Image */}
        <View style={styles.infoPanel}>
          {/* Header row */}
          <View style={styles.topInfoRow}>
            <View style={styles.badgeWrapper}>
              <Icon name="star" size={16} color="#F59E0B" />
              <Text style={styles.badgeText}>{avgRating.toFixed(1)} <Text style={{ color: theme.colors.textLight }}>({reviews.length})</Text></Text>
            </View>
            <View style={[styles.badgeWrapper, { backgroundColor: '#F3F4F6' }]}>
              <Icon name="map-marker-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>{tour.location}</Text>
            </View>
          </View>

          <Text style={styles.title}>{tour.title}</Text>

          {/* Quick Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconBg}><Icon name="clock-outline" size={20} color={theme.colors.primary} /></View>
              <Text style={styles.metricLabel}>Thời lượng</Text>
              <Text style={styles.metricValue}>{tour.duration} ngày</Text>
            </View>
            <View style={styles.metricItem}>
              <View style={styles.metricIconBg}><Icon name="account-group-outline" size={20} color={theme.colors.primary} /></View>
              <Text style={styles.metricLabel}>Đoàn khách</Text>
              <Text style={styles.metricValue}>Tối đa {tour.maxParticipants}</Text>
            </View>
            <View style={styles.metricItem}>
              <View style={styles.metricIconBg}><Icon name="ticket-confirmation-outline" size={20} color={theme.colors.primary} /></View>
              <Text style={styles.metricLabel}>Mã Tour</Text>
              <Text style={styles.metricValue}>#{tour.id}</Text>
            </View>
          </View>

          {/* Special Deal / Price Tag */}
          {tour.originalPrice && tour.originalPrice > tour.price ? (
             <View style={styles.dealBox}>
               <Icon name="brightness-percent" size={24} color="#E11D48" />
               <View style={{ marginLeft: 12, flex: 1 }}>
                 <Text style={styles.dealTitle}>Ưu đãi đặc biệt</Text>
                 <Text style={styles.dealSubtitle}>Tiết kiệm {Math.round((1 - tour.price / tour.originalPrice) * 100)}% khi đặt trực tiếp</Text>
               </View>
             </View>
          ) : null}

          {/* Section: Giới thiệu */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Giới Thiệu</Text>
             <Text style={styles.descriptionText}>{tour.description}</Text>
          </View>

          {/* Section: Điểm Nổi Bật */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Điểm Nổi Bật</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
               {[
                 { i: 'shield-check', t: 'Bảo hiểm DL', c: '#10B981', bg: '#D1FAE5' },
                 { i: 'bus-articulated-front', t: 'Xe đưa đón', c: '#3B82F6', bg: '#DBEAFE' },
                 { i: 'food', t: 'Ẩm thực', c: '#F59E0B', bg: '#FEF3C7' },
                 { i: 'camera', t: 'Cảnh đẹp', c: '#8B5CF6', bg: '#EDE9FE' }
               ].map((hl, i) => (
                 <View key={i} style={styles.highlightCard}>
                   <View style={[styles.hlIconBg, { backgroundColor: hl.bg }]}><Icon name={hl.i} size={22} color={hl.c} /></View>
                   <Text style={styles.hlText}>{hl.t}</Text>
                 </View>
               ))}
            </ScrollView>
          </View>

          {/* Section: Lịch Trình (Vertical Timeline) */}
          {tour.itinerary?.days && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lịch Trình Chi Tiết</Text>
              <View style={styles.timelineWrapper}>
                {tour.itinerary.days.map((day, dIdx) => {
                  const isLastDay = dIdx === tour.itinerary!.days!.length - 1;
                  return (
                    <View key={day.day} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <View style={styles.timelineDot} />
                        {!isLastDay && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineDayTitle}>Ngày {day.day}</Text>
                        <View style={styles.timelineActivities}>
                          {day.activities?.map((act, aIdx) => (
                            <Text key={aIdx} style={styles.timelineActText}>• {act}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section: Khởi Hành */}
          {tour.departures && tour.departures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chuyến Khởi Hành</Text>
              <View style={styles.departuresContainer}>
                {tour.departures.map(dep => {
                  let slots = dep.availableSlots;
                  let total = tour.maxParticipants;
                  if (selectedDeparture?.id === dep.id && realTimeAvail) {
                    slots = realTimeAvail.availableSlots;
                    total = realTimeAvail.totalSlots;
                  }
                  const isSelected = selectedDeparture?.id === dep.id;
                  const isFull = slots <= 0;
                  return (
                    <TouchableOpacity
                      key={dep.id} disabled={isFull} onPress={() => setSelectedDeparture(dep)} activeOpacity={0.8}
                      style={[styles.depBox, isSelected && styles.depBoxSelected, isFull && styles.depBoxFull]}
                    >
                      {isSelected && <View style={styles.depSelectedRibbon}><Icon name="check" size={12} color="#fff" /></View>}
                      <Text style={[styles.depDate, isSelected && styles.depTextSelected]}>
                        {new Date(dep.departureDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </Text>
                      <Text style={[styles.depYear, isSelected && styles.depTextSelected]}>
                        {new Date(dep.departureDate).getFullYear()}
                      </Text>
                      <View style={styles.depDivider} />
                      <Text style={[styles.depSlots, isFull ? { color: theme.colors.error } : isSelected ? styles.depTextSelected : {}]}>
                        {isFull ? 'Hết chỗ' : `Còn ${slots}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section: Đánh Giá */}
          <View style={[styles.section, { marginBottom: 40 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Đánh Giá</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Review', { tourId: tour.id, tourTitle: tour.title })}>
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Viết Đánh Giá</Text>
              </TouchableOpacity>
            </View>
            {displayReviews.length ? (
              <>
                {displayReviews.map(r => <ReviewCard key={r.id} review={r} />)}
                {reviews.length > 2 && (
                  <TouchableOpacity style={styles.viewAllReviewsBtn} onPress={() => setShowAllReviews(!showAllReviews)}>
                    <Text style={styles.viewAllReviewsText}>{showAllReviews ? 'Ẩn bớt' : `Xem tất cả ${reviews.length} đánh giá`}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.emptyReviews}>
                 <Text style={styles.emptyReviewsText}>Chưa có đánh giá nào cho hành trình này.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomPriceInfo}>
          {tour.originalPrice && tour.originalPrice > tour.price && (
            <Text style={styles.bottomOriginalPrice}>{formatPrice(tour.originalPrice)}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.bottomPriceValue}>{formatPrice(tour.price)}</Text>
            <Text style={styles.bottomPriceUnit}>/ khách</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.payButton, (!selectedDeparture && tour.departures?.length > 0) && { backgroundColor: theme.colors.border }]}
          disabled={tour.departures?.length > 0 && !selectedDeparture}
          onPress={() => navigation.navigate('Booking', {
            tourId: tour.id, tourTitle: tour.title, tourPrice: tour.price,
            departureId: selectedDeparture?.id, departureDate: selectedDeparture?.departureDate,
          })}
        >
          <Text style={styles.payButtonText}>{selectedDeparture ? 'Đặt Ngay' : 'Chọn Ngày'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  
  imageContainer: { width, height: SLIDER_HEIGHT, position: 'relative' },
  heroImage: { width, height: SLIDER_HEIGHT },
  heroGradient: { position: 'absolute', bottom: 0, width, height: 180 },
  paginationBadge: { position: 'absolute', bottom: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paginationText: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  
  glassBtn: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },

  infoPanel: {
    backgroundColor: theme.colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -28, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100,
  },
  topInfoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  badgeWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  
  title: { ...theme.typography.h1, fontSize: 24, color: theme.colors.text, marginBottom: 20, lineHeight: 32 },

  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 10 },
  metricItem: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, paddingVertical: 14, borderRadius: 14 },
  metricIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },

  dealBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', padding: 16, borderRadius: 16, marginBottom: 28, borderWidth: 1, borderColor: '#FFE4E6' },
  dealTitle: { fontSize: 15, fontWeight: '700', color: '#BE123C', marginBottom: 2 },
  dealSubtitle: { fontSize: 13, color: '#E11D48' },

  section: { marginBottom: 32 },
  sectionTitle: { ...theme.typography.h2, fontSize: 20, color: theme.colors.text, marginBottom: 16 },
  descriptionText: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 26 },

  highlightCard: { width: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12, alignItems: 'center' },
  hlIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  hlText: { fontSize: 13, fontWeight: '600', color: theme.colors.text, textAlign: 'center' },

  timelineWrapper: { marginLeft: 10 },
  timelineRow: { flexDirection: 'row', marginBottom: 20 },
  timelineLeft: { width: 20, alignItems: 'center', marginRight: 16 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.primary, borderWidth: 3, borderColor: theme.colors.primary + '30', zIndex: 2 },
  timelineLine: { position: 'absolute', top: 14, bottom: -20, width: 2, backgroundColor: theme.colors.surfaceVariant, zIndex: 1 },
  timelineContent: { flex: 1, paddingBottom: 4 },
  timelineDayTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 8, marginTop: -2 },
  timelineActivities: { backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: 12 },
  timelineActText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 6 },

  departuresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  depBox: { width: (width - 64) / 3, backgroundColor: '#fff', borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 16, paddingVertical: 12, alignItems: 'center', overflow: 'hidden' },
  depBoxSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  depBoxFull: { opacity: 0.5, backgroundColor: '#F3F4F6' },
  depSelectedRibbon: { position: 'absolute', top: 0, left: 0, backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8 },
  depDate: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 2 },
  depYear: { fontSize: 12, color: theme.colors.textSecondary },
  depDivider: { width: '40%', height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  depSlots: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  depTextSelected: { color: '#fff' },

  emptyReviews: { padding: 20, alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, borderRadius: 14 },
  emptyReviewsText: { color: theme.colors.textSecondary, fontStyle: 'italic' },
  viewAllReviewsBtn: { alignItems: 'center', paddingVertical: 14, backgroundColor: theme.colors.primary + '10', borderRadius: 16, marginTop: 10 },
  viewAllReviewsText: { color: theme.colors.primary, fontWeight: '700' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, ...theme.shadows.lg },
  bottomPriceInfo: { flex: 1 },
  bottomOriginalPrice: { fontSize: 13, color: theme.colors.textLight, textDecorationLine: 'line-through', marginBottom: 2 },
  bottomPriceValue: { ...theme.typography.price, fontSize: 24, color: theme.colors.accent },
  bottomPriceUnit: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 },
  payButton: { backgroundColor: theme.colors.accent, paddingHorizontal: 32, paddingVertical: 16, borderRadius: theme.borderRadius.full },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
