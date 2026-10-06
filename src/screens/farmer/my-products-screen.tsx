import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { fetchMyListings, ApiProduceItem } from '@/services/api';
import { UpdateStockModal } from './update-stock-modal';
import { DeleteArchiveModal } from './delete-archive-modal';
import { EditProductScreen } from './edit-product-screen';
import { ProductPerformanceScreen } from './product-performance-screen';
import { ProductPublishedModal } from './product-published-modal';

interface MyProductsScreenProps {
  onAddProduct: () => void;
  onEditProduct?: (product: ApiProduceItem) => void;
  newlyAddedTitle?: string | null;
}

const CATEGORY_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'spices', label: 'Spices' },
  { id: 'grains', label: 'Grains' },
];

export function MyProductsScreen({
  onAddProduct,
  onEditProduct,
  newlyAddedTitle,
}: MyProductsScreenProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'out_of_stock' | 'drafts'>('active');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ApiProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(newlyAddedTitle || null);
  const [showPublishedModal, setShowPublishedModal] = useState<boolean>(Boolean(newlyAddedTitle));

  // Modal / Subscreen states
  const [stockProduct, setStockProduct] = useState<ApiProduceItem | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<ApiProduceItem | null>(null);
  const [perfProduct, setPerfProduct] = useState<ApiProduceItem | null>(null);
  const [editingItem, setEditingItem] = useState<ApiProduceItem | null>(null);

  const loadProducts = async () => {
    try {
      const items = await fetchMyListings();
      if (items && items.length > 0) {
        setProducts(items);
      } else {
        setProducts(getMockFarmerProducts());
      }
    } catch {
      setProducts(getMockFarmerProducts());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleRestock = (productId: string) => {
    setProducts((prev) =>
      prev.map((item) => {
        if ((item.id || item._id) === productId) {
          return { ...item, availableQuantity: 100 };
        }
        return item;
      })
    );
  };

  const filteredProducts = products.filter((item) => {
    // Tab filter
    if (activeTab === 'active' && item.availableQuantity <= 0) return false;
    if (activeTab === 'out_of_stock' && item.availableQuantity > 0) return false;

    // Category filter
    if (selectedCategory !== 'all' && item.category?.toLowerCase() !== selectedCategory) {
      return false;
    }

    // Search query
    if (
      searchQuery.trim() &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const activeCount = products.filter((p) => p.availableQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.availableQuantity <= 0).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <Text style={styles.navTitle}>My Products</Text>

        <Pressable
          style={styles.addNavBtn}
          onPress={onAddProduct}>
          <Text style={styles.addNavBtnText}>+ Add New</Text>
        </Pressable>
      </View>

      {/* Success Notification Banner (Matching Figma Screen 4) */}
      {successBanner && (
        <View style={styles.successBanner}>
          <View style={styles.successIconCircle}>
            <Text style={{ color: '#15803D', fontWeight: '800' }}>✓</Text>
          </View>
          <Text style={styles.successBannerText}>
            <Text style={{ fontWeight: '800' }}>{successBanner}</Text> added to active inventory!
          </Text>
          <Pressable
            hitSlop={10}
            onPress={() => setSuccessBanner(null)}>
            <Text style={styles.successClose}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your crop listings..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter Tabs (Matching Figma Screen 5) */}
      <View style={styles.statusTabsRow}>
        <Pressable
          style={[styles.statusTab, activeTab === 'active' && styles.statusTabActive]}
          onPress={() => setActiveTab('active')}>
          <Text style={[styles.statusTabText, activeTab === 'active' && styles.statusTabTextActive]}>
            Active ({activeCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.statusTab, activeTab === 'out_of_stock' && styles.statusTabActive]}
          onPress={() => setActiveTab('out_of_stock')}>
          <Text style={[styles.statusTabText, activeTab === 'out_of_stock' && styles.statusTabTextActive]}>
            Out of Stock ({outOfStockCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.statusTab, activeTab === 'drafts' && styles.statusTabActive]}
          onPress={() => setActiveTab('drafts')}>
          <Text style={[styles.statusTabText, activeTab === 'drafts' && styles.statusTabTextActive]}>
            Drafts (0)
          </Text>
        </Pressable>
      </View>

      {/* Category Filter Pills (Matching Figma Screen 3) */}
      <View style={styles.catPillsRow}>
        {CATEGORY_PILLS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[styles.catPill, isSelected && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat.id)}>
              <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Produce List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Syncing farmer listings...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌿</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'out_of_stock'
              ? 'Great news! None of your products are currently out of stock.'
              : 'Add your first produce listing to start selling.'}
          </Text>
          <Pressable style={styles.emptyAddBtn} onPress={onAddProduct}>
            <Text style={styles.emptyAddBtnText}>+ Add Produce Listing</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id || item._id || ''}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
          }
          renderItem={({ item }) => {
            const isOutOfStock = item.availableQuantity <= 0;
            const isNewlyAdded = newlyAddedTitle === item.title;

            return (
              <Pressable
                style={[
                  styles.productCard,
                  isNewlyAdded && styles.productCardHighlighted,
                ]}
                onPress={() => setPerfProduct(item)}>
                {/* Thumbnail */}
                <View style={styles.thumbnailBox}>
                  {item.images && item.images[0] ? (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.placeholderThumbnail}>
                      <Text style={{ fontSize: 28 }}>🌱</Text>
                    </View>
                  )}
                  {item.isOrganic && (
                    <View style={styles.organicTag}>
                      <Text style={styles.organicTagText}>🌱</Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.productInfo}>
                  <View style={styles.productTitleRow}>
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {/* Edit Button */}
                      <Pressable
                        hitSlop={8}
                        style={styles.editBtn}
                        onPress={() => setEditingItem(item)}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M12 20h9" />
                          <Path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </Svg>
                      </Pressable>

                      {/* Archive / Delete Button */}
                      <Pressable
                        hitSlop={8}
                        style={[styles.editBtn, { backgroundColor: '#FEE2E2' }]}
                        onPress={() => setDeleteProduct(item)}>
                        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </Svg>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.priceText}>
                    Rs. {item.pricePerUnit}
                    <Text style={styles.unitText}> /{item.unit}</Text>
                  </Text>

                  {/* Stock Row & Restock / Update button */}
                  <View style={styles.stockRow}>
                    <Pressable
                      onPress={() => setStockProduct(item)}
                      style={[
                        styles.stockBadge,
                        isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn,
                      ]}>
                      <Text
                        style={[
                          styles.stockBadgeText,
                          isOutOfStock ? styles.stockTextOut : styles.stockTextIn,
                        ]}>
                        {isOutOfStock
                          ? '○ Out of Stock'
                          : `● ${item.availableQuantity} ${item.unit} in stock`}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.restockBtn}
                      onPress={() => setStockProduct(item)}>
                      <Text style={styles.restockBtnText}>
                        {isOutOfStock ? 'Restock' : 'Update Stock'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Floating Action Button (+ ADD PRODUCT) */}
      <Pressable style={styles.fabBtn} onPress={onAddProduct}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>ADD PRODUCT</Text>
      </Pressable>

      {/* Product Published Modal (Screen 3 in Figma) */}
      <ProductPublishedModal
        visible={showPublishedModal}
        productTitle={newlyAddedTitle || undefined}
        onViewProduct={() => {
          setShowPublishedModal(false);
          const found = products.find((p) => p.title === newlyAddedTitle);
          if (found) setPerfProduct(found);
        }}
        onAddAnother={() => {
          setShowPublishedModal(false);
          onAddProduct();
        }}
        onClose={() => setShowPublishedModal(false)}
      />

      {/* Update Stock Modal (Screen 5 in Figma) */}
      <UpdateStockModal
        visible={Boolean(stockProduct)}
        product={stockProduct}
        onClose={() => setStockProduct(null)}
        onSuccess={(updated) => {
          setProducts((prev) =>
            prev.map((p) => ((p.id || p._id) === (updated.id || updated._id) ? updated : p))
          );
        }}
      />

      {/* Delete or Archive Modal (Screen 6 in Figma) */}
      <DeleteArchiveModal
        visible={Boolean(deleteProduct)}
        product={deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onSuccess={() => {
          if (deleteProduct) {
            const delId = deleteProduct._id || deleteProduct.id;
            setProducts((prev) => prev.filter((p) => (p.id || p._id) !== delId));
          }
        }}
      />

      {/* Edit Product Screen (Screen 4 in Figma) */}
      {editingItem && (
        <View style={StyleSheet.absoluteFill}>
          <EditProductScreen
            product={editingItem}
            onBack={() => setEditingItem(null)}
            onSaved={(updated) => {
              setProducts((prev) =>
                prev.map((p) => ((p.id || p._id) === (updated.id || updated._id) ? updated : p))
              );
              setEditingItem(null);
            }}
          />
        </View>
      )}

      {/* Product Performance Analytics (Screen 7 in Figma) */}
      {perfProduct && (
        <View style={StyleSheet.absoluteFill}>
          <ProductPerformanceScreen
            product={perfProduct}
            onBack={() => setPerfProduct(null)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function getMockFarmerProducts(): ApiProduceItem[] {
  return [
    {
      id: 'fp-1',
      _id: 'fp-1',
      title: 'Organic Red Tomatoes',
      category: 'vegetables',
      description: 'Hand-picked vine ripe organic tomatoes, graded A quality.',
      currency: 'LKR',
      pricePerUnit: 240,
      unit: 'kg',
      availableQuantity: 150,
      minimumOrderQuantity: 10,
      farmerId: 'f1',
      farmerName: 'Kamal Perera',
      farmerMobile: '+94 77 123 4567',
      locationCity: 'Kandy',
      locationDistrict: 'Kandy',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'fp-2',
      _id: 'fp-2',
      title: 'Ceylon Cinnamon Quills',
      category: 'spices',
      description: 'Export quality Alba Ceylon cinnamon sticks from Southern Province.',
      currency: 'LKR',
      pricePerUnit: 1450,
      unit: 'kg',
      availableQuantity: 50,
      minimumOrderQuantity: 2,
      farmerId: 'f1',
      farmerName: 'Kamal Perera',
      farmerMobile: '+94 77 123 4567',
      locationCity: 'Kandy',
      locationDistrict: 'Kandy',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'fp-3',
      _id: 'fp-3',
      title: 'King Coconut',
      category: 'fruits',
      description: 'Sweet fresh king coconut with electrolyte rich water.',
      currency: 'LKR',
      pricePerUnit: 140,
      unit: 'unit',
      availableQuantity: 200,
      minimumOrderQuantity: 10,
      farmerId: 'f1',
      farmerName: 'Kamal Perera',
      farmerMobile: '+94 77 123 4567',
      locationCity: 'Kandy',
      locationDistrict: 'Kandy',
      isOrganic: false,
      images: ['https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=60'],
      createdAt: '2026-10-01',
    },
    {
      id: 'fp-4',
      _id: 'fp-4',
      title: 'Organic Red Beetroot',
      category: 'vegetables',
      description: 'Deep crimson organic beetroot with crisp texture.',
      currency: 'LKR',
      pricePerUnit: 260,
      unit: 'kg',
      availableQuantity: 0, // Out of stock example
      minimumOrderQuantity: 10,
      farmerId: 'f1',
      farmerName: 'Kamal Perera',
      farmerMobile: '+94 77 123 4567',
      locationCity: 'Kandy',
      locationDistrict: 'Kandy',
      isOrganic: true,
      images: ['https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=500&auto=format&fit=crop&q=60'],
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  addNavBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNavBtnText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  // Success banner (Screen 4)
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
    gap: 10,
  },
  successIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
  },
  successClose: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '700',
    padding: 4,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  // Status tabs (Screen 5)
  statusTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusTabActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  statusTabTextActive: {
    color: '#FFFFFF',
  },
  // Category filter pills
  catPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  catPillActive: {
    backgroundColor: '#DCFCE7',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  catPillTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  productCardHighlighted: {
    borderColor: '#22C55E',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  thumbnailBox: {
    width: 84,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  organicTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(22, 101, 52, 0.85)',
    borderRadius: 4,
    padding: 2,
  },
  organicTagText: {
    fontSize: 9,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  editBtn: {
    padding: 2,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 2,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeIn: {
    backgroundColor: '#DCFCE7',
  },
  stockBadgeOut: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockTextIn: {
    color: '#15803D',
  },
  stockTextOut: {
    color: '#B91C1C',
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeTagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  restockBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  restockBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  emptyAddBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Floating Action Button
  fabBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
