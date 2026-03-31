/**
 * TourCard Component — Card UI for tour listing
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: tour.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' }}
          style={styles.image}
        />
        <Pressable style={styles.favoriteBtn} onPress={onFavoritePress}>
          <Icon name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FF5A5F" : "#fff"} />
        </Pressable>
        {tour.originalPrice && tour.originalPrice > tour.price ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              Giảm {Math.round((1 - tour.price / tour.originalPrice) * 100)}%
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.location} numberOfLines={1}>{tour.location}</Text>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={14} color={theme.colors.star} />
            <Text style={styles.ratingText}>{(tour.rating || 0).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>{tour.title}</Text>
        <Text style={styles.duration}>{tour.duration} ngày</Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Từ</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {tour.originalPrice && tour.originalPrice > tour.price && (
                <Text style={styles.originalPrice}>{formatPrice(tour.originalPrice)}</Text>
              )}
              <Text style={styles.price}>{formatPrice(tour.price)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    // Soft shadow for modern look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceVariant,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  location: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    lineHeight: 24,
    marginBottom: 6,
  },
  duration: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  originalPrice: {
    fontSize: 14,
    color: theme.colors.textLight,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: theme.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
