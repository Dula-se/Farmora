import React, { useState } from 'react';
import {
  Modal,
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
import { ApiProduceItem } from '@/services/api';
import { useCart } from '@/context/cart-context';
import { ImageGalleryModal } from './image-gallery-modal';
import { PriceTrendsModal } from './price-trends-modal';
import { SavedToWishlistModal } from './wishlist-screen';

interface ProductDetailScreenProps {
  product: ApiProduceItem;
  onBack: () => void;
  onOrderNow?: (product: ApiProduceItem, quantity: number) => void;
  onChatFarmer?: (farmerId: string) => void;
  onOpenReviews?: (product: ApiProduceItem) => void;
  onOpenSimilar?: (product: ApiProduceItem) => void;
  onOpenCompare?: (product: ApiProduceItem) => void;
  onOpenFarmMap?: (product: ApiProduceItem) => void;
  onOpenWishlist?: () => void;
  onOpenCart?: () => void;
}

export function ProductDetailScreen({
  product,
  onBack,
  onOrderNow,
  onChatFarmer,
  onOpenReviews,
  onOpenSimilar,
  onOpenCompare,
  onOpenFarmMap,
  onOpenWishlist,
  onOpenCart,
}: ProductDetailScreenProps) {
  const { addToCart, totalCount: cartTotalCount } = useCart();
  const [selectedQty, setSelectedQty] = useState(product.minimumOrderQuantity || 10);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPriceTrends, setShowPriceTrends] = useState(false);
  const [showSavedWishlistModal, setShowSavedWishlistModal] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  const minQty = product.minimumOrderQuantity || 1;
  const maxQty = product.availableQuantity || 500;
  const unit = product.unit || 'kg';

  const handleDecrement = () => {
    if (selectedQty > minQty) {
      setSelectedQty((prev) => Math.max(minQty, prev - 5));
    }
  };

  const handleIncrement = () => {
    if (selectedQty < maxQty) {
      setSelectedQty((prev) => Math.min(maxQty, prev + 5));
    }
  };

  const handleToggleFavorite = () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    if (nextState) {
      setShowSavedWishlistModal(true);
    }
  };

  const handleAddToCartPress = () => {
    addToCart({
      id: product.id || (product as any)._id,
      title: product.title,
      pricePerUnit: product.pricePerUnit,
      unit: unit,
      farmerName: product.farmerName,
      locationDistrict: product.locationDistrict,
      locationCity: product.locationCity,
      image: (product.images && product.images[0]) || '',
      quantity: selectedQty,
      maxQuantity: maxQty,
      category: product.category,
      isOrganic: product.isOrganic,
    });
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 2000);
  };

  const totalPrice = selectedQty * product.pricePerUnit;
  const productImages = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.topRightActions}>
          {/* Cart Link button with live counter */}
          <Pressable
            onPress={onOpenCart || onBack}
            hitSlop={12}
            style={styles.navBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <Path d="M3 6h18" />
              <Path d="M16 10a4 4 0 0 1-8 0" />
            </Svg>
            {cartTotalCount > 0 && (
              <View style={styles.topNavCartBadge}>
                <Text style={styles.topNavCartBadgeText}>
                  {cartTotalCount > 9 ? '9+' : cartTotalCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Heart / Favorite button */}
          <Pressable
            onPress={handleToggleFavorite}
            hitSlop={12}
            style={styles.navBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill={isFavorite ? '#DC2626' : 'none'} stroke={isFavorite ? '#DC2626' : '#1E293B'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </Svg>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Product Image (Tap to open Fullscreen Gallery) */}
        <Pressable
          style={styles.imageContainer}
          onPress={() => setShowGallery(true)}>
          <Image
            source={{ uri: productImages[0] }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />

          {/* Gallery Badge */}
          <View style={styles.galleryBadge}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </Svg>
            <Text style={styles.galleryBadgeText}>View Gallery ({productImages.length})</Text>
          </View>

          {/* Badges Overlay */}
          <View style={styles.imageBadgesRow}>
            {product.isOrganic && (
              <View style={styles.organicBadge}>
                <Text style={styles.organicBadgeText}>🌱 100% Organic</Text>
              </View>
            )}
            <View style={styles.freshBadge}>
              <Text style={styles.freshBadgeText}>⚡ Fresh Harvest</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.bodyContent}>
          {/* Title & Price Header */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.productTitle}>{product.title}</Text>
              <Pressable
                style={styles.locationLink}
                onPress={() => onOpenFarmMap?.(product)}>
                <Text style={styles.locationText}>
                  📍 {product.locationCity}, {product.locationDistrict} • <Text style={styles.mapLinkText}>View Map ↗</Text>
                </Text>
              </Pressable>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>
                <Text style={styles.currencySymbol}>Rs. </Text>
                {product.pricePerUnit}
              </Text>
              <Text style={styles.priceUnit}>per {unit}</Text>
            </View>
          </View>

          {/* Price Trends & Wholesale Comparison Card Button */}
          <Pressable
            style={styles.priceTrendsCard}
            onPress={() => setShowPriceTrends(true)}>
            <View style={styles.priceTrendsLeft}>
              <View style={styles.trendIconBubble}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M23 6l-9.5 9.5-5-5L1 18" />
                  <Path d="M17 6h6v6" />
                </Svg>
              </View>
              <View>
                <Text style={styles.priceTrendsHeading}>Wholesale Price Trends</Text>
                <Text style={styles.priceTrendsSub}>Save Rs. 50/kg compared to Manning Market</Text>
              </View>
            </View>
            <View style={styles.viewTrendsBadge}>
              <Text style={styles.viewTrendsText}>View Graph ↗</Text>
            </View>
          </Pressable>

          {/* Ratings & Reviews Summary Card (Tap to open Reviews Screen) */}
          <Pressable
            style={styles.reviewsSummaryCard}
            onPress={() => onOpenReviews?.(product)}>
            <View style={styles.reviewsSummaryLeft}>
              <Text style={styles.bigRatingText}>4.8</Text>
              <View style={styles.starsGroup}>
                <Text style={styles.starIcons}>★★★★★</Text>
                <Text style={styles.reviewCountText}>124 verified reviews</Text>
              </View>
            </View>
            <View style={styles.reviewsSummaryRight}>
              <Text style={styles.readReviewsText}>Read all reviews ›</Text>
            </View>
          </Pressable>

          {/* Key Specs Row */}
          <View style={styles.specsRow}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Available Qty</Text>
              <Text style={styles.specValue}>{product.availableQuantity} {unit}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Min Order</Text>
              <Text style={styles.specValue}>{minQty} {unit}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Harvest Date</Text>
              <Text style={styles.specValue}>{product.harvestDate || 'Fresh Today'}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Shelf Life</Text>
              <Text style={styles.specValue}>5 - 7 Days</Text>
            </View>
          </View>

          {/* Quick Shortcuts Bar: Compare | Similar Products */}
          <View style={styles.shortcutsRow}>
            {onOpenCompare && (
              <Pressable
                style={styles.shortcutBtn}
                onPress={() => onOpenCompare(product)}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </Svg>
                <Text style={styles.shortcutBtnText}>Compare Produce</Text>
              </Pressable>
            )}

            {onOpenSimilar && (
              <Pressable
                style={styles.shortcutBtn}
                onPress={() => onOpenSimilar(product)}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </Svg>
                <Text style={styles.shortcutBtnText}>Similar Produce</Text>
              </Pressable>
            )}
          </View>

          {/* Description Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={showFullDesc ? undefined : 3}>
              {product.description ||
                'Freshly harvested agricultural produce directly supplied by local verified farmers. Cleaned, graded, and packed to guarantee quality.'}
            </Text>
            {product.description && product.description.length > 120 && (
              <Pressable onPress={() => setShowFullDesc(!showFullDesc)}>
                <Text style={styles.readMoreLink}>
                  {showFullDesc ? 'Show Less ⌃' : 'Read More ⌄'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Farmer Card (Tap to view farmer profile & ratings) */}
          <Pressable
            style={({ pressed }) => [styles.farmerCard, pressed && { opacity: 0.95 }]}
            onPress={() => onOpenReviews?.(product)}>
            <View style={styles.farmerAvatarCircle}>
              {product.farmerAvatar ? (
                <Image
                  source={{ uri: product.farmerAvatar }}
                  style={styles.farmerAvatarImg}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.farmerAvatarText}>
                  {product.farmerName ? product.farmerName.charAt(0) : '👨‍🌾'}
                </Text>
              )}
            </View>

            <View style={styles.farmerDetails}>
              <View style={styles.farmerNameRow}>
                <Text style={styles.farmerName}>{product.farmerName}</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>✓ Verified</Text>
                </View>
              </View>
              <Text style={styles.farmerLocation}>
                {product.locationCity}, {product.locationDistrict}
              </Text>
              <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700', marginTop: 2 }}>
                ⭐ 4.9 • Tap to view farmer reviews ›
              </Text>
            </View>

            {onChatFarmer && (
              <Pressable
                style={styles.chatFarmerBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onChatFarmer(String(product.farmerId));
                }}>
                <Text style={styles.chatFarmerBtnText}>Chat</Text>
              </Pressable>
            )}
          </Pressable>

          {/* Bulk Tier Discounts */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Tiered Bulk Pricing</Text>
            <View style={styles.bulkTable}>
              <View style={styles.bulkRow}>
                <Text style={styles.bulkTier}>1 - 50 {unit}</Text>
                <Text style={styles.bulkPrice}>Rs. {product.pricePerUnit} /{unit}</Text>
              </View>
              <View style={styles.bulkRow}>
                <Text style={styles.bulkTier}>50 - 200 {unit}</Text>
                <Text style={styles.bulkPrice}>
                  Rs. {Math.round(product.pricePerUnit * 0.95)} /{unit}{' '}
                  <Text style={styles.discountText}>(-5%)</Text>
                </Text>
              </View>
              <View style={[styles.bulkRow, styles.bulkRowLast]}>
                <Text style={styles.bulkTier}>200+ {unit}</Text>
                <Text style={styles.bulkPrice}>
                  Rs. {Math.round(product.pricePerUnit * 0.9)} /{unit}{' '}
                  <Text style={styles.discountText}>(-10%)</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.qtySelector}>
          <Pressable
            style={[styles.qtyBtn, selectedQty <= minQty && styles.qtyBtnDisabled]}
            onPress={handleDecrement}>
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyValue}>{selectedQty}</Text>
            <Text style={styles.qtyUnit}>{unit}</Text>
          </View>
          <Pressable
            style={[styles.qtyBtn, selectedQty >= maxQty && styles.qtyBtnDisabled]}
            onPress={handleIncrement}>
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>

        {/* Add to Cart button */}
        <Pressable
          style={[styles.addToCartDetailBtn, addedToCartToast && styles.addToCartDetailBtnSuccess]}
          onPress={handleAddToCartPress}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={addedToCartToast ? '#16A34A' : '#2E7D32'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <Path d="M3 6h18" />
            <Path d="M16 10a4 4 0 0 1-8 0" />
          </Svg>
          <Text style={[styles.addToCartDetailBtnText, addedToCartToast && styles.addToCartDetailBtnTextSuccess]}>
            {addedToCartToast ? 'Added!' : '+ Cart'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.orderBtn}
          onPress={() => onOrderNow?.(product, selectedQty)}>
          <View style={styles.orderBtnContent}>
            <Text style={styles.orderBtnLabel}>Order Now</Text>
            <Text style={styles.orderBtnPrice}>Rs. {totalPrice.toLocaleString()}</Text>
          </View>
        </Pressable>
      </View>

      {/* Fullscreen Image Gallery Modal */}
      <ImageGalleryModal
        visible={showGallery}
        images={productImages}
        onClose={() => setShowGallery(false)}
      />

      {/* Price Trends & Wholesale Comparison Modal */}
      <Modal
        visible={showPriceTrends}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowPriceTrends(false)}>
        <PriceTrendsModal
          product={product}
          onBack={() => setShowPriceTrends(false)}
          onOrderNow={() => {
            setShowPriceTrends(false);
            onOrderNow?.(product, selectedQty);
          }}
        />
      </Modal>

      {/* "Saved to Wishlist!" Confirmation Modal */}
      <SavedToWishlistModal
        visible={showSavedWishlistModal}
        productTitle={product.title}
        onClose={() => setShowSavedWishlistModal(false)}
        onViewWishlist={() => {
          setShowSavedWishlistModal(false);
          onOpenWishlist?.();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  galleryBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  galleryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  imageBadgesRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  organicBadge: {
    backgroundColor: '#166534',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  organicBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  freshBadge: {
    backgroundColor: '#2E7D32',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  freshBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  locationLink: {
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  mapLinkText: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E7D32',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceUnit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  // Price trends card button
  priceTrendsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  priceTrendsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  trendIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceTrendsHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  priceTrendsSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  viewTrendsBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewTrendsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // Reviews Summary Card
  reviewsSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  reviewsSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bigRatingText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B45309',
  },
  starsGroup: {
    justifyContent: 'center',
  },
  starIcons: {
    fontSize: 12,
    color: '#F59E0B',
  },
  reviewCountText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  reviewsSummaryRight: {
    alignItems: 'flex-end',
  },
  readReviewsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  shortcutBtnText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  readMoreLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 6,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  farmerAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  farmerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  farmerAvatarText: {
    fontSize: 22,
  },
  farmerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  farmerLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  farmerMapLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 3,
  },
  chatFarmerBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chatFarmerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  bulkTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bulkRowLast: {
    borderBottomWidth: 0,
  },
  bulkTier: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  bulkPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountText: {
    color: '#166534',
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  qtyBtn: {
    width: 38,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.3,
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  qtyDisplay: {
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 50,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  qtyUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  orderBtn: {
    flex: 1,
    backgroundColor: '#2E7D32',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  orderBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderBtnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  orderBtnPrice: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  topNavCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
  topNavCartBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addToCartDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  addToCartDetailBtnSuccess: {
    backgroundColor: '#BBF7D0',
  },
  addToCartDetailBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  addToCartDetailBtnTextSuccess: {
    color: '#15803D',
  },
});
