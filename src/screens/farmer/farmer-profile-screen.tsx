import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  getStoredUser,
  fetchMe,
  updateProfileApi,
  clearAuthSession,
  fetchMyListings,
  ApiUser,
  ApiProduceItem,
} from '@/services/api';
import { promptMediaSource } from '@/services/media-picker';

interface FarmerProfileScreenProps {
  onOpenVerification: () => void;
  onOpenPublicProfile: () => void;
  onOpenAgroTools: () => void;
  onOpenPriceAlerts: () => void;
  onOpenTrustScore: () => void;
  onOpenWizard: () => void;
  onOpenPrivacy: () => void;
  onOpenHelpSupport: () => void;
  onLogout: () => void;
}

export function FarmerProfileScreen({
  onOpenVerification,
  onOpenPublicProfile,
  onOpenAgroTools,
  onOpenPriceAlerts,
  onOpenTrustScore,
  onOpenWizard,
  onOpenPrivacy,
  onOpenHelpSupport,
  onLogout,
}: FarmerProfileScreenProps) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [myListings, setMyListings] = useState<ApiProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFarmName, setEditFarmName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editTotalArea, setEditTotalArea] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [stored, listings] = await Promise.all([
        getStoredUser(),
        fetchMyListings().catch(() => []),
      ]);

      if (stored) {
        setUser(stored);
        initEditFields(stored);
      }

      setMyListings(listings);

      // Refresh in background from /auth/me if online
      fetchMe()
        .then((latest) => {
          if (latest) {
            setUser(latest);
            initEditFields(latest);
          }
        })
        .catch(() => {});
    } catch (err) {
      console.log('[FarmerProfile] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initEditFields = (u: ApiUser) => {
    setEditName(u.fullName || '');
    setEditFarmName(u.farmDetails?.farmName || '');
    setEditPhone(u.mobileNumber || '');
    setEditDistrict(u.district || 'Nuwara Eliya');
    setEditCity(u.farmDetails?.city || 'Welimada');
    setEditTotalArea(u.farmDetails?.totalArea || '3.5');
    setEditBio(u.farmDetails?.bio || '');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleChangeAvatar = async () => {
    try {
      promptMediaSource({
        title: 'Farm Profile Picture',
        message: 'Take a camera selfie or choose from gallery',
        allowsEditing: true,
        aspect: [1, 1],
        onSelected: async (media) => {
          const base64Uri = media.dataUrl;
          if (!base64Uri) return;

          // Optimistic update
          setUser((prev) => (prev ? { ...prev, avatarUrl: base64Uri } : null));

          // Persist to backend and update session
          const updated = await updateProfileApi({ avatarUrl: base64Uri });
          if (updated) {
            setUser(updated);
          }
          Alert.alert('Avatar Updated', 'Your profile picture has been updated successfully.');
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile photo.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    setSavingProfile(true);
    try {
      const updates: Partial<ApiUser> = {
        fullName: editName.trim(),
        mobileNumber: editPhone.trim(),
        district: editDistrict.trim(),
        farmDetails: {
          ...(user?.farmDetails || {}),
          farmName: editFarmName.trim() || `${editName.trim()}'s Organic Farm`,
          city: editCity.trim(),
          totalArea: editTotalArea.trim(),
          bio: editBio.trim(),
        },
      };

      const updated = await updateProfileApi(updates);
      setUser(updated);
      setShowEditModal(false);
      Alert.alert('Profile Saved', 'Your farm profile information has been saved.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your farm account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuthSession();
          onLogout();
        },
      },
    ]);
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E5E3A" />
        <Text style={styles.loadingText}>Loading Farm Profile...</Text>
      </SafeAreaView>
    );
  }

  // Display computations
  const displayName = user?.fullName || 'Farmer Partner';
  const displayFarmName =
    user?.farmDetails?.farmName ||
    user?.businessDetails?.businessName ||
    `${displayName}'s Organic Farm`;
  const displayLocation =
    user?.farmDetails?.city && user?.district
      ? `${user.farmDetails.city}, ${user.district}`
      : user?.farmDetails?.city || user?.district || 'Central Province, Sri Lanka';
  const isVerified = user?.isVerified ?? true; // verified badge if true
  const farmingMethod = user?.farmDetails?.farmingMethod || '100% Organic & GAP Certified';
  const farmArea = user?.farmDetails?.totalArea ? `${user.farmDetails.totalArea} Acres` : '3.5 Acres';
  const experienceYears = '8+ Years';

  const defaultCrops = ['Highland Carrots', 'Organic Red Tomatoes', 'Green Beans', 'Crisp Leeks'];
  const primaryCrops =
    user?.farmDetails?.primaryCrops && user.farmDetails.primaryCrops.length > 0
      ? user.farmDetails.primaryCrops
      : defaultCrops;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Farm Profile & Settings</Text>
        <Pressable
          style={styles.editProfileBtn}
          onPress={() => setShowEditModal(true)}>
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E5E3A']} />
        }>
        {/* Farm Hero / Identity Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBackgroundPattern} />

          {/* Avatar with Camera Trigger */}
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <Pressable style={styles.cameraIconBadge} onPress={handleChangeAvatar}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <Path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </Svg>
            </Pressable>
          </View>

          {/* Farmer & Farm Info */}
          <Text style={styles.farmerNameText}>{displayName}</Text>
          <Text style={styles.farmTitleText}>{displayFarmName}</Text>

          <View style={styles.locationRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <Path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </Svg>
            <Text style={styles.locationText}>{displayLocation}</Text>
          </View>

          {/* Verification Badge */}
          <View style={styles.verifiedBadgeRow}>
            <View
              style={[
                styles.verifiedBadge,
                !isVerified && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
              ]}>
              <Text
                style={[
                  styles.verifiedBadgeText,
                  !isVerified && { color: '#B45309' },
                ]}>
                {isVerified ? '✓ Certified SL-GAP Organic Farmer' : '⏳ Verification In Progress'}
              </Text>
            </View>
          </View>

          {/* Contact Details Quick Strip */}
          <View style={styles.contactDetailsStrip}>
            {user?.mobileNumber ? (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>{user.mobileNumber}</Text>
              </View>
            ) : null}
            {user?.email ? (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Operational Farm Stats Ribbon */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{myListings.length}</Text>
            <Text style={styles.statLabel}>Active Crops</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{farmArea}</Text>
            <Text style={styles.statLabel}>Cultivated Land</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#16A34A' }]}>98%</Text>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{experienceYears}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {/* Primary Harvest Crops Chips */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Main Cultivation Crops</Text>
            <Text style={styles.sectionSubtitle}>{farmingMethod}</Text>
          </View>
          <View style={styles.cropsChipsRow}>
            {primaryCrops.map((crop, idx) => (
              <View key={idx} style={styles.cropChip}>
                <Text style={styles.cropChipEmoji}>🌱</Text>
                <Text style={styles.cropChipText}>{crop}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bank & Automated Escrow Disbursement Info Card */}
        <View style={styles.escrowCard}>
          <View style={styles.escrowHeader}>
            <View style={styles.escrowIconCircle}>
              <Text style={{ fontSize: 18 }}>🏦</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.escrowTitle}>Commercial Payout Account</Text>
              <Text style={styles.escrowSub}>
                {user?.farmDetails?.bankName || 'Commercial Bank of Ceylon PLC'}
              </Text>
            </View>
            <View style={styles.escrowActiveBadge}>
              <Text style={styles.escrowActiveText}>Connected</Text>
            </View>
          </View>
          <View style={styles.escrowDetailsRow}>
            <Text style={styles.escrowAccountNum}>
              A/C: {user?.farmDetails?.accountNumber || '8012 •••• •••• 4491'}
            </Text>
            <Text style={styles.escrowSchedule}>Direct 24-hr disbursement after delivery</Text>
          </View>
        </View>

        {/* Management & Agro Operations Menu List */}
        <View style={styles.menuCard}>
          <Text style={styles.menuGroupHeading}>FARM OPERATIONS & ADVISORY</Text>

          {/* 1. Official Farm Verification */}
          <Pressable style={styles.menuItem} onPress={onOpenVerification}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Farm Verification & Land Deed</Text>
              <Text style={styles.menuSubtitle}>Upload NIC, organic certificate & land titles</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {/* 2. View Public Storefront */}
          <Pressable style={styles.menuItem} onPress={onOpenPublicProfile}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>My Public Farm Storefront</Text>
              <Text style={styles.menuSubtitle}>Preview how restaurants & wholesale buyers see your farm</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {/* 3. Agro Tools, Subsidies & Weather */}
          <Pressable style={styles.menuItem} onPress={onOpenAgroTools}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Agro Tools & Subsidies</Text>
              <Text style={styles.menuSubtitle}>Maha/Yala calendar, weather, grants & carbon calculator</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {/* 4. Wholesale Price Watch & Alerts */}
          <Pressable style={styles.menuItem} onPress={onOpenPriceAlerts}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M23 6l-9.5 9.5-5-5L1 18" />
                <Path d="M17 6h6v6" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Wholesale Price Index</Text>
              <Text style={styles.menuSubtitle}>Daily price trends from Manning & Dambulla markets</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {/* 5. Trust Score & Quality Performance */}
          <Pressable style={styles.menuItem} onPress={onOpenTrustScore}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Farmer Trust Score</Text>
              <Text style={styles.menuSubtitle}>Review order fulfillment score & buyer feedback</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {/* 6. Farm Setup Wizard */}
          <Pressable style={styles.menuItem} onPress={onOpenWizard}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Farm Setup Checklist</Text>
              <Text style={styles.menuSubtitle}>Delivery radius, warehouse & storage capacity</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {/* 7. Privacy & Security */}
          <Pressable style={styles.menuItem} onPress={onOpenPrivacy}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Privacy & Security</Text>
              <Text style={styles.menuSubtitle}>Manage farm location privacy and data sharing</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {/* 8. Help & 24/7 Hotline */}
          <Pressable style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={onOpenHelpSupport}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </Svg>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Help & 24/7 Agro Hotline</Text>
              <Text style={styles.menuSubtitle}>Direct agronomist assistance & ticket support</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>

        {/* Sign Out Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogoutPress}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <Path d="M16 17l5-5-5-5" />
            <Path d="M21 12H9" />
          </Svg>
          <Text style={styles.logoutButtonText}>Sign Out of Farm Account</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Edit Farm Profile</Text>
              <Pressable onPress={() => setShowEditModal(false)} hitSlop={10}>
                <Text style={{ fontSize: 20, color: '#64748B' }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Kamal Gunawardana"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farm Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFarmName}
                  onChangeText={setEditFarmName}
                  placeholder="e.g. Govigedara Organic Farm"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                  placeholder="+94 77 ..."
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>District</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editDistrict}
                    onChangeText={setEditDistrict}
                    placeholder="e.g. Nuwara Eliya"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>City / Town</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editCity}
                    onChangeText={setEditCity}
                    placeholder="e.g. Welimada"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farm Land Area (Acres)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTotalArea}
                  onChangeText={setEditTotalArea}
                  keyboardType="numeric"
                  placeholder="e.g. 3.5"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farm Bio & Experience</Text>
                <TextInput
                  style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                  placeholder="Describe your farming methods and produce specialty..."
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}>
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBF9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  editProfileBtn: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  heroBackgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#1E5E3A',
    opacity: 0.08,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#DCFCE7',
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#1E5E3A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  farmerNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  farmTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E5E3A',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  verifiedBadgeRow: {
    marginTop: 10,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  contactDetailsStrip: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    justifyContent: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  contactValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  cropsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 4,
  },
  cropChipEmoji: {
    fontSize: 11,
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  escrowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
  },
  escrowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  escrowIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  escrowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  escrowActiveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  escrowActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  escrowDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  escrowAccountNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  escrowSchedule: {
    fontSize: 10,
    color: '#94A3B8',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    overflow: 'hidden',
    paddingVertical: 6,
  },
  menuGroupHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalActionsRow: {
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
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#1E5E3A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
