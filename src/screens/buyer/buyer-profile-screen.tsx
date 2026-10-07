import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStoredUser, clearAuthSession, ApiUser } from '@/services/api';

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

  useEffect(() => {
    getStoredUser().then((stored) => {
      setUser(stored);
      setLoading(false);
    });
  }, []);

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
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              }}
              style={styles.avatarImage}
            />
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
            <Text style={styles.ratingText}>4.8</Text>
            <Text style={styles.ratingSub}>(18 Completed Purchases)</Text>
          </View>

          <Pressable style={styles.editProfileBtn} onPress={onEditProfile}>
            <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
          </Pressable>
        </View>

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
});
