import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { fetchProduceListings, ApiProduceItem } from '@/services/api';
import { FilterModal, FilterState } from './filter-modal';
import { SortModal, SortOption } from './sort-modal';

interface CategoryProductsScreenProps {
  categoryId: string;
  categoryName: string;
  onBack: () => void;
  onSelectProduct: (product: ApiProduceItem) => void;
  onExploreAll: () => void;
}

export function CategoryProductsScreen({
  categoryId,
  categoryName,
  onBack,
  onSelectProduct,
  onExploreAll,
}: CategoryProductsScreenProps) {
  const [products, setProducts] = useState<ApiProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [activeSort, setActiveSort] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<Partial<FilterState>>({ category: categoryId });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProduceListings({
        category: categoryId,
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

      setProducts(sorted);
    } catch (err) {
      console.error('[CategoryProducts] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, filters, activeSort]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={styles.placeholderBtn} />
      </View>

      {/* Filter / Sort Control Bar */}
      <View style={styles.controlBar}>
        <Pressable
          style={styles.filterChip}
          onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.filterChipText}>Filter by ⌄</Text>
        </Pressable>

        <Pressable
          style={styles.filterChip}
          onPress={() => setSortModalVisible(true)}>
          <Text style={styles.filterChipText}>Sort by ⌄</Text>
        </Pressable>

        {filters.isOrganicOnly && (
          <View style={styles.activeTagBadge}>
            <Text style={styles.activeTagText}>Organic ✕</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#386641"
          />
        }>
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#386641" />
            <Text style={styles.loaderText}>Loading {categoryName} from MongoDB...</Text>
          </View>
        ) : products.length === 0 ? (
          /* Empty State - Matching Figma Screen 5 */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Text style={styles.emptyIcon}>🧺</Text>
            </View>
            <Text style={styles.emptyTitle}>No Products Available</Text>
            <Text style={styles.emptySub}>
              We couldn&apos;t find any products in this category right now. Check back later or
              explore other fresh produce.
            </Text>

            <Pressable style={styles.primaryBtn} onPress={onExploreAll}>
              <Text style={styles.primaryBtnText}>See All Categories</Text>
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={onBack}>
              <Text style={styles.secondaryBtnText}>Explore Marketplace</Text>
            </Pressable>
          </View>
        ) : (
          /* Products Grid - Matching Figma Screen 4 */
          <View style={styles.grid}>
            {products.map((item) => (
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
                    🧑‍🌾 {item.farmerName}
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

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        initialFilters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApply={(newFilters) => {
          setFilters((prev) => ({ ...prev, ...newFilters }));
        }}
        onReset={() => {
          setFilters({ category: categoryId });
        }}
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
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  placeholderBtn: {
    width: 36,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  activeTagBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  activeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  scrollContent: {
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
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 38,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#386641',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
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
    opacity: 0.95,
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
});
