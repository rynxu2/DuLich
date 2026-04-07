/**
 * TourCard — Clean, image-first card. Subtle gradient, warm pricing.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Tour } from '../api/tours';
import { theme } from '../theme';

interface Props {
  tour: Tour;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export default function TourCard({ tour, onPress, onFavoritePress, isFavorite = false }: Props) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const hasDiscount = tour.originalPrice && tour.originalPrice > tour.price;
  const discountPct = hasDiscount
    ? Math.round((1 - tour.price / tour.originalPrice!) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      {/* Image */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: tour.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600' }}
          style={styles.image}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={styles.imageGradient}
        />

        {/* Top: Discount */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}

        {/* Top right: Heart */}
        <Pressable style={styles.heartBtn} onPress={onFavoritePress} hitSlop={8}>
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? theme.colors.heart : '#fff'}
          />
        </Pressable>

        {/* Bottom: Location */}
        <View style={styles.imageBottom}>
          <View style={styles.locationRow}>
            <Icon name="map-marker-outline" size={13} color="#fff" />
            <Text style={styles.locationText} numberOfLines={1}>{tour.location}</Text>
          </View>
          <View style={styles.ratingPill}>
            <Icon name="star" size={12} color={theme.colors.star} />
            <Text style={styles.ratingText}>{(tour.rating || 0).toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{tour.title}</Text>

        <View style={styles.metaRow}>
          <Icon name="clock-outline" size={14} color={theme.colors.textLight} />
          <Text style={styles.metaText}>{tour.duration} ngày</Text>
          {tour.reviewCount ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{tour.reviewCount} đánh giá</Text>
            </>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <View>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatPrice(tour.originalPrice!)}</Text>
            )}
            <Text style={styles.price}>{formatPrice(tour.price)}</Text>
          </View>
          <Text style={styles.perPerson}>/người</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadows.md,
    overflow: 'hidden',
  },

  imageWrap: { width: '100%', height: 200 },
  image: { width: '100%', height: '100%', backgroundColor: theme.colors.surfaceVariant },
  imageGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
  },

  discountBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  heartBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  imageBottom: {
    position: 'absolute', bottom: 10, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  ratingText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  content: { padding: 14 },
  title: {
    fontSize: 16, fontWeight: '600', color: theme.colors.text,
    lineHeight: 21, marginBottom: 6, letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10,
  },
  metaText: { fontSize: 12, color: theme.colors.textLight, fontWeight: '400' },
  metaDot: { fontSize: 12, color: theme.colors.textLight },

  priceRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
  },
  originalPrice: {
    fontSize: 12, color: theme.colors.textLight, textDecorationLine: 'line-through',
  },
  price: { ...theme.typography.price, color: theme.colors.accent },
  perPerson: { fontSize: 12, color: theme.colors.textLight, marginLeft: 2 },
});
