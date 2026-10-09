import React, { useState, useEffect, useCallback } from 'react';
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
import {
  fetchProduceListings,
  ApiProduceItem,
  getStoredUser,
  ApiUser,
  fetchWishlist,
  toggleWishlist,
  fetchUnreadNotificationsCount,
} from '@/services/api';
import { WishlistService } from '@/services/wishlist-service';
import { useCart } from '@/context/cart-context';
import { MARKET_CATEGORIES } from './all-categories-screen';
import { FilterModal, FilterState } from './filter-modal';
import { LocationPermissionModal } from './location-permission-modal';
import { FirestoreChatService } from '@/services/firestore-chat-service';

interface BuyerHomeScreenProps {
  onOpenSearch: () => void;
  onOpenCategories: () => void;
  onSelectCategory: (categoryId: string, categoryName: string) => void;
  onSelectProduct: (product: ApiProduceItem) => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenOrders?: () => void;
  onOpenChats?: () => void;
  onOpenFarmsMap?: () => void;
  onOpenFarmerMatching?: () => void;
  onOpenProductScanner?: () => void;
  onOpenWishlist?: () => void;
  onOpenCart?: () => void;
  onOpenHarvestCalendar?: () => void;
  onOpenAuctionsHub?: () => void;
  onSelectFarmer?: (farmer: {
    id: string;
    name: string;
    avatar?: string;
    location?: string;
    rating?: number;
    district?: string;
  }) => void;
}

export interface NearbyFarmerItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  orders: number;
  avatar: string;
  distance: string;
}

