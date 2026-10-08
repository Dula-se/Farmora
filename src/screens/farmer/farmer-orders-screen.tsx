import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { FarmoraOrder, OrderService, OrderStatus } from '@/services/order-service';

interface FarmerOrdersScreenProps {
  onBack?: () => void;
  onChatBuyer: (buyerName: string, buyerId: string, orderRef?: string) => void;
  onRateBuyer: (buyerName: string, buyerId: string) => void;
  onCallBuyer: (buyerName: string, buyerPhone: string) => void;
  onTrackOrder?: (order: FarmoraOrder) => void;
}

export function FarmerOrdersScreen({
  onBack,
  onChatBuyer,
  onRateBuyer,
  onCallBuyer,
  onTrackOrder,
}: FarmerOrdersScreenProps) {
  const [orders, setOrders] = useState<FarmoraOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'dispatched' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dispatch modal
  const [dispatchOrder, setDispatchOrder] = useState<FarmoraOrder | null>(null);
  const [driverName, setDriverName] = useState('Saman Kumara');
  const [driverPhone, setDriverPhone] = useState('+94 77 333 4455');
  const [vehicleNo, setVehicleNo] = useState('WP-GA-9021');

  // Buyer Info & Rating modal
  const [selectedBuyerOrder, setSelectedBuyerOrder] = useState<FarmoraOrder | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setRefreshing(true);
    const list = await OrderService.getFarmerOrders();
    setOrders(list);
    setRefreshing(false);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchOrder) return;
    await OrderService.updateOrderStatus(dispatchOrder.id, 'Dispatched');
    setDispatchOrder(null);
    loadOrders();
    Alert.alert('Dispatch Confirmed! 🚚', `Order ${dispatchOrder.orderNumber} is marked in transit with vehicle ${vehicleNo}. Buyer notified.`);
  };

  const handleMarkDelivered = async (order: FarmoraOrder) => {
    Alert.alert(
      'Confirm Delivery & Escrow Release',
      `Mark ${order.orderNumber} as delivered? Rs. ${order.totalAmount.toLocaleString()} will be scheduled for your farm account disbursement.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivered',
          style: 'default',
          onPress: async () => {
            await OrderService.updateOrderStatus(order.id, 'Delivered');
            loadOrders();
          },
        },
      ]
    );
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((item) => item.produceTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return ord.status === 'Pending Dispatch';
    }
    if (activeTab === 'dispatched') {
      return ord.status === 'Dispatched';
    }
    if (activeTab === 'delivered') {
      return ord.status === 'Delivered';
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'Pending Dispatch').length;
  const dispatchedCount = orders.filter((o) => o.status === 'Dispatched').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.headerTitle}>Orders & Dispatch</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiNumber}>{orders.length}</Text>
          <Text style={styles.kpiLabel}>Total Orders</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiNumber, { color: '#D97706' }]}>{pendingCount}</Text>
          <Text style={styles.kpiLabel}>To Dispatch</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiNumber, { color: '#166534' }]}>Rs. {(totalRevenue / 1000).toFixed(0)}k</Text>
          <Text style={styles.kpiLabel}>Pipeline Value</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, buyer name, or crop..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All ({orders.length})</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pending')}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'dispatched' && styles.tabBtnActive]}
          onPress={() => setActiveTab('dispatched')}>
          <Text style={[styles.tabText, activeTab === 'dispatched' && styles.tabTextActive]}>
            In Transit ({dispatchedCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'delivered' && styles.tabBtnActive]}
          onPress={() => setActiveTab('delivered')}>
          <Text style={[styles.tabText, activeTab === 'delivered' && styles.tabTextActive]}>
            Delivered
          </Text>
        </Pressable>
      </View>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOrders} colors={['#1E5E3A']} />
        }>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📦</Text>
            <Text style={styles.emptyTitle}>No orders in this category</Text>
            <Text style={styles.emptySubtitle}>All incoming commercial inquiries and harvest bookings will appear here.</Text>
          </View>
        ) : (
          filteredOrders.map((ord) => {
            const isPending = ord.status === 'Pending Dispatch';
            const isDispatched = ord.status === 'Dispatched';
            const isDelivered = ord.status === 'Delivered';

            return (
              <View key={ord.id} style={styles.orderCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                    <Text style={styles.orderDate}>{ord.orderDate}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isPending && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                      isDispatched && { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' },
                      isDelivered && { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
                    ]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        isPending && { color: '#D97706' },
                        isDispatched && { color: '#1D4ED8' },
                        isDelivered && { color: '#15803D' },
                      ]}>
                      ● {ord.status}
                    </Text>
                  </View>
                </View>

                {/* Buyer Details (Tap to view buyer info & manage ratings) */}
                <Pressable
                  style={({ pressed }) => [styles.buyerRow, pressed && { opacity: 0.95 }]}
                  onPress={() => setSelectedBuyerOrder(ord)}>
                  <View style={styles.buyerAvatar}>
                    <Text style={{ fontSize: 18 }}>👨‍💼</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.buyerName}>{ord.buyerName}</Text>
                    <Text style={styles.buyerLoc}>📍 {ord.buyerLocation}</Text>
                    <Text style={{ fontSize: 10, color: '#166534', fontWeight: '700', marginTop: 1 }}>
                      ⭐ Tap card to view info & rate buyer ›
                    </Text>
                  </View>
                  <Pressable
                    style={styles.callIconBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      onCallBuyer(ord.buyerName, ord.buyerPhone);
                    }}>
                    <Text style={{ fontSize: 15 }}>📞</Text>
                  </Pressable>
                </Pressable>

                {/* Items */}
                <View style={styles.itemsBox}>
                  {ord.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Image source={{ uri: item.image }} style={styles.itemImg} contentFit="cover" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.itemTitle}>{item.produceTitle}</Text>
                        <Text style={styles.itemSub}>
                          {item.quantity} {item.unit} @ Rs. {item.unitPrice}/{item.unit}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>Rs. {item.totalPrice.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                {/* Price and Escrow Status */}
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.payoutLabel}>Total Farm Payout</Text>
                    <Text style={styles.payoutAmount}>Rs. {ord.totalAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.escrowChip}>
                    <Text style={styles.escrowChipText}>🛡️ {ord.paymentStatus}</Text>
                  </View>
                </View>

                {/* Action Controls - Spacious 2-Tier Layout */}
                <View style={styles.cardActionsContainer}>
                  {/* Tier 1: Primary Status Action */}
                  {isPending && (
                    <Pressable
                      style={styles.primaryFulfillBtn}
                      onPress={() => setDispatchOrder(ord)}>
                      <Text style={styles.primaryFulfillBtnText}>🚚 Dispatch & Assign Logistics</Text>
                    </Pressable>
                  )}

                  {isDispatched && (
                    <Pressable
                      style={styles.markDeliveredPrimaryBtn}
                      onPress={() => handleMarkDelivered(ord)}>
                      <Text style={styles.markDeliveredPrimaryBtnText}>✓ Mark Delivered & Release Escrow</Text>
                    </Pressable>
                  )}

                  {isDelivered && (
                    <View style={styles.deliveredBadgeBanner}>
                      <Text style={styles.deliveredBadgeText}>✓ Order Delivered • Farm Payout Released</Text>
                    </View>
                  )}

                  {/* Tier 2: Secondary Communication & Logistics Controls */}
                  <View style={styles.secondaryControlsRow}>
                    {onTrackOrder && (
                      <Pressable
                        style={styles.trackControlBtn}
                        onPress={() => onTrackOrder(ord)}>
                        <Text style={styles.trackControlBtnText}>📍 Track & PIN</Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.chatControlBtn}
                      onPress={() => onChatBuyer(ord.buyerName, ord.buyerId, ord.orderNumber)}>
                      <Text style={styles.chatControlBtnText}>💬 Chat</Text>
                    </Pressable>

                    <Pressable
                      style={styles.rateControlBtn}
                      onPress={() => onRateBuyer(ord.buyerName, ord.buyerId)}>
                      <Text style={styles.rateControlBtnText}>⭐ Rate Buyer</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Dispatch Assignment Modal */}
      <Modal
        visible={!!dispatchOrder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDispatchOrder(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dispatchModalCard}>
            <Text style={styles.modalHeading}>Dispatch Logistics Assignment</Text>
            <Text style={styles.modalSubheading}>
              Assign driver and vehicle details for {dispatchOrder?.orderNumber}
            </Text>

            <View style={styles.modalFormGroup}>
              <Text style={styles.inputLabel}>Driver / Transporter Name</Text>
              <TextInput
                style={styles.modalInput}
                value={driverName}
                onChangeText={setDriverName}
                placeholder="e.g. Ranjith Kumara"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.inputLabel}>Driver Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={driverPhone}
                onChangeText={setDriverPhone}
                keyboardType="phone-pad"
                placeholder="+94 77 ..."
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.inputLabel}>Vehicle Number / Type</Text>
              <TextInput
                style={styles.modalInput}
                value={vehicleNo}
                onChangeText={setVehicleNo}
                placeholder="e.g. WP-DA-4891 (Isuzu 3T)"
              />
            </View>

            <View style={styles.modalActionButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setDispatchOrder(null)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={handleConfirmDispatch}>
                <Text style={styles.modalConfirmBtnText}>Confirm & Start Transit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Buyer Info & Ratings Modal */}
      <Modal
        visible={!!selectedBuyerOrder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBuyerOrder(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.buyerInfoModalCard}>
            <View style={styles.buyerModalHeader}>
              <View style={styles.buyerAvatar}>
                <Text style={{ fontSize: 24 }}>👨‍💼</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.buyerModalName}>{selectedBuyerOrder?.buyerName}</Text>
                <Text style={styles.buyerModalLoc}>📍 {selectedBuyerOrder?.buyerLocation}</Text>
                <Text style={styles.buyerModalBadge}>✓ Commercial Procurement Partner</Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => setSelectedBuyerOrder(null)}
                style={styles.modalCloseCircle}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B' }}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.buyerStatsRow}>
              <View style={styles.buyerStatBox}>
                <Text style={styles.buyerStatValue}>4.9 ★</Text>
                <Text style={styles.buyerStatLabel}>Trust Score</Text>
              </View>
              <View style={styles.buyerStatBox}>
                <Text style={styles.buyerStatValue}>100%</Text>
                <Text style={styles.buyerStatLabel}>Payment Rate</Text>
              </View>
              <View style={styles.buyerStatBox}>
                <Text style={styles.buyerStatValue}>{selectedBuyerOrder?.orderNumber}</Text>
                <Text style={styles.buyerStatLabel}>Active Order</Text>
              </View>
            </View>

            <View style={styles.buyerModalDetailsBlock}>
              <Text style={styles.buyerModalDetailRow}>
                📞 Contact: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedBuyerOrder?.buyerPhone}</Text>
              </Text>
              <Text style={styles.buyerModalDetailRow}>
                💰 Order Total: <Text style={{ fontWeight: '700', color: '#166534' }}>Rs. {selectedBuyerOrder?.totalAmount.toLocaleString()}</Text>
              </Text>
              <Text style={styles.buyerModalDetailRow}>
                🛡️ Payment Status: <Text style={{ fontWeight: '700', color: '#1E40AF' }}>{selectedBuyerOrder?.paymentStatus}</Text>
              </Text>
            </View>

            <View style={styles.buyerModalActionRow}>
              <Pressable
                style={styles.buyerModalActionBtn}
                onPress={() => {
                  if (!selectedBuyerOrder) return;
                  const b = selectedBuyerOrder;
                  setSelectedBuyerOrder(null);
                  onChatBuyer(b.buyerName, b.buyerId, b.orderNumber);
                }}>
                <Text style={styles.buyerModalActionText}>💬 Chat</Text>
              </Pressable>

              <Pressable
                style={styles.buyerModalActionBtn}
                onPress={() => {
                  if (!selectedBuyerOrder) return;
                  const b = selectedBuyerOrder;
                  setSelectedBuyerOrder(null);
                  onCallBuyer(b.buyerName, b.buyerPhone);
                }}>
                <Text style={styles.buyerModalActionText}>📞 Call</Text>
              </Pressable>

              <Pressable
                style={styles.buyerModalRateBtn}
                onPress={() => {
                  if (!selectedBuyerOrder) return;
                  const b = selectedBuyerOrder;
                  setSelectedBuyerOrder(null);
                  onRateBuyer(b.buyerName, b.buyerId);
                }}>
                <Text style={styles.buyerModalRateText}>⭐ Rate / Edit Rating</Text>
              </Pressable>
            </View>
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
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#1E5E3A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 10,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  buyerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  buyerLoc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  callIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsBox: {
    marginVertical: 10,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  payoutLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  payoutAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#166534',
  },
  escrowChip: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  escrowChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  cardActionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  primaryFulfillBtn: {
    width: '100%',
    backgroundColor: '#1E5E3A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E5E3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryFulfillBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  markDeliveredPrimaryBtn: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  markDeliveredPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  deliveredBadgeBanner: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  deliveredBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackControlBtn: {
    flex: 1.15,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackControlBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  chatControlBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatControlBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  rateControlBtn: {
    flex: 1.15,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateControlBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dispatchModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  modalFormGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: '#1E5E3A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buyerInfoModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  buyerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  buyerModalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  buyerModalLoc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  buyerModalBadge: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
    marginTop: 3,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  buyerStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  buyerStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  buyerStatLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  buyerModalDetailsBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  buyerModalDetailRow: {
    fontSize: 12,
    color: '#475569',
  },
  buyerModalActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buyerModalActionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyerModalActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  buyerModalRateBtn: {
    flex: 2,
    backgroundColor: '#1E5E3A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyerModalRateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
