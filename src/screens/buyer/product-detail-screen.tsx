import React, { useState } from 'react';
import {
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

interface ProductDetailScreenProps {
  product: ApiProduceItem;
  onBack: () => void;
  onOrderNow?: (product: ApiProduceItem, quantity: number) => void;
  onChatFarmer?: (farmerId: string) => void;
}

export function ProductDetailScreen({
  product,
  onBack,
  onOrderNow,
  onChatFarmer,
}: ProductDetailScreenProps) {
  const [selectedQty, setSelectedQty] = useState(product.minimumOrderQuantity || 10);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

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

  const totalPrice = selectedQty * product.pricePerUnit;

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
          <Pressable
            onPress={() => setIsFavorite(!isFavorite)}
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
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.images && product.images[0] ? (
            <Image
              source={{ uri: product.images[0] }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderBox]}>
              <Text style={styles.placeholderEmoji}>🌱</Text>
            </View>
          )}

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
        </View>

        <View style={styles.bodyContent}>
          {/* Title & Price Header */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.productTitle}>{product.title}</Text>
              <Text style={styles.locationText}>
                📍 {product.locationCity}, {product.locationDistrict}
              </Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>
                <Text style={styles.currencySymbol}>Rs. </Text>
                {product.pricePerUnit}
              </Text>
              <Text style={styles.priceUnit}>per {unit}</Text>
            </View>
          </View>

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

          {/* Farmer Card */}
          <View style={styles.farmerCard}>
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
              <Text style={styles.farmerRating}>★ 4.9 (124 Orders completed)</Text>
            </View>

            {onChatFarmer && (
              <Pressable
                style={styles.chatFarmerBtn}
                onPress={() => onChatFarmer(String(product.farmerId))}>
                <Text style={styles.chatFarmerBtnText}>Chat</Text>
              </Pressable>
            )}
          </View>

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

        <Pressable
          style={styles.orderBtn}
          onPress={() => onOrderNow?.(product, selectedQty)}>
          <View style={styles.orderBtnContent}>
            <Text style={styles.orderBtnLabel}>Order Now</Text>
            <Text style={styles.orderBtnPrice}>Rs. {totalPrice.toLocaleString()}</Text>
          </View>
        </Pressable>
      </View>
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
  placeholderBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  freshBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bodyContent: {
    padding: 20,
    gap: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#166534',
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceUnit: {
    fontSize: 12,
    color: '#64748B',
  },
  specsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    gap: 8,
  },
  specBox: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'center',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  readMoreLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
    marginTop: 2,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  farmerAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  farmerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  farmerAvatarText: {
    fontSize: 20,
  },
  farmerDetails: {
    flex: 1,
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
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  farmerLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  farmerRating: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  chatFarmerBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  chatFarmerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  bulkTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bulkRowLast: {
    borderBottomWidth: 0,
  },
  bulkTier: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  bulkPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountText: {
    color: '#16A34A',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 6,
    height: 50,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  qtyDisplay: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  qtyUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  orderBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#386641',
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  orderBtnContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBtnLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  orderBtnPrice: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
