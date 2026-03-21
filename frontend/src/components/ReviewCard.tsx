/**
 * ReviewCard Component — Displays a single review with rating stars
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Review } from '../api/reviews';
import { theme } from '../theme';

interface Props {
  review: Review;
}

export default function ReviewCard({ review }: Props) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="account" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.username}>{review.isAnonymous ? 'Ẩn danh' : `Khách hàng #${review.userId}`}</Text>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Icon name="star" size={14} color={theme.colors.star} />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name={star <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= review.rating ? theme.colors.star : theme.colors.textLight}
          />
        ))}
      </View>
      {review.title ? (
        <Text style={[styles.comment, { fontWeight: '600', marginBottom: 4 }]}>{review.title}</Text>
      ) : null}
      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.star + '18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
