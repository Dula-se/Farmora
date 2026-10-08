import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchPublicFarmerProfile,
  fetchProduceListings,
  toggleFavouriteFarmApi,
  ApiProduceItem,
  getStoredUser,
  ApiUser,
} from '@/services/api';
import { useCart } from '@/context/cart-context';
import { RatingService, RatingReview } from '@/services/rating-service';

interface FarmerPublicProfileScreenProps {
  farmerId?: string;
  farmerName?: string;
  farmerAvatar?: string;
  onBack?: () => void;
  onSelectProduce?: (produce: ApiProduceItem) => void;
  onOpenChat?: (farmer: { id: string; name: string }) => void;
  onRateFarmer?: (farmer: { id: string; name: string; avatar?: string }) => void;
  onViewOnMap?: (farmer: { id: string; name: string }) => void;
}

export function FarmerPublicProfileScreen({
  farmerId = 'kamal-gunawardana',
  farmerName = 'Kamal Gunawardana',
  farmerAvatar,
  onBack,
  onSelectProduce,
  onOpenChat,
  onRateFarmer,
  onViewOnMap,
}: FarmerPublicProfileScreenProps) {
  const { addToCart } = useCart();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<ApiProduceItem[]>([]);

  // Rating and reviews state
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [reviews, setReviews] = useState<RatingReview[]>([]);
  const [myReview, setMyReview] = useState<RatingReview | null>(null);

  useEffect(() => {
    loadProfile();
    loadFarmerReviews();
  }, [farmerId]);

  const loadFarmerReviews = async () => {
    try {
      const [revs, u] = await Promise.all([
        RatingService.fetchReviewsForTarget(farmerId),
        getStoredUser(),
      ]);
      setReviews(revs);
      setCurrentUser(u);
      const myId = u?.id || u?._id;
      const found = revs.find(
        (r) =>
          (myId && r.authorId === myId) ||
          (u?.fullName && r.authorName === u.fullName)
      );
      setMyReview(found || null);
    } catch (err) {
      console.warn('Error loading farmer reviews:', err);
    }
  };

  const handleDeleteMyReview = (reviewId: string) => {
    Alert.alert(
      'Delete Rating? 🗑️',
      'Are you sure you want to delete your rating for this farmer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await RatingService.deleteReview(reviewId);
              Alert.alert('Deleted', 'Your review has been removed.');
              loadFarmerReviews();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete review.');
            }
          },
        },
      ]
    );
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchPublicFarmerProfile(farmerId);
      setProfile(data);
    } catch {
      // Fallback preview data matching Screen 10 in Figma
      setProfile({
        id: farmerId,
        fullName: farmerName || 'Kamal Gunawardana',
        district: 'Nuwara Eliya',
        rating: 4.9,
        reviewsCount: 124,
        bio: 'Kamal has been running his farm in Nuwara Eliya for over 15 years, specializing in organic highland vegetables. He uses eco-friendly pest control and natural spring water irrigation.',
        mobileNumber: '+94 77 987 6543',
        farmLocations: ['Highland Valley Farm, Hakgala Road, Nuwara Eliya'],
        stats: {
          crops: 14,
          experience: '15 Years',
          responseTime: '< 2 Hours',
        },
        certifications: ['GAP Certified', 'USDA Organic', 'Highland Natural'],
      });
    }

    try {
      const prods = await fetchProduceListings({ farmerId });
      if (prods && prods.length > 0) {
        setFeaturedProducts(prods);
      } else {
        // Fallback featured items
        setFeaturedProducts([
          {
            id: 'kamal-p1',
            title: 'Highland Fresh Carrots',
            category: 'Vegetables',
            description: 'Crisp, organically grown carrots from Nuwara Eliya springs.',
            pricePerUnit: 280,
            currency: 'LKR',
            unit: 'kg',
            availableQuantity: 350,
            minimumOrderQuantity: 10,
            locationDistrict: 'Nuwara Eliya',
            locationCity: 'Hakgala',
            images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=500'],
            farmerId: farmerId,
            farmerName: 'Kamal Gunawardana',
            farmerMobile: '+94 77 987 6543',
            isOrganic: true,
          },
          {
            id: 'kamal-p2',
            title: 'Crisp Leeks (Organically Grown)',
            category: 'Vegetables',
            description: 'Highland leeks grown without synthetic pesticides.',
            pricePerUnit: 310,
            currency: 'LKR',
            unit: 'kg',
            availableQuantity: 200,
            minimumOrderQuantity: 5,
            locationDistrict: 'Nuwara Eliya',
            locationCity: 'Hakgala',
            images: ['https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500'],
            farmerId: farmerId,
            farmerName: 'Kamal Gunawardana',
            farmerMobile: '+94 77 987 6543',
            isOrganic: true,
          },
          {
            id: 'kamal-p3',
            title: 'Red Round Radish',
            category: 'Vegetables',
            description: 'Juicy organic red radish freshly pulled from garden beds.',
            pricePerUnit: 190,
            currency: 'LKR',
            unit: 'kg',
            availableQuantity: 180,
            minimumOrderQuantity: 5,
            locationDistrict: 'Nuwara Eliya',
            locationCity: 'Hakgala',
            images: ['https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=500'],
            farmerId: farmerId,
            farmerName: 'Kamal Gunawardana',
            farmerMobile: '+94 77 987 6543',
            isOrganic: true,
          },
        ]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    setIsFollowing((prev) => !prev);
    try {
      await toggleFavouriteFarmApi(farmerId);
    } catch {
      // Toggle locally
    }
  };

  const handleCall = () => {
    const phone = profile?.mobileNumber || '+94779876543';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Calling Farmer', `Dialing ${phone}`);
    });
  };

  const handleShare = () => {
    Alert.alert('Share Profile', `Sharing link to ${profile?.fullName || farmerName}'s farm profile.`);
  };

  const sampleReviews = [
    {
      id: 'r1',
      name: 'Nimal S.',
      rating: 5,
      date: '2 days ago',
      text: 'Exceptional quality carrots! Delivered fresh to our restaurant in Kandy with next-day cold chain delivery.',
    },
    {
      id: 'r2',
      name: 'Aroma Cafe',
      rating: 5,
      date: '1 week ago',
      text: 'Kamal is our regular supplier for premium highland produce. Super reliable packaging and fair pricing.',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#386641" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2E20" />

      {/* Hero Cover Header */}
      <View style={styles.coverHeader}>
        <Image
          source={{
            uri:
              profile?.farmDetails?.coverPhoto ||
              'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
          }}
          style={styles.coverImage}
        />
        <View style={styles.coverOverlay} />

        {/* Floating Nav Buttons */}
        <View style={styles.navBar}>
          <Pressable onPress={onBack} hitSlop={10} style={styles.iconCircleBtn}>
            <Text style={styles.iconBtnText}>←</Text>
          </Pressable>

          <Pressable onPress={handleShare} hitSlop={10} style={styles.iconCircleBtn}>
            <Text style={styles.iconBtnText}>↗</Text>
          </Pressable>
        </View>

        {/* Farmer Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                profile?.avatarUrl ||
                'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
            }}
            style={styles.avatarImage}
          />
          <View style={styles.onlineBadge} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Name & Title */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.farmerName}>{profile?.fullName || farmerName}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          </View>

          <Text style={styles.farmerTitle}>
            Highland Organic Farmer • {profile?.district || 'Nuwara Eliya'}
          </Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingScore}>
              {reviews.length > 0
                ? RatingService.computeStats(reviews).average
                : profile?.rating || 4.9}
            </Text>
            <Text style={styles.reviewsCount}>
              ({reviews.length || profile?.reviewsCount || 124}+ verified reviews)
            </Text>
          </View>
        </View>

        {/* Action Buttons: Call, Chat, Follow, Rate */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={handleCall}>
            <Text style={styles.actionBtnIcon}>📞</Text>
            <Text style={styles.actionBtnText}>Call</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={() =>
              onOpenChat?.({
                id: profile?.id || farmerId,
                name: profile?.fullName || farmerName,
              })
            }>
            <Text style={styles.actionBtnIcon}>💬</Text>
            <Text style={styles.actionBtnText}>Chat</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              isFollowing && styles.actionBtnActive,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={handleToggleFollow}>
            <Text style={styles.actionBtnIcon}>{isFollowing ? '✓' : '❤️'}</Text>
            <Text
              style={[
                styles.actionBtnText,
                isFollowing && styles.actionBtnTextActive,
              ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              myReview && styles.actionBtnActive,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={() =>
              onRateFarmer?.({
                id: farmerId,
                name: profile?.fullName || farmerName,
                avatar: farmerAvatar || profile?.avatarUrl,
              })
            }>
            <Text style={styles.actionBtnIcon}>⭐</Text>
            <Text
              style={[
                styles.actionBtnText,
                myReview && styles.actionBtnTextActive,
              ]}>
              {myReview ? 'Edit Rate' : 'Rate'}
            </Text>
          </Pressable>
        </View>

        {/* About Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>ABOUT</Text>
          <Text style={styles.aboutText}>{profile?.bio}</Text>
        </View>

        {/* Farm Locations Preview (REAL MAP LINK) */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>FARM LOCATIONS</Text>
          <Pressable
            style={styles.locationCard}
            onPress={() => {
              if (onViewOnMap) {
                onViewOnMap({ id: farmerId, name: profile?.fullName || farmerName });
              } else {
                const addr = profile?.farmLocations?.[0] || 'Hakgala Road, Nuwara Eliya';
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
              }
            }}>
            <Text style={styles.locationPinIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>
                {profile?.farmDetails?.farmName || 'Highland Valley Farm'}
              </Text>
              <Text style={styles.locationAddress}>
                {profile?.farmDetails?.address ||
                  profile?.farmLocations?.[0] ||
                  'Hakgala Road, Nuwara Eliya'}
              </Text>
              <Text style={styles.locationMapLink}>
                🗺️ View on Real Map & GPS Navigation ›
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile?.stats?.crops || 14}</Text>
            <Text style={styles.statLabel}>Active Crops</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile?.stats?.experience || '15 Yrs'}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {profile?.stats?.responseTime || '< 2h'}
            </Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>

        {/* Certifications Badges */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>CERTIFICATIONS</Text>
          <View style={styles.certChipsRow}>
            {(profile?.certifications || ['GAP Certified', 'USDA Organic']).map(
              (cert: string) => (
                <View key={cert} style={styles.certChip}>
                  <Text style={styles.certShieldIcon}>🛡️</Text>
                  <Text style={styles.certChipText}>{cert}</Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>FEATURED PRODUCE</Text>
            <Text style={styles.viewAllLink}>View All ({featuredProducts.length})</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            {featuredProducts.map((item) => (
              <Pressable
                key={item.id}
                style={styles.produceCard}
                onPress={() => onSelectProduce?.(item)}>
                <Image
                  source={{
                    uri:
                      item.images?.[0] ||
                      'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=500',
                  }}
                  style={styles.produceImage}
                />
                <View style={styles.produceInfo}>
                  <Text style={styles.produceTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.producePrice}>
                    Rs. {item.pricePerUnit} <Text style={styles.produceUnit}>/{item.unit}</Text>
                  </Text>
                  <Pressable
                    style={styles.addToCartMiniBtn}
                    onPress={() => {
                      addToCart({
                        id: item.id,
                        title: item.title,
                        pricePerUnit: item.pricePerUnit,
                        unit: item.unit,
                        farmerName: item.farmerName,
                        image: item.images?.[0] || '',
                        quantity: 1,
                      });
                      Alert.alert('Added', `${item.title} added to cart!`);
                    }}>
                    <Text style={styles.addToCartMiniText}>+ Add to Cart</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Verified Reviews Section (Powered by RatingService) */}
        <View style={styles.cardSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionHeader}>VERIFIED REVIEWS ({reviews.length})</Text>
            <Pressable
              onPress={() =>
                onRateFarmer?.({
                  id: farmerId,
                  name: profile?.fullName || farmerName,
                  avatar: farmerAvatar || profile?.avatarUrl,
                })
              }
              style={{
                backgroundColor: myReview ? '#EFF6FF' : '#1E5E3A',
                borderWidth: myReview ? 1 : 0,
                borderColor: '#BFDBFE',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}>
              <Text
                style={{
                  color: myReview ? '#1D4ED8' : '#FFFFFF',
                  fontSize: 12,
                  fontWeight: '700',
                }}>
                {myReview ? '✏️ Edit My Rating' : '⭐ Rate Farmer'}
              </Text>
            </Pressable>
          </View>

          {reviews.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>🌱</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 8 }}>
                No reviews yet
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' }}>
                Be the first to rate your produce procurement experience with this farmer!
              </Text>
            </View>
          ) : (
            reviews.map((rev) => {
              const isMine = myReview && rev.id === myReview.id;
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
                    styles.reviewItem,
                    isMine && { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
                  ]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>
                        {rev.authorName ? rev.authorName[0] : '👤'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.reviewerName}>{rev.authorName}</Text>
                        {isMine && (
                          <View
                            style={{
                              backgroundColor: '#DCFCE7',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#15803D' }}>
                              👑 You
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.reviewDate}>{displayDate}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      <Text style={{ fontSize: 12, color: '#EAB308' }}>
                        {'★'.repeat(rev.overallRating || 5)}
                      </Text>
                    </View>
                  </View>

                  {rev.tags && rev.tags.length > 0 && (
                    <Text style={{ fontSize: 11, color: '#1E5E3A', fontWeight: '700', marginBottom: 4 }}>
                      {rev.tags.join(' • ')}
                    </Text>
                  )}
                  <Text style={styles.reviewText}>{rev.comment}</Text>

                  {/* Edit and Delete Actions if it is the current user's review */}
                  {isMine && (
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 8,
                        marginTop: 10,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: '#DCFCE7',
                      }}>
                      <Pressable
                        style={{
                          backgroundColor: '#EFF6FF',
                          borderWidth: 1,
                          borderColor: '#BFDBFE',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                        }}
                        onPress={() =>
                          onRateFarmer?.({
                            id: farmerId,
                            name: profile?.fullName || farmerName,
                            avatar: farmerAvatar || profile?.avatarUrl,
                          })
                        }>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}>
                          ✏️ Edit Rating
                        </Text>
                      </Pressable>
                      <Pressable
                        style={{
                          backgroundColor: '#FFF1F2',
                          borderWidth: 1,
                          borderColor: '#FECDD3',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                        }}
                        onPress={() => handleDeleteMyReview(rev.id)}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#E11D48' }}>
                          🗑️ Delete Rating
                        </Text>
                      </Pressable>
                    </View>
                  )}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBF9',
  },
  coverHeader: {
    position: 'relative',
    height: 180,
    backgroundColor: '#1E293B',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  navBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 12 : 8,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  iconBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -40,
    left: 24,
    zIndex: 10,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nameSection: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  farmerTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingStar: {
    fontSize: 14,
    color: '#EAB308',
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewsCount: {
    fontSize: 13,
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    backgroundColor: '#EDF4EC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4E2D3',
  },
  actionBtnActive: {
    backgroundColor: '#386641',
    borderColor: '#386641',
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionBtnIcon: {
    fontSize: 14,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  actionBtnTextActive: {
    color: '#FFFFFF',
  },
  cardSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#386641',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  locationPinIcon: {
    fontSize: 18,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  locationAddress: {
    fontSize: 12,
    color: '#64748B',
  },
  locationMapLink: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '700',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#386641',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  certChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  certShieldIcon: {
    fontSize: 12,
  },
  certChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  productsScroll: {
    flexDirection: 'row',
  },
  produceCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
    overflow: 'hidden',
  },
  produceImage: {
    width: '100%',
    height: 95,
    resizeMode: 'cover',
  },
  produceInfo: {
    padding: 10,
  },
  produceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  producePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#386641',
    marginBottom: 6,
  },
  produceUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  addToCartMiniBtn: {
    backgroundColor: '#386641',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  addToCartMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  reviewStars: {
    alignItems: 'flex-end',
  },
  reviewStarIcon: {
    fontSize: 12,
    color: '#EAB308',
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
  },
});
