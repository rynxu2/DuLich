/**
 * HomeScreen — Premium immersive hero, frosted search, icon categories.
 * Sea & Sky v2 design system.
 */
import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Image, ScrollView,
  Dimensions, Platform, StatusBar, Animated,
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
const HERO_HEIGHT = 280;

const CATEGORIES = [
  { key: 'all',           label: 'Tất cả',    icon: 'earth' },
  { key: 'beach',         label: 'Biển đảo',   icon: 'island' },
  { key: 'mountain',      label: 'Núi rừng',   icon: 'image-filter-hdr' },
  { key: 'city',          label: 'Thành phố',  icon: 'city-variant-outline' },
  { key: 'culture',       label: 'Văn hoá',    icon: 'temple-buddhist-outline' },
  { key: 'international', label: 'Quốc tế',    icon: 'airplane' },
];

const PROMOTIONS = [
  {
    id: 1,
    title: 'Mùa Hè Rực Rỡ',
    subtitle: 'Giảm đến 30% tour biển đảo',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600',
    tag: 'HOT',
  },
  {
    id: 2,
    title: 'Săn Mây Tây Bắc',
    subtitle: 'Trekking đỉnh Fansipan ưu đãi đặc biệt',
    image: 'https://images.unsplash.com/photo-1542318855-408fbce9d08e?w=600',
    tag: 'MỚI',
  },
  {
    id: 3,
    title: 'Phố Cổ Hội An',
    subtitle: 'Tour đi bộ phố đèn lồng',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
    tag: 'YÊU THÍCH',
  },
];

