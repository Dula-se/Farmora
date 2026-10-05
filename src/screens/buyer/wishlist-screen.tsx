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

export interface WishlistItem {
  id: string;
  produceId: string;
  title: string;
  pricePerUnit: number;
  unit: string;
  farmerName: string;
  locationCity: string;
  image: string;
  inStock: boolean;
  category: string;
  organic: boolean;
}

const DEFAULT_WISHLIST_ITEMS: WishlistItem[] = [
  {
    id: 'w-1',
    produceId: 'p-1',
    title: 'Organic Red Tomatoes',
    pricePerUnit: 240,
    unit: 'kg',
    farmerName: 'Perera Organic Farm',
    locationCity: 'Kandy',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    category: 'Vegetables',
    organic: true,
  },
  {
    id: 'w-2',
    produceId: 'p-2',
    title: 'Organic Carrots',
    pricePerUnit: 280,
    unit: 'kg',
    farmerName: 'Highland Fresh Fields',
    locationCity: 'Nuwara Eliya',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    category: 'Vegetables',
    organic: true,
  },
  {
    id: 'w-3',
    produceId: 'p-3',
    title: 'King Coconut',
    pricePerUnit: 140,
    unit: 'unit',
    farmerName: 'Silva Coconut Groves',
    locationCity: 'Kurunegala',
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=60',
    inStock: false,
    category: 'Fruits',
    organic: false,
  },
  {
    id: 'w-4',
    produceId: 'p-4',
    title: 'Fresh Keeramin Pepper',
    pricePerUnit: 450,
    unit: 'kg',
    farmerName: 'Matale Spice Garden',
    locationCity: 'Matale',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    category: 'Spices',
    organic: true,
  },
];

interface WishlistScreenProps {
  onBack: () => void;
  onSelectProduct?: (produceId: string) => void;
  onAddToCart?: (item: WishlistItem) => void;
}

export function WishlistScreen({
  onBack,
  onSelectProduct,
  onAddToCart,
}: WishlistScreenProps) {
  const [items, setItems] = useState<WishlistItem[]>(DEFAULT_WISHLIST_ITEMS);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [addedItemTitle, setAddedItemTitle] = useState('');

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddToCart = (item: WishlistItem) => {
    setAddedItemTitle(item.title);
    setShowAddedModal(true);
    onAddToCart?.(item);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header matching Figma Screen 7 */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.navTitleCenter}>
          <Text style={styles.navTitle}>
            My Wishlist <Text style={styles.navCount}>({items.length} items)</Text>
          </Text>
        </View>

        <Pressable hitSlop={12} style={styles.navBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>
              Explore fresh farm produce and save your favorites here.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={onBack}>
              <Text style={styles.emptyBtnText}>Explore Marketplace</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => onSelectProduct?.(item.produceId)}>
                {/* Product Thumbnail */}
                <View style={styles.imageBox}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.thumbnail}
                    contentFit="cover"
                  />
                  {item.organic && (
                    <View style={styles.organicMiniBadge}>
                      <Text style={styles.organicMiniText}>🌱</Text>
                    </View>
                  )}
                </View>

                {/* Info Container */}
                <View style={styles.cardInfo}>
                  <View style={styles.cardRowTop}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Pressable
                      hitSlop={8}
                      onPress={() => handleRemove(item.id)}
                      style={styles.trashBtn}>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </Svg>
                    </Pressable>
                  </View>

                  <Text style={styles.farmerSubtext}>
                    {item.farmerName} • {item.locationCity}
                  </Text>

                  {/* Stock Status */}
                  <View style={styles.stockRow}>
                    <View
                      style={[
                        styles.stockBadge,
                        item.inStock ? styles.stockIn : styles.stockOut,
                      ]}>
                      <Text
                        style={[
                          styles.stockBadgeText,
                          item.inStock ? styles.stockInText : styles.stockOutText,
                        ]}>
                        {item.inStock ? '● In Stock' : '○ Out of Stock'}
                      </Text>
                    </View>
                  </View>

                  {/* Price & Add to Cart button */}
                  <View style={styles.cardRowBottom}>
                    <View>
                      <Text style={styles.priceText}>
                        Rs. {item.pricePerUnit}
                        <Text style={styles.unitText}> /{item.unit}</Text>
                      </Text>
                    </View>

                    <Pressable
                      style={[
                        styles.addToCartBtn,
                        !item.inStock && styles.addToCartDisabled,
                      ]}
                      disabled={!item.inStock}
                      onPress={() => handleAddToCart(item)}>
                      <Text style={styles.addToCartText}>+ Add to Cart</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* "Saved to Wishlist!" Confirmation Modal (Matching Figma Screen 6) */}
      <Modal
        visible={showAddedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Green Checkmark Circle using pure Path */}
            <View style={styles.checkCircle}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>

            <Text style={styles.modalTitle}>Added to Cart!</Text>
            <Text style={styles.modalMessage}>
              {addedItemTitle || 'Item'} has been successfully added to your active cart.
            </Text>

            <Pressable
              style={styles.modalPrimaryBtn}
              onPress={() => setShowAddedModal(false)}>
              <Text style={styles.modalPrimaryBtnText}>Continue Browsing</Text>
            </Pressable>

            <Pressable
              style={styles.modalSecondaryBtn}
              onPress={() => {
                setShowAddedModal(false);
              }}>
              <Text style={styles.modalSecondaryBtnText}>View My Cart</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Standalone Modal for "Saved to Wishlist!" confirmation when clicked from Product Detail
interface SavedToWishlistModalProps {
  visible: boolean;
  productTitle: string;
  onClose: () => void;
  onViewWishlist: () => void;
}

export function SavedToWishlistModal({
  visible,
  productTitle,
  onClose,
  onViewWishlist,
}: SavedToWishlistModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.checkCircle}>
            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          </View>

          <Text style={styles.modalTitle}>Saved to Wishlist!</Text>
          <Text style={styles.modalMessage}>
            <Text style={{ fontWeight: '700' }}>{productTitle}</Text> has been saved to your personal wishlist.
          </Text>

          <Pressable style={styles.modalPrimaryBtn} onPress={onClose}>
            <Text style={styles.modalPrimaryBtnText}>Continue Browsing</Text>
          </Pressable>

          <Pressable style={styles.modalSecondaryBtn} onPress={onViewWishlist}>
            <Text style={styles.modalSecondaryBtnText}>View Wishlist</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
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
  navTitleCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  navCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 14,
  },
  card: {
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
  imageBox: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  organicMiniBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(22, 101, 52, 0.85)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  organicMiniText: {
    fontSize: 10,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  trashBtn: {
    padding: 2,
  },
  farmerSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stockRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockIn: {
    backgroundColor: '#DCFCE7',
  },
  stockOut: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockInText: {
    color: '#15803D',
  },
  stockOutText: {
    color: '#B91C1C',
  },
  cardRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  addToCartBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addToCartDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // Modal Styles matching Figma Screen 6
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalPrimaryBtn: {
    backgroundColor: '#2E7D32',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSecondaryBtn: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSecondaryBtnText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '700',
  },
});