export function BuyerHomeScreen({
  onOpenSearch,
  onOpenCategories,
  onSelectCategory,
  onSelectProduct,
  onOpenNotifications,
  onOpenProfile,
  onOpenOrders,
  onOpenChats,
  onOpenFarmsMap,
  onOpenFarmerMatching,
  onOpenProductScanner,
  onOpenWishlist,
  onOpenCart,
  onOpenHarvestCalendar,
  onOpenAuctionsHub,
  onSelectFarmer,
}: BuyerHomeScreenProps) {
  const { totalCount: cartCount, addToCart } = useCart();
  const [produceList, setProduceList] = useState<ApiProduceItem[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Colombo, Sri Lanka');
  const [nearbyFarmers, setNearbyFarmers] = useState<NearbyFarmerItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [items, currentUser, savedWishlist] = await Promise.all([
        fetchProduceListings(),
        getStoredUser(),
        fetchWishlist().catch(() => []),
      ]);
      setProduceList(items);
      setUser(currentUser);
      const uid = currentUser?.id || (currentUser as any)?._id;
      if (uid) {
        fetchUnreadNotificationsCount(uid)
          .then(setUnreadNotificationsCount)
          .catch(() => {});
      }
      if (currentUser?.district) {
        setSelectedLocation(`${currentUser.district}, Sri Lanka`);
      }
      if (Array.isArray(savedWishlist) && savedWishlist.length > 0) {
        const ids = new Set<string>();
        savedWishlist.forEach((w: any) => {
          if (w.produceId) ids.add(w.produceId);
          else if (w.id) ids.add(w.id);
          else if (w._id) ids.add(w._id);
        });
        setWishlistedIds(ids);
      }

      // ── Dynamically populate real farmers directly from MongoDB & Firestore database ──
      const farmerMap = new Map<string, NearbyFarmerItem>();
      if (Array.isArray(items)) {
        items.forEach((p) => {
          const rawId = String(p.farmerId || (p as any)._id || '');
          const farmerName = p.farmerName || 'Verified Farmer';
          if (!rawId && !farmerName) return;
          const key = (p.farmerId || farmerName).toString();
          if (!farmerMap.has(key)) {
            const loc = p.locationDistrict
              ? `${p.locationCity ? p.locationCity + ', ' : ''}${p.locationDistrict}`
              : 'Nuwara Eliya';
            farmerMap.set(key, {
              id: p.farmerId || rawId || key,
              name: farmerName,
              location: loc,
              rating: 4.9,
              orders: 140,
              avatar: p.farmerAvatar || '',
              distance: p.locationDistrict === currentUser?.district ? '8 km' : '14 km',
            });
          } else if (p.farmerAvatar && !farmerMap.get(key)!.avatar) {
            farmerMap.get(key)!.avatar = p.farmerAvatar;
          }
        });
      }

      try {
        const platformFarmers = await FirestoreChatService.fetchPlatformUsers('farmer');
        platformFarmers.forEach((ff) => {
          const key = ff.id || ff.fullName;
          if (!farmerMap.has(key)) {
            farmerMap.set(key, {
              id: ff.id,
              name: ff.fullName,
              location: ff.district ? `${ff.district}, Sri Lanka` : 'Central Province',
              rating: 4.9,
              orders: 96,
              avatar: ff.avatarUrl || '',
              distance: '12 km',
            });
          } else if (ff.avatarUrl) {
            farmerMap.get(key)!.avatar = ff.avatarUrl;
          }
        });
      } catch {}

      if (farmerMap.size > 0) {
        setNearbyFarmers(Array.from(farmerMap.values()));
      } else {
        setNearbyFarmers([
          {
            id: 'Sunil Bandara',
            name: 'Sunil Bandara',
            location: 'Welimada, Nuwara Eliya',
            rating: 4.9,
            orders: 142,
            avatar: '',
            distance: '12 km',
          },
          {
            id: 'Kamal Gunawardana',
            name: 'Kamal Gunawardana',
            location: 'Kandy, Ampitiya',
            rating: 4.8,
            orders: 98,
            avatar: '',
            distance: '18 km',
          },
          {
            id: 'Ranjith Silva',
            name: 'Ranjith Silva',
            location: 'Welimada',
            rating: 4.9,
            orders: 215,
            avatar: '',
            distance: '24 km',
          },
        ]);
      }
    } catch (err) {
      console.error('[BuyerHomeScreen] Failed to load data from MongoDB:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = WishlistService.subscribe((wItems) => {
      const ids = new Set<string>();
      wItems.forEach((wi) => {
        if (wi.produceId) ids.add(wi.produceId);
        if (wi.id) ids.add(wi.id);
      });
      setWishlistedIds(ids);
    });
    return () => unsub();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleWishlist = async (item: ApiProduceItem) => {
    const res = await WishlistService.toggleWishlist(item);
    setToastMessage(
      !res.isWishlisted
        ? `Removed "${item.title}" from Wishlist`
        : `Saved "${item.title}" to Wishlist ❤️`
    );
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleAddToCart = (item: ApiProduceItem) => {
    const pId = item.id || (item as any)._id;
    addToCart({
      id: pId,
      title: item.title,
      pricePerUnit: item.pricePerUnit,
      unit: item.unit,
      farmerName: item.farmerName,
      locationDistrict: item.locationDistrict,
      locationCity: item.locationCity,
      image: item.images?.[0] || '',
      quantity: 1,
      maxQuantity: item.availableQuantity,
      category: item.category,
      isOrganic: item.isOrganic,
    });

    setRecentlyAddedId(pId);
    setToastMessage(`Added 1 ${item.unit} "${item.title}" to Cart 🛒`);
    setTimeout(() => setRecentlyAddedId(null), 1400);
    setTimeout(() => setToastMessage(null), 2200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header (Screen 1 & 2 in Figma) */}
      <View style={styles.header}>
        {/* Top bar with logo, wishlist, cart and notifications */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeEmoji}>🌱</Text>
            </View>
            <Text style={styles.brandName}>Farmora</Text>
          </View>

          <View style={styles.topRightActions}>
            {/* Wishlist Icon Button */}
            <Pressable
              style={styles.headerActionBtn}
              hitSlop={10}
              onPress={onOpenWishlist}>
              <Svg
                width={21}
                height={21}
                viewBox="0 0 24 24"
                fill={wishlistedIds.size > 0 ? '#EF4444' : 'none'}
                stroke={wishlistedIds.size > 0 ? '#EF4444' : '#1E293B'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round">
                <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </Svg>
              {wishlistedIds.size > 0 && (
                <View style={styles.badgeRed}>
                  <Text style={styles.badgeText}>
                    {wishlistedIds.size > 9 ? '9+' : wishlistedIds.size}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Cart Icon Button */}
            <Pressable
              style={styles.headerActionBtn}
              hitSlop={10}
              onPress={onOpenCart}>
              <Svg
                width={21}
                height={21}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E293B"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round">
                <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <Path d="M3 6h18" />
                <Path d="M16 10a4 4 0 0 1-8 0" />
              </Svg>
              {cartCount > 0 && (
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Notification Bell */}
            <Pressable
              style={styles.headerActionBtn}
              hitSlop={10}
              onPress={onOpenNotifications}>
              <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
              {unreadNotificationsCount > 0 && (
                <View style={styles.badgeRed}>
                  <Text style={styles.badgeText}>
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Deliver To Selector */}
        <View style={styles.locationRow}>
          <Text style={styles.deliverLabel}>Deliver to: </Text>
          <Pressable style={styles.locationSelector} onPress={() => setShowLocationModal(true)}>
            <Text style={styles.locationText}>{selectedLocation}</Text>
            <Text style={styles.locationArrow}> ⌄</Text>
          </Pressable>
        </View>

        {/* Search Bar Input */}
        <View style={styles.searchBarRow}>
          <Pressable style={styles.searchBar} onPress={onOpenSearch}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              Search fresh vegetables, fruits...
            </Text>
          </Pressable>

          <Pressable
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
            </Svg>
          </Pressable>
        </View>
      </View>

      {/* Main Body */}
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
        {/* Promotional Hero Banner (Screen 1 in Figma) */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>⚡ DIRECT HARVEST</Text>
            </View>
            <Text style={styles.heroTitle}>Direct Harvest Reward</Text>
            <Text style={styles.heroSub}>
              Save up to 25% on your first bulk order directly from farmers.
            </Text>
            <Pressable style={styles.heroCta} onPress={onOpenCategories}>
              <Text style={styles.heroCtaText}>Explore Now →</Text>
            </Pressable>
          </View>
          <View style={styles.heroImagePlaceholder}>
            <Text style={{ fontSize: 50 }}>🥦</Text>
          </View>
        </View>

        {/* Smart Farmer & Produce AI Tools Strip */}
        <View style={styles.quickToolsContainer}>
          <Pressable
            style={styles.quickToolCard}
            onPress={onOpenFarmerMatching}>
            <View style={[styles.quickToolIcon, { backgroundColor: '#DCFCE7' }]}>
              <Text style={{ fontSize: 18 }}>🎯</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickToolTitle}>AI Farmer Match</Text>
              <Text style={styles.quickToolSub}>Find best farm suppliers</Text>
            </View>
            <Text style={styles.quickToolArrow}>›</Text>
          </Pressable>

          <Pressable
            style={styles.quickToolCard}
            onPress={onOpenProductScanner}>
            <View style={[styles.quickToolIcon, { backgroundColor: '#DBEAFE' }]}>
              <Text style={{ fontSize: 18 }}>📸</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickToolTitle}>Produce Scanner</Text>
              <Text style={styles.quickToolSub}>Quality & price audit</Text>
            </View>
            <Text style={styles.quickToolArrow}>›</Text>
          </Pressable>
        </View>

        {/* Harvest Schedule & Live Auctions Cards */}
        <View style={styles.quickToolsContainer}>
          <Pressable
            style={[styles.quickToolCard, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }]}
            onPress={onOpenHarvestCalendar}>
            <View style={[styles.quickToolIcon, { backgroundColor: '#DCFCE7' }]}>
              <Text style={{ fontSize: 18 }}>📅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickToolTitle, { color: '#14532D' }]}>Harvest Pre-Order</Text>
              <Text style={styles.quickToolSub}>Book upcoming batches</Text>
            </View>
            <Text style={[styles.quickToolArrow, { color: '#16A34A' }]}>›</Text>
          </Pressable>

          <Pressable
            style={[styles.quickToolCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
            onPress={onOpenAuctionsHub}>
            <View style={[styles.quickToolIcon, { backgroundColor: '#FEE2E2' }]}>
              <Text style={{ fontSize: 18 }}>🔨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickToolTitle, { color: '#7F1D1D' }]}>Produce Bidding</Text>
              <Text style={styles.quickToolSub}>Wholesale live auctions</Text>
            </View>
            <Text style={[styles.quickToolArrow, { color: '#DC2626' }]}>›</Text>
          </Pressable>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={onOpenCategories} hitSlop={10}>
              <Text style={styles.seeAllLink}>See All ›</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}>
            {MARKET_CATEGORIES.slice(0, 6).map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.categoryPill,
                  pressed && styles.categoryPillPressed,
                ]}
                onPress={() => onSelectCategory(cat.id, cat.name)}>
                <View style={[styles.categoryCircle, { backgroundColor: cat.color }]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Today's Fresh Harvest (Screen 1 & 2 in Figma) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Today&apos;s Harvest</Text>
              <Text style={styles.sectionSub}>Freshly picked and ready for dispatch</Text>
            </View>
            <Pressable onPress={onOpenSearch} hitSlop={10}>
              <Text style={styles.seeAllLink}>See All ›</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="small" color="#386641" />
              <Text style={styles.loaderText}>Syncing live harvest from MongoDB...</Text>
            </View>
          ) : produceList.length === 0 ? (
            <View style={styles.emptyHarvest}>
              <Text style={styles.emptyHarvestText}>No active listings in your area yet.</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {produceList.map((item) => {
                const itemId = item.id || (item as any)._id;
                const isItemWishlisted = wishlistedIds.has(itemId);
                const isJustAdded = recentlyAddedId === itemId;

                return (
                  <Pressable
                    key={itemId}
                    style={({ pressed }) => [
                      styles.productCard,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => onSelectProduct(item)}>
                    <View style={styles.productImageContainer}>
                      {item.images && item.images[0] ? (
                        <Image
                          source={{ uri: item.images[0] }}
                          style={styles.productImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.productImage, styles.placeholderImg]}>
                          <Text style={{ fontSize: 32 }}>🌱</Text>
                        </View>
                      )}

                      {/* Wishlist Heart Button overlay */}
                      <Pressable
                        style={[
                          styles.cardWishlistBtn,
                          isItemWishlisted && styles.cardWishlistBtnActive,
                        ]}
                        hitSlop={10}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(item);
                        }}>
                        <Svg
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill={isItemWishlisted ? '#EF4444' : 'none'}
                          stroke={isItemWishlisted ? '#EF4444' : '#1E293B'}
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round">
                          <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </Svg>
                      </Pressable>

                      {item.isOrganic && (
                        <View style={styles.organicTag}>
                          <Text style={styles.organicTagText}>Organic</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.farmerSub} numberOfLines={1}>
                        🧑‍🌾 {item.farmerName} • 📍 {item.locationDistrict}
                      </Text>

                      <View style={styles.productBottom}>
                        <Text style={styles.productPrice}>
                          Rs. {item.pricePerUnit}
                          <Text style={styles.productUnit}> /{item.unit}</Text>
                        </Text>

                        {/* Interactive Add to Cart button */}
                        <Pressable
                          style={[
                            styles.addBtn,
                            isJustAdded && styles.addBtnSuccess,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}>
                          {isJustAdded ? (
                            <Text style={styles.addBtnTextSuccess}>✓ Added</Text>
                          ) : (
                            <View style={styles.addBtnRow}>
                              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M12 5v14M5 12h14" />
                              </Svg>
                              <Text style={styles.addBtnText}>Cart</Text>
                            </View>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Nearby Verified Farmers Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Nearby Farmers</Text>
              <Text style={styles.sectionSub}>Direct from verified local growers</Text>
            </View>
            <Pressable onPress={onOpenFarmsMap} hitSlop={10}>
              <Text style={styles.seeAllLink}>View on Map ›</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.farmersScroll}>
            {nearbyFarmers.map((farmer) => (
              <Pressable
                key={farmer.id}
                style={styles.farmerCard}
                onPress={() => {
                  if (onSelectFarmer) {
                    onSelectFarmer(farmer);
                  } else if (onOpenFarmsMap) {
                    onOpenFarmsMap();
                  }
                }}>
                {farmer.avatar ? (
                  <Image
                    source={{ uri: farmer.avatar }}
                    style={styles.farmerAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.farmerAvatar, styles.farmerAvatarPlaceholder]}>
                    <Text style={styles.farmerAvatarInitials}>
                      {farmer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.farmerName}>{farmer.name}</Text>
                <Text style={styles.farmerDist}>{farmer.location} • {farmer.distance}</Text>
                <View style={styles.farmerRatingRow}>
                  <Text style={styles.farmerRatingText}>★ {farmer.rating}</Text>
                  <Text style={styles.farmerOrdersText}>({farmer.orders} orders)</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Special Offers Banner */}
        <View style={styles.offerBanner}>
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText}>SPECIAL DEAL</Text>
          </View>
          <Text style={styles.offerTitle}>Weekend Highland Veggies - 15% OFF</Text>
          <Text style={styles.offerSub}>
            Valid for orders placed directly from Nuwara Eliya growers today.
          </Text>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(f) => {
          if (f.district) setSelectedLocation(`${f.district}, Sri Lanka`);
        }}
        onReset={() => {}}
      />

      {/* Location Permission Prompt Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        onAllowLocation={() => {
          setShowLocationModal(false);
          setSelectedLocation('Central Province, Sri Lanka');
        }}
        onManualLocation={() => {
          setShowLocationModal(false);
          setFilterModalVisible(true);
        }}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <View style={styles.toastBanner} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#386641',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeEmoji: {
    fontSize: 16,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16281D',
    letterSpacing: -0.4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeRed: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeGreen: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#2E7D32',
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliverLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationArrow: {
    fontSize: 12,
    color: '#0F172A',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 13.5,
    color: '#94A3B8',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#386641',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBanner: {
    flexDirection: 'row',
    backgroundColor: '#386641',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTextContent: {
    flex: 1,
    paddingRight: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2F5436',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSub: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  heroCtaText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  heroImagePlaceholder: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  categoryPill: {
    alignItems: 'center',
    width: 64,
  },
  categoryPillPressed: {
    transform: [{ scale: 0.96 }],
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  loaderBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyHarvest: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  emptyHarvestText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
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
  productImage: {
    width: '100%',
    height: 125,
    backgroundColor: '#F1F5F9',
  },
  placeholderImg: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  organicTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#166534',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  organicTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    height: 36,
  },
  farmerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 6,
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  productUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 125,
    backgroundColor: '#F1F5F9',
  },
  cardWishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 3,
  },
  cardWishlistBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  addBtn: {
    backgroundColor: '#EBF5EE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnSuccess: {
    backgroundColor: '#DCFCE7',
  },
  addBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  addBtnTextSuccess: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  toastBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 36 : 24,
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  farmersScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  farmerCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  farmerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  farmerAvatarPlaceholder: {
    backgroundColor: '#1E5E3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  farmerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  farmerDist: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  farmerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  farmerRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  farmerOrdersText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  offerBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
  },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  offerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  offerSub: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  // Quick tools strip
  quickToolsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  quickToolCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 10,
  },
  quickToolIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickToolTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickToolSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  quickToolArrow: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
});
