import React, { useState, useEffect } from 'react';
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
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { ApiProduceItem } from '@/services/api';
import { ChatService, ReviewItem } from '@/services/chat-service';

interface ReviewsScreenProps {
  product: ApiProduceItem;
  onBack: () => void;
  onWriteReview?: () => void;
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
    images: [] as string[],
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
    images: [] as string[],
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
    images: [] as string[],
  },
];

const RATING_BARS = [
  { stars: 5, percent: 78 },
  { stars: 4, percent: 14 },
  { stars: 3, percent: 5 },
  { stars: 2, percent: 2 },
  { stars: 1, percent: 1 },
];

export function ReviewsScreen({ product, onBack, onWriteReview }: ReviewsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | '5star'>('all');
  const [submittedReviews, setSubmittedReviews] = useState<ReviewItem[]>([]);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({
    r1: 14,
    r2: 9,
    r3: 5,
  });

  useEffect(() => {
    loadDynamicReviews();
  }, []);

  const loadDynamicReviews = async () => {
    try {
      const revs = await ChatService.getReviews();
      setSubmittedReviews(revs);
    } catch (e) {
      console.log('Failed to load reviews:', e);
    }
  };

  const toggleHelpful = (id: string) => {
    setHelpfulCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  // Convert submitted reviews to display format
  const dynamicFormatted = submittedReviews.map((r) => ({
    id: r.id,
    author: r.authorName,
    date: r.date,
    rating: r.overallRating,
    title: r.tags.length > 0 ? r.tags.join(' • ') : 'Verified Harvest Feedback',
    comment: r.comment,
    helpful: r.helpfulCount,
    images: r.images || [],
  }));

  const allCombined = [...dynamicFormatted, ...DEMO_REVIEWS];

  const filteredReviews = allCombined.filter((rev) => {
    if (activeFilter === 'photos') {
      return rev.images && rev.images.length > 0;
    }
    if (activeFilter === '5star') {
      return rev.rating >= 5;
    }
    return true;
  });

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
        {onWriteReview ? (
          <Pressable
            onPress={onWriteReview}
            style={{ backgroundColor: '#1E5E3A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>+ Rate</Text>
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Write Review CTA Card */}
        {onWriteReview && (
          <Pressable
            style={styles.rateCtaCard}
            onPress={onWriteReview}>
            <View>
              <Text style={styles.rateCtaTitle}>Bought from this farmer?</Text>
              <Text style={styles.rateCtaSub}>Rate quality, sorting, and dispatch</Text>
            </View>
            <View style={styles.rateCtaBtn}>
              <Text style={styles.rateCtaBtnText}>Write Review ⭐</Text>
            </View>
          </Pressable>
        )}

        {/* Big Rating Summary Card */}
        <View style={styles.ratingOverviewCard}>
          <View style={styles.leftScore}>
            <Text style={styles.bigScore}>4.8</Text>
            <View style={styles.starsRow}>
              <Text style={styles.starsText}>★★★★★</Text>
            </View>
            <Text style={styles.reviewTotal}>{allCombined.length} verified ratings</Text>
          </View>

          <View style={styles.barsContainer}>
            {RATING_BARS.map((b) => (
              <View key={b.stars} style={styles.barRow}>
                <Text style={styles.barLabel}>{b.stars}★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${b.percent}%` }]} />
                </View>
                <Text style={styles.barPercent}>{b.percent}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sub-Criteria Breakdown */}
        <View style={styles.subRatingsRow}>
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingScore}>4.9</Text>
            <Text style={styles.subRatingLabel}>Freshness</Text>
          </View>
          <View style={styles.subDivider} />
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingScore}>4.8</Text>
            <Text style={styles.subRatingLabel}>Grading</Text>
          </View>
          <View style={styles.subDivider} />
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingScore}>4.7</Text>
            <Text style={styles.subRatingLabel}>Packaging</Text>
          </View>
          <View style={styles.subDivider} />
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingScore}>4.9</Text>
            <Text style={styles.subRatingLabel}>Dispatch</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          <Pressable
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}>
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All ({allCombined.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, activeFilter === 'photos' && styles.filterChipActive]}
            onPress={() => setActiveFilter('photos')}>
            <Text style={[styles.filterChipText, activeFilter === 'photos' && styles.filterChipTextActive]}>
              With Photos ({allCombined.filter((r) => r.images && r.images.length > 0).length})
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
          {filteredReviews.map((rev) => (
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

              {/* Photos if attached (Base64) */}
              {rev.images && rev.images.length > 0 && (
                <View style={styles.imagesRow}>
                  {rev.images.map((imgUri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: imgUri }}
                      style={styles.reviewAttachedImg}
                      contentFit="cover"
                    />
                  ))}
                </View>
              )}

              <View style={styles.reviewFooter}>
                <Pressable
                  style={styles.helpfulBtn}
                  onPress={() => toggleHelpful(rev.id)}>
                  <Text style={styles.helpfulText}>
                    👍 Helpful ({helpfulCounts[rev.id] || rev.helpful || 0})
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
  rateCtaCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateCtaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  rateCtaSub: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  rateCtaBtn: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  rateCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  subRatingScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  subRatingLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  subDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    height: '80%',
    alignSelf: 'center',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewsList: {
    gap: 14,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  buyerVerifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  buyerVerifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  starsPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  starsPillText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  reviewAttachedImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  helpfulBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  helpfulText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
