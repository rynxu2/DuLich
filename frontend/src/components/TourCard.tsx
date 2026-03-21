/**
 * TourCard Component — Card UI for tour listing
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Tour } from '../api/tours';
import { theme } from '../theme';

interface Props {
  tour: Tour;
  onPress: () => void;
}

export default function TourCard({ tour, onPress }: Props) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: tour.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' }}
        style={styles.image}
      />
      <View style={styles.ratingBadge}>
        <Icon name="star" size={14} color={theme.colors.star} />
        <Text style={styles.ratingText}>{tour.rating.toFixed(1)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{tour.title}</Text>
        <View style={styles.locationRow}>
          <Icon name="map-marker-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.location}>{tour.location}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(tour.price)}</Text>
          <View style={styles.durationBadge}>
            <Icon name="clock-outline" size={12} color={theme.colors.primary} />
            <Text style={styles.duration}>{tour.duration} ngày</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.surfaceVariant,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  location: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  duration: {
    ...theme.typography.caption,
    color: theme.colors.primary,
  },
});
