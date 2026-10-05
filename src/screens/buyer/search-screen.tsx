import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { fetchProduceListings, ApiProduceItem } from '@/services/api';
import { FilterModal, FilterState } from './filter-modal';
import { SortModal, SortOption } from './sort-modal';

interface SearchScreenProps {
  initialQuery?: string;
  onBack: () => void;
  onSelectProduct: (product: ApiProduceItem) => void;
  onSelectCategory?: (categoryId: string) => void;
}

const DEFAULT_RECENTS = ['Organic Tomatoes', 'Bell Pepper', 'Fresh Carrots', 'Ceylon Papaya'];
const POPULAR_TAGS = ['Organic Veg', 'Fresh Coconuts', 'Ceylon Cinnamon', 'Red Rice', 'Potatoes'];

export function SearchScreen({
  initialQuery = '',
  onBack,
  onSelectProduct,
  onSelectCategory,
}: SearchScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENTS);
  const [results, setResults] = useState<ApiProduceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'farmers' | 'districts'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [activeSort, setActiveSort] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<Partial<FilterState>>({});

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchProduceListings({
        search: searchQuery.trim(),
        district: filters.district,
        maxPrice: filters.maxPrice,
      });

      let sorted = [...data];
      if (filters.isOrganicOnly) {
        sorted = sorted.filter((p) => p.isOrganic);
      }

      if (activeSort === 'price_asc') {
        sorted.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      } else if (activeSort === 'price_desc') {
        sorted.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
      } else if (activeSort === 'qty_desc') {
        sorted.sort((a, b) => b.availableQuantity - a.availableQuantity);
      }

      setResults(sorted);

      // Save to recents
      if (!recentSearches.includes(searchQuery.trim())) {
        setRecentSearches((prev) => [searchQuery.trim(), ...prev.slice(0, 5)]);
      }
    } catch (err) {
      console.error('[SearchScreen] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, activeSort, recentSearches]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        executeSearch(query);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  const handleClearRecents = () => {
    setRecentSearches([]);
  };

  const handleRemoveRecent = (item: string) => {
    setRecentSearches((prev) => prev.filter((r) => r !== item));
  };

  const uniqueFarmers = Array.from(new Set(results.map((r) => r.farmerName)));
  const uniqueDistricts = Array.from(new Set(results.map((r) => r.locationDistrict)));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Search Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.searchInputBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Search vegetables, fruits, crops..."
            placeholderTextColor="#94A3B8"
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
          hitSlop={10}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </Svg>
        </Pressable>
      </View>

      {/* Query Active View */}
      {query.trim().length > 0 ? (
        <View style={styles.resultsContainer}>
          {/* Result Tabs (Screen 7 in Figma) */}
          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}>
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                All Products ({results.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === 'farmers' && styles.tabActive]}
              onPress={() => setActiveTab('farmers')}>
              <Text style={[styles.tabText, activeTab === 'farmers' && styles.tabTextActive]}>
                Farmers ({uniqueFarmers.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === 'districts' && styles.tabActive]}
              onPress={() => setActiveTab('districts')}>
              <Text style={[styles.tabText, activeTab === 'districts' && styles.tabTextActive]}>
                Districts ({uniqueDistricts.length})
              </Text>
            </Pressable>
          </View>

          {/* Quick Filters / Sort chips */}
          <View style={styles.sortBar}>
            <Pressable
              style={styles.sortChip}
              onPress={() => setSortModalVisible(true)}>
              <Text style={styles.sortChipText}>Sort by ⌄</Text>
            </Pressable>
            <Pressable
              style={styles.sortChip}
              onPress={() => setFilterModalVisible(true)}>
              <Text style={styles.sortChipText}>Filter ⌄</Text>
            </Pressable>

            {filters.isOrganicOnly && (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Organic ✕</Text>
              </View>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollList}
            showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="large" color="#386641" />
                <Text style={styles.loaderText}>Searching MongoDB database...</Text>
              </View>
            ) : results.length === 0 ? (
              /* Screen 9: No Results Found State */
              <View style={styles.noResultsBox}>
                <View style={styles.noResultsCircle}>
                  <Text style={styles.noResultsIcon}>🔍</Text>
                </View>
                <Text style={styles.noResultsTitle}>No Results Found</Text>
                <Text style={styles.noResultsSub}>
                  We couldn&apos;t find anything matching &quot;{query}&quot;. Try checking for spelling
                  or searching for broader keywords like &quot;carrots&quot; or &quot;vegetables&quot;.
                </Text>
                <Pressable
                  style={styles.clearFiltersBtn}
                  onPress={() => {
                    setQuery('');
                    setFilters({});
                  }}>
                  <Text style={styles.clearFiltersBtnText}>Clear Search & Filters</Text>
                </Pressable>

                {/* Popular suggestions */}
                <View style={styles.popularBox}>
                  <Text style={styles.popularLabel}>Popular searches right now:</Text>
                  <View style={styles.chipsRow}>
                    {POPULAR_TAGS.map((tag) => (
                      <Pressable
                        key={tag}
                        style={styles.popularChip}
                        onPress={() => setQuery(tag)}>
                        <Text style={styles.popularChipText}>{tag}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            ) : activeTab === 'farmers' ? (
              /* Farmers List View */
              <View style={styles.farmersList}>
                {uniqueFarmers.map((fName) => {
                  const sampleItem = results.find((r) => r.farmerName === fName);
                  return (
                    <View key={fName} style={styles.farmerRowCard}>
                      <View style={styles.farmerAvatarCircle}>
                        <Text style={styles.farmerAvatarEmoji}>🧑‍🌾</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.farmerRowName}>{fName}</Text>
                        <Text style={styles.farmerRowDistrict}>
                          📍 {sampleItem?.locationCity}, {sampleItem?.locationDistrict}
                        </Text>
                      </View>
                      <View style={styles.farmerRowBadge}>
                        <Text style={styles.farmerRowBadgeText}>★ 4.9</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : activeTab === 'districts' ? (
              /* Districts List View */
              <View style={styles.districtsList}>
                {uniqueDistricts.map((dist) => (
                  <Pressable
                    key={dist}
                    style={styles.districtRow}
                    onPress={() => {
                      setFilters((prev) => ({ ...prev, district: dist }));
                      setActiveTab('all');
                    }}>
                    <Text style={styles.districtRowText}>📍 {dist} District</Text>
                    <Text style={styles.districtRowCount}>
                      {results.filter((r) => r.locationDistrict === dist).length} items
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              /* 2-Column Produce Grid (Screen 7 & 8 in Figma) */
              <View style={styles.grid}>
                {results.map((item) => (
                  <Pressable
                    key={item.id || item._id}
                    style={({ pressed }) => [
                      styles.productCard,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => onSelectProduct(item)}>
                    {item.images && item.images[0] ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        style={styles.cardImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.cardImage, styles.placeholderImage]}>
                        <Text style={{ fontSize: 32 }}>🌱</Text>
                      </View>
                    )}

                    {item.isOrganic && (
                      <View style={styles.cardOrganicBadge}>
                        <Text style={styles.cardOrganicText}>Organic</Text>
                      </View>
                    )}

                    <View style={styles.cardDetails}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardFarmer} numberOfLines={1}>
                        🧑‍🌾 {item.farmerName} • 📍 {item.locationDistrict}
                      </Text>

                      <View style={styles.cardBottomRow}>
                        <Text style={styles.cardPrice}>
                          Rs. {item.pricePerUnit}
                          <Text style={styles.cardUnit}> /{item.unit}</Text>
                        </Text>

                        <Pressable
                          style={styles.addBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            onSelectProduct(item);
                          }}>
                          <Text style={styles.addBtnText}>+ Add</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        /* Screen 6: Pre-search State (Recent searches + suggestions) */
        <ScrollView
          contentContainerStyle={styles.preSearchScroll}
          showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>RECENT SEARCHES</Text>
                <Pressable onPress={handleClearRecents} hitSlop={10}>
                  <Text style={styles.clearAllLink}>Clear All</Text>
                </Pressable>
              </View>

              <View style={styles.recentsList}>
                {recentSearches.map((item) => (
                  <View key={item} style={styles.recentItemRow}>
                    <Pressable
                      style={styles.recentItemLeft}
                      onPress={() => setQuery(item)}>
                      <Text style={styles.clockIcon}>🕒</Text>
                      <Text style={styles.recentItemText}>{item}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveRecent(item)}
                      hitSlop={10}>
                      <Text style={styles.removeRecentIcon}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Popular Categories */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>POPULAR SEARCHES</Text>
            <View style={styles.chipsRow}>
              {POPULAR_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.suggestedChip}
                  onPress={() => setQuery(tag)}>
                  <Text style={styles.suggestedChipText}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        initialFilters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApply={(f) => setFilters(f)}
        onReset={() => setFilters({})}
      />

      {/* Sort Modal */}
      <SortModal
        visible={sortModalVisible}
        selectedSort={activeSort}
        onClose={() => setSortModalVisible(false)}
        onSelect={setActiveSort}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsContainer: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#386641',
  },
  tabText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#386641',
    fontWeight: '700',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  sortChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  scrollList: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardImage: {
    width: '100%',
    height: 125,
    backgroundColor: '#F1F5F9',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOrganicBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#166534',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  cardOrganicText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardDetails: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    height: 36,
  },
  cardFarmer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  cardUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  addBtn: {
    backgroundColor: '#EBF5EE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#386641',
  },
  farmersList: {
    gap: 10,
  },
  farmerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    gap: 12,
  },
  farmerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerAvatarEmoji: {
    fontSize: 22,
  },
  farmerRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerRowDistrict: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  farmerRowBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  farmerRowBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  districtsList: {
    gap: 8,
  },
  districtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  districtRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  districtRowCount: {
    fontSize: 13,
    color: '#64748B',
  },
  noResultsBox: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noResultsCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noResultsIcon: {
    fontSize: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  noResultsSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  clearFiltersBtn: {
    backgroundColor: '#386641',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  clearFiltersBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  popularBox: {
    marginTop: 32,
    width: '100%',
  },
  popularLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  preSearchScroll: {
    padding: 20,
    gap: 24,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  clearAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  recentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    overflow: 'hidden',
  },
  recentItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clockIcon: {
    fontSize: 14,
  },
  recentItemText: {
    fontSize: 14,
    color: '#334155',
  },
  removeRecentIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestedChipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  popularChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  popularChipText: {
    fontSize: 12,
    color: '#475569',
  },
});
