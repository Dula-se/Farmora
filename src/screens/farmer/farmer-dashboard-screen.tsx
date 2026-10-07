import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { getStoredUser, ApiUser, fetchMyListings, ApiProduceItem } from '@/services/api';

interface FarmerDashboardScreenProps {
  onAddProduct: () => void;
  onViewProducts: () => void;
  onViewOrders: () => void;
  onViewMessages?: () => void;
  onOpenProfile?: () => void;
  onOpenMarketTrends?: () => void;
  onOpenDistrictPriceCompare?: () => void;
  onOpenWholesaleRetail?: () => void;
  onOpenTrustScore?: () => void;
  onOpenRescueProduce?: () => void;
  onOpenVerification?: () => void;
}

interface FarmerOrderSummary {
  id: string;
  orderNumber: string;
  buyerName: string;
  cropName: string;
  quantity: string;
  totalAmount: number;
  status: 'Pending Dispatch' | 'Accepted' | 'Delivered';
  timeAgo: string;
}

const MOCK_TODAYS_ORDERS: FarmerOrderSummary[] = [
  {
    id: 'ord-1',
    orderNumber: '#1042',
    buyerName: 'Sunil Dissanayake',
    cropName: 'Organic Red Tomatoes',
    quantity: '50 kg',
    totalAmount: 12000,
    status: 'Pending Dispatch',
    timeAgo: '25 min ago',
  },
  {
    id: 'ord-2',
    orderNumber: '#1041',
    buyerName: 'Green Leaf Supermarket',
    cropName: 'Highland Carrots',
    quantity: '100 kg',
    totalAmount: 24000,
    status: 'Accepted',
    timeAgo: '2 hours ago',
  },
];

