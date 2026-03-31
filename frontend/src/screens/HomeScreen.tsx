/**
 * Modern Home Screen — Redesigned with premium UX/UI
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Image, ScrollView,
  TextInput, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TourCard from '../components/TourCard';
import { useAuthStore } from '../store/useAuthStore';
import { useTours } from '../hooks/useTours';
import { MainTabParamList } from '../navigation/MainTabs';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'all', label: 'Khám phá', icon: 'compass-outline' },
  { key: 'beach', label: 'Biển đảo', icon: 'beach' },
  { key: 'mountain', label: 'Leo núi', icon: 'image-filter-hdr' },
  { key: 'city', label: 'Thành thị', icon: 'city-variant-outline' },
  { key: 'culture', label: 'Văn hóa', icon: 'bank-outline' },
  { key : 'international', label: 'Quốc tế', icon: 'airplane-marker' }
];

const PROMOTIONS = [
  {
    id: 1,
    title: 'Mùa Hè Sôi Động',
    subtitle: 'Giảm đến 30% cho các tour biển đảo',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600',
    color: '#FF7B54',
  },
  {
    id: 2,
    title: 'Khám Phá Tây Bắc',
    subtitle: 'Trekking săn mây ưu đãi sốc',
    image: 'https://images.unsplash.com/photo-1542318855-408fbce9d08e?w=600',
    color: '#2E8B57',
  },
  {
    id: 3,
    title: 'Trải Nghiệm Hội An',
    subtitle: 'Hoài niệm quá khứ với tour đi bộ',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
    color: '#8E44AD',
  }
];

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: tours = [], isLoading, isRefetching, refetch } = useTours({
    keyword: searchQuery.trim() || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  const onRefresh = () => refetch();

  const featuredTours = useMemo(() => {
    return [...tours].sort((a, b) => b.rating - a.rating).slice(0, 5);
  }, [tours]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.fullName || user?.username || 'Traveler'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.avatarButton} 
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <Image 
            source={{ uri: user?.avatarUrl || 'https://mui.com/static/images/avatar/2.jpg' }} 
            style={styles.avatarImage} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Modern Box */}
      <View style={styles.searchWrapper}>
        <TouchableOpacity 
          style={styles.searchContainer} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('SearchTab')}
        >
          <Icon name="magnify" size={28} color={theme.colors.textSecondary} />
          <Text style={styles.fakeSearchText}>Bạn muốn đi đâu?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => navigation.navigate('SearchTab')}>
          <Icon name="tune-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modern Categories Row */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <TouchableOpacity 
              key={cat.key} 
              style={[styles.categoryItem, isActive && styles.categoryItemActive]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Icon 
                name={cat.icon} 
                size={28} 
                color={isActive ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {cat.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Banner Promotions */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Ưu đãi đặc biệt</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.promoScroll}
        pagingEnabled
        snapToInterval={width * 0.8 + 16}
        decelerationRate="fast"
      >
        {PROMOTIONS.map((promo) => (
          <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.9}>
            <Image source={{ uri: promo.image }} style={styles.promoImage} />
            <View style={styles.promoOverlay} />
            <View style={styles.promoContent}>
               <Text style={styles.promoSubtitle}>{promo.title}</Text>
               <Text style={styles.promoTitle} numberOfLines={2}>{promo.subtitle}</Text>
               <View style={[styles.promoTag, { backgroundColor: promo.color }]}>
                  <Text style={styles.promoTagText}>Khám phá ngay</Text>
               </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Horizontal List */}
      {featuredTours.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Xu hướng tìm kiếm</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
            snapToInterval={width * 0.5 + 16}
            decelerationRate="fast"
          >
            {featuredTours.map((item) => (
              <TouchableOpacity
                key={`feat-${item.id}`}
                style={styles.featuredTourCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('TourDetail', { tourId: item.id })}
              >
                <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' }} style={styles.featuredTourImage} />
                <TouchableOpacity style={styles.miniHeart}>
                  <Icon name="heart-outline" size={18} color="#fff" />
                </TouchableOpacity>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredLocation} numberOfLines={1}>{item.location}</Text>
                  <Text style={styles.featuredTourTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.featuredRating}>
                    <Icon name="star" size={14} color={theme.colors.star} />
                    <Text style={styles.featuredRatingText}>{item.rating.toFixed(1)}</Text>
                    <Text style={styles.featuredReviews}>({item.reviewCount || 0})</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main List Title */}
      <View style={[styles.sectionHeaderRow, { marginBottom: 12 }]}>
        <Text style={styles.sectionTitle}>Gợi ý hoàn hảo cho bạn</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tours}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.mainList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 20 }}>
              <TourCard tour={item} onPress={() => navigation.navigate('TourDetail', { tourId: item.id })} />
            </View>
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="compass-off-outline" size={64} color={theme.colors.border} />
              <Text style={styles.emptyText}>Không tìm thấy tour phù hợp</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer: { backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
  },
  greeting: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: 2 },
  userName: { ...theme.typography.h1, color: theme.colors.text, fontSize: 26 },
  avatarButton: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  avatarImage: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.surfaceVariant },
  
  searchWrapper: {
    flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, marginBottom: 24, gap: 12,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA',
    borderRadius: theme.borderRadius.lg, paddingHorizontal: 16, height: 60,
  },
  fakeSearchText: { flex: 1, marginLeft: 10, fontSize: 16, color: theme.colors.textLight, fontFamily: 'System' },
  filterBtn: {
    width: 60, height: 60, backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg, justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4,
  },

  categoryScroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 32 },
  categoryItem: { alignItems: 'center', minWidth: 60 },
  categoryItemActive: { opacity: 1 },
  categoryText: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 8 },
  categoryTextActive: { color: theme.colors.text, fontWeight: '700' },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary, marginTop: 6 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { ...theme.typography.h2, fontSize: 22, color: theme.colors.text },
  seeAllText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },

  promoScroll: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  promoCard: { width: width * 0.8, height: 180, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 8 },
  promoImage: { width: '100%', height: '100%' },
  promoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  promoContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  promoSubtitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4, letterSpacing: 0.5 },
  promoTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12, lineHeight: 30 },
  promoTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  promoTagText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  featuredSection: { marginBottom: 20 },
  featuredScroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
  featuredTourCard: { width: width * 0.55, backgroundColor: theme.colors.surface, borderRadius: 20, paddingBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, overflow: 'hidden' },
  featuredTourImage: { width: '100%', height: 160, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  miniHeart: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 16 },
  featuredInfo: { paddingHorizontal: 12, paddingTop: 12 },
  featuredLocation: { fontSize: 12, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600', marginBottom: 4 },
  featuredTourTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 8, lineHeight: 22 },
  featuredRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredRatingText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  featuredReviews: { fontSize: 13, color: theme.colors.textLight },

  mainList: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 40, paddingBottom: 40 },
  emptyText: { ...theme.typography.body, color: theme.colors.textLight, marginTop: 12 },
});
