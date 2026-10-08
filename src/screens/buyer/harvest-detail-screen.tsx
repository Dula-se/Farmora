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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { HarvestItem, HarvestService } from '@/services/harvest-service';
import { StripePaymentModal } from './stripe-payment-modal';

interface HarvestDetailScreenProps {
  harvest: HarvestItem;
  onBack: () => void;
  onContactFarmer?: (farmerId: string, farmerName: string) => void;
  onPreOrderSuccess?: (harvest: HarvestItem) => void;
}

export function HarvestDetailScreen({
  harvest: initialHarvest,
  onBack,
  onContactFarmer,
  onPreOrderSuccess,
}: HarvestDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [harvest, setHarvest] = useState<HarvestItem>(initialHarvest);
  const [orderKg, setOrderKg] = useState<number>(initialHarvest.minPreOrderQty || 50);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastPaymentIntent, setLastPaymentIntent] = useState<string>('');

  const remainingKg = Math.max(0, harvest.estimatedYieldKg - harvest.reservedYieldKg);
  const minQty = harvest.minPreOrderQty || 10;

  // Financial calculations
  const totalBatchPrice = orderKg * harvest.preOrderPricePerKg;
  const depositAmount = Math.round((totalBatchPrice * harvest.depositPercent) / 100);
  const remainingBalance = totalBatchPrice - depositAmount;
  const marketEstimatedPrice = orderKg * harvest.marketPricePerKg;
  const savings = Math.max(0, marketEstimatedPrice - totalBatchPrice);

  const handleAdjustQty = (delta: number) => {
    setOrderKg((prev) => {
      const next = prev + delta;
      if (next < minQty) return minQty;
      if (next > remainingKg) return remainingKg;
      return next;
    });
  };

  const handleSetQuickQty = (qty: number) => {
    if (qty > remainingKg) {
      setOrderKg(remainingKg);
    } else if (qty < minQty) {
      setOrderKg(minQty);
    } else {
      setOrderKg(qty);
    }
  };

  const handleBookPress = () => {
    if (remainingKg <= 0) {
      Alert.alert('Fully Booked', 'This harvest batch is 100% reserved.');
      return;
    }
    if (orderKg < minQty) {
      Alert.alert('Minimum Order', `Minimum pre-order quantity is ${minQty} kg.`);
      return;
    }
    setShowStripeModal(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setShowStripeModal(false);
    setLastPaymentIntent(paymentIntentId);

    try {
      const updated = await HarvestService.preOrderHarvest(harvest.id, {
        quantityKg: orderKg,
        depositAmount,
        totalAmount: totalBatchPrice,
        stripePaymentIntentId: paymentIntentId,
      });

      setHarvest(updated);
      setShowSuccessModal(true);
      onPreOrderSuccess?.(updated);
    } catch (e: any) {
      Alert.alert('Booking Error', e?.message || 'Could not finalize pre-order reservation.');
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

        <Text style={styles.navTitle}>Harvest Pre-Order</Text>

        <Pressable
          onPress={() => onContactFarmer?.(harvest.farmerId, harvest.farmerName)}
          hitSlop={12}
          style={styles.chatNavBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2}>
            <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: harvest.image }} style={styles.heroImg} contentFit="cover" />
          <View style={styles.countdownTag}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5}>
              <Circle cx={12} cy={12} r={10} />
              <Path d="M12 6v6l4 2" />
            </Svg>
            <Text style={styles.countdownTagText}>
              Harvest Expected: {harvest.expectedHarvestDate}
            </Text>
          </View>
        </View>

        {/* Title & Farmer Row */}
        <View style={styles.infoCard}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{harvest.category}</Text>
            </View>
            <View style={styles.organicBadge}>
              <Text style={styles.organicBadgeText}>100% Organically Farmed</Text>
            </View>
          </View>

          <Text style={styles.cropTitle}>{harvest.cropName}</Text>
          <Text style={styles.varietySubtitle}>{harvest.variety} • {harvest.locationDistrict}</Text>

          {/* Farmer Card */}
          <View style={styles.farmerBox}>
            <Image source={{ uri: harvest.farmerAvatar }} style={styles.farmerAvatar} />
            <View style={styles.farmerDetails}>
              <Text style={styles.farmerName}>{harvest.farmerName}</Text>
              <Text style={styles.farmerFarm}>{harvest.farmerFarm}</Text>
              <Text style={styles.farmerLocation}>{harvest.farmAddress || harvest.locationDistrict}</Text>
            </View>
            <Pressable
              style={styles.contactBtn}
              onPress={() => onContactFarmer?.(harvest.farmerId, harvest.farmerName)}
            >
              <Text style={styles.contactBtnText}>Message</Text>
            </Pressable>
          </View>

          {/* Field Notes */}
          {harvest.fieldNotes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Farmer Field Notes</Text>
              <Text style={styles.notesContent}>{harvest.fieldNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Yield Allocation Progress */}
        <View style={styles.yieldCard}>
          <Text style={styles.sectionHeading}>Batch Yield Allocation</Text>

          <View style={styles.yieldNumbersRow}>
            <View>
              <Text style={styles.yieldVal}>{harvest.reservedYieldKg.toLocaleString()} kg</Text>
              <Text style={styles.yieldSub}>Reserved by Buyers</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.yieldValGreen}>{remainingKg.toLocaleString()} kg</Text>
              <Text style={styles.yieldSub}>Available for Pre-Order</Text>
            </View>
          </View>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, Math.round((harvest.reservedYieldKg / harvest.estimatedYieldKg) * 100))}%` },
              ]}
            />
          </View>
          <Text style={styles.totalBatchNote}>
            Total Projected Yield: {harvest.estimatedYieldKg.toLocaleString()} kg
          </Text>
        </View>

        {/* Pre-Order Calculator */}
        <View style={styles.calcCard}>
          <Text style={styles.sectionHeading}>Pre-Order Quantity</Text>
          <Text style={styles.calcHelper}>
            Min. order {minQty} kg • Available: {remainingKg} kg
          </Text>

          {/* Counter Control */}
          <View style={styles.counterRow}>
            <Pressable style={styles.counterBtn} onPress={() => handleAdjustQty(-25)}>
              <Text style={styles.counterBtnText}>-25</Text>
            </Pressable>

            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyDisplayText}>{orderKg}</Text>
              <Text style={styles.qtyUnitText}>kg</Text>
            </View>

            <Pressable style={styles.counterBtn} onPress={() => handleAdjustQty(25)}>
              <Text style={styles.counterBtnText}>+25</Text>
            </Pressable>
          </View>

          {/* Quick Choice Chips */}
          <View style={styles.chipsRow}>
            {[50, 100, 250, 500].map((chip) => (
              <Pressable
                key={chip}
                style={[styles.chip, orderKg === chip && styles.chipActive]}
                onPress={() => handleSetQuickQty(chip)}
              >
                <Text style={[styles.chipText, orderKg === chip && styles.chipTextActive]}>
                  {chip} kg
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Payment Breakdown Card */}
          <View style={styles.breakdownBox}>
            <View style={styles.breakRow}>
              <Text style={styles.breakLabel}>Pre-Order Rate</Text>
              <Text style={styles.breakVal}>Rs. {harvest.preOrderPricePerKg} / kg</Text>
            </View>

            <View style={styles.breakRow}>
              <Text style={styles.breakLabel}>Total Batch Price ({orderKg} kg)</Text>
              <Text style={styles.breakVal}>Rs. {totalBatchPrice.toLocaleString()}</Text>
            </View>

            <View style={styles.breakRowHighlight}>
              <View>
                <Text style={styles.depositLabel}>Deposit Required ({harvest.depositPercent}%)</Text>
                <Text style={styles.depositSub}>Pay now via Stripe to lock in batch</Text>
              </View>
              <Text style={styles.depositVal}>Rs. {depositAmount.toLocaleString()}</Text>
            </View>

            <View style={styles.breakRow}>
              <Text style={styles.breakLabel}>Balance upon Harvest Dispatch</Text>
              <Text style={styles.breakVal}>Rs. {remainingBalance.toLocaleString()}</Text>
            </View>

            {savings > 0 && (
              <View style={styles.savingsBanner}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={2}>
                  <Path d="M20 6L9 17l-5-5" />
                </Svg>
                <Text style={styles.savingsBannerText}>
                  You save estimated Rs. {savings.toLocaleString()} vs spot retail market!
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomDepositLabel}>Deposit Due Now</Text>
          <Text style={styles.bottomDepositVal}>Rs. {depositAmount.toLocaleString()}</Text>
        </View>

        <Pressable
          style={[styles.payDepositBtn, remainingKg <= 0 && styles.btnDisabled]}
          onPress={handleBookPress}
          disabled={remainingKg <= 0}
        >
          <Text style={styles.payDepositBtnText}>
            {remainingKg <= 0 ? 'Fully Booked' : `Pay Deposit & Reserve`}
          </Text>
        </Pressable>
      </View>

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={depositAmount}
        paymentType="harvest_deposit"
        title="Harvest Deposit Checkout"
        description={`${harvest.depositPercent}% advance deposit for ${orderKg}kg of ${harvest.cropName}`}
        onClose={() => setShowStripeModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Pre-Order Confirmed Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.successBox}>
            <View style={styles.checkCircle}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>

            <Text style={styles.successTitle}>Pre-Order Confirmed!</Text>
            <Text style={styles.successDesc}>
              Your deposit of Rs. {depositAmount.toLocaleString()} has been received via Stripe. Your batch of {orderKg} kg is reserved for harvest on {harvest.expectedHarvestDate}.
            </Text>

            <View style={styles.receiptMini}>
              <View style={styles.receiptMiniRow}>
                <Text style={styles.receiptMiniLabel}>Reserved Batch</Text>
                <Text style={styles.receiptMiniVal}>{orderKg} kg</Text>
              </View>
              <View style={styles.receiptMiniRow}>
                <Text style={styles.receiptMiniLabel}>Deposit Paid</Text>
                <Text style={styles.receiptMiniValGreen}>Rs. {depositAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.receiptMiniRow}>
                <Text style={styles.receiptMiniLabel}>Remaining on Dispatch</Text>
                <Text style={styles.receiptMiniVal}>Rs. {remainingBalance.toLocaleString()}</Text>
              </View>
            </View>

            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                setShowSuccessModal(false);
                onBack();
              }}
            >
              <Text style={styles.doneBtnText}>Return to Schedule</Text>
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
  chatNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
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
  },
  heroWrapper: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  countdownTag: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  organicBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  organicBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  cropTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  varietySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  farmerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CBD5E1',
    marginRight: 12,
  },
  farmerDetails: {
    flex: 1,
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  farmerFarm: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  farmerLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  contactBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  notesBox: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 12.5,
    color: '#713F12',
    lineHeight: 18,
  },
  yieldCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  yieldNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  yieldVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  yieldValGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2E7D32',
  },
  yieldSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  track: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 6,
  },
  fill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 5,
  },
  totalBatchNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  calcCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    marginTop: 10,
  },
  calcHelper: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 14,
  },
  counterBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  qtyDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
    gap: 4,
  },
  qtyDisplayText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#15803D',
  },
  qtyUnitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  breakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  breakLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  breakVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 10,
    marginVertical: 8,
  },
  depositLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
  },
  depositSub: {
    fontSize: 10.5,
    color: '#166534',
  },
  depositVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#14532D',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  savingsBannerText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '700',
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
  bottomLeft: {
    flex: 1,
  },
  bottomDepositLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomDepositVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2E7D32',
  },
  payDepositBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },
  payDepositBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  successDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  receiptMini: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptMiniLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptMiniVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  receiptMiniValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
