/**
 * Home Screen — Tour exploration with search, category filters, and featured tours
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TourCard from '../components/TourCard';
import { Tour, toursApi } from '../api/tours';
import { useAuth } from '../store/AuthContext';
import { HomeStackParamList } from '../navigation/MainTabs';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;
};

const CATEGORIES = [
  { key: 'all', label: 'Tất cả', icon: 'earth' },
  { key: 'beach', label: 'Biển', icon: 'waves' },
  { key: 'mountain', label: 'Núi', icon: 'image-filter-hdr' },
  { key: 'city', label: 'Thành phố', icon: 'city' },
  { key: 'island', label: 'Đảo', icon: 'island' },
  { key: 'culture', label: 'Văn hóa', icon: 'book-open-variant' },
  { key : 'international', label: 'Quốc tế', icon: 'earth' }
];

const PROMOTIONS = [
  {
    id: 1,
    title: 'Giảm 20% Tour Hè',
    subtitle: 'Đặt trước 30/04 để nhận ưu đãi',
    color: '#FF6B6B',
    icon: 'tag-outline',
  },
  {
    id: 2,
    title: 'Combo Gia Đình',
    subtitle: 'Mua 3 vé tặng 1 vé cho bé',
    color: '#4FC0D0',
    icon: 'account-group',
  },
  {
    id: 3,
    title: 'Flash Sale Weekend',
    subtitle: 'Tour cuối tuần giá sốc từ 1.5tr',
    color: '#F39C12',
    icon: 'flash',
  },
];

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchTours = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const normalizedSearch = searchQuery.trim();
      const response = await toursApi.list({
        keyword: normalizedSearch || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      const data = response.data;
      console.log('Fetched tours:', data);
      setTours(data);
    } catch {
      setTours([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchTours(false);
  }, [fetchTours]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTours(true);
  };

  const filteredTours = tours;

  const featuredTours = useMemo(() => {
    return [...tours].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [tours]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const renderHeader = () => (
    <View>
      {/* Promotions Banner */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.promoContainer}>
        {PROMOTIONS.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.promoCard, { backgroundColor: item.color }]} activeOpacity={0.9}>
            <View style={styles.promoContent}>
              <View style={styles.promoIconBg}>
                <Icon name={item.icon} size={22} color="#fff" />
              </View>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>{item.title}</Text>
                <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Section */}
      {featuredTours.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tour Nổi Bật</Text>
            <Icon name="star" size={18} color={theme.colors.star} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}>
            {featuredTours.map((item) => (
              <TouchableOpacity
                key={`featured-${item.id}`}
                style={styles.featuredCard}
                onPress={() => navigation.navigate('TourDetail', { tourId: item.id })}
                activeOpacity={0.9}>
                <Image
                  source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' }}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredGradient}>
                  <View style={styles.featuredRating}>
                    <Icon name="star" size={11} color={theme.colors.star} />
                    <Text style={styles.featuredRatingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.featuredLocationRow}>
                    <Icon name="map-marker-outline" size={11} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.featuredLocation}>{item.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* All Tours Header */}
      <View style={styles.allToursHeader}>
        <Text style={styles.sectionTitle}>Tất Cả Tour</Text>
        <View style={styles.tourCountBadge}>
          <Text style={styles.tourCount}>{filteredTours.length}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user?.fullName || user?.username || 'Bạn'} 👋</Text>
          <Text style={styles.headerTitle}>Khám Phá Việt Nam</Text>
        </View>
        <TouchableOpacity style={styles.avatarButton}>
          <Icon name="account-circle" size={40} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Tìm kiếm tour du lịch..."
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor={theme.colors.textSecondary}
      />

      {/* Category Filters */}
      <View
        style={{ paddingHorizontal: 20, }}
      >
        <FlatList
          horizontal
          style={{ flexGrow: 0 }}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.key && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.key)}>
              <Icon
                name={item.icon}
                size={16}
                color={selectedCategory === item.key ? '#fff' : theme.colors.primary}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.key && styles.categoryTextActive,
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tour List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View
          style={{ paddingHorizontal: 20, paddingBottom: 185 }}
        >
          <FlatList
            data={filteredTours}
            keyExtractor={(item, index) => item?.id?.toString() ?? index.toString()}
            contentContainerStyle={styles.tourList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <TourCard
                tour={item}
                onPress={() => navigation.navigate('TourDetail', { tourId: item.id })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="compass-off-outline" size={64} color={theme.colors.textLight} />
                <Text style={styles.emptyText}>Không tìm thấy tour nào</Text>
                {selectedCategory !== 'all' && (
                  <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                    <Text style={styles.resetFilter}>Xem tất cả tour</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginTop: 2,
  },
  avatarButton: { padding: 4 },
  searchBar: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  searchInput: { fontSize: 14 },
  categoriesContainer: {
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
  },
  promoContainer: {
    paddingBottom: 20,
    paddingTop: 4,
    gap: 10,
  },
  promoCard: {
    width: 240,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoTextContainer: { flex: 1 },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  promoSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 15,
  },
  featuredSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  featuredList: {
    gap: 10,
  },
  featuredCard: {
    width: 190,
    height: 130,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceVariant,
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 30,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  featuredRating: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  featuredRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  featuredLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  featuredLocation: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  allToursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  tourCountBadge: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tourCount: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  tourList: {
    paddingBottom: 20,
    marginBottom:90
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    marginTop: 12,
  },
  resetFilter: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 12,
  },
});