export function FarmerDashboardScreen({
  onAddProduct,
  onViewProducts,
  onViewOrders,
  onViewMessages,
  onOpenProfile,
  onOpenMarketTrends,
  onOpenDistrictPriceCompare,
  onOpenWholesaleRetail,
  onOpenTrustScore,
  onOpenRescueProduce,
  onOpenVerification,
}: FarmerDashboardScreenProps) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [myListings, setMyListings] = useState<ApiProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNewFarmerMode, setIsNewFarmerMode] = useState(false);

  const loadData = async () => {
    try {
      const [currentUser, listings] = await Promise.all([
        getStoredUser(),
        fetchMyListings().catch(() => []),
      ]);
      setUser(currentUser);
      setMyListings(listings);
      if (listings.length === 0) {
        setIsNewFarmerMode(false); // default to full dashboard with sample stats, toggleable
      }
    } catch (err) {
      console.log('[FarmerDashboard] Failed to load data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const farmerName = user?.fullName || 'Kamal Perera';
  const farmLocation = user?.district ? `${user.district} Organic Valley` : 'Ampitiya Organic Valley, Kandy';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>
            Good Morning, {farmerName.split(' ')[0]} 👨‍🌾
          </Text>
          <Text style={styles.farmLocationText}>📍 {farmLocation}</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.modeToggleBtn}
            onPress={() => setIsNewFarmerMode(!isNewFarmerMode)}>
            <Text style={styles.modeToggleText}>
              {isNewFarmerMode ? 'Active View' : 'New Farmer View'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.avatarBtn}
            onPress={onOpenProfile}>
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>
                {farmerName.charAt(0)}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
        }>
        {/* ========================================================================= */}
        {/* SCREEN 2: WELCOME, NEW FARMER! (ONBOARDING MODE)                          */}
        {/* ========================================================================= */}
        {isNewFarmerMode ? (
          <View style={styles.onboardingContainer}>
            <View style={styles.onboardingIconBox}>
              <Text style={styles.onboardingIconEmoji}>🌱</Text>
            </View>

            <Text style={styles.onboardingTitle}>Welcome, New Farmer!</Text>
            <Text style={styles.onboardingSub}>
              Your Farm Dashboard is ready. Complete these quick steps to get your produce live and start receiving direct orders.
            </Text>

            {/* Checklist Card */}
            <View style={styles.checklistCard}>
              <View style={styles.checklistHeader}>
                <Text style={styles.checklistTitle}>Setup Checklist</Text>
                <Text style={styles.progressPercent}>33% Complete</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '33%' }]} />
              </View>

              {/* Step 1 */}
              <View style={styles.checklistItem}>
                <View style={styles.checkCircleDone}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitleDone}>1. Complete Farm Profile</Text>
                  <Text style={styles.itemSubDone}>Profile details and mobile verified</Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.checklistItem}>
                <View style={styles.checkCirclePending}>
                  <Text style={styles.checkNumber}>2</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>2. Add Your First Produce Listing</Text>
                  <Text style={styles.itemSub}>Upload crop photos, quantity, and price</Text>
                </View>
                <Pressable style={styles.itemActionBtn} onPress={onAddProduct}>
                  <Text style={styles.itemActionBtnText}>+ Add Produce</Text>
                </Pressable>
              </View>

              {/* Step 3 */}
              <View style={[styles.checklistItem, { borderBottomWidth: 0 }]}>
                <View style={styles.checkCirclePending}>
                  <Text style={styles.checkNumber}>3</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>3. Set Delivery Preferences</Text>
                  <Text style={styles.itemSub}>Choose farm pickup or direct delivery radius</Text>
                </View>
                <Pressable style={styles.itemActionOutlineBtn} onPress={onAddProduct}>
                  <Text style={styles.itemActionOutlineBtnText}>Set Radius</Text>
                </Pressable>
              </View>
            </View>

            {/* Switch to full dashboard */}
            <Pressable
              style={styles.primaryBigBtn}
              onPress={onAddProduct}>
              <Text style={styles.primaryBigBtnText}>+ Add First Product Listing →</Text>
            </Pressable>
          </View>
        ) : (
          /* ========================================================================= */
          /* SCREEN 1: ACTIVE FARMER HOME DASHBOARD                                     */
          /* ========================================================================= */
          <View>
            {/* 4 Metric Cards (2x2 Grid) */}
            <View style={styles.metricsGrid}>
              {/* Metric 1 */}
              <Pressable style={styles.metricCard} onPress={onViewProducts}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Active Listings</Text>
                  <View style={[styles.metricDot, { backgroundColor: '#22C55E' }]} />
                </View>
                <Text style={styles.metricValue}>
                  {myListings.length > 0 ? myListings.length : 12}
                </Text>
                <Text style={styles.metricFootnote}>In stock & visible</Text>
              </Pressable>

              {/* Metric 2 */}
              <Pressable style={styles.metricCard} onPress={onViewOrders}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Pending Orders</Text>
                  <View style={[styles.metricDot, { backgroundColor: '#F59E0B' }]} />
                </View>
                <Text style={[styles.metricValue, { color: '#B45309' }]}>5</Text>
                <Text style={styles.metricFootnote}>Needs confirmation</Text>
              </Pressable>

              {/* Metric 3 */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Monthly Revenue</Text>
                  <Text style={{ fontSize: 13 }}>💰</Text>
                </View>
                <Text style={[styles.metricValue, { color: '#2E7D32' }]}>
                  Rs. 48,700
                </Text>
                <Text style={styles.metricFootnote}>+18% vs last month</Text>
              </View>

              {/* Metric 4 */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Buyer Rating</Text>
                  <Text style={{ fontSize: 13 }}>★</Text>
                </View>
                <Text style={[styles.metricValue, { color: '#0F172A' }]}>
                  4.8 <Text style={styles.ratingSub}>/ 5.0</Text>
                </Text>
                <Text style={styles.metricFootnote}>24 verified reviews</Text>
              </View>
            </View>

            {/* Get Verified Hero Banner */}
            {onOpenVerification && (
              <Pressable
                style={styles.verificationBannerCard}
                onPress={onOpenVerification}>
                <View style={styles.verificationBannerIcon}>
                  <Text style={{ fontSize: 20 }}>🛡️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verificationBannerTitle}>
                    Grow Your Trust & Sales
                  </Text>
                  <Text style={styles.verificationBannerSub}>
                    Get verified with NIC & land evidence to unlock badges & up to 3x more orders.
                  </Text>
                </View>
                <View style={styles.verificationBannerBtn}>
                  <Text style={styles.verificationBannerBtnText}>Verify ›</Text>
                </View>
              </Pressable>
            )}

            {/* Quick Actions Bar */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsRow}>
                <Pressable
                  style={styles.quickActionPrimary}
                  onPress={onAddProduct}>
                  <Text style={styles.quickActionPrimaryText}>+ Add Listing</Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionSecondary}
                  onPress={onViewOrders}>
                  <Text style={styles.quickActionSecondaryText}>📦 My Orders</Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionSecondary}
                  onPress={onViewProducts}>
                  <Text style={styles.quickActionSecondaryText}>📊 Stock (12)</Text>
                </Pressable>
              </View>
            </View>

            {/* Today's Orders Section */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionTitle}>Today&apos;s Orders</Text>
                <Pressable onPress={onViewOrders} hitSlop={10}>
                  <Text style={styles.viewAllText}>View All (5) ›</Text>
                </Pressable>
              </View>

              {MOCK_TODAYS_ORDERS.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardTop}>
                    <View>
                      <Text style={styles.orderBuyerName}>{order.buyerName}</Text>
                      <Text style={styles.orderCropText}>
                        {order.cropName} • {order.quantity}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        order.status === 'Accepted'
                          ? styles.statusAccepted
                          : styles.statusPending,
                      ]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          order.status === 'Accepted'
                            ? styles.statusAcceptedText
                            : styles.statusPendingText,
                        ]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderCardBottom}>
                    <Text style={styles.orderAmountText}>
                      Rs. {order.totalAmount.toLocaleString()}
                    </Text>
                    <Text style={styles.orderTimeText}>{order.timeAgo}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Agri-Market Intelligence & Tools (Matching Figma Screens 8, 9, 10, 11, 12) */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Market Intelligence & Tools</Text>

              {/* Farmer Trust Score Card (Figma Screen 12) */}
              <Pressable
                style={styles.intelCard}
                onPress={onOpenTrustScore}>
                <View style={styles.intelIconCircle}>
                  <Text style={{ fontSize: 20 }}>🎖️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.intelHeaderRow}>
                    <Text style={styles.intelCardTitle}>Farmer Trust Score</Text>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeText}>94 / 100</Text>
                    </View>
                  </View>
                  <Text style={styles.intelCardSub}>
                    Grade A+ Certified • Top 5% in Central Province
                  </Text>
                </View>
                <Text style={styles.intelArrow}>›</Text>
              </Pressable>

              {/* Tomato Market Trend (Figma Screen 11) */}
              <Pressable
                style={styles.intelCard}
                onPress={onOpenMarketTrends}>
                <View style={[styles.intelIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={{ fontSize: 20 }}>📈</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.intelHeaderRow}>
                    <Text style={styles.intelCardTitle}>Tomato Market Trend</Text>
                    <Text style={styles.trendUpText}>+Rs. 12/kg Today</Text>
                  </View>
                  <Text style={styles.intelCardSub}>
                    Nuwara Eliya Mandi: Rs. 340/kg • Bullish rain forecast
                  </Text>
                </View>
                <Text style={styles.intelArrow}>›</Text>
              </Pressable>

              {/* District Price Compare (Figma Screen 9) */}
              <Pressable
                style={styles.intelCard}
                onPress={onOpenDistrictPriceCompare}>
                <View style={[styles.intelIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={{ fontSize: 20 }}>🏷️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.intelHeaderRow}>
                    <Text style={styles.intelCardTitle}>District Price Compare</Text>
                    <Text style={styles.colomboAdvantage}>Colombo +17%</Text>
                  </View>
                  <Text style={styles.intelCardSub}>
                    Compare farmgate rates across Manning, Dambulla & Kandy
                  </Text>
                </View>
                <Text style={styles.intelArrow}>›</Text>
              </Pressable>

              {/* Wholesale vs Retail Calculator (Figma Screen 10) */}
              <Pressable
                style={styles.intelCard}
                onPress={onOpenWholesaleRetail}>
                <View style={[styles.intelIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={{ fontSize: 20 }}>⚖️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.intelCardTitle}>Wholesale vs Retail Strategy</Text>
                  <Text style={styles.intelCardSub}>
                    Optimize bulk 50kg+ clearance rates vs direct retail margins
                  </Text>
                </View>
                <Text style={styles.intelArrow}>›</Text>
              </Pressable>

              {/* Rescue Produce Banner (Figma Screen 8) */}
              <Pressable
                style={styles.rescueBannerCard}
                onPress={onOpenRescueProduce}>
                <View style={styles.rescueBannerContent}>
                  <Text style={styles.rescueBannerEmoji}>🌱</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rescueBannerTitle}>Rescue Produce Surplus Feed</Text>
                    <Text style={styles.rescueBannerSub}>
                      List near-expiry or surplus crops to quick commercial buyers
                    </Text>
                  </View>
                  <View style={styles.rescueOpenBtn}>
                    <Text style={styles.rescueOpenBtnText}>Open</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* SMS / Twilio Integration Status Banner */}
            <View style={styles.twilioBanner}>
              <View style={styles.twilioIconCircle}>
                <Text style={{ fontSize: 16 }}>📱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.twilioTitle}>SMS Notifications Active</Text>
                <Text style={styles.twilioSub}>
                  Twilio messaging engine notifies your mobile phone immediately when a buyer submits a new dispatch request.
                </Text>
              </View>
            </View>

            {/* Recent Activity Timeline */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityCard}>
                <View style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.activityText}>
                      Received order for 50kg Organic Tomatoes
                    </Text>
                    <Text style={styles.activityTime}>25 min ago</Text>
                  </View>
                </View>

                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: '#3B82F6' }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.activityText}>
                      Price updated for Bitter Gourd to Rs. 210/kg
                    </Text>
                    <Text style={styles.activityTime}>3 hours ago</Text>
                  </View>
                </View>

                <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
                  <View style={[styles.activityDot, { backgroundColor: '#8B5CF6' }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.activityText}>
                      Quality check report submitted for Nuwara Eliya Leeks
                    </Text>
                    <Text style={styles.activityTime}>Yesterday</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  farmLocationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeToggleBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modeToggleText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
  },
  ratingSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  metricFootnote: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  // Quick actions
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionPrimary: {
    flex: 1.2,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quickActionSecondary: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickActionSecondaryText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  // Section Block
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderBuyerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderCropText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#B45309',
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusAcceptedText: {
    color: '#15803D',
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  orderAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  orderTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // Twilio Banner
  twilioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
    marginBottom: 20,
  },
  twilioIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  twilioTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  twilioSub: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
    marginTop: 2,
  },
  // Recent Activity
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginTop: 5,
  },
  activityText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  // Onboarding Mode Styles (Screen 2)
  onboardingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  onboardingIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  onboardingIconEmoji: {
    fontSize: 36,
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  onboardingSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  checklistCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkCircleDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 14,
  },
  checkCirclePending: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  checkNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  itemTitleDone: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'line-through',
  },
  itemSubDone: {
    fontSize: 11,
    color: '#94A3B8',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748B',
  },
  itemActionBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  itemActionOutlineBtn: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemActionOutlineBtnText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryBigBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBigBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Intelligence Cards Styles
  intelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  intelIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  intelCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  intelCardSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  intelArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CBD5E1',
    marginLeft: 4,
  },
  trustBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  trendUpText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  colomboAdvantage: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  rescueBannerCard: {
    backgroundColor: '#14532D',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  rescueBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rescueBannerEmoji: {
    fontSize: 24,
  },
  rescueBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rescueBannerSub: {
    fontSize: 11,
    color: '#BBF7D0',
    lineHeight: 15,
    marginTop: 2,
  },
  rescueOpenBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rescueOpenBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verificationBannerCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verificationBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
  },
  verificationBannerSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 15,
  },
  verificationBannerBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verificationBannerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
