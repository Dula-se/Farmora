import React, { useState, useEffect } from 'react';
import {
  Alert,
  Linking,
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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { OrderService, FarmoraOrder, OrderStatus } from '@/services/order-service';

interface OrderTrackingScreenProps {
  orderId: string;
  onBack: () => void;
  onChatWithFarmer?: (farmerId: string, farmerName: string) => void;
}

const STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'Pending Dispatch', label: 'Order Placed', desc: 'Received & sent to farm' },
  { key: 'Packed', label: 'Produce Harvested & Packed', desc: 'Inspected for export freshness' },
  { key: 'Dispatched', label: 'Out for Delivery', desc: 'En route with temperature control' },
  { key: 'Delivered', label: 'Delivered & Completed', desc: 'Securely handed over' },
];

export function OrderTrackingScreen({
  orderId,
  onBack,
  onChatWithFarmer,
}: OrderTrackingScreenProps) {
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<FarmoraOrder | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const data = await OrderService.getOrderById(orderId);
    if (data) {
      setOrder(data);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Pending Dispatch':
        return 0;
      case 'Packed':
        return 1;
      case 'Dispatched':
        return 2;
      case 'Delivered':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  const handleCallDriver = () => {
    const phone = order?.driverPhone || '+94765551290';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Driver', `Driver contact number: ${phone}`);
    });
  };

  const handleSimulateDelivery = async () => {
    if (!order) return;
    setIsVerifying(true);
    try {
      const pin = order.securityPin || '4821';
      const updated = await OrderService.verifyDeliveryQr(order.id, pin);
      if (updated) {
        setOrder(updated);
      }
      setShowQrModal(false);
      Alert.alert('Delivery Verified', 'Driver scanned QR and verified PIN. Order is marked as Delivered!');
    } catch {
      Alert.alert('Verification Failed', 'Invalid PIN or QR code.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>Loading order tracking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.navTitleCenter}>
          <Text style={styles.navTitle}>Live Tracking</Text>
          <Text style={styles.navSub}>{order.orderNumber}</Text>
        </View>

        <Pressable
          onPress={() => onChatWithFarmer?.(order.farmerId, order.farmerName)}
          hitSlop={12}
          style={styles.chatBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2}>
            <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Estimated Arrival Banner */}
        <View style={styles.arrivalCard}>
          <View style={styles.arrivalLeft}>
            <Text style={styles.arrivalLabel}>ESTIMATED ARRIVAL</Text>
            <Text style={styles.arrivalVal}>
              {order.status === 'Delivered' ? 'Delivered' : 'Today, 03:45 PM'}
            </Text>
            <Text style={styles.arrivalSub}>
              {order.status === 'Delivered'
                ? 'Produce received & inspected'
                : 'Direct from Dambulla cold chain logistics'}
            </Text>
          </View>
          <View style={styles.arrivalBadge}>
            <Text style={styles.arrivalBadgeText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Live Stepper */}
        <View style={styles.stepperCard}>
          <Text style={styles.cardHeaderTitle}>Delivery Status</Text>

          {STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted ? styles.stepCircleActive : styles.stepCircleInactive,
                    ]}
                  >
                    {isCompleted ? (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    ) : (
                      <View style={styles.dotInactive} />
                    )}
                  </View>
                  {idx < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        idx < currentStepIdx ? styles.stepLineActive : styles.stepLineInactive,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.stepContentCol}>
                  <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop' }}
              style={styles.driverAvatar}
            />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{order.driverName || 'Ranjith Kumara'}</Text>
              <Text style={styles.vehiclePlate}>{order.vehicleNumber || 'WP-DA-4891 (Isuzu 3T)'}</Text>
              <Text style={styles.driverRole}>Famora Logistics Partner</Text>
            </View>

            <Pressable style={styles.phoneCircle} onPress={handleCallDriver}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2.2}>
                <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* Delivery QR & PIN Action Card */}
        <View style={styles.handoverCard}>
          <View style={styles.handoverLeft}>
            <Text style={styles.handoverTitle}>Handover Verification</Text>
            <Text style={styles.handoverDesc}>
              Present your QR code or 4-digit PIN upon parcel delivery.
            </Text>
          </View>

          <Pressable style={styles.showQrBtn} onPress={() => setShowQrModal(true)}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 6 }}>
              <Rect x={3} y={3} width={7} height={7} />
              <Rect x={14} y={3} width={7} height={7} />
              <Rect x={14} y={14} width={7} height={7} />
              <Rect x={3} y={14} width={7} height={7} />
            </Svg>
            <Text style={styles.showQrBtnText}>Show QR / PIN</Text>
          </Pressable>
        </View>

        {/* Order Items Snapshot */}
        <View style={styles.itemsCard}>
          <Text style={styles.cardHeaderTitle}>Produce in this Package</Text>
          {order.items.map((item, idx) => (
            <View key={item.produceId || idx} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImg} />
              <View style={styles.itemDetail}>
                <Text style={styles.itemTitle}>{item.produceTitle}</Text>
                <Text style={styles.itemSub}>{item.quantity} {item.unit}</Text>
              </View>
              <Text style={styles.itemPrice}>Rs. {item.totalPrice.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Handover QR Modal */}
      <Modal visible={showQrModal} animationType="fade" transparent onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalBox}>
            <Text style={styles.qrModalTitle}>Delivery Handover QR</Text>
            <Text style={styles.qrModalSub}>
              Scan this QR with the delivery partner device or provide the PIN.
            </Text>

            {/* Stylized QR Code Canvas */}
            <View style={styles.qrFrame}>
              <Svg width={180} height={180} viewBox="0 0 180 180">
                <Rect x={10} y={10} width={45} height={45} stroke="#0F172A" strokeWidth={6} fill="none" />
                <Rect x={22} y={22} width={21} height={21} fill="#0F172A" />

                <Rect x={125} y={10} width={45} height={45} stroke="#0F172A" strokeWidth={6} fill="none" />
                <Rect x={137} y={22} width={21} height={21} fill="#0F172A" />

                <Rect x={10} y={125} width={45} height={45} stroke="#0F172A" strokeWidth={6} fill="none" />
                <Rect x={22} y={137} width={21} height={21} fill="#0F172A" />

                {/* Pattern dots */}
                <Rect x={70} y={20} width={15} height={15} fill="#2E7D32" />
                <Rect x={95} y={35} width={15} height={15} fill="#0F172A" />
                <Rect x={70} y={55} width={15} height={15} fill="#0F172A" />
                <Rect x={70} y={80} width={40} height={20} fill="#2E7D32" />
                <Rect x={20} y={75} width={30} height={15} fill="#0F172A" />
                <Rect x={130} y={75} width={20} height={35} fill="#0F172A" />
                <Rect x={80} y={125} width={25} height={25} fill="#0F172A" />
                <Rect x={125} y={125} width={30} height={15} fill="#2E7D32" />
                <Rect x={115} y={150} width={45} height={15} fill="#0F172A" />
              </Svg>
            </View>

            {/* 4 Digit PIN */}
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>4-Digit Verification PIN</Text>
              <Text style={styles.pinText}>{order.securityPin || '4821'}</Text>
            </View>

            {/* Simulate Driver Button */}
            {order.status !== 'Delivered' && (
              <Pressable
                style={styles.verifySimulateBtn}
                onPress={handleSimulateDelivery}
                disabled={isVerifying}
              >
                <Text style={styles.verifySimulateBtnText}>
                  {isVerifying ? 'Verifying...' : 'Simulate Driver Scan & Handover'}
                </Text>
              </Pressable>
            )}

            <Pressable onPress={() => setShowQrModal(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalBtnText}>Close</Text>
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
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
  navTitleCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  arrivalCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  arrivalLeft: {
    flex: 1,
  },
  arrivalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BBF7D0',
    letterSpacing: 0.5,
  },
  arrivalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  arrivalSub: {
    fontSize: 12,
    color: '#DCFCE7',
    marginTop: 4,
  },
  arrivalBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  arrivalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2E7D32',
  },
  stepCircleInactive: {
    backgroundColor: '#E2E8F0',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  stepLineActive: {
    backgroundColor: '#2E7D32',
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehiclePlate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 2,
  },
  driverRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  phoneCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handoverCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  handoverLeft: {
    flex: 1,
    marginRight: 10,
  },
  handoverTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  handoverDesc: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  showQrBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  showQrBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  itemDetail: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  qrModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  qrModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  pinText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#2E7D32',
    marginTop: 2,
  },
  verifySimulateBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  verifySimulateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeModalBtn: {
    paddingVertical: 8,
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
