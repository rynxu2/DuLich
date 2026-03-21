/**
 * Tour Detail Screen — Full tour info with image slider, reviews, favorites,
 * itinerary, and real-time departure availability
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Dimensions,
  FlatList, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Tour, TourImage, TourDeparture, toursApi } from '../api/tours';
import { Review, reviewsApi } from '../api/reviews';
import ReviewCard from '../components/ReviewCard';
import FavoriteButton from '../components/FavoriteButton';
import { HomeStackParamList } from '../navigation/MainTabs';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'TourDetail'>;
  route: RouteProp<HomeStackParamList, 'TourDetail'>;
};

const { width } = Dimensions.get('window');
const SLIDER_HEIGHT = 300;
const AUTO_SCROLL_INTERVAL = 4000; // ms

export default function TourDetailScreen({ navigation, route }: Props) {
  const { tourId } = route.params;
  const [tour, setTour] = useState<Tour | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<TourDeparture | null>(null);
  const [availability, setAvailability] = useState<Record<number, { availableSlots: number; totalSlots: number }>>({});

  // Image slider state
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const response = await toursApi.getById(tourId);
        const tourData = response.data;
        setTour(tourData);

        // Fetch availability for each departure
        if (tourData.departures?.length > 0) {
          const availMap: Record<number, { availableSlots: number; totalSlots: number }> = {};
          for (const dep of tourData.departures) {
            try {
              const avail = await toursApi.getAvailability(dep.id);
              availMap[dep.id] = {
                availableSlots: avail.data.availableSlots,
                totalSlots: avail.data.totalSlots,
              };
            } catch {
              availMap[dep.id] = { availableSlots: dep.availableSlots, totalSlots: tourData.maxParticipants };
            }
          }
          setAvailability(availMap);
          // Auto-select first available departure
          const firstAvailable = tourData.departures.find(
            (d: TourDeparture) => d.status === 'OPEN' && (availMap[d.id]?.availableSlots ?? d.availableSlots) > 0
          );
          if (firstAvailable) setSelectedDeparture(firstAvailable);
        }
      } catch {
        setTour(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewsApi.getByTour(tourId);
        setReviews(res.data);
      } catch {
        setReviews([]);
      }
    };
    fetchReviews();
  }, [tourId]);

  // Build the list of images for the slider
  const sliderImages = useCallback((): { uri: string }[] => {
    if (!tour) return [];
    const imgs: { uri: string }[] = [];
    imgs.push({ uri: tour.imageUrl });

    // Add images from API (tour.images)
    if (tour.images && tour.images.length > 0) {
      tour.images
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .forEach((img) => {
          imgs.push({ uri: img.imageUrl });
        });
    }

    // If no API images, fall back to tour.imageUrl
    if (imgs.length === 0 && tour.imageUrl) {
      imgs.push({ uri: tour.imageUrl });
    }

    // Absolute fallback
    if (imgs.length === 0) {
      imgs.push({
        uri: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800'
      });
    }

    return imgs;
  }, [tour]);

  const images = sliderImages();

  // Auto-scroll logic
  useEffect(() => {
    if (images.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % images.length;
        sliderRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [images.length]);

  const onSliderScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeSlide) {
      setActiveSlide(index);
    }
  };

  // Reset auto-scroll timer when user manually swipes
  const onSliderTouchStart = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
  };

  const onSliderTouchEnd = () => {
    if (images.length <= 1) return;
    autoScrollTimer.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % images.length;
        sliderRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : tour?.rating || 0;

  const displayReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tour) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="alert-circle-outline" size={64} color={theme.colors.textLight} />
        <Text style={styles.errorText}>Không thể tải thông tin tour</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Slider */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={sliderRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onSliderScroll}
            scrollEventThrottle={16}
            onTouchStart={onSliderTouchStart}
            onTouchEnd={onSliderTouchEnd}
            keyExtractor={(_, index) => index.toString()}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.uri }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            )}
          />

          {/* Dot Indicators */}
          {images.length > 1 && (
            <View style={styles.dotContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeSlide && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Image counter badge */}
          {images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Icon name="image-multiple" size={14} color="#fff" />
              <Text style={styles.imageCountText}>
                {activeSlide + 1}/{images.length}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <FavoriteButton
            tourId={tour.id}
            style={styles.favoriteButton}
          />
          <View style={styles.ratingOverlay}>
            <Icon name="star" size={16} color={theme.colors.star} />
            <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
            <Text style={styles.reviewCountOverlay}>({reviews.length})</Text>
          </View>
        </View>

        {/* Tour Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{tour.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="map-marker" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>{tour.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="clock-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>{tour.duration} ngày</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.price}>{formatPrice(tour.price)}</Text>
            <Text style={styles.priceLabel}>/ người</Text>
          </View>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô Tả</Text>
            <Text style={styles.description}>{tour.description}</Text>
          </View>

          {/* Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Điểm Nổi Bật</Text>
            <View style={styles.highlightGrid}>
              <View style={styles.highlightItem}>
                <Icon name="shield-check" size={20} color={theme.colors.success} />
                <Text style={styles.highlightText}>Bảo hiểm du lịch</Text>
              </View>
              <View style={styles.highlightItem}>
                <Icon name="bus" size={20} color={theme.colors.primary} />
                <Text style={styles.highlightText}>Xe đời mới</Text>
              </View>
              <View style={styles.highlightItem}>
                <Icon name="food" size={20} color={theme.colors.warning} />
                <Text style={styles.highlightText}>Bữa ăn đặc sản</Text>
              </View>
              <View style={styles.highlightItem}>
                <Icon name="account-tie" size={20} color={theme.colors.accent} />
                <Text style={styles.highlightText}>HDV chuyên nghiệp</Text>
              </View>
            </View>
          </View>

          {/* Itinerary Preview */}
          {tour.itinerary?.days && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lịch Trình</Text>
              {tour.itinerary.days.map((day) => (
                <View key={day.day} style={styles.dayCard}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>Ngày {day.day}</Text>
                  </View>
                  {day.activities.map((activity, idx) => (
                    <View key={idx} style={styles.activityRow}>
                      <View style={styles.activityDot} />
                      <Text style={styles.activityText}>{activity}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Departure Availability */}
          {tour.departures && tour.departures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lịch Khởi Hành</Text>
              {tour.departures.map((dep) => {
                const avail = availability[dep.id];
                const slots = avail?.availableSlots ?? dep.availableSlots;
                const total = avail?.totalSlots ?? tour.maxParticipants;
                const isSelected = selectedDeparture?.id === dep.id;
                const isFull = slots <= 0;
                const isLow = slots > 0 && slots <= 5;

                return (
                  <TouchableOpacity
                    key={dep.id}
                    disabled={isFull}
                    onPress={() => setSelectedDeparture(dep)}
                    style={[
                      styles.departureCard,
                      isSelected && styles.departureCardSelected,
                      isFull && styles.departureCardDisabled,
                    ]}
                    activeOpacity={0.7}>
                    <View style={styles.departureLeft}>
                      <Icon name="calendar-month" size={20}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                      <View>
                        <Text style={[
                          styles.departureDate,
                          isSelected && { color: theme.colors.primary },
                        ]}>
                          {new Date(dep.departureDate).toLocaleDateString('vi-VN', {
                            weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </Text>
                        <Text style={styles.departureSlots}>
                          {isFull
                            ? 'Hết chỗ'
                            : `${slots}/${total} chỗ còn trống`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.departureRight}>
                      {isFull ? (
                        <View style={styles.badgeFull}>
                          <Text style={styles.badgeFullText}>Hết</Text>
                        </View>
                      ) : isLow ? (
                        <View style={styles.badgeLow}>
                          <Text style={styles.badgeLowText}>Sắp hết</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeOpen}>
                          <Text style={styles.badgeOpenText}>Còn chỗ</Text>
                        </View>
                      )}
                      {isSelected && (
                        <Icon name="check-circle" size={22} color={theme.colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Đánh Giá</Text>
                <View style={styles.reviewSummary}>
                  <Icon name="star" size={18} color={theme.colors.star} />
                  <Text style={styles.reviewAvg}>{avgRating.toFixed(1)}</Text>
                  <Text style={styles.reviewTotal}>• {reviews.length} đánh giá</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => navigation.navigate('Review', {
                  tourId: tour.id,
                  tourTitle: tour.title,
                })}>
                <Icon name="pencil" size={16} color="#fff" />
                <Text style={styles.writeReviewBtnText}>Viết đánh giá</Text>
              </TouchableOpacity>
            </View>

            {displayReviews.length > 0 ? (
              <>
                {displayReviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {reviews.length > 2 && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setShowAllReviews(!showAllReviews)}>
                    <Text style={styles.showMoreText}>
                      {showAllReviews ? 'Ẩn bớt' : `Xem tất cả ${reviews.length} đánh giá`}
                    </Text>
                    <Icon
                      name={showAllReviews ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.reviewPlaceholder}>
                <Icon name="message-text-outline" size={32} color={theme.colors.textLight} />
                <Text style={styles.reviewPlaceholderText}>
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Book Button */}
      <View style={styles.bottomBar}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          <Text style={styles.bottomPrice}>{formatPrice(tour.price)}</Text>
          <Text style={styles.bottomPriceLabel}>/ người</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, !selectedDeparture && tour.departures?.length > 0 && { opacity: 0.5 }]}
          disabled={tour.departures?.length > 0 && !selectedDeparture}
          onPress={() => navigation.navigate('Booking', {
            tourId: tour.id,
            tourTitle: tour.title,
            tourPrice: tour.price,
            departureId: selectedDeparture?.id,
            departureDate: selectedDeparture?.departureDate,
          })}
          activeOpacity={0.8}>
          <Text style={styles.bookButtonText}>
            {selectedDeparture ? 'Đặt Tour' : 'Chọn ngày trước'}
          </Text>
          <Icon name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: { ...theme.typography.body, color: theme.colors.textLight, marginTop: 12 },
  backLink: { ...theme.typography.body, color: theme.colors.primary, marginTop: 8 },
  imageContainer: { position: 'relative' },
  heroImage: { width, height: SLIDER_HEIGHT, backgroundColor: theme.colors.surfaceVariant },
  backButtonOverlay: {
    position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20, padding: 8,
  },
  favoriteButton: {
    position: 'absolute', top: 48, right: 16,
  },
  ratingOverlay: {
    position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, gap: 4,
  },
  ratingText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reviewCountOverlay: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  // Slider dots
  dotContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
    borderRadius: 4,
  },

  // Image count badge
  imageCountBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  infoSection: { padding: 20 },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...theme.typography.body, color: theme.colors.textSecondary },
  price: { fontSize: 28, fontWeight: '800', color: theme.colors.accent },
  priceLabel: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: -2, marginBottom: 4 },
  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 12 },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 24 },
  highlightGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  highlightItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14, paddingVertical: 10, width: '47%',
  },
  highlightText: { ...theme.typography.bodySmall, color: theme.colors.text },
  dayCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 16, marginBottom: 12, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  dayBadge: {
    backgroundColor: theme.colors.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12,
  },
  dayBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 10 },
  activityDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primaryLight,
  },
  activityText: { ...theme.typography.body, color: theme.colors.text, flex: 1 },
  reviewSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 14,
  },
  reviewAvg: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  reviewTotal: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  writeReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.primary, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  writeReviewBtnText: { ...theme.typography.caption, color: '#fff' },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 12,
  },
  showMoreText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },
  reviewPlaceholder: {
    alignItems: 'center', paddingVertical: 24, backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
  },
  reviewPlaceholderText: {
    ...theme.typography.bodySmall, color: theme.colors.textLight, marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  bottomPrice: { fontSize: 22, fontWeight: '800', color: theme.colors.accent },
  bottomPriceLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4 },
  bookButton: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14, elevation: 3,
  },
  bookButtonText: { ...theme.typography.button, color: '#fff' },

  // Departure styles
  departureCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: theme.colors.border,
  },
  departureCardSelected: {
    borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08',
  },
  departureCardDisabled: {
    opacity: 0.5,
  },
  departureLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  departureDate: { ...theme.typography.body, fontWeight: '700', color: theme.colors.text },
  departureSlots: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  departureRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeFull: {
    backgroundColor: theme.colors.error + '15', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeFullText: { ...theme.typography.caption, color: theme.colors.error, fontWeight: '700' },
  badgeLow: {
    backgroundColor: theme.colors.warning + '15', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeLowText: { ...theme.typography.caption, color: theme.colors.warning, fontWeight: '700' },
  badgeOpen: {
    backgroundColor: theme.colors.success + '15', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeOpenText: { ...theme.typography.caption, color: theme.colors.success, fontWeight: '700' },
});
