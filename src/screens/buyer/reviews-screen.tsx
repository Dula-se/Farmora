import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ApiProduceItem } from '@/services/api';

interface ReviewsScreenProps {
  product: ApiProduceItem;
  onBack: () => void;
}

const DEMO_REVIEWS = [
  {
    id: 'r1',
    author: 'Chinthaka Perera',
    date: '2 days ago',
    rating: 5,
    title: 'Extremely fresh and well packaged!',
    comment:
      'Harvest was crisp and sweet. Arrived washed and sorted in ventilated wooden crates. Zero bruising. Perfect for our restaurant kitchen in Colombo.',
    helpful: 14,
  },
  {
    id: 'r2',
    author: 'Dilshan Wickramasinghe',
    date: '5 days ago',
    rating: 5,
    title: 'Direct farm gate pricing saved us 20%',
    comment:
      'We usually buy from the Pettah market where prices fluctuate wildly. Getting 200kg straight from Welimada plots at guaranteed rates is a game changer.',
    helpful: 9,
  },
  {
    id: 'r3',
    author: 'Manjula Senaratne',
    date: '1 week ago',
    rating: 4,
    title: 'Very good quality, fast dispatch',
    comment:
      'Produce was top tier. Delivery took around 4 hours from highland dispatch to Kandy delivery. Will order on a weekly schedule.',
    helpful: 5,
  },
];

const RATING_BARS = [
  { stars: 5, percent: 78 },
  { stars: 4, percent: 14 },
  { stars: 3, percent: 5 },
  { stars: 2, percent: 2 },
  { stars: 1, percent: 1 },
];

export function ReviewsScreen({ product, onBack }: ReviewsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | '5star'>('all');
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({
    r1: 14,
    r2: 9,
    r3: 5,
  });

  const toggleHelpful = (id: string) => {
    setHelpfulCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Rating Overview Card */}
        <View style={styles.ratingOverviewCard}>
          <View style={styles.leftScore}>
            <Text style={styles.bigScore}>4.8</Text>
            <View style={styles.starsRow}>
              <Text style={styles.starsText}>★★★★★</Text>
            </View>
            <Text style={styles.reviewTotal}>Based on 124 reviews</Text>
          </View>

          {/* Distribution Bars */}
          <View style={styles.barsContainer}>
            {RATING_BARS.map((bar) => (
              <View key={bar.stars} style={styles.barRow}>
                <Text style={styles.barLabel}>{bar.stars} ★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${bar.percent}%` }]} />
                </View>
                <Text style={styles.barPercent}>{bar.percent}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Feature Sub-Ratings */}
        <View style={styles.subRatingsRow}>
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingValue}>4.9</Text>
            <Text style={styles.subRatingLabel}>Freshness</Text>
          </View>
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingValue}>4.8</Text>
            <Text style={styles.subRatingLabel}>Grading / Quality</Text>
          </View>
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingValue}>4.7</Text>
            <Text style={styles.subRatingLabel}>Value for Money</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          <Pressable
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}>
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All (124)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, activeFilter === 'photos' && styles.filterChipActive]}
            onPress={() => setActiveFilter('photos')}>
            <Text style={[styles.filterChipText, activeFilter === 'photos' && styles.filterChipTextActive]}>
              With Photos (36)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, activeFilter === '5star' && styles.filterChipActive]}
            onPress={() => setActiveFilter('5star')}>
            <Text style={[styles.filterChipText, activeFilter === '5star' && styles.filterChipTextActive]}>
              5 Stars Only
            </Text>
          </Pressable>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {DEMO_REVIEWS.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerAvatar}>
                  <Text style={styles.avatarEmoji}>{rev.author.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.authorRow}>
                    <Text style={styles.authorName}>{rev.author}</Text>
                    <View style={styles.buyerVerifiedBadge}>
                      <Text style={styles.buyerVerifiedText}>✓ Verified Buyer</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{rev.date}</Text>
                </View>

                <View style={styles.starsPill}>
                  <Text style={styles.starsPillText}>{'★'.repeat(rev.rating)}</Text>
                </View>
              </View>

              <Text style={styles.reviewTitle}>{rev.title}</Text>
              <Text style={styles.reviewComment}>{rev.comment}</Text>

              <View style={styles.reviewFooter}>
                <Pressable
                  style={styles.helpfulBtn}
                  onPress={() => toggleHelpful(rev.id)}>
                  <Text style={styles.helpfulText}>
                    👍 Helpful ({helpfulCounts[rev.id] || 0})
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  ratingOverviewCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 16,
  },
  leftScore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    width: 110,
  },
  bigScore: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
  },
  starsRow: {
    marginVertical: 4,
  },
  starsText: {
    fontSize: 14,
    color: '#D97706',
  },
  reviewTotal: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  barsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    color: '#64748B',
    width: 24,
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#386641',
    borderRadius: 4,
  },
  barPercent: {
    fontSize: 10,
    color: '#94A3B8',
    width: 28,
    textAlign: 'right',
  },
  subRatingsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECE8',
  },
  subRatingItem: {
    flex: 1,
    alignItems: 'center',
  },
  subRatingValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  subRatingLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  filterChipActive: {
    backgroundColor: '#386641',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  buyerVerifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  buyerVerifiedText: {
    fontSize: 9,
    color: '#166534',
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  starsPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  starsPillText: {
    fontSize: 11,
    color: '#D97706',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  reviewFooter: {
    flexDirection: 'row',
    marginTop: 4,
  },
  helpfulBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  helpfulText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
