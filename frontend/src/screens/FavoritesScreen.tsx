/**
 * FavoritesScreen — Premium favorites list with beautiful empty state
 */
import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TourCard from '../components/TourCard';
import { theme } from '../theme';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { Tour } from '../api/tours';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function FavoritesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: favorites = [], isLoading, isRefetching, refetch } = useFavorites();
  const { mutate: toggleFavorite } = useToggleFavorite();

  const handleRemoveFavorite = (tourId: number) => {
    toggleFavorite(tourId, {
      onError: () => {
        Alert.alert('Lỗi', 'Không thể bỏ yêu thích. Vui lòng thử lại.');
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Tour Yêu Thích</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{favorites.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => (
            <TourCard
              tour={item}
              onPress={() => navigation.navigate('TourDetail', { tourId: item.id })}
              onFavoritePress={() => handleRemoveFavorite(item.id)}
              isFavorite={true}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <View style={styles.emptyIconInner}>
                  <Icon name="heart-outline" size={36} color={theme.colors.heart} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Chưa có tour yêu thích</Text>
              <Text style={styles.emptySubtitle}>
                Khám phá những tour tuyệt vời và nhấn vào biểu tượng trái tim để lưu lại!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('HomeTab')}
                activeOpacity={0.85}
              >
                <Icon name="compass-outline" size={18} color="#fff" />
                <Text style={styles.exploreBtnText}>Khám Phá Ngay</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  hTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  countBadge: {
    minWidth: 28, height: 28, borderRadius: 10,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8,
  },
  countText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 100 },

  // ── Empty State ──
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 32,
    backgroundColor: theme.colors.errorMuted,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconInner: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14, color: theme.colors.textSecondary,
    textAlign: 'center', paddingHorizontal: 50, lineHeight: 21, marginBottom: 28,
  },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.colored,
  },
  exploreBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
