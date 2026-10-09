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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { AuctionItem, AuctionService } from '@/services/auction-service';
import { getStoredUser } from '@/services/api';
import { StripePaymentModal } from './stripe-payment-modal';

interface AuctionRoomScreenProps {
  auction: AuctionItem;
  onBack: () => void;
  onAuctionUpdated?: (updated: AuctionItem) => void;
}

export function AuctionRoomScreen({
  auction: initialAuction,
  onBack,
  onAuctionUpdated,
}: AuctionRoomScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [auction, setAuction] = useState<AuctionItem>(initialAuction);
  const [bidPerKg, setBidPerKg] = useState<number>(initialAuction.currentBidPerKg + 5);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [tick, setTick] = useState(0);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showWonModal, setShowWonModal] = useState(false);

  useEffect(() => {
    getStoredUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  // 1-second countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const diffMs = new Date(auction.endTime).getTime() - Date.now();
  const isEnded = diffMs <= 0 || auction.status === 'ended' || auction.status === 'paid';
  const isUrgent = diffMs > 0 && diffMs < 5 * 60 * 1000; // < 5 mins

  const formatClock = () => {
    if (diffMs <= 0) return '00:00:00';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  const currentTotal = auction.currentBidPerKg * auction.lotSizeKg;
  const proposedTotal = bidPerKg * auction.lotSizeKg;

  const handleIncrement = (delta: number) => {
    setBidPerKg((prev) => Math.max(auction.currentBidPerKg + 1, prev + delta));
  };

  const handlePlaceBid = async () => {
    if (bidPerKg <= auction.currentBidPerKg) {
      Alert.alert('Invalid Bid', `Your bid must be at least Rs. ${auction.currentBidPerKg + 1} per kg.`);
      return;
    }

    setIsPlacingBid(true);
    try {
      const updated = await AuctionService.placeBid(auction.id, bidPerKg);
      setAuction(updated);
      setBidPerKg(updated.currentBidPerKg + 5);
      onAuctionUpdated?.(updated);
      Alert.alert('Bid Placed!', `You are now the highest bidder at Rs. ${updated.currentBidPerKg}/kg!`);
    } catch (e: any) {
      Alert.alert('Bid Error', e?.message || 'Could not place bid.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handlePayWonLot = () => {
    setShowStripeModal(true);
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    setShowStripeModal(false);
    try {
      const updated = await AuctionService.finalizeWonAuction(auction.id, paymentIntentId);
      setAuction(updated);
      onAuctionUpdated?.(updated);
      setShowWonModal(false);
      Alert.alert('Payment Complete', 'Wholesale produce lot purchased successfully via Stripe!');
    } catch {
      Alert.alert('Finalize Error', 'Payment completed, but order sync encountered an issue.');
    }
  };

  const currentUserId = currentUser?.id || currentUser?._id || 'buyer-sunil';
  const currentUserName = (currentUser?.fullName || currentUser?.name || 'Sunil Dissanayake').toLowerCase();

  const isHighestBidder =
    (auction.highestBidderId && (auction.highestBidderId === currentUserId || auction.highestBidderId === 'buyer-sunil')) ||
    (auction.winnerId && (auction.winnerId === currentUserId || auction.winnerId === 'buyer-sunil')) ||
    (auction.highestBidderName && (auction.highestBidderName.toLowerCase() === currentUserName || auction.highestBidderName.toLowerCase().includes('sunil'))) ||
    (auction.winnerName && (auction.winnerName.toLowerCase() === currentUserName || auction.winnerName.toLowerCase().includes('sunil'))) ||
    (auction.bids?.length > 0 && (
      auction.bids[0].bidderId === currentUserId ||
      auction.bids[0].bidderId === 'buyer-sunil' ||
      auction.bids[0].bidderName.toLowerCase() === currentUserName ||
      auction.bids[0].bidderName.toLowerCase().includes('sunil')
    ));

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
          <View style={styles.liveBadgeRow}>
            <View style={isEnded ? styles.dotGrey : styles.dotRed} />
            <Text style={styles.liveNavTitle}>{isEnded ? 'AUCTION ENDED' : 'LIVE AUCTION ROOM'}</Text>
          </View>
          <Text style={styles.lotSizeHeader}>{auction.lotSizeKg} kg Lot</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Countdown Banner */}
        <View style={[styles.timerBanner, isUrgent && styles.timerBannerUrgent]}>
          <Text style={[styles.timerLabel, isUrgent && styles.timerLabelUrgent]}>
            {isEnded ? 'FINAL BIDDING CLOSED' : 'AUCTION ENDS IN'}
          </Text>
          <Text style={[styles.timerClock, isUrgent && styles.timerClockUrgent]}>
            {formatClock()}
          </Text>
          <Text style={styles.antiSnipingNote}>
            🛡️ Anti-Sniping Active • Late bids add +3 mins
          </Text>
        </View>

        {/* Won Celebration Banner or Highest Bidder Indicator */}
        {isEnded && isHighestBidder ? (
          <View style={styles.wonCelebrationCard}>
            <View style={styles.wonTrophyRow}>
              <Text style={styles.wonTrophyIcon}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.wonCelebrationTitle}>You Won This Produce Lot!</Text>
                <Text style={styles.wonCelebrationSub}>
                  {auction.status === 'paid'
                    ? 'Payment verified via Stripe • Order confirmed for dispatch'
                    : 'Your final bid was the highest. Complete payment to secure and buy your produce.'}
                </Text>
              </View>
            </View>

            <View style={styles.wonSummaryBox}>
              <View style={styles.wonSummaryCol}>
                <Text style={styles.wonSummaryLabel}>WINNING BID</Text>
                <Text style={styles.wonSummaryValue}>Rs. {auction.currentBidPerKg} / kg</Text>
              </View>
              <View style={styles.wonSummaryDivider} />
              <View style={styles.wonSummaryCol}>
                <Text style={styles.wonSummaryLabel}>LOT SIZE</Text>
                <Text style={styles.wonSummaryValue}>{auction.lotSizeKg.toLocaleString()} {auction.unit}</Text>
              </View>
              <View style={styles.wonSummaryDivider} />
              <View style={styles.wonSummaryCol}>
                <Text style={styles.wonSummaryLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.wonSummaryHighlight}>Rs. {currentTotal.toLocaleString()}</Text>
              </View>
            </View>

            {auction.status !== 'paid' ? (
              <Pressable style={styles.wonPayHeroBtn} onPress={handlePayWonLot}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2}>
                  <Rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
                  <Path d="M1 10h22" />
                </Svg>
                <Text style={styles.wonPayHeroBtnText}>
                  Pay Rs. {currentTotal.toLocaleString()} & Buy Lot via Stripe
                </Text>
              </Pressable>
            ) : (
              <View style={styles.wonPaidHeroBadge}>
                <Text style={styles.wonPaidHeroBadgeText}>
                  ✅ Lot Purchased & Paid Successfully
                </Text>
              </View>
            )}
          </View>
        ) : !isEnded && isHighestBidder ? (
          <View style={styles.leaderBanner}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={2.5}>
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
            <Text style={styles.leaderBannerText}>You are currently the Highest Bidder!</Text>
          </View>
        ) : null}

        {/* Produce Overview Card */}
        <View style={styles.card}>
          <View style={styles.produceRow}>
            <Image source={{ uri: auction.image }} style={styles.produceImg} contentFit="cover" />
            <View style={styles.produceMeta}>
              <View style={styles.gradePill}>
                <Text style={styles.gradePillText}>{auction.grade}</Text>
              </View>
              <Text style={styles.cropTitle} numberOfLines={2}>{auction.cropName}</Text>
              <Text style={styles.farmerDetail}>
                Farmer: {auction.farmerName} ({auction.locationDistrict})
              </Text>
              <Text style={styles.lotSpec}>
                Wholesale Lot: {auction.lotSizeKg.toLocaleString()} {auction.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Current Highest Bid Card */}
        <View style={styles.highestBidCard}>
          <Text style={styles.highestBidLabel}>CURRENT HIGHEST BID</Text>
          <View style={styles.highestBidAmountRow}>
            <Text style={styles.highestBidAmount}>
              Rs. {auction.currentBidPerKg}
              <Text style={styles.perKgUnit}> / kg</Text>
            </Text>
            <View style={styles.lotTotalBadge}>
              <Text style={styles.lotTotalBadgeText}>
                Lot Total: Rs. {currentTotal.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.highestBidderRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {auction.highestBidderName ? auction.highestBidderName[0] : 'F'}
              </Text>
            </View>
            <Text style={styles.highestBidderName}>
              Lead: {auction.highestBidderName || 'Starting Bid'}
            </Text>
            <Text style={styles.bidsTotalCount}>({auction.bidsCount} total bids)</Text>
          </View>
        </View>

        {/* Live Bid History List */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Live Bid Activity</Text>
          {auction.bids.length === 0 ? (
            <Text style={styles.noBidsText}>No bids placed yet. Be the first to bid!</Text>
          ) : (
            auction.bids.slice(0, 5).map((b, idx) => (
              <View key={`${b.timestamp}-${idx}`} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyBidder}>{b.bidderName}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyPrice}>Rs. {b.bidAmountPerKg} / kg</Text>
                  <Text style={styles.historyLotTotal}>Rs. {b.totalLotAmount.toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Interactive Bidding Bottom Sheet */}
      {!isEnded ? (
        <View style={[styles.bottomBiddingBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Quick Increment Chips */}
          <View style={styles.quickChipsRow}>
            {[5, 10, 25, 50].map((inc) => (
              <Pressable
                key={inc}
                style={styles.chipBtn}
                onPress={() => handleIncrement(inc)}
              >
                <Text style={styles.chipBtnText}>+Rs. {inc}</Text>
              </Pressable>
            ))}
          </View>

          {/* Bid Selector & Place Button */}
          <View style={styles.actionRow}>
            <View style={styles.bidInputBox}>
              <Text style={styles.inputSubLabel}>Your Bid / kg</Text>
              <View style={styles.counterRow}>
                <Pressable
                  style={styles.minusBtn}
                  onPress={() => setBidPerKg((p) => Math.max(auction.currentBidPerKg + 1, p - 5))}
                >
                  <Text style={styles.btnSymbol}>-</Text>
                </Pressable>
                <Text style={styles.bidNumber}>Rs. {bidPerKg}</Text>
                <Pressable style={styles.plusBtn} onPress={() => setBidPerKg((p) => p + 5)}>
                  <Text style={styles.btnSymbol}>+</Text>
                </Pressable>
              </View>
              <Text style={styles.lotEstSummary}>
                Total: Rs. {proposedTotal.toLocaleString()}
              </Text>
            </View>

            <Pressable
              style={[styles.placeBidBtn, isPlacingBid && styles.btnDisabled]}
              onPress={handlePlaceBid}
              disabled={isPlacingBid}
            >
              <Text style={styles.placeBidBtnText}>Place Bid</Text>
            </Pressable>
          </View>
        </View>
      ) : isEnded ? (
        <View style={[styles.bottomBiddingBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {isHighestBidder && auction.status !== 'paid' ? (
            <Pressable style={styles.wonPayBtn} onPress={handlePayWonLot}>
              <Text style={styles.wonPayBtnText}>
                You Won! Pay Rs. {currentTotal.toLocaleString()} via Stripe
              </Text>
            </Pressable>
          ) : isHighestBidder && auction.status === 'paid' ? (
            <View style={styles.paidConfirmedBar}>
              <Text style={styles.paidConfirmedText}>✅ Paid & Order Confirmed via Stripe</Text>
            </View>
          ) : (
            <View style={styles.endedInfoBar}>
              <Text style={styles.endedInfoText}>
                Auction Ended • Winning Bid: Rs. {auction.currentBidPerKg}/kg
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Stripe Checkout Modal for Winning Auction */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={currentTotal}
        paymentType="auction_win"
        title="Wholesale Auction Payment"
        description={`Payment for won lot: ${auction.lotSizeKg} kg of ${auction.cropName}`}
        onClose={() => setShowStripeModal(false)}
        onSuccess={handleStripeSuccess}
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
  navTitleCenter: {
    alignItems: 'center',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  dotGrey: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  liveNavTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  lotSizeHeader: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  timerBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  timerBannerUrgent: {
    backgroundColor: '#7F1D1D',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  timerLabelUrgent: {
    color: '#FECACA',
  },
  timerClock: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 2,
  },
  timerClockUrgent: {
    color: '#F87171',
  },
  antiSnipingNote: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 6,
  },
  leaderBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  leaderBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  payNowMiniBtn: {
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payNowMiniBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  produceRow: {
    flexDirection: 'row',
  },
  produceImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  produceMeta: {
    flex: 1,
  },
  gradePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  gradePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  farmerDetail: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  lotSpec: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 2,
  },
  highestBidCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  highestBidLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  highestBidAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  highestBidAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#14532D',
  },
  perKgUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  lotTotalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lotTotalBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  highestBidderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 10,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  highestBidderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  bidsTotalCount: {
    fontSize: 12,
    color: '#64748B',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  noBidsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 14,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyLeft: {
    flex: 1,
  },
  historyBidder: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  historyLotTotal: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bottomBiddingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  chipBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bidInputBox: {
    flex: 1,
  },
  inputSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    gap: 10,
  },
  minusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  bidNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  lotEstSummary: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  placeBidBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeBidBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  wonPayBtn: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  wonPayBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  wonCelebrationCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  wonTrophyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  wonTrophyIcon: {
    fontSize: 34,
  },
  wonCelebrationTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#14532D',
  },
  wonCelebrationSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
    lineHeight: 17,
  },
  wonSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 14,
  },
  wonSummaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  wonSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  wonSummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  wonSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  wonSummaryHighlight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
  },
  wonPayHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  wonPayHeroBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  wonPaidHeroBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  wonPaidHeroBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  paidConfirmedBar: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  paidConfirmedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  endedInfoBar: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  endedInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
