import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { FarmoraOrder, OrderService, OrderStatus } from '@/services/order-service';

interface BuyerOrdersScreenProps {
  onBack: () => void;
  onChatFarmer: (farmerName: string, farmerId: string, orderRef?: string) => void;
  onRateOrder: (order: FarmoraOrder) => void;
  onReportIssue: (order: FarmoraOrder) => void;
  onCallFarmer: (farmerName: string, farmerPhone: string, avatar: string) => void;
  onTrackOrder?: (order: FarmoraOrder) => void;
}

export function BuyerOrdersScreen({
  onBack,
  onChatFarmer,
  onRateOrder,
  onReportIssue,
  onCallFarmer,
  onTrackOrder,
}: BuyerOrdersScreenProps) {
  const [orders, setOrders] = useState<FarmoraOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<FarmoraOrder | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const list = await OrderService.getBuyerOrders();
    setOrders(list);
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((item) => item.produceTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'active') {
      return ord.status === 'Pending Dispatch' || ord.status === 'Dispatched' || ord.status === 'Packed';
    }
    if (activeTab === 'delivered') {
      return ord.status === 'Delivered';
    }
    return true;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending Dispatch':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'Packed':
        return { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' };
      case 'Dispatched':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' };
      case 'Delivered':
        return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>My Orders & Procurement</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search order ID, farmer, or produce..."
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

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({orders.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
          onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'delivered' && styles.tabBtnActive]}
          onPress={() => setActiveTab('delivered')}>
          <Text style={[styles.tabText, activeTab === 'delivered' && styles.tabTextActive]}>
            Delivered ({orders.filter((o) => o.status === 'Delivered').length})
          </Text>
        </Pressable>
      </View>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              Orders placed with direct farm growers will appear here with live tracking.
            </Text>
          </View>
        ) : (
          filteredOrders.map((ord) => {
            const statusStyle = getStatusColor(ord.status);
            const isDelivered = ord.status === 'Delivered';
            const isDispatched = ord.status === 'Dispatched' || ord.status === 'Delivered';

            return (
              <View key={ord.id} style={styles.orderCard}>
                {/* Order Top Bar */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumberText}>{ord.orderNumber}</Text>
                    <Text style={styles.orderDateText}>{ord.orderDate}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                    ]}>
                    <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                      ● {ord.status}
                    </Text>
                  </View>
                </View>

                {/* Farmer Info */}
                <View style={styles.farmerRow}>
                  <Image source={{ uri: ord.farmerAvatar }} style={styles.farmerAvatar} contentFit="cover" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.farmerName}>{ord.farmerName}</Text>
                    <Text style={styles.farmerFarm}>{ord.farmerFarm}</Text>
                  </View>
                  <Pressable
                    style={styles.callSmallBtn}
                    onPress={() => onCallFarmer(ord.farmerName, ord.farmerPhone, ord.farmerAvatar)}>
                    <Text style={{ fontSize: 14 }}>📞</Text>
                  </Pressable>
                </View>

                {/* Items */}
                <View style={styles.itemsSection}>
                  {ord.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Image source={{ uri: item.image }} style={styles.itemThumb} contentFit="cover" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.itemTitle}>{item.produceTitle}</Text>
                        <Text style={styles.itemQty}>
                          {item.quantity} {item.unit} × Rs. {item.unitPrice}
                        </Text>
                      </View>
                      <Text style={styles.itemTotal}>Rs. {item.totalPrice.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                {/* Tracking Progress Stepper */}
                <View style={styles.stepperBox}>
                  <View style={styles.stepTrack}>
                    <View style={[styles.stepDot, styles.stepDotDone]}>
                      <Text style={styles.stepDotNum}>✓</Text>
                    </View>
                    <View style={[styles.stepLine, styles.stepLineDone]} />
                    <View style={[styles.stepDot, styles.stepDotDone]}>
                      <Text style={styles.stepDotNum}>✓</Text>
                    </View>
                    <View style={[styles.stepLine, isDispatched && styles.stepLineDone]} />
                    <View style={[styles.stepDot, isDispatched && styles.stepDotDone]}>
                      <Text style={[styles.stepDotNum, !isDispatched && { color: '#94A3B8' }]}>
                        {isDispatched ? '✓' : '3'}
                      </Text>
                    </View>
                    <View style={[styles.stepLine, isDelivered && styles.stepLineDone]} />
                    <View style={[styles.stepDot, isDelivered && styles.stepDotDone]}>
                      <Text style={[styles.stepDotNum, !isDelivered && { color: '#94A3B8' }]}>
                        {isDelivered ? '✓' : '4'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepLabelsRow}>
                    <Text style={styles.stepLabelActive}>Confirmed</Text>
                    <Text style={styles.stepLabelActive}>Packed</Text>
                    <Text style={isDispatched ? styles.stepLabelActive : styles.stepLabel}>In Transit</Text>
                    <Text style={isDelivered ? styles.stepLabelActive : styles.stepLabel}>Delivered</Text>
                  </View>

                  {/* Dispatch details snippet if available */}
                  {ord.driverName && isDispatched && (
                    <View style={styles.driverInfoBanner}>
                      <Text style={styles.driverInfoText}>
                        🚚 <Text style={{ fontWeight: '700' }}>{ord.driverName}</Text> • {ord.vehicleNumber}
                      </Text>
                      <Text style={styles.trackingCodeText}>{ord.trackingNumber}</Text>
                    </View>
                  )}
                </View>

                {/* Total and Escrow Details */}
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalPrice}>Rs. {ord.totalAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.escrowBadge}>
                    <Text style={styles.escrowText}>🛡️ {ord.paymentStatus}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActionsRow}>
                  {onTrackOrder && (
                    <Pressable
                      style={[styles.invoiceBtn, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }]}
                      onPress={() => onTrackOrder(ord)}>
                      <Text style={[styles.invoiceBtnText, { color: '#166534', fontWeight: '800' }]}>📍 Track & PIN</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.chatActionBtn}
                    onPress={() => onChatFarmer(ord.farmerName, ord.farmerId, ord.orderNumber)}>
                    <Text style={styles.chatActionBtnText}>💬 Chat Farmer</Text>
                  </Pressable>

                  <Pressable
                    style={styles.invoiceBtn}
                    onPress={() => setSelectedInvoiceOrder(ord)}>
                    <Text style={styles.invoiceBtnText}>📄 Invoice</Text>
                  </Pressable>

                  {isDelivered && (
                    <Pressable
                      style={styles.rateBtn}
                      onPress={() => onRateOrder(ord)}>
                      <Text style={styles.rateBtnText}>⭐ Rate</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.reportBtn}
                    onPress={() => onReportIssue(ord)}>
                    <Text style={styles.reportBtnText}>⚠️ Dispute</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Invoice Modal */}
      <Modal
        visible={!!selectedInvoiceOrder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedInvoiceOrder(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.invoiceBrand}>FARMORA COMMERCIAL INVOICE</Text>
                <Text style={styles.invoiceCode}>{selectedInvoiceOrder?.orderNumber}</Text>
              </View>
              <Pressable onPress={() => setSelectedInvoiceOrder(null)} hitSlop={10}>
                <Text style={{ fontSize: 20, color: '#64748B' }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, marginVertical: 12 }}>
              <View style={styles.invoiceSection}>
                <Text style={styles.invoiceSectionTitle}>Farmer / Origin</Text>
                <Text style={styles.invoiceTextBold}>{selectedInvoiceOrder?.farmerName}</Text>
                <Text style={styles.invoiceText}>{selectedInvoiceOrder?.farmerFarm}</Text>
                <Text style={styles.invoiceText}>Contact: {selectedInvoiceOrder?.farmerPhone}</Text>
              </View>

              <View style={styles.invoiceSection}>
                <Text style={styles.invoiceSectionTitle}>Buyer / Destination</Text>
                <Text style={styles.invoiceTextBold}>{selectedInvoiceOrder?.buyerName}</Text>
                <Text style={styles.invoiceText}>{selectedInvoiceOrder?.buyerLocation}</Text>
                <Text style={styles.invoiceText}>Contact: {selectedInvoiceOrder?.buyerPhone}</Text>
              </View>

              <View style={styles.invoiceSection}>
                <Text style={styles.invoiceSectionTitle}>Produce Breakdown</Text>
                {selectedInvoiceOrder?.items.map((it) => (
                  <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
                    <Text style={styles.invoiceText}>
                      {it.produceTitle} ({it.quantity} {it.unit})
                    </Text>
                    <Text style={styles.invoiceTextBold}>Rs. {it.totalPrice.toLocaleString()}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.invoiceCalcBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Produce Subtotal</Text>
                  <Text style={styles.calcVal}>Rs. {selectedInvoiceOrder?.subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Direct Logistics</Text>
                  <Text style={styles.calcVal}>Rs. {selectedInvoiceOrder?.deliveryFee.toLocaleString()}</Text>
                </View>
                {!!selectedInvoiceOrder?.discount && (
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: '#16A34A' }]}>Bulk Incentive Discount</Text>
                    <Text style={[styles.calcVal, { color: '#16A34A' }]}>- Rs. {selectedInvoiceOrder?.discount.toLocaleString()}</Text>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { fontWeight: '800', color: '#0F172A' }]}>Grand Total</Text>
                  <Text style={[styles.calcVal, { fontWeight: '800', color: '#166534', fontSize: 16 }]}>
                    Rs. {selectedInvoiceOrder?.totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.escrowNoticeBox}>
                <Text style={styles.escrowNoticeTitle}>Famora Digital Escrow Protection</Text>
                <Text style={styles.escrowNoticeDesc}>
                  Funds are held in Sri Lankan Rupee escrow until buyer physically verifies harvest quality on arrival.
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.closeInvoiceBtn}
              onPress={() => setSelectedInvoiceOrder(null)}>
              <Text style={styles.closeInvoiceBtnText}>Close Receipt</Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
    gap: 10,
  },
  tabBtn: {
    paddingHorizontal: 14,
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
    lineHeight: 18,
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
  orderNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDateText: {
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
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  farmerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerFarm: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  callSmallBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsSection: {
    marginVertical: 10,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
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
  itemQty: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepperBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#1E5E3A',
  },
  stepDotNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: '#1E5E3A',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stepLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepLabelActive: {
    fontSize: 9,
    color: '#1E5E3A',
    fontWeight: '700',
  },
  driverInfoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  driverInfoText: {
    fontSize: 11,
    color: '#334155',
  },
  trackingCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E5E3A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#166534',
  },
  escrowBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  escrowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  chatActionBtn: {
    flex: 2,
    backgroundColor: '#1E5E3A',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  invoiceBtn: {
    flex: 1.2,
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  rateBtn: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  reportBtn: {
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  invoiceModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  invoiceBrand: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E5E3A',
    letterSpacing: 0.5,
  },
  invoiceCode: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  invoiceSection: {
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  invoiceSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  invoiceText: {
    fontSize: 12,
    color: '#334155',
  },
  invoiceTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceCalcBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginVertical: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12,
    color: '#475569',
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#DCFCE7',
    marginVertical: 4,
  },
  escrowNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  escrowNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  escrowNoticeDesc: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 14,
  },
  closeInvoiceBtn: {
    backgroundColor: '#1E5E3A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeInvoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
