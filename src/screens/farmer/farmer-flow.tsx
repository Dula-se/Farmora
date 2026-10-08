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
import { FarmerPrivacyScreen } from './farmer-privacy-screen';
import { FarmerVerificationFlow } from './farmer-verification-flow';
import { FarmerPublicProfileScreen } from '../buyer/farmer-public-profile-screen';

// Orders & Communication screens
import { FarmerOrdersScreen } from './farmer-orders-screen';
import { MessagesListScreen } from '../communication/messages-list-screen';
import { ChatConversationScreen } from '../communication/chat-conversation-screen';
import { VoiceCallScreen } from '../communication/voice-call-screen';
import { VideoCallScreen } from '../communication/video-call-screen';
import { ScheduleInspectionModal } from '../communication/schedule-inspection-modal';
import { RateBuyerScreen } from '../communication/rate-buyer-screen';
import { ReportUserScreen } from '../communication/report-user-screen';
import { NotificationsScreen } from '../communication/notifications-screen';
import { NotificationPreferencesScreen } from '../communication/notification-preferences-screen';
import { PriceAlertsScreen } from '../communication/price-alerts-screen';
import { HelpSupportScreen } from '../communication/help-support-screen';
import { AgroToolsScreen } from '../communication/agro-tools-screen';
import { ChatService } from '@/services/chat-service';

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
  | 'onboarding-wizard'
  | 'privacy'
  | 'verification'
  | 'farmer-public-profile'
  | 'chat-conversation'
  | 'rate-buyer'
  | 'report-user'
  | 'notifications'
  | 'notification-preferences'
  | 'price-alerts'
  | 'help-support'
  | 'agro-tools';

export type FarmerTab = 'dashboard' | 'products' | 'orders' | 'messages' | 'profile';

interface FarmerFlowProps {
  onBackToAuth: () => void;
}

