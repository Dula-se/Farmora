import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FarmoraOrder } from '@/services/order-service';

interface OrderSuccessScreenProps {
  order: FarmoraOrder;
  onTrackOrder: (orderId: string) => void;
  onHomePress: () => void;
}

export function OrderSuccessScreen({
  order,
  onTrackOrder,
  onHomePress,
}: OrderSuccessScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Animated-style Checkmark Hero */}
        <View style={styles.heroBox}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
          </View>

          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subTitle}>
            Your order has been placed directly with the farm. You can track real-time dispatch and delivery below.
          </Text>
        </View>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptTopRow}>
            <View>
              <Text style={styles.receiptLabel}>Order Number</Text>
              <Text style={styles.receiptOrderNum}>{order.orderNumber || `#${order.id}`}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>CONFIRMED</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.valGreen}>Rs. {order.totalAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.val}>{order.paymentMethod}</Text>
          </View>

          {order.stripePaymentIntentId && (
            <View style={styles.row}>
              <Text style={styles.label}>Stripe Reference</Text>
              <Text style={styles.valMono} numberOfLines={1}>
                {order.stripePaymentIntentId}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Estimated Delivery</Text>
            <Text style={styles.val}>{order.expectedDelivery || 'Tomorrow afternoon'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Farm Origin</Text>
            <Text style={styles.val}>{order.farmerFarm || 'Green Haven Organics'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.securityNote}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={2}>
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <Text style={styles.securityNoteText}>
              Protected by Famora Escrow Guarantee. Funds released only when goods pass delivery inspection.
            </Text>
          </View>
        </View>

        {/* Delivery Handover PIN Info Card */}
        <View style={styles.pinCard}>
          <Text style={styles.pinCardTitle}>Delivery Verification PIN</Text>
          <Text style={styles.pinCardDesc}>
            Keep this 4-digit PIN ready to provide to the driver upon handover:
          </Text>
          <View style={styles.pinBox}>
            <Text style={styles.pinCode}>{order.securityPin || '4821'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Pressable
          style={styles.trackBtn}
          onPress={() => onTrackOrder(order.id || order._id || 'ord-1')}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 8 }}>
            <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </Svg>
          <Text style={styles.trackBtnText}>Track Order Live</Text>
        </Pressable>

        <Pressable style={styles.homeBtn} onPress={onHomePress}>
          <Text style={styles.homeBtnText}>Return to Marketplace</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  outerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  innerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  receiptOrderNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: '#64748B',
  },
  val: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  valGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
  },
  valMono: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#475569',
    maxWidth: 160,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 16,
  },
  pinCard: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  pinCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 4,
  },
  pinCardDesc: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 10,
  },
  pinBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  pinCode: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#1E3A8A',
  },
  trackBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  homeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
});
