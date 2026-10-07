import React, { useState } from 'react';
import {
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
import Svg, { Path } from 'react-native-svg';
import { clearAuthSession } from '@/services/api';
import { FarmerDashboardScreen } from './farmer-dashboard-screen';
import { MyProductsScreen } from './my-products-screen';
import { AddProductWizard } from './add-product-wizard';
import { MarketTrendScreen } from './market-trend-screen';
import { DistrictPriceCompareScreen } from './district-price-compare-screen';
import { WholesaleRetailScreen } from './wholesale-retail-screen';
import { FarmerTrustScoreScreen } from './farmer-trust-score-screen';
import { RescueProduceScreen } from './rescue-produce-screen';
import { FarmerProfileWizard } from './farmer-profile-wizard';

export type FarmerScreenView =
  | 'dashboard'
  | 'products'
  | 'add-product'
  | 'orders'
  | 'messages'
  | 'profile'
  | 'market-trends'
  | 'district-price-compare'
  | 'wholesale-retail'
  | 'farmer-trust-score'
  | 'rescue-produce'
  | 'onboarding-wizard';

export type FarmerTab = 'dashboard' | 'products' | 'orders' | 'messages' | 'profile';

interface FarmerFlowProps {
  onBackToAuth: () => void;
  onSwitchToBuyerPreview?: () => void;
}

export function FarmerFlow({ onBackToAuth, onSwitchToBuyerPreview }: FarmerFlowProps) {
  const [currentView, setCurrentView] = useState<FarmerScreenView>('dashboard');
  const [activeTab, setActiveTab] = useState<FarmerTab>('dashboard');
  const [newlyAddedTitle, setNewlyAddedTitle] = useState<string | null>(null);

  const handleTabPress = (tab: FarmerTab) => {
    setActiveTab(tab);
    setCurrentView(tab);
  };

  const handleProductCreated = (title: string) => {
    setNewlyAddedTitle(title);
    setActiveTab('products');
    setCurrentView('products');
  };

  const isFullScreen =
    currentView === 'add-product' ||
    currentView === 'market-trends' ||
    currentView === 'district-price-compare' ||
    currentView === 'wholesale-retail' ||
    currentView === 'farmer-trust-score' ||
    currentView === 'rescue-produce' ||
    currentView === 'onboarding-wizard';

  return (
    <View style={styles.container}>
      {/* Main Screen Content */}
      <View style={styles.content}>
        {currentView === 'dashboard' && (
          <FarmerDashboardScreen
            onAddProduct={() => setCurrentView('add-product')}
            onViewProducts={() => handleTabPress('products')}
            onViewOrders={() => handleTabPress('orders')}
            onViewMessages={() => handleTabPress('messages')}
            onOpenProfile={() => handleTabPress('profile')}
            onOpenMarketTrends={() => setCurrentView('market-trends')}
            onOpenDistrictPriceCompare={() => setCurrentView('district-price-compare')}
            onOpenWholesaleRetail={() => setCurrentView('wholesale-retail')}
            onOpenTrustScore={() => setCurrentView('farmer-trust-score')}
            onOpenRescueProduce={() => setCurrentView('rescue-produce')}
          />
        )}

        {currentView === 'products' && (
          <MyProductsScreen
            onAddProduct={() => setCurrentView('add-product')}
            newlyAddedTitle={newlyAddedTitle}
          />
        )}

        {currentView === 'add-product' && (
          <AddProductWizard
            onBack={() => setCurrentView('products')}
            onSuccess={handleProductCreated}
          />
        )}

        {currentView === 'market-trends' && (
          <MarketTrendScreen onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'district-price-compare' && (
          <DistrictPriceCompareScreen onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'wholesale-retail' && (
          <WholesaleRetailScreen onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'farmer-trust-score' && (
          <FarmerTrustScoreScreen onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'rescue-produce' && (
          <RescueProduceScreen onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'orders' && (
          <SafeAreaView style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>Orders & Dispatch</Text>
            <Text style={styles.placeholderSub}>
              Manage upcoming collections, bulk delivery dispatch schedules, and buyer payments.
            </Text>
            <View style={styles.mockOrderCard}>
              <Text style={styles.mockOrderTitle}>Order #1042 — Sunil Dissanayake</Text>
              <Text style={styles.mockOrderCrop}>50 kg Organic Red Tomatoes • Rs. 12,000</Text>
              <View style={styles.mockBadgeRow}>
                <View style={styles.mockBadgePending}>
                  <Text style={styles.mockBadgePendingText}>Pending Dispatch</Text>
                </View>
                <Pressable
                  style={styles.mockConfirmBtn}
                  onPress={() => alert('Order dispatched! Buyer notified via Twilio SMS.')}>
                  <Text style={styles.mockConfirmBtnText}>Mark Dispatched</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.mockOrderCard}>
              <Text style={styles.mockOrderTitle}>Order #1041 — Green Leaf Supermarket</Text>
              <Text style={styles.mockOrderCrop}>100 kg Highland Carrots • Rs. 24,000</Text>
              <View style={styles.mockBadgeRow}>
                <View style={styles.mockBadgeAccepted}>
                  <Text style={styles.mockBadgeAcceptedText}>Accepted by Farm</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        )}

        {currentView === 'messages' && (
          <SafeAreaView style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>Buyer Messages</Text>
            <Text style={styles.placeholderSub}>
              Direct negotiation and order inquiry chats with verified commercial buyers.
            </Text>
            <View style={styles.chatCard}>
              <View style={styles.chatAvatar}>
                <Text style={{ fontSize: 18 }}>👨‍💼</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.chatName}>Sunil Dissanayake</Text>
                <Text style={styles.chatLastMsg}>Can you dispatch the tomatoes before 10 AM?</Text>
              </View>
              <Text style={styles.chatTime}>10m</Text>
            </View>

            <View style={styles.chatCard}>
              <View style={styles.chatAvatar}>
                <Text style={{ fontSize: 18 }}>🏬</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.chatName}>Green Leaf Supermarket</Text>
                <Text style={styles.chatLastMsg}>Invoice received. Transferring to commercial account.</Text>
              </View>
              <Text style={styles.chatTime}>2h</Text>
            </View>
          </SafeAreaView>
        )}

        {currentView === 'profile' && (
          <SafeAreaView style={styles.profileContainer}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarLarge}>
                <Text style={{ fontSize: 32 }}>👨‍🌾</Text>
              </View>
              <Text style={styles.profileName}>Kamal Gunawardana</Text>
              <Text style={styles.profileFarm}>Govigedara Organic Farm • Nuwara Eliya</Text>
              <View style={styles.verifiedFarmerBadge}>
                <Text style={styles.verifiedFarmerText}>✓ Certified Verified Farmer</Text>
              </View>
            </View>

            {/* Farm Profile Onboarding Wizard Trigger */}
            <Pressable
              style={styles.onboardingBanner}
              onPress={() => setCurrentView('onboarding-wizard')}>
              <View style={styles.onboardingLeft}>
                <Text style={styles.onboardingTitle}>Farm Profile 70% Complete</Text>
                <Text style={styles.onboardingSub}>
                  Complete Delivery & Payment preferences to boost buyer trust.
                </Text>
              </View>
              <Text style={styles.onboardingArrow}>→</Text>
            </Pressable>

            {/* Switch to Buyer Preview mode if developer/testing */}
            {onSwitchToBuyerPreview && (
              <Pressable
                style={styles.switchModeCard}
                onPress={onSwitchToBuyerPreview}>
                <Text style={styles.switchModeTitle}>Switch to Buyer Marketplace View</Text>
                <Text style={styles.switchModeSub}>Preview the app from a buyer perspective</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.logoutBtn}
              onPress={async () => {
                await clearAuthSession();
                onBackToAuth();
              }}>
              <Text style={styles.logoutBtnText}>Sign Out of Farm Account</Text>
            </Pressable>
          </SafeAreaView>
        )}

        {currentView === 'onboarding-wizard' && (
          <FarmerProfileWizard
            initialStep="checklist"
            onClose={() => setCurrentView('profile')}
            onFinish={() => setCurrentView('profile')}
          />
        )}
      </View>

      {/* Persistent Bottom Tab Bar (Matching Figma bottom bar) */}
      {!isFullScreen && (
        <View style={styles.bottomTabBar}>
          {/* 1. Dashboard */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('dashboard')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'dashboard' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <Path d="M9 22V12h6v10" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
              Dashboard
            </Text>
          </Pressable>

          {/* 2. Products */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('products')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'products' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2L2 7l10 5 10-5-10-5z" />
              <Path d="M2 17l10 5 10-5" />
              <Path d="M2 12l10 5 10-5" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'products' && styles.tabLabelActive]}>
              Products
            </Text>
          </Pressable>

          {/* 3. Orders */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('orders')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'orders' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <Path d="M3 6h18" />
              <Path d="M16 10a4 4 0 0 1-8 0" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
              Orders
            </Text>
          </Pressable>

          {/* 4. Messages */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('messages')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'messages' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'messages' && styles.tabLabelActive]}>
              Messages
            </Text>
          </Pressable>

          {/* 5. Profile */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('profile')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'profile' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              Profile
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  placeholderContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  placeholderSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },
  mockOrderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  mockOrderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  mockOrderCrop: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  mockBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockBadgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mockBadgePendingText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  mockBadgeAccepted: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mockBadgeAcceptedText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  mockConfirmBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mockConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  chatLastMsg: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chatTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  profileContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileFarm: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedFarmerBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  verifiedFarmerText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  switchModeCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  switchModeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  switchModeSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  logoutBtnText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  onboardingBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDF4EC',
    borderWidth: 1.5,
    borderColor: '#386641',
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
  },
  onboardingLeft: {
    flex: 1,
    marginRight: 10,
  },
  onboardingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2E20',
  },
  onboardingSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
  },
  onboardingArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#386641',
  },
});
