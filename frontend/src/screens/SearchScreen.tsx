/**
 * Search Screen — Modern search experience with suggestions and filters
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Keyboard, TouchableWithoutFeedback, TextInput, Image, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TourCard from '../components/TourCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTours } from '../hooks/useTours';
import { MainTabParamList } from '../navigation/MainTabs';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'SearchTab'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const { width } = Dimensions.get('window');

const DURATION_FILTERS = [
  { key: 'all', label: 'Thời lượng' },
  { key: '1-3', label: '1 - 3 ngày' },
  { key: '4-7', label: '4 - 7 ngày' },
  { key: '8+', label: 'Trên 7 ngày' },
];

const PRICE_FILTERS = [
  { key: 'all', label: 'Mức giá' },
  { key: 'under-5', label: '< 5 triệu' },
  { key: '5-15', label: '5 - 15 triệu' },
  { key: 'over-15', label: '> 15 triệu' },
];

const SUGGESTIONS = [
  { id: '1', name: 'Phú Quốc', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400' },
  { id: '2', name: 'Đà Lạt', image: 'https://images.unsplash.com/photo-1583417646062-799f24c6e9fb?w=400' },
  { id: '3', name: 'Sapa', image: 'https://images.unsplash.com/photo-1542318855-408fbce9d08e?w=400' },
  { id: '4', name: 'Đà Nẵng', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400' },
];

export default function SearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  const inputRef = useRef<TextInput>(null);

  const { data: tours = [], isLoading } = useTours({
    keyword: activeQuery || undefined,
  });

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    setActiveQuery(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setActiveQuery('');
    setDurationFilter('all');
    setPriceFilter('all');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSuggestionPress = (location: string) => {
    setSearchInput(location);
    setActiveQuery(location);
    Keyboard.dismiss();
  };

  const filteredTours = useMemo(() => {
    return tours.filter(tour => {
      if (durationFilter !== 'all') {
        if (durationFilter === '1-3' && (tour.duration < 1 || tour.duration > 3)) return false;
        if (durationFilter === '4-7' && (tour.duration < 4 || tour.duration > 7)) return false;
        if (durationFilter === '8+' && tour.duration <= 7) return false;
      }
      if (priceFilter !== 'all') {
        if (priceFilter === 'under-5' && tour.price >= 5000000) return false;
        if (priceFilter === '5-15' && (tour.price < 5000000 || tour.price > 15000000)) return false;
        if (priceFilter === 'over-15' && tour.price <= 15000000) return false;
      }
      return true;
    });
  }, [tours, durationFilter, priceFilter]);

  const showSuggestions = !activeQuery && !searchInput;

  const renderSkeletons = () => (
    <View style={styles.listContainer}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.skeletonWrapper}>
          <SkeletonLoader height={220} borderRadius={20} />
          <View style={{ padding: 16 }}>
            <SkeletonLoader width="40%" height={14} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="80%" height={24} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="30%" height={14} style={{ marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonLoader width="30%" height={20} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={26} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Tìm địa điểm, tên tour..."
            placeholderTextColor={theme.colors.textLight}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={false}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Icon name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={DURATION_FILTERS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  durationFilter === item.key && styles.filterChipActive,
                ]}
                onPress={() => setDurationFilter(item.key)}>
                <Text
                  style={[
                    styles.filterText,
                    durationFilter === item.key && styles.filterTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={PRICE_FILTERS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  priceFilter === item.key && styles.filterChipActive,
                ]}
                onPress={() => setPriceFilter(item.key)}>
                <Text
                  style={[
                    styles.filterText,
                    priceFilter === item.key && styles.filterTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {showSuggestions ? (
            <View style={styles.suggestionsContainer}>
               <Text style={styles.suggestionTitle}>Điểm đến phổ biến</Text>
               <View style={styles.suggestionGrid}>
                 {SUGGESTIONS.map(sug => (
                   <TouchableOpacity 
                     key={sug.id} 
                     style={styles.suggestionBox}
                     onPress={() => handleSuggestionPress(sug.name)}
                   >
                     <Image source={{ uri: sug.image }} style={styles.suggestionImg} />
                     <View style={styles.suggestionOverlay} />
                     <Text style={styles.suggestionText}>{sug.name}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {isLoading ? 'Đang tìm kiếm...' : `Tìm thấy ${filteredTours.length} kết quả cho "${activeQuery || 'Mọi điểm đến'}"`}
                </Text>
              </View>

              {isLoading ? (
                renderSkeletons()
              ) : (
                <FlatList
                  data={filteredTours}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TourCard
                      tour={item}
                      onPress={() => navigation.navigate('TourDetail', { tourId: item.id })}
                    />
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Icon name="magnify-close" size={64} color={theme.colors.border} />
                      <Text style={styles.emptyText}>Không có kết quả mĩ mãn</Text>
                      <Text style={styles.emptySubtext}>Thử nới lỏng bộ lọc hoặc thay đổi từ khóa xem sao nhé.</Text>
                      <TouchableOpacity style={styles.clearAllBtn} onPress={handleClear}>
                        <Text style={styles.clearAllText}>Xóa bộ lọc</Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA',
    borderRadius: theme.borderRadius.lg, paddingHorizontal: 16, height: 60,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: theme.colors.text, fontFamily: 'System' },
  clearBtn: { padding: 8 },

  filtersWrapper: { paddingBottom: 8 },
  filterSection: { marginBottom: 12 },
  filterContainer: { paddingHorizontal: 20, gap: 10 },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
    backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { ...theme.typography.body, color: theme.colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff' },

  suggestionsContainer: { paddingHorizontal: 20, paddingTop: 10 },
  suggestionTitle: { ...theme.typography.h2, fontSize: 20, color: theme.colors.text, marginBottom: 16 },
  suggestionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  suggestionBox: { width: (width - 52) / 2, height: 110, borderRadius: 16, overflow: 'hidden' },
  suggestionImg: { width: '100%', height: '100%' },
  suggestionOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  suggestionText: { position: 'absolute', bottom: 12, left: 12, right: 12, color: '#fff', ...theme.typography.h3, fontSize: 16 },

  resultsHeader: { paddingHorizontal: 20, paddingBottom: 12 },
  resultsCount: { ...theme.typography.body, color: theme.colors.textSecondary },

  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  skeletonWrapper: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, overflow: 'hidden',
  },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { ...theme.typography.h2, color: theme.colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtext: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
  clearAllBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: theme.colors.primary + '15' },
  clearAllText: { ...theme.typography.button, color: theme.colors.primary },
});