export function FarmerFlow({ onBackToAuth }: FarmerFlowProps) {
  const [currentView, setCurrentView] = useState<FarmerScreenView>('dashboard');
  const [activeTab, setActiveTab] = useState<FarmerTab>('dashboard');
  const [newlyAddedTitle, setNewlyAddedTitle] = useState<string | null>(null);

  // Communication & Call States
  const [activeChatId, setActiveChatId] = useState<string>('c1');
  const [activeBuyerForRating, setActiveBuyerForRating] = useState({
    id: 'buyer-sunil',
    name: 'Sunil Dissanayake',
  });
  const [activeCall, setActiveCall] = useState<{
    visible: boolean;
    name: string;
    avatar: string;
    mode: 'audio' | 'video';
  }>({
    visible: false,
    name: 'Sunil Dissanayake',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    mode: 'audio',
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({
    name: 'Sunil Dissanayake',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  });

  const handleTabPress = (tab: FarmerTab) => {
    setActiveTab(tab);
    setCurrentView(tab);
  };

  const handleProductCreated = (title: string) => {
    setNewlyAddedTitle(title);
    setActiveTab('products');
    setCurrentView('products');
  };

  const handleStartChatWithBuyer = async (buyerName: string) => {
    const conv = await ChatService.getOrCreateConversation({
      participantId: `buyer-${buyerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      participantName: buyerName,
      participantRole: 'buyer',
      productTitle: 'Highland Farm Harvest',
    });
    setActiveChatId(conv.id);
    setCurrentView('chat-conversation');
  };

  const isFullScreen =
    currentView === 'add-product' ||
    currentView === 'market-trends' ||
    currentView === 'district-price-compare' ||
    currentView === 'wholesale-retail' ||
    currentView === 'farmer-trust-score' ||
    currentView === 'rescue-produce' ||
    currentView === 'onboarding-wizard' ||
    currentView === 'privacy' ||
    currentView === 'verification' ||
    currentView === 'farmer-public-profile' ||
    currentView === 'chat-conversation' ||
    currentView === 'rate-buyer' ||
    currentView === 'report-user' ||
    currentView === 'notifications' ||
    currentView === 'notification-preferences' ||
    currentView === 'price-alerts' ||
    currentView === 'help-support' ||
    currentView === 'agro-tools';

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
            onOpenVerification={() => setCurrentView('verification')}
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

        {/* Real Interactive Orders Screen */}
        {currentView === 'orders' && (
          <FarmerOrdersScreen
            onChatBuyer={(buyerName) => {
              handleStartChatWithBuyer(buyerName);
            }}
            onRateBuyer={(buyerName, buyerId) => {
              setActiveBuyerForRating({ id: buyerId, name: buyerName });
              setCurrentView('rate-buyer');
            }}
            onCallBuyer={(buyerName, buyerPhone) => {
              setActiveCall({
                visible: true,
                name: buyerName,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
                mode: 'audio',
              });
            }}
          />
        )}

        {/* Real Messages List Screen */}
        {currentView === 'messages' && (
          <MessagesListScreen
            onOpenConversation={(convId: string) => {
              setActiveChatId(convId);
              setCurrentView('chat-conversation');
            }}
            onStartCall={(name, avatar, mode) => {
              setActiveCall({
                visible: true,
                name,
                avatar,
                mode,
              });
            }}
          />
        )}

        {/* 1-on-1 Chat Screen with Negotiation Cards & Base64 Photos */}
        {currentView === 'chat-conversation' && (
          <ChatConversationScreen
            conversationId={activeChatId}
            currentRole="farmer"
            onBack={() => setCurrentView('messages')}
            onStartAudioCall={(name, avatar) => {
              setActiveCall({ visible: true, name, avatar, mode: 'audio' });
            }}
            onStartVideoCall={(name, avatar) => {
              setActiveCall({ visible: true, name, avatar, mode: 'video' });
            }}
            onRequestInspection={() => setShowScheduleModal(true)}
            onRateUser={(uId, uName) => {
              setActiveBuyerForRating({ id: uId, name: uName });
              setCurrentView('rate-buyer');
            }}
          />
        )}

        {/* Rate Buyer Screen */}
        {currentView === 'rate-buyer' && (
          <RateBuyerScreen
            buyerId={activeBuyerForRating.id}
            buyerName={activeBuyerForRating.name}
            onBack={() => setCurrentView('orders')}
            onSubmitSuccess={() => setCurrentView('orders')}
          />
        )}

        {/* Report / Dispute User Screen */}
        {currentView === 'report-user' && (
          <ReportUserScreen
            targetName={reportTarget.name}
            targetAvatar={reportTarget.avatar}
            onBack={() => setCurrentView('dashboard')}
            onSubmitSuccess={() => setCurrentView('dashboard')}
          />
        )}

        {/* Notifications Screen */}
        {currentView === 'notifications' && (
          <NotificationsScreen
            onBack={() => setCurrentView('dashboard')}
            onOpenPreferences={() => setCurrentView('notification-preferences')}
            onActionPress={(item) => {
              if (item.type === 'message') setCurrentView('messages');
              else if (item.type === 'price') setCurrentView('price-alerts');
              else Alert.alert('Notification', item.description);
            }}
          />
        )}

        {currentView === 'notification-preferences' && (
          <NotificationPreferencesScreen onBack={() => setCurrentView('profile')} />
        )}

        {currentView === 'price-alerts' && (
          <PriceAlertsScreen onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'help-support' && (
          <HelpSupportScreen
            onBack={() => setCurrentView('profile')}
            onOpenLiveChat={() => {
              handleStartChatWithBuyer('Famora Agro Support');
            }}
          />
        )}

        {currentView === 'agro-tools' && (
          <AgroToolsScreen onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'profile' && (
          <SafeAreaView style={styles.profileContainer}>
            <ScrollView
              contentContainerStyle={styles.profileScrollContent}
              showsVerticalScrollIndicator={false}>
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

              {/* Action Buttons List */}
              <View style={styles.profileMenuSection}>
                {/* 1. Verification Center */}
                <Pressable
                  style={styles.profileMenuItem}
                  onPress={() => setCurrentView('verification')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={{ fontSize: 18 }}>🛡️</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.menuItemTitle}>Get Verified</Text>
                    <Text style={styles.menuItemSub}>Upload NIC, certifications & land evidence</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </Pressable>

                {/* 2. Agro Tools, Subsidies & Weather */}
                <Pressable
                  style={styles.profileMenuItem}
                  onPress={() => setCurrentView('agro-tools')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={{ fontSize: 18 }}>🌾</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.menuItemTitle}>Agro Tools & Subsidies</Text>
                    <Text style={styles.menuItemSub}>Weather, calendar, subsidies, eco footprint</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </Pressable>

                {/* 3. Price Alerts */}
                <Pressable
                  style={styles.profileMenuItem}
                  onPress={() => setCurrentView('price-alerts')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={{ fontSize: 18 }}>📈</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.menuItemTitle}>Price Watch & Alerts</Text>
                    <Text style={styles.menuItemSub}>Manning & Dambulla wholesale index</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </Pressable>

                {/* 4. Help & Support */}
                <Pressable
                  style={styles.profileMenuItem}
                  onPress={() => setCurrentView('help-support')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={{ fontSize: 18 }}>📞</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.menuItemTitle}>Help & 24/7 Hotline</Text>
                    <Text style={styles.menuItemSub}>Direct agronomy hotline & FAQs</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </Pressable>

                {/* 5. Privacy Settings */}
                <Pressable
                  style={styles.profileMenuItem}
                  onPress={() => setCurrentView('privacy')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={{ fontSize: 18 }}>🔒</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.menuItemTitle}>Privacy & Security</Text>
                    <Text style={styles.menuItemSub}>Control visibility, data download & policy</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </Pressable>

                {/* 6. View Public Profile */}
                <Pressable
                  style={styles.profileMenuItem}
                  onPress={() => setCurrentView('farmer-public-profile')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={{ fontSize: 18 }}>👁️</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.menuItemTitle}>View Public Profile</Text>
                    <Text style={styles.menuItemSub}>See how buyers and restaurants view your farm</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </Pressable>

                {/* 7. Farm Profile Onboarding Wizard */}
                <Pressable
                  style={[styles.profileMenuItem, { borderBottomWidth: 0 }]}
                  onPress={() => setCurrentView('onboarding-wizard')}>
                  <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={{ fontSize: 18 }}>⚙️</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.menuItemTitle}>Farm Setup Checklist</Text>
                    <Text style={styles.menuItemSub}>Delivery & payment preferences</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.logoutBtn}
                onPress={async () => {
                  await clearAuthSession();
                  onBackToAuth();
                }}>
                <Text style={styles.logoutBtnText}>Sign Out of Farm Account</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        )}

        {currentView === 'privacy' && (
          <FarmerPrivacyScreen
            onBack={() => {
              setActiveTab('profile');
              setCurrentView('profile');
            }}
          />
        )}

        {currentView === 'verification' && (
          <FarmerVerificationFlow
            initialStep="landing"
            onBack={() => {
              setActiveTab('dashboard');
              setCurrentView('dashboard');
            }}
            onGoToDashboard={() => {
              setActiveTab('dashboard');
              setCurrentView('dashboard');
            }}
            onViewPublicProfile={() => setCurrentView('farmer-public-profile')}
          />
        )}

        {currentView === 'farmer-public-profile' && (
          <FarmerPublicProfileScreen
            farmerName="Kamal Gunawardana"
            onBack={() => {
              setActiveTab('profile');
              setCurrentView('profile');
            }}
          />
        )}

        {currentView === 'onboarding-wizard' && (
          <FarmerProfileWizard
            initialStep="checklist"
            onClose={() => setCurrentView('profile')}
            onFinish={() => setCurrentView('profile')}
          />
        )}
      </View>

      {/* Voice Call Modal */}
      {activeCall.visible && activeCall.mode === 'audio' && (
        <VoiceCallScreen
          visible={activeCall.visible}
          participantName={activeCall.name}
          participantAvatar={activeCall.avatar}
          onEndCall={() => setActiveCall((prev) => ({ ...prev, visible: false }))}
          onSwitchToVideo={() =>
            setActiveCall((prev) => ({ ...prev, mode: 'video' }))
          }
        />
      )}

      {/* Video Call Modal */}
      {activeCall.visible && activeCall.mode === 'video' && (
        <VideoCallScreen
          visible={activeCall.visible}
          participantName={activeCall.name}
          participantAvatar={activeCall.avatar}
          onEndCall={() => setActiveCall((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Schedule Live Video Inspection Modal */}
      <ScheduleInspectionModal
        visible={showScheduleModal}
        farmerName="Sunil Dissanayake"
        onClose={() => setShowScheduleModal(false)}
        onScheduled={(details) => {
          setShowScheduleModal(false);
          ChatService.sendMessage(activeChatId, {
            senderId: 'current-farmer',
            senderName: 'You',
            senderRole: 'farmer',
            text: `📅 Scheduled Farm Inspection confirmed for ${details.date} at ${details.time}`,
          });
        }}
      />

      {/* Persistent Bottom Tab Bar */}
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
  profileContainer: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  profileScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    marginBottom: 20,
  },
  profileAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileFarm: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedFarmerBadge: {
    marginTop: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedFarmerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  profileMenuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700',
  },
});
