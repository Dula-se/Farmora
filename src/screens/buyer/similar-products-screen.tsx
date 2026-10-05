import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
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

interface SimilarProductsScreenProps {
  baseProduct?: ApiProduceItem | null;
  onBack: () => void;
  onSelectProduct: (product: ApiProduceItem) => void;
  onOpenCompare?: (product: ApiProduceItem) => void;
  onToggleWishlist?: (product: ApiProduceItem) => void;
}

const FILTER_PILLS = [
  { id: 'same-cat', label: 'Same Category' },
  { id: 'nearby', label: 'Nearby (< 25km)' },
  { id: 'organic', label: '100% Organic' },
  { id: 'fair', label: 'Fair Trade Certified' },
  { id: 'bulk', label: 'Bulk Discount' },
];

export function SimilarProductsScreen({
  baseProduct,
  onBack,
  onSelectProduct,
  onOpenCompare,
  onToggleWishlist,
}: SimilarProductsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState('same-cat');
  const [products, setProducts] = useState<ApiProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    loadSimilarProduce();
  }, [baseProduct, selectedFilter]);

  const loadSimilarProduce = async () => {
    try {
      setLoading(true);
      const categoryParam = baseProduct?.category || 'vegetables';
      const items = await fetchProduceListings({
        category: selectedFilter === 'same-cat' ? categoryParam : undefined,
      });

      if (items && items.length > 0) {
        const filtered = items.filter(
          (p: ApiProduceItem) =>
            (p._id || p.id) !== (baseProduct?._id || baseProduct?.id)
        );
        setProducts(filtered);
      } else {
        setProducts(getMockSimilarProducts());
      }
    } catch {
      setProducts(getMockSimilarProducts());
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = (p: ApiProduceItem) => {
    const pId = p._id || p.id;
    if (!pId) return;

    if (wishlistIds.includes(pId)) {
      setWishlistIds((prev) => prev.filter((id) => id !== pId));
    } else {
      setWishlistIds((prev) => [...prev, pId]);
      onToggleWishlist?.(p);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <Text style={styles.navTitle}>Similar Products</Text>

        {baseProduct && onOpenCompare ? (
          <Pressable
            hitSlop={10}
            style={styles.compareBtn}
            onPress={() => onOpenCompare(baseProduct)}>
            <Text style={styles.compareBtnText}>Compare</Text>
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterPillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}>
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedFilter === pill.id;
            return (
              <Pressable
                key={pill.id}
                style={[
                  styles.pillBtn,
                  isSelected && styles.pillBtnSelected,
                ]}
                onPress={() => setSelectedFilter(pill.id)}>
                <Text
                  style={[
                    styles.pillBtnText,
                    isSelected && styles.pillBtnTextSelected,
                  ]}>
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 2-Column Produce Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Finding best matches...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No similar produce found</Text>
          <Text style={styles.emptySub}>Try switching filters to see more results</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const pId = item._id || item.id || '';
            const isFav = wishlistIds.includes(pId);
            return (
              <Pressable
                style={styles.card}
                onPress={() => onSelectProduct(item)}>
                {/* Image & Wishlist Button */}
                <View style={styles.imageBox}>
                  {item.images && item.images[0] ? (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.productImg}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <View style={styles.placeholderBox}>
                      <Text style={styles.placeholderEmoji}>🌱</Text>
                    </View>
                  )}

                  {/* Organic Badge */}
                  {item.isOrganic && (
                    <View style={styles.organicTag}>
                      <Text style={styles.organicTagText}>🌱 Organic</Text>
                    </View>
                  )}

                  {/* Heart Action */}
                  <Pressable
                    style={styles.heartBtn}
                    hitSlop={8}
                    onPress={() => toggleWishlist(item)}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill={isFav ? '#DC2626' : 'none'} stroke={isFav ? '#DC2626' : '#1E293B'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </Svg>
                  </Pressable>
                </View>

                {/* Card Content */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  <Text style={styles.cardFarmer} numberOfLines={1}>
                    {item.farmerName} • {item.locationCity}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.cardPrice}>
                      Rs. {item.pricePerUnit}
                      <Text style={styles.cardUnit}>/{item.unit}</Text>
                    </Text>
                    <Text style={styles.cardRating}>★ 4.9</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.inStockBadge}>
                      <Text style={styles.inStockText}>In Stock</Text>
                    </View>
                    {onOpenCompare && (
                      <Pressable
                        style={styles.compareSmallBtn}
                        onPress={() => onOpenCompare(item)}>
                        <Text style={styles.compareSmallText}>Compare</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function getMockSimilarProducts(): ApiProduceItem[] {
  return [
    {
      id: 'sim-1',
      _id: 'sim-1',
      title: 'Organic Green Beans',
      category: 'vegetables',
      description: 'Hand-picked green beans, rich in nutrients and freshness.',
      currency: 'LKR',
      pricePerUnit: 220,
      unit: 'kg',
      availableQuantity: 150,
      minimumOrderQuantity: 10,
      farmerId: 'f1',
      farmerName: 'Perera Organic Farm',
      farmerMobile: '+94 77 123 4567',
      locationCity: 'Kandy',
      locationDistrict: 'Kandy',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'sim-2',
      _id: 'sim-2',
      title: 'A5 Seedling Potato',
      category: 'vegetables',
      description: 'Mountain-grown potatoes ideal for culinary preparation and storing.',
      currency: 'LKR',
      pricePerUnit: 190,
      unit: 'kg',
      availableQuantity: 400,
      minimumOrderQuantity: 20,
      farmerId: 'f2',
      farmerName: 'Highland Fresh Fields',
      farmerMobile: '+94 71 987 6543',
      locationCity: 'Nuwara Eliya',
      locationDistrict: 'Nuwara Eliya',
      isOrganic: false,
      images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'sim-3',
      _id: 'sim-3',
      title: 'Premium Sweet Corn',
      category: 'vegetables',
      description: 'Naturally sweet and juicy fresh-picked corn cobs.',
      currency: 'LKR',
      pricePerUnit: 160,
      unit: 'kg',
      availableQuantity: 200,
      minimumOrderQuantity: 15,
      farmerId: 'f3',
      farmerName: 'Dambulla Harvest Co',
      farmerMobile: '+94 76 555 1234',
      locationCity: 'Dambulla',
      locationDistrict: 'Matale',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'sim-4',
      _id: 'sim-4',
      title: 'Organic Red Beetroot',
      category: 'vegetables',
      description: 'Earth-fresh organic beetroot with deep crimson color.',
      currency: 'LKR',
      pricePerUnit: 260,
      unit: 'kg',
      availableQuantity: 180,
      minimumOrderQuantity: 10,
      farmerId: 'f4',
      farmerName: 'Badulla Highland Agro',
      farmerMobile: '+94 77 999 8888',
      locationCity: 'Badulla',
      locationDistrict: 'Badulla',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'sim-5',
      _id: 'sim-5',
      title: 'Fresh Keeramin Pepper',
      category: 'spices',
      description: 'Pungent whole green and black pepper from Matale valley.',
      currency: 'LKR',
      pricePerUnit: 450,
      unit: 'kg',
      availableQuantity: 90,
      minimumOrderQuantity: 5,
      farmerId: 'f5',
      farmerName: 'Matale Spice Garden',
      farmerMobile: '+94 78 111 2222',
      locationCity: 'Matale',
      locationDistrict: 'Matale',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'sim-6',
      _id: 'sim-6',
      title: 'Ceylon Cinnamon Quills',
      category: 'spices',
      description: 'Authentic pure Ceylon cinnamon sticks with delicate aroma.',
      currency: 'LKR',
      pricePerUnit: 1200,
      unit: 'kg',
      availableQuantity: 50,
      minimumOrderQuantity: 2,
      farmerId: 'f6',
      farmerName: 'Southern Spice Estate',
      farmerMobile: '+94 70 333 4444',
      locationCity: 'Galle',
      locationDistrict: 'Galle',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
  ];
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  compareBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compareBtnText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  filterPillsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillBtnSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pillBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  gridContent: {
    padding: 12,
    paddingBottom: 30,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  imageBox: {
    width: '100%',
    height: 125,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  organicTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#166534',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  organicTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardFarmer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  cardUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  cardRating: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EAB308',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inStockBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inStockText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  compareSmallBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compareSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
});
