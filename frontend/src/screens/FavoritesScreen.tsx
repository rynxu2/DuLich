/**
 * Favorites Screen — List of saved/favorite tours (API-powered)
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Tour Yêu Thích</Text>
        <View style={{ width: 40 }} />
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
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          renderItem={({ item }) => (
            <View>
              <TourCard tour={item} onPress={() => {}} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveFavorite(item.id)}>
                <Icon name="heart-off" size={18} color={theme.colors.error} />
                <Text style={styles.removeBtnText}>Bỏ yêu thích</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="heart-outline" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>Chưa có tour yêu thích</Text>
              <Text style={styles.emptySubtitle}>
                Nhấn trên các tour để lưu vào danh sách yêu thích
              </Text>
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
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  backBtn: { padding: 8 },
  hTitle: { ...theme.typography.h3, color: theme.colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 20 },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: -8, marginBottom: 12, paddingVertical: 8,
  },
  removeBtnText: { ...theme.typography.bodySmall, color: theme.colors.error },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textLight, marginTop: 16 },
  emptySubtitle: {
    ...theme.typography.bodySmall, color: theme.colors.textLight,
    marginTop: 4, textAlign: 'center', paddingHorizontal: 40,
  },
});
