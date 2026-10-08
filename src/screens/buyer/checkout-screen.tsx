import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useCart, CartItem } from '@/context/cart-context';
import { OrderService, OrderItem, FarmoraOrder } from '@/services/order-service';
import { getStoredUser } from '@/services/api';
import { StripePaymentModal } from './stripe-payment-modal';

interface CheckoutScreenProps {
  onBack: () => void;
  onOrderSuccess: (order: FarmoraOrder) => void;
  directItems?: OrderItem[]; // If buying directly from a product detail page
}

type DeliveryOptionType = 'standard' | 'express' | 'pickup';
type PaymentMethodType =
  | 'Stripe Card Payment'
  | 'Famora Escrow Pay'
  | 'Commercial Bank Transfer'
  | 'Cash on Delivery';

export function CheckoutScreen({ onBack, onOrderSuccess, directItems }: CheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const { items: cartItems, clearCart } = useCart();

  // Selected items: either direct items or cart items
  const items: OrderItem[] = directItems && directItems.length > 0
    ? directItems
    : cartItems.map((c) => ({
        produceId: c.id,
        produceTitle: c.title,
        quantity: c.quantity,
        unit: c.unit || 'kg',
        unitPrice: c.pricePerUnit,
        totalPrice: c.pricePerUnit * c.quantity,
        image: c.image,
      }));

  // Delivery Option State
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOptionType>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Stripe Card Payment');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address
  const [address, setAddress] = useState({
    recipient: 'Sunil Dissanayake',
    phone: '+94 77 123 4567',
    street: 'No. 42, Temple Road',
    city: 'Nawala, Rajagiriya',
    district: 'Colombo District',
    postalCode: '10107',
  });

  // Calculate pricing
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryCost =
    deliveryOption === 'standard' ? 450 : deliveryOption === 'express' ? 850 : 0;
  const platformFee = 50;
  const totalAmount = subtotal + deliveryCost + platformFee;

  const handlePlaceOrderPress = () => {
    if (items.length === 0) {
      Alert.alert('Empty Order', 'Please select at least one produce item.');
      return;
    }

    if (paymentMethod === 'Stripe Card Payment') {
      setShowStripeModal(true);
    } else {
      processOrder();
    }
  };

  const processOrder = async (stripePaymentIntentId?: string) => {
    setIsSubmitting(true);
    try {
      const storedUser = await getStoredUser();
      const buyerId = storedUser?.id || storedUser?._id || 'buyer-sunil';

      const createdOrder = await OrderService.createNewOrder({
        buyerId,
        buyerName: address.recipient || storedUser?.fullName || 'Sunil Dissanayake',
        buyerPhone: address.phone || storedUser?.mobileNumber || '+94 77 123 4567',
        buyerLocation: `${address.street}, ${address.city}, ${address.district}`,
        farmerId: 'farmer-kusuma',
        farmerName: 'Kusuma Bandara',
        farmerFarm: 'Govigedara Highland Farm, Welimada',
        farmerPhone: '+94 71 890 1234',
        farmerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        items,
        subtotal,
        deliveryFee: deliveryCost,
        discount: 0,
        totalAmount,
        deliveryOption,
        paymentMethod,
        paymentStatus: stripePaymentIntentId
          ? 'Paid'
          : paymentMethod === 'Famora Escrow Pay'
          ? 'Escrow Secured'
          : 'Pending',
        stripePaymentIntentId,
        notes: deliveryInstructions.trim(),
      });

      // Clear cart if completed
      if (!directItems || directItems.length === 0) {
        clearCart();
      }

      setIsSubmitting(false);
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Checkout Error', err?.message || 'Could not finalize order.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <Text style={styles.navTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircleGreen}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2.2}>
                <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <Circle cx={12} cy={10} r={3} />
              </Svg>
            </View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          <View style={styles.addressBox}>
            <View style={styles.recipientRow}>
              <Text style={styles.recipientName}>{address.recipient}</Text>
              <View style={styles.badgeHome}>
                <Text style={styles.badgeHomeText}>DEFAULT</Text>
              </View>
            </View>
            <Text style={styles.addressLine}>{address.street}, {address.city}</Text>
            <Text style={styles.addressDistrict}>{address.district} ({address.postalCode})</Text>
            <Text style={styles.addressPhone}>Phone: {address.phone}</Text>
          </View>
        </View>

        {/* Delivery Options */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>

          {/* Standard Delivery */}
          <Pressable
            style={[styles.optionRow, deliveryOption === 'standard' && styles.optionRowActive]}
            onPress={() => setDeliveryOption('standard')}
          >
            <View style={styles.radioOuter}>
              {deliveryOption === 'standard' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Standard Delivery (1-2 Days)</Text>
              <Text style={styles.optionSub}>Direct insulated farm logistics</Text>
            </View>
            <Text style={styles.optionPrice}>Rs. 450</Text>
          </Pressable>

          {/* Express Delivery */}
          <Pressable
            style={[styles.optionRow, deliveryOption === 'express' && styles.optionRowActive]}
            onPress={() => setDeliveryOption('express')}
          >
            <View style={styles.radioOuter}>
              {deliveryOption === 'express' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Express Same-Day Priority</Text>
              <Text style={styles.optionSub}>Delivered within 4-6 hours</Text>
            </View>
            <Text style={styles.optionPrice}>Rs. 850</Text>
          </Pressable>

          {/* Farm Pickup */}
          <Pressable
            style={[styles.optionRow, deliveryOption === 'pickup' && styles.optionRowActive]}
            onPress={() => setDeliveryOption('pickup')}
          >
            <View style={styles.radioOuter}>
              {deliveryOption === 'pickup' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Self-Pickup at Farm Gate</Text>
              <Text style={styles.optionSub}>Meet farmer & inspect produce in person</Text>
            </View>
            <Text style={[styles.optionPrice, { color: '#16A34A' }]}>FREE</Text>
          </Pressable>
        </View>

        {/* Order Items Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Items in Order</Text>
            <Text style={styles.itemCountText}>{items.length} items</Text>
          </View>

          {items.map((item, idx) => (
            <View key={item.produceId || idx} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemThumb} contentFit="cover" />
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.produceTitle}</Text>
                <Text style={styles.itemQty}>{item.quantity} {item.unit} x Rs. {item.unitPrice}</Text>
              </View>
              <Text style={styles.itemTotal}>Rs. {item.totalPrice.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {/* Stripe Card */}
          <Pressable
            style={[styles.optionRow, paymentMethod === 'Stripe Card Payment' && styles.optionRowActive]}
            onPress={() => setPaymentMethod('Stripe Card Payment')}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'Stripe Card Payment' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionInfo}>
              <View style={styles.badgeStripeRow}>
                <Text style={styles.optionTitle}>Credit / Debit Card</Text>
                <View style={styles.stripeTag}>
                  <Text style={styles.stripeTagText}>STRIPE SECURE</Text>
                </View>
              </View>
              <Text style={styles.optionSub}>Visa, Mastercard, AMEX (Test Mode)</Text>
            </View>
          </Pressable>

          {/* Famora Escrow */}
          <Pressable
            style={[styles.optionRow, paymentMethod === 'Famora Escrow Pay' && styles.optionRowActive]}
            onPress={() => setPaymentMethod('Famora Escrow Pay')}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'Famora Escrow Pay' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionInfo}>
              <View style={styles.badgeStripeRow}>
                <Text style={styles.optionTitle}>Famora Escrow Pay</Text>
                <View style={styles.escrowTag}>
                  <Text style={styles.escrowTagText}>100% PROTECTED</Text>
                </View>
              </View>
              <Text style={styles.optionSub}>Released only after delivery confirmation</Text>
            </View>
          </Pressable>

          {/* Bank Transfer */}
          <Pressable
            style={[styles.optionRow, paymentMethod === 'Commercial Bank Transfer' && styles.optionRowActive]}
            onPress={() => setPaymentMethod('Commercial Bank Transfer')}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'Commercial Bank Transfer' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Direct Bank Transfer</Text>
              <Text style={styles.optionSub}>Commercial Bank of Ceylon / HNB</Text>
            </View>
          </Pressable>

          {/* Cash on Delivery */}
          <Pressable
            style={[styles.optionRow, paymentMethod === 'Cash on Delivery' && styles.optionRowActive]}
            onPress={() => setPaymentMethod('Cash on Delivery')}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'Cash on Delivery' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.optionSub}>Pay driver upon receiving goods</Text>
            </View>
          </Pressable>
        </View>

        {/* Note to Farmer */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={styles.instructionInput}
            placeholder="e.g. Call before arrival, leave at security gate..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={2}
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
          />
        </View>

        {/* Price Breakdown */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Price Details</Text>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Produce Subtotal</Text>
            <Text style={styles.calcValue}>Rs. {subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Delivery Fee</Text>
            <Text style={styles.calcValue}>
              {deliveryCost === 0 ? 'FREE' : `Rs. ${deliveryCost.toLocaleString()}`}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Famora Service & Escrow Fee</Text>
            <Text style={styles.calcValue}>Rs. {platformFee}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.calcRowTotal}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>Rs. {totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomTotalBox}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>Rs. {totalAmount.toLocaleString()}</Text>
        </View>

        <Pressable
          style={[styles.checkoutBtn, isSubmitting && styles.checkoutBtnDisabled]}
          onPress={handlePlaceOrderPress}
          disabled={isSubmitting}
        >
          <Text style={styles.checkoutBtnText}>
            {paymentMethod === 'Stripe Card Payment'
              ? 'Pay with Stripe'
              : 'Confirm & Place Order'}
          </Text>
        </Pressable>
      </View>

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={totalAmount}
        paymentType="order"
        title="Order Payment"
        description="Encrypted card checkout with Stripe"
        onClose={() => setShowStripeModal(false)}
        onSuccess={(paymentIntentId) => {
          setShowStripeModal(false);
          processOrder(paymentIntentId);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircleGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  itemCountText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeHome: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeHomeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  addressLine: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  addressDistrict: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  optionRowActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeStripeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stripeTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stripeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  escrowTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  escrowTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemQty: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  instructionInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  calcRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2E7D32',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  bottomTotalBox: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  checkoutBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
