import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { useCart, CartItem } from '@/context/cart-context';

interface CartScreenProps {
  onBack: () => void;
  onSelectProduct?: (produceId: string) => void;
  onExploreMarketplace?: () => void;
  onProceedToCheckout?: () => void;
}

export function CartScreen({
  onBack,
  onSelectProduct,
  onExploreMarketplace,
  onProceedToCheckout,
}: CartScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    items,
    distinctCount,
    totalCount,
    subtotal,
    deliveryFee,
    discount,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const handleCheckoutPress = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items to your cart before proceeding to checkout.');
      return;
    }
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      setShowCheckoutModal(true);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.navTitleCenter}>
          <Text style={styles.navTitle}>
            My Cart <Text style={styles.navCount}>({distinctCount} {distinctCount === 1 ? 'item' : 'items'})</Text>
          </Text>
        </View>

        {items.length > 0 ? (
          <Pressable onPress={handleClearAll} hitSlop={10} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {items.length === 0 ? (
        /* Empty Cart State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse fresh harvest straight from Sri Lankan farms and add your favorites to your cart.
          </Text>
          <Pressable
            style={styles.exploreBtn}
            onPress={onExploreMarketplace || onBack}>
            <Text style={styles.exploreBtnText}>Start Shopping Fresh</Text>
          </Pressable>
        </View>
      ) : (
        /* Populated Cart Content */
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Delivery Assurance Notice */}
            <View style={styles.assuranceBanner}>
              <View style={styles.assuranceIcon}>
                <Text style={{ fontSize: 16 }}>🚚</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assuranceTitle}>Direct Farm Dispatch</Text>
                <Text style={styles.assuranceSub}>
                  Harvested fresh and packed directly by verified local growers.
                </Text>
              </View>
            </View>

            {/* List of Cart Items */}
            <View style={styles.itemsList}>
              {items.map((item: CartItem) => {
                const lineTotal = item.pricePerUnit * item.quantity;
                return (
                  <View key={item.id} style={styles.cartCard}>
                    {/* Thumbnail */}
                    <Pressable
                      style={styles.cardImageWrapper}
                      onPress={() => onSelectProduct?.(item.id)}>
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.cardImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.cardImage, styles.placeholderImage]}>
                          <Text style={{ fontSize: 24 }}>🌱</Text>
                        </View>
                      )}
                      {item.isOrganic && (
                        <View style={styles.organicTag}>
                          <Text style={styles.organicTagText}>Organic</Text>
                        </View>
                      )}
                    </Pressable>

                    {/* Details */}
                    <View style={styles.cardDetails}>
                      <View style={styles.cardHeaderRow}>
                        <Pressable
                          style={{ flex: 1 }}
                          onPress={() => onSelectProduct?.(item.id)}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.cardFarmer} numberOfLines={1}>
                            🧑‍🌾 {item.farmerName}
                            {item.locationCity || item.locationDistrict
                              ? ` • ${item.locationCity || item.locationDistrict}`
                              : ''}
                          </Text>
                        </Pressable>

                        {/* Remove item button */}
                        <Pressable
                          onPress={() => removeFromCart(item.id)}
                          hitSlop={8}
                          style={styles.trashBtn}>
                          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                          </Svg>
                        </Pressable>
                      </View>

                      {/* Price & Quantity Stepper */}
                      <View style={styles.cardBottomRow}>
                        <View>
                          <Text style={styles.unitPrice}>
                            Rs. {item.pricePerUnit.toLocaleString()}
                            <Text style={styles.unitPriceSub}> /{item.unit}</Text>
                          </Text>
                          <Text style={styles.lineTotal}>
                            Total: Rs. {lineTotal.toLocaleString()}
                          </Text>
                        </View>

                        {/* Stepper */}
                        <View style={styles.stepperContainer}>
                          <Pressable
                            style={styles.stepperBtn}
                            onPress={() => updateQuantity(item.id, -1)}>
                            <Text style={styles.stepperBtnText}>−</Text>
                          </Pressable>

                          <View style={styles.stepperQtyBox}>
                            <Text style={styles.stepperQtyText}>{item.quantity}</Text>
                            <Text style={styles.stepperUnitText}>{item.unit}</Text>
                          </View>

                          <Pressable
                            style={styles.stepperBtn}
                            onPress={() => updateQuantity(item.id, 1)}>
                            <Text style={styles.stepperBtnText}>+</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Price Breakdown / Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryHeader}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Items Subtotal ({totalCount} {totalCount === 1 ? 'unit' : 'units'})
                </Text>
                <Text style={styles.summaryVal}>Rs. {subtotal.toLocaleString()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Direct Farm Delivery</Text>
                <Text style={[styles.summaryVal, deliveryFee === 0 && styles.freeDeliveryText]}>
                  {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                </Text>
              </View>

              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discountLabel]}>
                    Farm Direct Bulk Reward
                  </Text>
                  <Text style={[styles.summaryVal, styles.discountVal]}>
                    - Rs. {discount.toLocaleString()}
                  </Text>
                </View>
              )}

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalVal}>Rs. {totalAmount.toLocaleString()}</Text>
              </View>
            </View>

            {/* Extra padding for floating bottom button */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky Checkout Bottom Bar (Figma E-commerce Style) */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.bottomPriceCol}>
              <Text style={styles.bottomTotalLabel}>Total Amount</Text>
              <Text style={styles.bottomTotalAmount}>
                Rs. {totalAmount.toLocaleString()}
              </Text>
            </View>

            {/* Required Checkout Button */}
            <Pressable
              style={styles.checkoutBtn}
              onPress={handleCheckoutPress}>
              <Text style={styles.checkoutBtnText}>Checkout</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M12 5l7 7-7 7" />
              </Svg>
            </Pressable>
          </View>
        </View>
      )}

      {/* Checkout Notice Modal (No need to implement backend function) */}
      <Modal
        visible={showCheckoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCheckoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>

            <Text style={styles.modalTitle}>Order Checkout</Text>
            <Text style={styles.modalDesc}>
              Ready to checkout {totalCount} items from your cart!
            </Text>

            <View style={styles.modalReceiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Total Amount:</Text>
                <Text style={styles.receiptValue}>Rs. {totalAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Items:</Text>
                <Text style={styles.receiptValue}>{distinctCount} products ({totalCount} units)</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery:</Text>
                <Text style={styles.receiptValue}>Direct from Farm</Text>
              </View>
            </View>

            <Text style={styles.modalNote}>
              Note: Checkout flow button is configured and ready. Payment gateway and delivery scheduling can be wired when ready.
            </Text>

            <Pressable
              style={styles.modalDoneBtn}
              onPress={() => setShowCheckoutModal(false)}>
              <Text style={styles.modalDoneBtnText}>Got it, Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  topNav: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitleCenter: {
    flex: 1,
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
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  assuranceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  assuranceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assuranceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  assuranceSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  itemsList: {
    gap: 12,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardImageWrapper: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  organicTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  organicTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardFarmer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  trashBtn: {
    padding: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  unitPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  unitPriceSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  lineTotal: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepperQtyBox: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  stepperQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepperUnitText: {
    fontSize: 9,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  freeDeliveryText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  discountLabel: {
    color: '#16A34A',
  },
  discountVal: {
    color: '#16A34A',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2E7D32',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceCol: {
    gap: 2,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2E7D32',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalSuccessIcon: {
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
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalReceiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  modalDoneBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
