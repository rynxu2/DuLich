/**
 * SearchScreen — 3-state search: Idle → Typing → Results
 * Features: search history, 2-col destination grid, debounced autocomplete,
 * sort/filter bar, memoized list items.
 */
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, Keyboard, TextInput,
  Image, Dimensions, Pressable, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TourCard from '../components/TourCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTours } from '../hooks/useTours';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { Tour } from '../api/tours';
import { MainTabParamList } from '../navigation/MainTabs';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'SearchTab'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

type ScreenState = 'idle' | 'typing' | 'results';
type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

const { width } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_ITEM_W = (width - 40 - GRID_GAP) / 2;

// ─── Static Data ───
const POPULAR_DESTINATIONS = [
  { id: '1', name: 'Phú Quốc', sub: 'Biển đảo', rating: '4.8', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400' },
  { id: '2', name: 'Đà Lạt',  sub: 'Cao nguyên', rating: '4.7', image: 'https://images.unsplash.com/photo-1583417646062-799f24c6e9fb?w=400' },
  { id: '3', name: 'Sapa',    sub: 'Tây Bắc', rating: '4.9', image: 'https://images.unsplash.com/photo-1542318855-408fbce9d08e?w=400' },
  { id: '4', name: 'Đà Nẵng', sub: 'Miền Trung', rating: '4.6', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400' },
  { id: '5', name: 'Hội An',  sub: 'Di sản', rating: '4.8', image: 'https://images.unsplash.com/photo-1555921015-5532091f6026?w=400' },
  { id: '6', name: 'Nha Trang', sub: 'Biển', rating: '4.5', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400' },
];

const CATEGORIES = [
  { key: 'beach',         label: 'Biển đảo',    icon: 'island' },
  { key: 'mountain',      label: 'Núi rừng',    icon: 'pine-tree' },
  { key: 'city',          label: 'Thành phố',   icon: 'city-variant-outline' },
  { key: 'culture',       label: 'Văn hoá',     icon: 'temple-buddhist-outline' },
  { key: 'international', label: 'Quốc tế',     icon: 'airplane' },
];

const DURATION_FILTERS = [
  { key: 'all', label: 'Thời gian' },
  { key: '1-3', label: '1-3 ngày' },
  { key: '4-7', label: '4-7 ngày' },
  { key: '8+', label: '7+ ngày' },
];

const PRICE_FILTERS = [
  { key: 'all', label: 'Mức giá' },
  { key: 'under-5', label: '< 5 triệu' },
  { key: '5-15', label: '5-15 triệu' },
  { key: 'over-15', label: '> 15 triệu' },
];

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'relevance', label: 'Phù hợp', icon: 'sort' },
  { key: 'price-asc', label: 'Giá tăng', icon: 'sort-ascending' },
  { key: 'price-desc', label: 'Giá giảm', icon: 'sort-descending' },
  { key: 'rating', label: 'Đánh giá', icon: 'star-outline' },
];

// ─── Memoized Tour Card ───
const MemoTourCard = React.memo(({ tour, onPress }: { tour: Tour; onPress: () => void }) => (
  <TourCard tour={tour} onPress={onPress} />
));

export default function SearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { history, addTerm, removeTerm, clearAll: clearHistory } = useSearchHistory();

  // ─── State ───
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Debounced autocomplete
  const [autocompleteTerm, setAutocompleteTerm] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── API ───
  const { data: tours = [], isLoading } = useTours({
    keyword: activeQuery || undefined,
  });

  // All tours for autocomplete (cached from first load)
  const { data: allTours = [] } = useTours({});

  // ─── Debounced autocomplete suggestions ───
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchInput.length >= 2 && screenState === 'typing') {
      debounceRef.current = setTimeout(() => {
        setAutocompleteTerm(searchInput.trim().toLowerCase());
      }, 300);
    } else {
      setAutocompleteTerm('');
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput, screenState]);

  const autocompleteSuggestions = useMemo(() => {
    if (!autocompleteTerm) return [];
    const term = autocompleteTerm;

    // Location matches
    const locationSet = new Set<string>();
    allTours.forEach(t => {
      if (t.location.toLowerCase().includes(term)) locationSet.add(t.location);
    });
    const locations = Array.from(locationSet).slice(0, 3).map(loc => ({
      type: 'location' as const, text: loc, icon: 'map-marker-outline',
    }));

    // Tour title matches
    const titleMatches = allTours
      .filter(t => t.title.toLowerCase().includes(term))
      .slice(0, 3)
      .map(t => ({ type: 'tour' as const, text: t.title, icon: 'tag-outline', tourId: t.id }));

    return [...locations, ...titleMatches];
  }, [autocompleteTerm, allTours]);

  // ─── Filtered + Sorted Results ───
  const filteredTours = useMemo(() => {
    let result = [...tours];

    // Duration filter
    if (durationFilter !== 'all') {
      result = result.filter(t => {
        if (durationFilter === '1-3') return t.duration >= 1 && t.duration <= 3;
        if (durationFilter === '4-7') return t.duration >= 4 && t.duration <= 7;
        if (durationFilter === '8+') return t.duration > 7;
        return true;
      });
    }

    // Price filter
    if (priceFilter !== 'all') {
      result = result.filter(t => {
        if (priceFilter === 'under-5') return t.price < 5000000;
        if (priceFilter === '5-15') return t.price >= 5000000 && t.price <= 15000000;
        if (priceFilter === 'over-15') return t.price > 15000000;
        return true;
      });
    }

    // Sort
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [tours, durationFilter, priceFilter, sortBy]);

  // ─── Handlers ───
  const handleSearchFocus = useCallback(() => {
    setScreenState('typing');
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const q = searchInput.trim();
    if (!q) return;
    Keyboard.dismiss();
    addTerm(q);
    setActiveQuery(q);
    setScreenState('results');
  }, [searchInput, addTerm]);

  const handleClearAll = useCallback(() => {
    setSearchInput('');
    setActiveQuery('');
    setDurationFilter('all');
    setPriceFilter('all');
    setSortBy('relevance');
    setScreenState('idle');
  }, []);

  const handleSuggestionPress = useCallback((text: string, tourId?: number) => {
    if (tourId) {
      navigation.navigate('TourDetail', { tourId });
      return;
    }
    setSearchInput(text);
    addTerm(text);
    setActiveQuery(text);
    setScreenState('results');
    Keyboard.dismiss();
  }, [navigation, addTerm]);

  const handleHistoryPress = useCallback((term: string) => {
    setSearchInput(term);
    setActiveQuery(term);
    setScreenState('results');
  }, []);

  const handleDestinationPress = useCallback((name: string) => {
    setSearchInput(name);
    addTerm(name);
    setActiveQuery(name);
    setScreenState('results');
  }, [addTerm]);

  const handleCategoryPress = useCallback((category: string) => {
    setSearchInput(category);
    addTerm(category);
    setActiveQuery(category);
    setScreenState('results');
  }, [addTerm]);

  const handleBackToIdle = useCallback(() => {
    setSearchInput('');
    setAutocompleteTerm('');
    setScreenState('idle');
    Keyboard.dismiss();
  }, []);

  const renderTourItem = useCallback(({ item }: { item: Tour }) => (
    <MemoTourCard tour={item} onPress={() => navigation.navigate('TourDetail', { tourId: item.id })} />
  ), [navigation]);

  const keyExtractor = useCallback((item: Tour) => item.id.toString(), []);

  // ═════════════════════════════════════════════
  // ─── RENDER: Idle State ───
  // ═════════════════════════════════════════════
  const renderIdle = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.idleScroll} keyboardShouldPersistTaps="handled">
      {/* Search History */}
      {history.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
            <TouchableOpacity onPress={clearHistory} hitSlop={8}>
              <Text style={styles.clearLink}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>
          {history.map((term, i) => (
            <TouchableOpacity key={`h-${i}`} style={styles.historyItem} onPress={() => handleHistoryPress(term)} activeOpacity={0.7}>
              <Icon name="clock-outline" size={16} color={theme.colors.textLight} />
              <Text style={styles.historyText} numberOfLines={1}>{term}</Text>
              <Pressable onPress={() => removeTerm(term)} hitSlop={10} style={styles.historyDelete}>
                <Icon name="close" size={14} color={theme.colors.textLight} />
              </Pressable>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Categories — Horizontal Pills */}
      <View style={styles.catSection}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>Thể loại tour</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={styles.catPill}
              activeOpacity={0.8}
              onPress={() => handleCategoryPress(cat.label)}
            >
              <View style={styles.catPillIcon}>
                <Icon name={cat.icon} size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.catPillLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Popular Destinations — 2-column Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Điểm đến phổ biến</Text>
        <View style={styles.destGrid}>
          {POPULAR_DESTINATIONS.map(d => (
            <TouchableOpacity
              key={d.id}
              style={styles.destCard}
              activeOpacity={0.9}
              onPress={() => handleDestinationPress(d.name)}
            >
              <Image source={{ uri: d.image }} style={styles.destImg} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.destGrad} />
              <View style={styles.destInfo}>
                <Text style={styles.destName}>{d.name}</Text>
                <View style={styles.destMeta}>
                  <Text style={styles.destSub}>{d.sub}</Text>
                  <View style={styles.destRating}>
                    <Icon name="star" size={10} color={theme.colors.star} />
                    <Text style={styles.destRatingText}>{d.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // ═════════════════════════════════════════════
  // ─── RENDER: Typing State (Autocomplete) ───
  // ═════════════════════════════════════════════
  const renderTyping = () => (
    <View style={styles.typingWrap}>
      {autocompleteSuggestions.length > 0 ? (
        <View>
          <Text style={styles.autoLabel}>Gợi ý</Text>
          {autocompleteSuggestions.map((s, i) => (
            <TouchableOpacity
              key={`ac-${i}`}
              style={styles.autoItem}
              onPress={() => handleSuggestionPress(s.text, s.type === 'tour' ? (s as any).tourId : undefined)}
              activeOpacity={0.7}
            >
              <Icon name={s.icon} size={18} color={theme.colors.primary} />
              <Text style={styles.autoText} numberOfLines={1}>{s.text}</Text>
              <Icon name="arrow-top-left" size={16} color={theme.colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      ) : searchInput.length >= 2 ? (
        <View style={styles.autoEmpty}>
          <Text style={styles.autoEmptyText}>Nhấn tìm kiếm để xem kết quả</Text>
        </View>
      ) : (
        <View style={styles.autoEmpty}>
          <Text style={styles.autoEmptyText}>Nhập ít nhất 2 ký tự...</Text>
        </View>
      )}
      {/* Dimmed tap area to dismiss */}
      <Pressable style={styles.typingDim} onPress={handleBackToIdle} />
    </View>
  );

  // ═════════════════════════════════════════════
  // ─── RENDER: Results State ───
  // ═════════════════════════════════════════════
  const renderResults = () => (
    <View style={{ flex: 1 }}>
      {/* Filter + Sort Row */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Duration */}
          {DURATION_FILTERS.map(f => {
            const on = durationFilter === f.key;
            if (f.key === 'all' && durationFilter === 'all') return null;
            if (f.key === 'all') return null;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, on && styles.filterChipActive]}
                onPress={() => setDurationFilter(on ? 'all' : f.key)}
              >
                <Text style={[styles.filterChipText, on && styles.filterChipTextActive]}>{f.label}</Text>
                {on && <Icon name="close" size={12} color="#fff" style={{ marginLeft: 2 }} />}
              </TouchableOpacity>
            );
          })}

          {/* Price */}
          {PRICE_FILTERS.map(f => {
            const on = priceFilter === f.key;
            if (f.key === 'all') return null;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, on && styles.filterChipActive]}
                onPress={() => setPriceFilter(on ? 'all' : f.key)}
              >
                <Text style={[styles.filterChipText, on && styles.filterChipTextActive]}>{f.label}</Text>
                {on && <Icon name="close" size={12} color="#fff" style={{ marginLeft: 2 }} />}
              </TouchableOpacity>
            );
          })}

          {/* Sort */}
          <TouchableOpacity
            style={[styles.filterChip, sortBy !== 'relevance' && styles.filterChipActive]}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Icon name="sort" size={14} color={sortBy !== 'relevance' ? '#fff' : theme.colors.textSecondary} />
            <Text style={[styles.filterChipText, sortBy !== 'relevance' && styles.filterChipTextActive, { marginLeft: 4 }]}>
              {SORT_OPTIONS.find(s => s.key === sortBy)?.label || 'Sắp xếp'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sort dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortItem, sortBy === opt.key && styles.sortItemActive]}
              onPress={() => { setSortBy(opt.key); setShowSortMenu(false); }}
            >
              <Icon name={opt.icon} size={16} color={sortBy === opt.key ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.sortItemText, sortBy === opt.key && styles.sortItemTextActive]}>{opt.label}</Text>
              {sortBy === opt.key && <Icon name="check" size={16} color={theme.colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Result count */}
      <View style={styles.resHeader}>
        <Text style={styles.resCount}>
          {isLoading ? 'Đang tìm...' : `${filteredTours.length} kết quả`}
          {activeQuery ? ` cho "${activeQuery}"` : ''}
        </Text>
        {(durationFilter !== 'all' || priceFilter !== 'all' || sortBy !== 'relevance') && (
          <TouchableOpacity onPress={() => { setDurationFilter('all'); setPriceFilter('all'); setSortBy('relevance'); }}>
            <Text style={styles.resClear}>Xóa lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results List */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[1, 2, 3].map(k => (
            <View key={k} style={styles.skeleton}>
              <SkeletonLoader height={200} borderRadius={16} />
              <View style={{ padding: 14 }}>
                <SkeletonLoader width="80%" height={18} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="50%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredTours}
          keyExtractor={keyExtractor}
          renderItem={renderTourItem}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => { Keyboard.dismiss(); setShowSortMenu(false); }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Icon name="magnify-close" size={32} color={theme.colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptySub}>Thử thay đổi từ khóa hoặc bỏ bớt bộ lọc</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleClearAll}>
                <Text style={styles.emptyBtnText}>Tìm kiếm mới</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );

  // ═════════════════════════════════════════════
  // ─── MAIN RENDER ───
  // ═════════════════════════════════════════════
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Search Bar ── */}
      <View style={styles.searchWrap}>
        {screenState !== 'idle' && (
          <TouchableOpacity onPress={handleBackToIdle} style={styles.backBtn} hitSlop={8}>
            <Icon name="arrow-left" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <View style={[styles.searchBox, screenState === 'typing' && styles.searchBoxFocused]}>
          <Icon name="magnify" size={20} color={screenState === 'typing' ? theme.colors.primary : theme.colors.textLight} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Bạn muốn đi đâu?"
            placeholderTextColor={theme.colors.textLight}
            value={searchInput}
            onChangeText={setSearchInput}
            onFocus={handleSearchFocus}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
              <Icon name="close-circle" size={18} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Content by state ── */}
      {screenState === 'idle' && renderIdle()}
      {screenState === 'typing' && renderTyping()}
      {screenState === 'results' && renderResults()}
    </View>
  );
}

// ═════════════════════════════════════════════
// ─── STYLES ───
// ═════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // ── Search Bar ──
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md, paddingHorizontal: 12, height: 44,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  searchBoxFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.colors.text, paddingVertical: 0 },

  // ── Idle: Sections ──
  idleScroll: { paddingBottom: 100 },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  clearLink: { fontSize: 12, color: theme.colors.accent, fontWeight: '600' },

  // ── History ──
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  historyText: { flex: 1, fontSize: 14, color: theme.colors.text },
  historyDelete: { padding: 4 },

  // ── Destination Grid ──
  destGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginTop: 4 },
  destCard: {
    width: GRID_ITEM_W, height: GRID_ITEM_W * 1.15,
    borderRadius: theme.borderRadius.lg, overflow: 'hidden',
    ...theme.shadows.sm,
  },
  destImg: { width: '100%', height: '100%', backgroundColor: theme.colors.surfaceVariant },
  destGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  destInfo: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  destName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  destMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  destRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  destRatingText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ── Categories (Horizontal Pills) ──
  catSection: { paddingTop: 20 },
  catScroll: { paddingHorizontal: 20, gap: 8, paddingTop: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.full,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  catPillIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  catPillLabel: { fontSize: 13, fontWeight: '500', color: theme.colors.text },

  // ── Typing: Autocomplete ──
  typingWrap: { flex: 1 },
  autoLabel: {
    fontSize: 12, fontWeight: '600', color: theme.colors.textLight,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  autoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  autoText: { flex: 1, fontSize: 15, color: theme.colors.text },
  autoEmpty: { paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' },
  autoEmptyText: { fontSize: 14, color: theme.colors.textLight },
  typingDim: { flex: 1 },

  // ── Results: Filters ──
  filterRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  filterScroll: { paddingHorizontal: 16, gap: 6 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },

  // ── Sort Menu ──
  sortMenu: {
    position: 'absolute', top: 94, right: 16, zIndex: 100,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    paddingVertical: 4, width: 170,
    ...theme.shadows.lg,
  },
  sortItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  sortItemActive: { backgroundColor: theme.colors.primaryMuted },
  sortItemText: { flex: 1, fontSize: 14, color: theme.colors.textSecondary },
  sortItemTextActive: { color: theme.colors.primary, fontWeight: '600' },

  // ── Results Header ──
  resHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  resCount: { fontSize: 13, color: theme.colors.textSecondary },
  resClear: { fontSize: 13, color: theme.colors.accent, fontWeight: '600' },

  // ── List ──
  listPad: { paddingHorizontal: 20, paddingBottom: 100 },
  skeleton: {
    backgroundColor: theme.colors.surface, borderRadius: 16,
    marginBottom: 16, overflow: 'hidden', ...theme.shadows.sm,
  },

  // ── Empty State ──
  emptyBox: { alignItems: 'center', paddingTop: 50 },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 20, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
