/**
 * HomeScreen — Clean, image-first design.
 * White header, text-pill categories, horizontal promos, featured grid.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Image, ScrollView,
  Dimensions, Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
  { key: 'all',           label: 'Tất cả' },
  { key: 'beach',         label: 'Biển đảo' },
  { key: 'mountain',      label: 'Núi rừng' },
  { key: 'city',          label: 'Thành phố' },
  { key: 'culture',       label: 'Văn hoá' },
  { key: 'international', label: 'Quốc tế' },
];

const PROMOTIONS = [
  {
    id: 1,
    title: 'Mùa Hè Rực Rỡ',
    subtitle: 'Giảm đến 30% tour biển đảo',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600',
  },
  {
    id: 2,
    title: 'Săn Mây Tây Bắc',
    subtitle: 'Trekking đỉnh Fansipan ưu đãi đặc biệt',
    image: 'https://images.unsplash.com/photo-1542318855-408fbce9d08e?w=600',
  },
  {
    id: 3,
    title: 'Phố Cổ Hội An',
    subtitle: 'Tour đi bộ phố đèn lồng',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
  },
];

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: tours = [], isLoading, isRefetching, refetch } = useTours({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  const featuredTours = useMemo(() => {
    return [...tours].sort((a, b) => b.rating - a.rating).slice(0, 5);
  }, [tours]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const renderHeader = () => (
    <View>
      {/* ── Clean Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {user?.fullName || user?.username || 'Traveler'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileTab')}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: user?.avatarUrl || 'https://mui.com/static/images/avatar/2.jpg' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SearchTab')}
      >
        <Icon name="magnify" size={22} color={theme.colors.textLight} />
        <Text style={styles.searchText}>Bạn muốn đi đâu?</Text>
      </TouchableOpacity>

      {/* ── Category Pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catPill, active && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catText, active && styles.catTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Promo Carousel ── */}
      <Text style={styles.sectionTitle}>Ưu đãi hôm nay</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.promoScroll}
        snapToInterval={width * 0.78 + 12}
        decelerationRate="fast"
      >
        {PROMOTIONS.map((p) => (
          <TouchableOpacity key={p.id} style={styles.promoCard} activeOpacity={0.95}>
            <Image source={{ uri: p.image }} style={styles.promoImg} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={styles.promoGrad}
            />
            <View style={styles.promoInfo}>
              <Text style={styles.promoTitle}>{p.title}</Text>
              <Text style={styles.promoSub} numberOfLines={1}>{p.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Featured Tours ── */}
      {featuredTours.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Phổ biến nhất</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featScroll}
            snapToInterval={width * 0.43 + 12}
            decelerationRate="fast"
          >
            {featuredTours.map((t) => (
              <TouchableOpacity
                key={`f-${t.id}`}
                style={styles.featCard}
                activeOpacity={0.95}
                onPress={() => navigation.navigate('TourDetail', { tourId: t.id })}
              >
                <Image
                  source={{ uri: t.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' }}
                  style={styles.featImg}
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.featGrad} />
                <View style={styles.featInfo}>
                  <Text style={styles.featLoc} numberOfLines={1}>{t.location}</Text>
                  <Text style={styles.featTitle} numberOfLines={2}>{t.title}</Text>
                  <View style={styles.featMeta}>
                    <Icon name="star" size={11} color={theme.colors.star} />
                    <Text style={styles.featRating}>{t.rating.toFixed(1)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Main List Title ── */}
      <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="compass-off-outline" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>Không tìm thấy tour phù hợp</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainList: { paddingBottom: 100 },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: theme.colors.surface,
  },
  greeting: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.3 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 2, borderColor: theme.colors.primaryMuted,
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md, paddingHorizontal: 16, height: 48,
  },
  searchText: { fontSize: 14, color: theme.colors.textLight },

  // ── Categories ──
  catScroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  catPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  catPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  catText: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary },
  catTextActive: { color: '#fff', fontWeight: '600' },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: theme.colors.text,
    paddingHorizontal: 20, marginBottom: 14, letterSpacing: -0.2,
  },

  // ── Promos ──
  promoScroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  promoCard: {
    width: width * 0.78, height: 180, borderRadius: 16, overflow: 'hidden',
    ...theme.shadows.md,
  },
  promoImg: { width: '100%', height: '100%' },
  promoGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  promoInfo: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 3, letterSpacing: -0.2 },
  promoSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

  // ── Featured ──
  featScroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  featCard: {
    width: width * 0.43, height: 200, borderRadius: 14, overflow: 'hidden',
    ...theme.shadows.sm,
  },
  featImg: { width: '100%', height: '100%' },
  featGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  featInfo: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  featLoc: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  featTitle: { fontSize: 13, fontWeight: '600', color: '#fff', lineHeight: 17, marginBottom: 4 },
  featMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featRating: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // ── Empty ──
  emptyBox: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: theme.colors.textLight, marginTop: 10 },
});
