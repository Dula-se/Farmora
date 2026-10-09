import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { AuctionService, AuctionItem, AuctionStatus } from '@/services/auction-service';
import { getStoredUser } from '@/services/api';
import { StripePaymentModal } from './stripe-payment-modal';

interface AuctionsHubScreenProps {
  onBack: () => void;
  onSelectAuction: (auction: AuctionItem) => void;
  onCreateAuctionPress?: () => void;
}

type TabType = 'live' | 'upcoming' | 'my-bids' | 'won';

export function AuctionsHubScreen({
  onBack,
  onSelectAuction,
  onCreateAuctionPress,
}: AuctionsHubScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [payAuction, setPayAuction] = useState<AuctionItem | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);

  useEffect(() => {
    getStoredUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  // Re-render every second for real-time countdown clocks
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAuctions();
  }, [activeTab, currentUser]);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const currentUserId = currentUser?.id || currentUser?._id || 'buyer-sunil';
      const data = await AuctionService.getAuctions(
        activeTab === 'live' || activeTab === 'upcoming'
          ? { status: activeTab }
          : activeTab === 'won' || activeTab === 'my-bids'
          ? { tab: activeTab, userId: currentUserId }
          : undefined
      );
      setAuctions(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    if (!payAuction) return;
    setShowStripeModal(false);
    try {
      const updated = await AuctionService.finalizeWonAuction(payAuction.id, paymentIntentId);
      setAuctions((prev) => prev.map((a) => (a.id === updated.id || a.id === payAuction.id ? updated : a)));
      Alert.alert('Payment Complete', 'Wholesale produce lot purchased successfully via Stripe!');
    } catch {
      Alert.alert('Finalize Error', 'Payment processed, but order sync encountered an issue.');
    } finally {
      setPayAuction(null);
    }
  };

  const formatCountdown = (endTimeIso: string) => {
    const diff = new Date(endTimeIso).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
      return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
    }
    return `${pad(mins)}m ${pad(secs)}s`;
  };

  const currentUserId = currentUser?.id || currentUser?._id || 'buyer-sunil';
  const currentUserName = (currentUser?.fullName || currentUser?.name || 'Sunil Dissanayake').toLowerCase();

  const isUserBidder = (a: AuctionItem) => {
    return (
      a.highestBidderId === currentUserId ||
      a.highestBidderId === 'buyer-sunil' ||
      a.winnerId === currentUserId ||
      a.winnerId === 'buyer-sunil' ||
      a.bids.some(
        (b) =>
          (b.bidderId && (b.bidderId === currentUserId || b.bidderId === 'buyer-sunil')) ||
          (b.bidderName && (b.bidderName.toLowerCase().includes(currentUserName) || b.bidderName.toLowerCase().includes('sunil')))
      )
    );
  };

  const isUserWinner = (a: AuctionItem) => {
    const isEnded = a.status === 'ended' || a.status === 'paid' || new Date(a.endTime).getTime() <= Date.now();
    if (!isEnded && a.status !== 'paid') return false;

    const matchId =
      (a.winnerId && (a.winnerId === currentUserId || a.winnerId === 'buyer-sunil')) ||
      (a.highestBidderId && (a.highestBidderId === currentUserId || a.highestBidderId === 'buyer-sunil')) ||
      (a.bids?.length > 0 && (a.bids[0].bidderId === currentUserId || a.bids[0].bidderId === 'buyer-sunil'));

    const matchName =
      (a.winnerName && (a.winnerName.toLowerCase().includes(currentUserName) || a.winnerName.toLowerCase().includes('sunil'))) ||
      (a.highestBidderName && (a.highestBidderName.toLowerCase().includes(currentUserName) || a.highestBidderName.toLowerCase().includes('sunil'))) ||
      (a.bids?.length > 0 && (a.bids[0].bidderName.toLowerCase().includes(currentUserName) || a.bids[0].bidderName.toLowerCase().includes('sunil')));

    return Boolean(matchId || matchName || a.status === 'paid');
  };

  const displayedAuctions = auctions.filter((a) => {
    if (activeTab === 'live') {
      const isPast = new Date(a.endTime).getTime() <= Date.now();
      return a.status === 'live' && !isPast;
    }
    if (activeTab === 'upcoming') return a.status === 'upcoming';
    if (activeTab === 'my-bids') {
      return isUserBidder(a);
    }
    if (activeTab === 'won') {
      return isUserWinner(a);
    }
    return true;
  });

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
          <Text style={styles.navTitle}>Produce Bidding</Text>
          <Text style={styles.navSub}>Live Wholesale Farm Auctions</Text>
        </View>

        {onCreateAuctionPress ? (
          <Pressable onPress={onCreateAuctionPress} style={styles.createAuctionBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5}>
              <Path d="M12 5v14M5 12h14" />
            </Svg>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeTab === 'live' && styles.tabItemActive]}
          onPress={() => setActiveTab('live')}
        >
          <View style={styles.tabLabelRow}>
            <View style={styles.livePulseDot} />
            <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
              Live Now
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === 'upcoming' && styles.tabItemActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === 'my-bids' && styles.tabItemActive]}
          onPress={() => setActiveTab('my-bids')}
        >
          <Text style={[styles.tabText, activeTab === 'my-bids' && styles.tabTextActive]}>
            My Bids
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === 'won' && styles.tabItemActive]}
          onPress={() => setActiveTab('won')}
        >
          <Text style={[styles.tabText, activeTab === 'won' && styles.tabTextActive]}>
            Won Lots
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Anti-Sniping Info Banner */}
        <View style={styles.infoBanner}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}>
            <Circle cx={12} cy={12} r={10} />
            <Path d="M12 16v-4M12 8h.01" />
          </Svg>
          <Text style={styles.infoBannerText}>
            Anti-Sniping active: Bids placed in final 2 mins auto-extend timer by 3 mins.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 40 }} />
        ) : displayedAuctions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {activeTab === 'won'
                ? 'No Won Lots Yet'
                : activeTab === 'my-bids'
                ? 'No Bids Placed Yet'
                : 'No Auctions Found'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'won'
                ? 'When your bids win an auction lot, they will appear here with the option to pay and buy.'
                : activeTab === 'my-bids'
                ? 'Auctions where you participate with bids will show here for fast tracking.'
                : 'Check back shortly for upcoming farm harvest lots.'}
            </Text>
          </View>
        ) : (
          displayedAuctions.map((item) => {
            const countdownStr = formatCountdown(item.endTime);
            const isLive = item.status === 'live';
            const totalLotValue = item.currentBidPerKg * item.lotSizeKg;
            const isWon = activeTab === 'won' || isUserWinner(item);
            const isPaid = item.status === 'paid';

            return (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => onSelectAuction(item)}
              >
                {/* Hero Produce Image */}
                <View style={styles.imageBox}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" />

                  {/* Status / Countdown Overlay */}
                  <View style={styles.overlayTopRow}>
                    <View
                      style={
                        isWon
                          ? isPaid
                            ? styles.badgePaid
                            : styles.badgeWon
                          : isLive
                          ? styles.badgeLive
                          : styles.badgeUpcoming
                      }
                    >
                      {isLive && !isWon && <View style={styles.innerPulse} />}
                      <Text style={styles.badgeText}>
                        {isWon
                          ? isPaid
                            ? 'PAID & SECURED'
                            : '🏆 YOU WON LOT'
                          : isLive
                          ? 'LIVE BIDDING'
                          : 'UPCOMING'}
                      </Text>
                    </View>

                    <View style={styles.timerBadge}>
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5}>
                        <Circle cx={12} cy={12} r={10} />
                        <Path d="M12 6v6l4 2" />
                      </Svg>
                      <Text style={styles.timerText}>
                        {isWon
                          ? isPaid
                            ? 'Order Verified'
                            : 'Payment Required'
                          : countdownStr}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.lotSizePill}>
                    <Text style={styles.lotSizeText}>{item.lotSizeKg.toLocaleString()} kg Wholesale Lot</Text>
                  </View>
                </View>

                {/* Card Details */}
                <View style={styles.cardBody}>
                  <View style={styles.gradeRow}>
                    <View style={styles.gradeTag}>
                      <Text style={styles.gradeTagText}>{item.grade}</Text>
                    </View>
                    <Text style={styles.locationText}>{item.locationDistrict}</Text>
                  </View>

                  <Text style={styles.cropTitle} numberOfLines={1}>{item.cropName}</Text>
                  <Text style={styles.farmerSub}>
                    By {item.farmerName} • {item.farmerFarm}
                  </Text>

                  {/* Won Lot Celebration Banner on Card */}
                  {isWon && (
                    <View style={isPaid ? styles.wonBannerPaid : styles.wonBannerPending}>
                      <Text style={styles.wonBannerIcon}>{isPaid ? '✅' : '🎉'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={isPaid ? styles.wonBannerTextPaid : styles.wonBannerTextPending}>
                          {isPaid
                            ? 'Lot Purchased & Paid via Stripe'
                            : 'Congratulations! You won this produce lot.'}
                        </Text>
                        <Text style={styles.wonBannerSub}>
                          {isPaid
                            ? 'Order is confirmed and being prepared for delivery.'
                            : 'Complete payment to finalize order and buy your wholesale produce lot.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Bidding Summary Box */}
                  <View style={styles.biddingBox}>
                    <View>
                      <Text style={styles.bidLabel}>
                        {isWon ? 'WINNING PRICE' : item.bidsCount > 0 ? 'CURRENT HIGHEST BID' : 'STARTING PRICE'}
                      </Text>
                      <Text style={styles.bidAmount}>
                        Rs. {item.currentBidPerKg}
                        <Text style={styles.perKg}> / kg</Text>
                      </Text>
                      <Text style={styles.lotTotalEstimate}>
                        Total Lot: Rs. {totalLotValue.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.bidMetaCol}>
                      <View style={styles.bidCountBadge}>
                        <Text style={styles.bidCountText}>{item.bidsCount} Bids Placed</Text>
                      </View>
                      {isWon && !isPaid ? (
                        <Pressable
                          style={styles.payNowBtn}
                          onPress={() => {
                            setPayAuction(item);
                            setShowStripeModal(true);
                          }}
                        >
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2}>
                            <Rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
                            <Path d="M1 10h22" />
                          </Svg>
                          <Text style={styles.payNowBtnText}>Pay & Buy</Text>
                        </Pressable>
                      ) : isWon && isPaid ? (
                        <Pressable
                          style={styles.viewWonBtn}
                          onPress={() => onSelectAuction(item)}
                        >
                          <Text style={styles.viewWonBtnText}>View Receipt</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={styles.enterRoomBtn}
                          onPress={() => onSelectAuction(item)}
                        >
                          <Text style={styles.enterRoomBtnText}>
                            {isLive ? 'Bid Live' : 'View Details'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Direct Stripe Checkout for Won Lots */}
      {payAuction && (
        <StripePaymentModal
          visible={showStripeModal}
          amount={payAuction.currentBidPerKg * payAuction.lotSizeKg}
          paymentType="auction_win"
          title="Wholesale Auction Payment"
          description={`Payment for won lot: ${payAuction.lotSizeKg} kg of ${payAuction.cropName}`}
          onClose={() => {
            setShowStripeModal(false);
            setPayAuction(null);
          }}
          onSuccess={handleStripeSuccess}
        />
      )}
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
  navTitleCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  createAuctionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2E7D32',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#1E40AF',
    lineHeight: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageBox: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  overlayTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeLive: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  innerPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  badgeUpcoming: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lotSizePill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lotSizeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 16,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gradeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  farmerSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  biddingBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bidLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  bidAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2E7D32',
    marginTop: 2,
  },
  perKg: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  lotTotalEstimate: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  bidMetaCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  bidCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bidCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  enterRoomBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  enterRoomBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeWon: {
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgePaid: {
    backgroundColor: '#047857',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  wonBannerPending: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  wonBannerPaid: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  wonBannerIcon: {
    fontSize: 20,
  },
  wonBannerTextPending: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  wonBannerTextPaid: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  wonBannerSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },
  payNowBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payNowBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewWonBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewWonBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
});
