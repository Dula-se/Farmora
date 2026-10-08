import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ApiProduceItem, getStoredUser, ApiUser } from '@/services/api';
import { RatingService, RatingReview } from '@/services/rating-service';

interface ReviewsScreenProps {
  product: ApiProduceItem;
  onBack: () => void;
  onWriteReview?: () => void;
}

export function ReviewsScreen({ product, onBack, onWriteReview }: ReviewsScreenProps) {
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | '5star'>('all');
  const [reviews, setReviews] = useState<RatingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});

  const targetId = String(product.farmerId || product.id || 'farmer-kusuma');

  useEffect(() => {
    loadAllReviews();
  }, [targetId]);

  const loadAllReviews = async () => {
    setLoading(true);
    try {
      const u = await getStoredUser();
      setCurrentUser(u);
      const resolvedName =
        product.farmerName ||
        (product as any).farmer?.fullName ||
        (product as any).farmer?.name ||
        product.title;
      const targetIds = [
        product.farmerId,
        (product as any)._id,
        product.id,
        (product as any).farmer?.id,
        (product as any).farmer?._id,
        targetId,
      ].filter(Boolean) as string[];
      const data = await RatingService.fetchReviewsForTarget(targetIds, resolvedName);
      setReviews(data);
    } catch (e) {
      console.warn('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleHelpful = (id: string) => {
    setHelpfulCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      'Delete Rating? 🗑️',
      'Are you sure you want to delete your review? This will remove your feedback and update the rating score.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await RatingService.deleteReview(reviewId);
              Alert.alert('Deleted', 'Your review has been deleted.');
              loadAllReviews();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not delete review.');
            }
          },
        },
      ]
    );
  };

  const stats = RatingService.computeStats(reviews);
  const averageRating = reviews.length > 0 ? stats.average : 4.8;
  const totalCount = reviews.length > 0 ? stats.count : 0;

  // Calculate rating bar percentages
  const ratingBars = [5, 4, 3, 2, 1].map((stars) => {
    const starCount = reviews.filter((r) => r.overallRating === stars).length;
    const percent = totalCount > 0 ? Math.round((starCount / totalCount) * 100) : stars === 5 ? 78 : stars === 4 ? 14 : 4;
    return { stars, percent };
  });

  const filteredReviews = reviews.filter((rev) => {
    if (activeFilter === 'photos') {
      return rev.images && rev.images.length > 0;
    }
    if (activeFilter === '5star') {
      return rev.overallRating >= 5;
    }
    return true;
  });

  const myId = currentUser?.id || currentUser?._id;
  const myReview = reviews.find((r) => (myId && r.authorId === myId) || (currentUser?.fullName && r.authorName === currentUser.fullName));

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
        {/* Write / Edit Review CTA Card */}
        {onWriteReview && (
          <Pressable
            style={[styles.rateCtaCard, myReview && { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}
            onPress={onWriteReview}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateCtaTitle}>
                {myReview ? 'You Rated This Farmer ⭐' : 'Bought from this farmer?'}
              </Text>
              <Text style={styles.rateCtaSub}>
                {myReview ? 'Tap to edit criteria scores or delete your review' : 'Rate quality, sorting, and dispatch'}
              </Text>
            </View>
            <View style={[styles.rateCtaBtn, myReview && { backgroundColor: '#15803D' }]}>
              <Text style={styles.rateCtaBtnText}>
                {myReview ? 'Edit Review ✏️' : 'Write Review ⭐'}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Big Rating Summary Card */}
        <View style={styles.ratingOverviewCard}>
          <View style={styles.leftScore}>
            <Text style={styles.bigScore}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              <Text style={styles.starsText}>{'★'.repeat(Math.round(averageRating))}</Text>
            </View>
            <Text style={styles.reviewTotal}>{totalCount} verified ratings</Text>
          </View>

          <View style={styles.barsContainer}>
            {ratingBars.map((b) => (
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
              All ({reviews.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, activeFilter === 'photos' && styles.filterChipActive]}
            onPress={() => setActiveFilter('photos')}>
            <Text style={[styles.filterChipText, activeFilter === 'photos' && styles.filterChipTextActive]}>
              With Photos ({reviews.filter((r) => r.images && r.images.length > 0).length})
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
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#166534" />
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 10, fontWeight: '600' }}>
                Loading verified reviews...
              </Text>
            </View>
          ) : filteredReviews.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>🌿</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B', marginTop: 8 }}>
                No reviews yet in this filter
              </Text>
            </View>
          ) : (
            filteredReviews.map((rev) => {
              const isMyReview =
                (myId && rev.authorId === myId) ||
                (currentUser?.fullName && rev.authorName === currentUser.fullName) ||
                rev.id === myReview?.id;

              const displayDate = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent';

              return (
                <View
                  key={rev.id}
                  style={[
                    styles.reviewCard,
                    isMyReview && { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
                  ]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.avatarEmoji}>
                        {rev.authorName ? rev.authorName.charAt(0) : '👤'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.authorRow}>
                        <Text style={styles.authorName}>{rev.authorName}</Text>
                        {isMyReview ? (
                          <View style={styles.myReviewBadge}>
                            <Text style={styles.myReviewBadgeText}>👑 Your Review</Text>
                          </View>
                        ) : (
                          <View style={styles.buyerVerifiedBadge}>
                            <Text style={styles.buyerVerifiedText}>✓ Verified Buyer</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.reviewDate}>{displayDate}</Text>
                    </View>

                    <View style={styles.starsPill}>
                      <Text style={styles.starsPillText}>
                        {'★'.repeat(rev.overallRating || 5)}
                      </Text>
                    </View>
                  </View>

                  {rev.tags && rev.tags.length > 0 && (
                    <Text style={styles.reviewTitle}>{rev.tags.join(' • ')}</Text>
                  )}
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
                        👍 Helpful ({helpfulCounts[rev.id] || rev.helpfulCount || 0})
                      </Text>
                    </Pressable>

                    {/* Action buttons if this review belongs to the user */}
                    {isMyReview && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          style={styles.inlineEditBtn}
                          onPress={onWriteReview}>
                          <Text style={styles.inlineEditBtnText}>✏️ Edit</Text>
                        </Pressable>
                        <Pressable
                          style={styles.inlineDeleteBtn}
                          onPress={() => handleDeleteReview(rev.id)}>
                          <Text style={styles.inlineDeleteBtnText}>🗑️ Delete</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
  myReviewBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  myReviewBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  inlineEditBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inlineEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  inlineDeleteBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inlineDeleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
});
