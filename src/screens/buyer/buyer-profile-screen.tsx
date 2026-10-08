import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { getStoredUser, clearAuthSession, ApiUser } from '@/services/api';
import { RatingService, RatingReview } from '@/services/rating-service';

interface BuyerProfileScreenProps {
  onEditProfile?: () => void;
  onOpenSavedAddresses?: () => void;
  onOpenFavouriteFarms?: () => void;
  onOpenSettings?: () => void;
  onOpenSecurity?: () => void;
  onOpenOrderHistory?: () => void;
  onOpenHelpSupport?: () => void;
  onOpenPaymentMethods?: () => void;
  onLogout?: () => void;
}

export function BuyerProfileScreen({
  onEditProfile,
  onOpenSavedAddresses,
  onOpenFavouriteFarms,
  onOpenSettings,
  onOpenSecurity,
  onOpenOrderHistory,
  onOpenHelpSupport,
  onOpenPaymentMethods,
  onLogout,
}: BuyerProfileScreenProps) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Buyer Info & Ratings Modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [activeRatingTab, setActiveRatingTab] = useState<'given' | 'received'>('given');
  const [givenReviews, setGivenReviews] = useState<RatingReview[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<RatingReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Edit Review sub-modal state
  const [editingReview, setEditingReview] = useState<RatingReview | null>(null);
  const [editRatingScore, setEditRatingScore] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadUserAndRatings();
  }, []);

  const loadUserAndRatings = async () => {
    const stored = await getStoredUser();
    setUser(stored);
    setLoading(false);

    if (stored) {
      loadReviews(stored);
    }
  };

  const loadReviews = async (currentUser: ApiUser) => {
    setLoadingReviews(true);
    try {
      const uId = currentUser.id || currentUser._id || 'user-buyer-1';
      const [given, received] = await Promise.all([
        RatingService.fetchReviewsByAuthor(uId),
        RatingService.fetchReviewsForTarget(uId),
      ]);
      setGivenReviews(given);
      setReceivedReviews(received);
    } catch (e) {
      console.warn('Could not load buyer reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleStartEdit = (rev: RatingReview) => {
    setEditingReview(rev);
    setEditRatingScore(rev.overallRating || 5);
    setEditComment(rev.comment || '');
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    setSavingEdit(true);
    try {
      await RatingService.updateReview(editingReview.id, {
        overallRating: editRatingScore,
        comment: editComment.trim() || 'Updated rating',
      });
      Alert.alert('Success ⭐', 'Your review has been updated!');
      setEditingReview(null);
      if (user) loadReviews(user);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update review.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      'Delete Rating? 🗑️',
      'Are you sure you want to delete this rating? It will be removed permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await RatingService.deleteReview(reviewId);
              Alert.alert('Deleted', 'Your review has been removed.');
              if (user) loadReviews(user);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete review.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of Farmora?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuthSession();
          onLogout?.();
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'my-ratings',
      icon: '⭐',
      label: 'My Ratings & Reviews',
      badge: `${givenReviews.length} Submitted`,
      onPress: () => setShowInfoModal(true),
    },
    {
      id: 'notifications',
      icon: '🔔',
      label: 'Notification Settings',
      badge: 'On',
      onPress: onOpenSettings,
    },
    {
      id: 'addresses',
      icon: '📍',
      label: 'Saved Addresses',
      badge: `${user?.savedAddresses?.length || 2} Saved`,
      onPress: onOpenSavedAddresses,
    },
    {
      id: 'favourites',
      icon: '❤️',
      label: 'Favourite Farms',
      badge: `${user?.favouriteFarms?.length || 3} Farms`,
      onPress: onOpenFavouriteFarms,
    },
    {
      id: 'orders',
      icon: '📦',
      label: 'Order History',
      badge: '5 Orders',
      onPress: () => {
        if (onOpenOrderHistory) onOpenOrderHistory();
        else Alert.alert('Orders', 'Viewing active procurement and past delivered orders.');
      },
    },
    {
      id: 'payments',
      icon: '💳',
      label: 'Payment Methods',
      badge: 'Card / Escrow',
      onPress: () => {
        if (onOpenPaymentMethods) onOpenPaymentMethods();
        else Alert.alert('Payment Methods', 'Manage Bank Accounts & Escrow guarantees.');
      },
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings',
      onPress: onOpenSettings,
    },
    {
      id: 'security',
      icon: '🔒',
      label: 'Security & 2FA',
      onPress: onOpenSecurity,
    },
    {
      id: 'help',
      icon: '❓',
      label: 'Help & Support',
      onPress: () => {
        if (onOpenHelpSupport) onOpenHelpSupport();
        else Alert.alert('Famora Support', 'Contact 24/7 hotline at 011 234 5678 or support@famora.lk');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Pressable onPress={onOpenSettings} hitSlop={10} style={styles.headerIconBtn}>
          <Text style={styles.headerIconText}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card - CLICKABLE DIRECTLY TO VIEW INFO & EDIT RATINGS */}
        <Pressable
          style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.96 }]}
          onPress={() => setShowInfoModal(true)}>
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitialText}>
                  {(user?.fullName || 'User').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Pressable style={styles.editAvatarBtn} onPress={onEditProfile}>
              <Text style={styles.editAvatarText}>✎</Text>
            </Pressable>
          </View>

          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user?.fullName || 'Priyantha Perera'}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          </View>

          <Text style={styles.userRole}>
            {user?.buyerType || 'Verified Buyer'} • {user?.mobileNumber || '+94 77 123 4567'}
          </Text>

          <View style={styles.ratingPill}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingText}>
              {receivedReviews.length > 0
                ? RatingService.computeStats(receivedReviews).average
                : '4.8'}
            </Text>
            <Text style={styles.ratingSub}>
              ({receivedReviews.length || 18} Received • {givenReviews.length} Given)
            </Text>
          </View>

          {/* Explicit hint that card is clickable */}
          <View style={styles.manageRatingsHint}>
            <Text style={styles.manageRatingsHintText}>
              ⭐ Tap card to view info & manage your ratings ›
            </Text>
          </View>

          <Pressable style={styles.editProfileBtn} onPress={onEditProfile}>
            <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
          </Pressable>
        </Pressable>

        {/* Menu Section */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>

              <View style={styles.menuRight}>
                {item.badge && <Text style={styles.menuBadgeText}>{item.badge}</Text>}
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
          ]}
          onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </Pressable>

        <Text style={styles.versionText}>Famora Marketplace v1.0.4 (Build 42)</Text>
      </ScrollView>

      {/* Buyer Info & Ratings Management Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowInfoModal(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable
              hitSlop={12}
              style={styles.modalCloseBtn}
              onPress={() => setShowInfoModal(false)}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>✕</Text>
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Buyer Info & Ratings</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Buyer Profile Card */}
            <View style={styles.infoSummaryCard}>
              <View style={styles.infoAvatarRow}>
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.infoAvatar}
                  />
                ) : (
                  <View style={[styles.infoAvatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitialText}>
                      {(user?.fullName || 'User').trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.infoFullName}>
                      {user?.fullName || 'Priyantha Perera'}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedCheck}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.infoRoleText}>
                    {user?.buyerType || 'Verified Commercial Buyer'}
                  </Text>
                  <Text style={styles.infoContactText}>
                    📱 {user?.mobileNumber || '+94 77 123 4567'}
                  </Text>
                  {user?.email && (
                    <Text style={styles.infoContactText}>✉️ {user.email}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoMetaGrid}>
                <View style={styles.infoMetaItem}>
                  <Text style={styles.infoMetaLabel}>Trust Status</Text>
                  <Text style={styles.infoMetaValue}>Escrow Verified</Text>
                </View>
                <View style={styles.infoMetaItem}>
                  <Text style={styles.infoMetaLabel}>Given Ratings</Text>
                  <Text style={styles.infoMetaValue}>{givenReviews.length} Reviews</Text>
                </View>
                <View style={styles.infoMetaItem}>
                  <Text style={styles.infoMetaLabel}>Buyer Score</Text>
                  <Text style={styles.infoMetaValue}>
                    ★{' '}
                    {receivedReviews.length > 0
                      ? RatingService.computeStats(receivedReviews).average
                      : '4.8'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ratings Tab Selector */}
            <View style={styles.modalTabsRow}>
              <Pressable
                style={[
                  styles.modalTabBtn,
                  activeRatingTab === 'given' && styles.modalTabBtnActive,
                ]}
                onPress={() => setActiveRatingTab('given')}>
                <Text
                  style={[
                    styles.modalTabBtnText,
                    activeRatingTab === 'given' && styles.modalTabBtnTextActive,
                  ]}>
                  Ratings You Gave ({givenReviews.length})
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalTabBtn,
                  activeRatingTab === 'received' && styles.modalTabBtnActive,
                ]}
                onPress={() => setActiveRatingTab('received')}>
                <Text
                  style={[
                    styles.modalTabBtnText,
                    activeRatingTab === 'received' && styles.modalTabBtnTextActive,
                  ]}>
                  Farmer Ratings ({receivedReviews.length})
                </Text>
              </Pressable>
            </View>

            {/* Tab 1: Ratings Given to Farmers (WITH EDIT & DELETE) */}
            {activeRatingTab === 'given' && (
              <View style={styles.ratingsListContainer}>
                {givenReviews.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={{ fontSize: 36 }}>⭐</Text>
                    <Text style={styles.emptyStateTitle}>No Ratings Given Yet</Text>
                    <Text style={styles.emptyStateSub}>
                      When you rate a farmer after purchase, your feedback will appear here. You can update or delete them anytime.
                    </Text>
                  </View>
                ) : (
                  givenReviews.map((rev) => (
                    <View key={rev.id} style={styles.buyerReviewCard}>
                      <View style={styles.buyerReviewHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.buyerReviewTarget}>
                            👨‍🌾 {rev.targetName || 'Highland Farmer'}
                          </Text>
                          <Text style={styles.buyerReviewDate}>
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </Text>
                        </View>
                        <View style={styles.starsPill}>
                          <Text style={styles.starsPillText}>
                            {'★'.repeat(rev.overallRating || 5)}
                          </Text>
                        </View>
                      </View>

                      {rev.tags && rev.tags.length > 0 && (
                        <Text style={styles.buyerReviewTags}>{rev.tags.join(' • ')}</Text>
                      )}
                      <Text style={styles.buyerReviewComment}>{rev.comment}</Text>

                      {/* Edit and Delete Buttons */}
                      <View style={styles.buyerReviewActionsRow}>
                        <Pressable
                          style={styles.editRatingBtn}
                          onPress={() => handleStartEdit(rev)}>
                          <Text style={styles.editRatingBtnText}>✏️ Edit Rating</Text>
                        </Pressable>
                        <Pressable
                          style={styles.deleteRatingBtn}
                          onPress={() => handleDeleteReview(rev.id)}>
                          <Text style={styles.deleteRatingBtnText}>🗑️ Delete Rating</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Tab 2: Ratings Received by Buyer */}
            {activeRatingTab === 'received' && (
              <View style={styles.ratingsListContainer}>
                {receivedReviews.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={{ fontSize: 36 }}>👨‍💼</Text>
                    <Text style={styles.emptyStateTitle}>No Farmer Ratings Yet</Text>
                    <Text style={styles.emptyStateSub}>
                      Ratings provided by farmers after order fulfillment will be visible here.
                    </Text>
                  </View>
                ) : (
                  receivedReviews.map((rev) => (
                    <View key={rev.id} style={styles.buyerReviewCard}>
                      <View style={styles.buyerReviewHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.buyerReviewTarget}>
                            Rated by: {rev.authorName || 'Verified Farmer'}
                          </Text>
                          <Text style={styles.buyerReviewDate}>
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </Text>
                        </View>
                        <View style={styles.starsPill}>
                          <Text style={styles.starsPillText}>
                            {'★'.repeat(rev.overallRating || 5)}
                          </Text>
                        </View>
                      </View>

                      {rev.tags && rev.tags.length > 0 && (
                        <Text style={styles.buyerReviewTags}>{rev.tags.join(' • ')}</Text>
                      )}
                      <Text style={styles.buyerReviewComment}>{rev.comment}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          {/* Edit Rating Sub-Modal */}
          {editingReview && (
            <Modal
              visible={true}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setEditingReview(null)}>
              <View style={styles.modalOverlay}>
                <View style={styles.editDialogCard}>
                  <Text style={styles.editDialogTitle}>
                    Edit Rating for {editingReview.targetName || 'Farmer'}
                  </Text>
                  <Text style={styles.editDialogSub}>
                    Update your overall star score and written review:
                  </Text>

                  {/* Star selector */}
                  <View style={styles.starsSelectRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        hitSlop={8}
                        onPress={() => setEditRatingScore(star)}>
                        <Text
                          style={[
                            styles.dialogStar,
                            {
                              color: star <= editRatingScore ? '#EAB308' : '#CBD5E1',
                            },
                          ]}>
                          ★
                        </Text>
                      </Pressable>
                    ))}
                    <Text style={styles.dialogStarScore}>
                      {editRatingScore}.0 / 5.0
                    </Text>
                  </View>

                  {/* Comment Input */}
                  <TextInput
                    style={styles.dialogInput}
                    multiline
                    numberOfLines={3}
                    placeholder="Update your review comment..."
                    placeholderTextColor="#94A3B8"
                    value={editComment}
                    onChangeText={setEditComment}
                  />

                  {/* Dialog Buttons */}
                  <View style={styles.dialogButtonsRow}>
                    <Pressable
                      style={styles.dialogCancelBtn}
                      onPress={() => setEditingReview(null)}>
                      <Text style={styles.dialogCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.dialogSaveBtn, savingEdit && { opacity: 0.7 }]}
                      disabled={savingEdit}
                      onPress={handleSaveEdit}>
                      <Text style={styles.dialogSaveText}>
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  userCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#386641',
  },
  avatarPlaceholder: {
    backgroundColor: '#1E3A2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#386641',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  userRole: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    marginBottom: 16,
  },
  starIcon: {
    color: '#CA8A04',
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
  },
  ratingSub: {
    fontSize: 11,
    color: '#A16207',
  },
  editProfileBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#EDF4EC',
    borderWidth: 1,
    borderColor: '#D4E2D3',
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 16,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    color: '#94A3B8',
  },
  logoutBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
  },
  logoutBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
  },
  manageRatingsHint: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 4,
    alignItems: 'center',
  },
  manageRatingsHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  infoAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
  },
  infoFullName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoRoleText: {
    fontSize: 13,
    color: '#1E5E3A',
    fontWeight: '700',
    marginTop: 2,
  },
  infoContactText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  infoMetaGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    justifyContent: 'space-between',
  },
  infoMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoMetaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  infoMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modalTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalTabBtnTextActive: {
    color: '#1E5E3A',
  },
  ratingsListContainer: {
    gap: 12,
  },
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  buyerReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buyerReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  buyerReviewTarget: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  buyerReviewDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
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
  buyerReviewTags: {
    fontSize: 11,
    color: '#1E5E3A',
    fontWeight: '700',
    marginBottom: 6,
  },
  buyerReviewComment: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  buyerReviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  editRatingBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editRatingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  deleteRatingBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  deleteRatingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editDialogCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  editDialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  editDialogSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  starsSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dialogStar: {
    fontSize: 32,
  },
  dialogStarScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E5E3A',
    marginLeft: 6,
  },
  dialogInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  dialogSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1E5E3A',
  },
  dialogSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