const HERO_BG = 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80';

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activePromo, setActivePromo] = useState(0);

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

  const handlePromoScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (width * 0.82 + 12));
    setActivePromo(idx);
  };

  const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
          <Icon name="chevron-right" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* ── Immersive Hero ── */}
      <View style={styles.heroWrap}>
        <Image source={{ uri: HERO_BG }} style={styles.heroBg} />
        <LinearGradient
          colors={['rgba(7,89,133,0.7)', 'rgba(7,89,133,0.4)', 'transparent']}
          style={styles.heroGradTop}
        />
        <LinearGradient
          colors={['transparent', 'rgba(248,250,252,0.6)', theme.colors.background]}
          locations={[0.4, 0.8, 1]}
          style={styles.heroGradBot}
        />

        {/* Header content */}
        <View style={[styles.heroContent, { paddingTop: insets.top + 12 }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.fullName || user?.username || 'Traveler'} 👋
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileTab')}
              activeOpacity={0.8}
              style={styles.avatarWrap}
            >
              <Image
                source={{ uri: user?.avatarUrl || 'https://mui.com/static/images/avatar/2.jpg' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>

          {/* ── Frosted Search Bar ── */}
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SearchTab')}
          >
            <Icon name="magnify" size={22} color={theme.colors.primary} />
            <Text style={styles.searchText}>Bạn muốn đi đâu?</Text>
            <View style={styles.searchDivider} />
            <Icon name="tune-variant" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category Pills with Icons ── */}
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
              <View style={[styles.catIconWrap, active && styles.catIconWrapActive]}>
                <Icon
                  name={cat.icon}
                  size={18}
                  color={active ? '#fff' : theme.colors.primary}
                />
              </View>
              <Text style={[styles.catText, active && styles.catTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Promo Carousel ── */}
      {renderSectionHeader('Ưu đãi hôm nay')}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.promoScroll}
        snapToInterval={width * 0.82 + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={handlePromoScroll}
      >
        {PROMOTIONS.map((p) => (
          <TouchableOpacity key={p.id} style={styles.promoCard} activeOpacity={0.95}>
            <Image source={{ uri: p.image }} style={styles.promoImg} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
              locations={[0, 0.4, 1]}
              style={styles.promoGrad}
            />
            {/* Tag */}
            <View style={styles.promoTag}>
              <Text style={styles.promoTagText}>{p.tag}</Text>
            </View>
            <View style={styles.promoInfo}>
              <Text style={styles.promoTitle}>{p.title}</Text>
              <Text style={styles.promoSub} numberOfLines={1}>{p.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Dots */}
      <View style={styles.dotsRow}>
        {PROMOTIONS.map((_, i) => (
          <View key={i} style={[styles.dot, activePromo === i && styles.dotActive]} />
        ))}
      </View>

      {/* ── Featured Tours ── */}
      {featuredTours.length > 0 && (
        <>
          {renderSectionHeader('Phổ biến nhất', () => navigation.navigate('SearchTab'))}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featScroll}
            snapToInterval={width * 0.52 + 12}
            decelerationRate="fast"
          >
            {featuredTours.map((t) => (
              <TouchableOpacity
                key={`f-${t.id}`}
                style={styles.featCard}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('TourDetail', { tourId: t.id })}
              >
                <Image
                  source={{ uri: t.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' }}
                  style={styles.featImg}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.featGrad}
                />
                <View style={styles.featInfo}>
                  <View style={styles.featLocationRow}>
                    <Icon name="map-marker" size={10} color={theme.colors.primaryLight} />
                    <Text style={styles.featLoc} numberOfLines={1}>{t.location}</Text>
                  </View>
                  <Text style={styles.featTitle} numberOfLines={2}>{t.title}</Text>
                  <View style={styles.featBottom}>
                    <View style={styles.featRatingRow}>
                      <Icon name="star" size={11} color={theme.colors.star} />
                      <Text style={styles.featRating}>{t.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.featPrice}>
                      {new Intl.NumberFormat('vi-VN').format(t.price)}đ
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Main List Title ── */}
      {renderSectionHeader('Gợi ý cho bạn', () => navigation.navigate('SearchTab'))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
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
              <View style={styles.emptyIconWrap}>
                <Icon name="compass-off-outline" size={40} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có tour phù hợp</Text>
              <Text style={styles.emptyText}>Thử chọn danh mục khác hoặc kéo xuống để làm mới</Text>
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

  // ── Hero ──
  heroWrap: {
    height: HERO_HEIGHT,
    position: 'relative',
    marginBottom: 4,
  },
  heroBg: {
    width: '100%', height: '100%',
    position: 'absolute',
  },
  heroGradTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: HERO_HEIGHT * 0.5,
  },
  heroGradBot: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: HERO_HEIGHT * 0.5,
  },
  heroContent: {
    flex: 1, paddingHorizontal: 20, justifyContent: 'flex-start',
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2, fontWeight: '500',
  },
  userName: {
    fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  avatarWrap: {
    padding: 3,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.surfaceVariant,
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.colors.frosted,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: 18, height: 52,
    ...theme.shadows.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  searchText: { flex: 1, fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  searchDivider: {
    width: 1, height: 24, backgroundColor: theme.colors.border, marginHorizontal: 4,
  },

  // ── Categories ──
  catScroll: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, gap: 10 },
  catPill: {
    alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    minWidth: 72,
  },
  catPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.colored,
  },
  catIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  catIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  catText: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary },
  catTextActive: { color: '#fff' },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  seeAllText: {
    fontSize: 13, fontWeight: '600', color: theme.colors.primary,
  },

  // ── Promos ──
  promoScroll: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  promoCard: {
    width: width * 0.82, height: 200, borderRadius: 20, overflow: 'hidden',
    ...theme.shadows.lg,
  },
  promoImg: { width: '100%', height: '100%' },
  promoGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 },
  promoTag: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  promoTagText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  promoInfo: { position: 'absolute', bottom: 18, left: 18, right: 18 },
  promoTitle: {
    color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
  promoSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, marginBottom: 24, marginTop: 4,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 20, borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  // ── Featured ──
  featScroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  featCard: {
    width: width * 0.52, height: 240, borderRadius: 18, overflow: 'hidden',
    ...theme.shadows.md,
  },
  featImg: { width: '100%', height: '100%' },
  featGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
  featInfo: { position: 'absolute', bottom: 14, left: 14, right: 14 },
  featLocationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4,
  },
  featLoc: {
    fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  featTitle: {
    fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 19, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 },
  },
  featBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  featRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featRating: { fontSize: 12, fontWeight: '700', color: '#fff' },
  featPrice: {
    fontSize: 13, fontWeight: '800', color: theme.colors.accentLight,
  },

  // ── Empty ──
  emptyBox: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 6,
  },
  emptyText: {
    fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 19,
  },
});
