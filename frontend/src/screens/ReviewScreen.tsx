/**
 * Review Screen — Rating and review submission (API-powered, no sample fallback)
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, TextInput as RNTextInput,
  ScrollView, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Review, reviewsApi } from '../api/reviews';
import { useAuth } from '../store/AuthContext';
import ReviewCard from '../components/ReviewCard';
import { HomeStackParamList } from '../navigation/MainTabs';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Review'>;
  route: RouteProp<HomeStackParamList, 'Review'>;
};

export default function ReviewScreen({ navigation, route }: Props) {
  const { tourId, tourTitle } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewsApi.getByTour(tourId);
        setReviews(res.data);
      } catch {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [tourId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
      return;
    }
    setLoading(true);
    try {
      const res = await reviewsApi.create({
        tourId,
        rating,
        comment: review,
      });
      setReviews(prev => [res.data, ...prev]);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Đánh Giá</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.tourName}>{tourTitle}</Text>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="star" size={24} color={theme.colors.star} />
            <Text style={styles.statValue}>{avgRating}</Text>
            <Text style={styles.statLabel}>Trung bình</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="message-text-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
        </View>

        {/* Write Review Form */}
        {!submitted ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Viết Đánh Giá Của Bạn</Text>

            <Text style={styles.label}>Đánh giá</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Icon
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? theme.colors.star : theme.colors.textLight}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating === 0 ? 'Chạm để đánh giá' :
               rating <= 2 ? 'Chưa hài lòng' :
               rating <= 3 ? 'Bình thường' :
               rating <= 4 ? 'Hài lòng' : 'Rất tuyệt vời!'}
            </Text>

            <Text style={styles.label}>Nhận xét</Text>
            <RNTextInput
              value={review}
              onChangeText={setReview}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              multiline
              numberOfLines={5}
              style={styles.textArea}
              textAlignVertical="top"
              placeholderTextColor={theme.colors.textLight}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="send" size={18} color="#fff" />
                  <Text style={styles.submitText}>Gửi Đánh Giá</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.thankYouCard}>
            <Icon name="check-circle" size={48} color={theme.colors.success} />
            <Text style={styles.thankYouTitle}>Cảm ơn bạn!</Text>
            <Text style={styles.thankYouText}>Đánh giá của bạn đã được ghi nhận.</Text>
          </View>
        )}

        {/* Existing Reviews */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsSectionTitle}>Tất Cả Đánh Giá ({reviews.length})</Text>
          {loadingReviews ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : reviews.length > 0 ? (
            reviews.map(r => <ReviewCard key={r.id} review={r} />)
          ) : (
            <View style={styles.emptyReviews}>
              <Icon name="message-text-outline" size={32} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  backBtn: { padding: 8 },
  hTitle: { ...theme.typography.h3, color: theme.colors.text },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
  tourName: { ...theme.typography.h2, color: theme.colors.text, textAlign: 'center', marginBottom: 20 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: 20, marginBottom: 24, elevation: 1,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginTop: 6 },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 50, backgroundColor: theme.colors.border },
  formCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: 20, marginBottom: 24, elevation: 2,
  },
  formTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16, textAlign: 'center' },
  label: { ...theme.typography.caption, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  ratingLabel: { ...theme.typography.body, color: theme.colors.primary, textAlign: 'center', marginBottom: 20 },
  textArea: {
    backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md,
    padding: 16, fontSize: 15, color: theme.colors.text, minHeight: 100,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16,
  },
  submitButton: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, elevation: 3,
  },
  buttonDisabled: { opacity: 0.7 },
  submitText: { ...theme.typography.button, color: '#fff' },
  thankYouCard: {
    backgroundColor: theme.colors.success + '10', borderRadius: theme.borderRadius.lg,
    padding: 24, alignItems: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: theme.colors.success + '30',
  },
  thankYouTitle: { ...theme.typography.h2, color: theme.colors.text, marginTop: 12 },
  thankYouText: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: 4 },
  reviewsSection: { marginTop: 4 },
  reviewsSectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 14 },
  emptyReviews: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { ...theme.typography.bodySmall, color: theme.colors.textLight, marginTop: 8 },
});
