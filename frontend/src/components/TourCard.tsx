/**
 * TourCard — Premium image-first card with depth + frosted accents.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Tour } from '../api/tours';
import { theme } from '../theme';
import { getMediaUrl } from '../utils/media';

const { width } = Dimensions.get('window');

interface Props {
  tour: Tour;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  compact?: boolean;
}

export default function TourCard({ tour, onPress, onFavoritePress, isFavorite = false, compact = false }: Props) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const hasDiscount = tour.originalPrice && tour.originalPrice > tour.price;
  const discountPct = hasDiscount
    ? Math.round((1 - tour.price / tour.originalPrice!) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Image */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: getMediaUrl(tour.imageUrl) || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600' }}
          style={styles.image}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.55)']}
          locations={[0, 0.5, 1]}
          style={styles.imageGradient}
        />

        {/* Top left: Discount badge */}
        {hasDiscount && (
          <LinearGradient
            colors={[theme.colors.accent, theme.colors.accentDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.discountBadge}
          >
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </LinearGradient>
        )}

        {/* Top right: Heart */}
        <Pressable style={styles.heartBtn} onPress={onFavoritePress} hitSlop={10}>
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? theme.colors.heart : '#fff'}
          />
        </Pressable>

        {/* Bottom: Location + Rating */}
        <View style={styles.imageBottom}>
          <View style={styles.locationRow}>
            <Icon name="map-marker" size={13} color={theme.colors.primaryLight} />
            <Text style={styles.locationText} numberOfLines={1}>{tour.location}</Text>
          </View>
          <View style={styles.ratingPill}>
            <Icon name="star" size={11} color={theme.colors.star} />
            <Text style={styles.ratingText}>{(tour.rating || 0).toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{tour.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Icon name="clock-outline" size={13} color={theme.colors.primary} />
            <Text style={styles.metaText}>{tour.duration} ngày</Text>
          </View>
          {tour.reviewCount ? (
            <View style={styles.metaChip}>
              <Icon name="message-text-outline" size={13} color={theme.colors.primary} />
              <Text style={styles.metaText}>{tour.reviewCount} đánh giá</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatPrice(tour.originalPrice!)}</Text>
            )}
            <View style={styles.priceWrap}>
              <Text style={styles.price}>{formatPrice(tour.price)}</Text>
              <Text style={styles.perPerson}>/người</Text>
            </View>
          </View>
          <View style={styles.bookHint}>
            <Text style={styles.bookHintText}>Xem chi tiết</Text>
            <Icon name="arrow-right" size={14} color={theme.colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginBottom: 20,
    ...theme.shadows.lg,
    overflow: 'hidden',
  },

  // ── Image ──
  imageWrap: { width: '100%', height: 220 },
  image: { width: '100%', height: '100%', backgroundColor: theme.colors.surfaceVariant },
  imageGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 120,
  },

  discountBadge: {
    position: 'absolute', top: 14, left: 14,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  discountText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  heartBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  imageBottom: {
    position: 'absolute', bottom: 12, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locationText: { color: '#fff', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── Content ──
  content: { padding: 16 },
  title: {
    fontSize: 16, fontWeight: '700', color: theme.colors.text,
    lineHeight: 22, marginBottom: 10, letterSpacing: -0.2,
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  metaText: { fontSize: 11, color: theme.colors.primaryDark, fontWeight: '600' },

  priceRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  priceLeft: {},
  originalPrice: {
    fontSize: 12, color: theme.colors.textLight,
    textDecorationLine: 'line-through', marginBottom: 1,
  },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { ...theme.typography.price, color: theme.colors.accent },
  perPerson: { fontSize: 12, color: theme.colors.textLight },

  bookHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  bookHintText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
});
