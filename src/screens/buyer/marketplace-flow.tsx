import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiProduceItem } from '@/services/api';
import { BuyerHomeScreen } from './buyer-home-screen';
import { AllCategoriesScreen } from './all-categories-screen';
import { CategoryProductsScreen } from './category-products-screen';
import { SearchScreen } from './search-screen';
import { ProductDetailScreen } from './product-detail-screen';
import { ReviewsScreen } from './reviews-screen';
import { SimilarProductsScreen } from './similar-products-screen';
import { CompareProductsScreen } from './compare-products-screen';
import { WishlistScreen } from './wishlist-screen';
import { FarmMapScreen } from './farm-map-screen';
import { FarmerMatchingFlow } from './farmer-matching-flow';
import { ProductScannerFlow } from './product-scanner-flow';
import { CartScreen } from './cart-screen';
import { BuyerProfileScreen } from './buyer-profile-screen';
import { EditProfileScreen } from './edit-profile-screen';
import { SavedAddressesScreen } from './saved-addresses-screen';
import { AddAddressScreen } from './add-address-screen';
import { FavouriteFarmsScreen } from './favourite-farms-screen';
import { SettingsScreen } from './settings-screen';
import { SecurityScreen } from './security-screen';
import { FarmerPublicProfileScreen } from './farmer-public-profile-screen';

// Communication & Tools Screens
import { BuyerOrdersScreen } from './buyer-orders-screen';
import { MessagesListScreen } from '../communication/messages-list-screen';
import { ChatConversationScreen } from '../communication/chat-conversation-screen';
import { VoiceCallScreen } from '../communication/voice-call-screen';
import { VideoCallScreen } from '../communication/video-call-screen';
import { IncomingCallModal } from '@/components/incoming-call-modal';
import { FirestoreCallSession } from '@/services/firestore-chat-service';
import { ScheduleInspectionModal } from '../communication/schedule-inspection-modal';
import { RateExperienceScreen } from '../communication/rate-experience-screen';
import { ReportUserScreen } from '../communication/report-user-screen';
import { NotificationsScreen } from '../communication/notifications-screen';
import { NotificationPreferencesScreen } from '../communication/notification-preferences-screen';
import { PriceAlertsScreen } from '../communication/price-alerts-screen';
import { HelpSupportScreen } from '../communication/help-support-screen';
import { AgroToolsScreen } from '../communication/agro-tools-screen';
import { FirestoreChatService } from '@/services/firestore-chat-service';
import { getStoredUser } from '@/services/api';

export type BuyerScreenView =
  | 'home'
  | 'categories'
  | 'category-products'
  | 'search'
  | 'product-detail'
  | 'reviews'
  | 'similar-products'
  | 'compare-products'
  | 'wishlist'
  | 'farm-map'
  | 'farmer-matching'
  | 'product-scanner'
  | 'cart'
  | 'profile'
  | 'edit-profile'
  | 'saved-addresses'
  | 'add-address'
  | 'favourite-farms'
  | 'settings'
  | 'security'
  | 'farmer-public-profile'
  | 'buyer-orders'
  | 'messages'
  | 'chat-conversation'
  | 'rate-experience'
  | 'report-user'
  | 'notifications'
  | 'notification-preferences'
  | 'price-alerts'
  | 'help-support'
  | 'agro-tools';

export type BuyerTab = 'home' | 'market' | 'messages' | 'wishlist' | 'profile';

interface MarketplaceFlowProps {
  onBackToAuth?: () => void;
}

export function MarketplaceFlow({ onBackToAuth }: MarketplaceFlowProps) {
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState<BuyerScreenView>('home');
  const [activeTab, setActiveTab] = useState<BuyerTab>('home');
  const [selectedCategory, setSelectedCategory] = useState({ id: 'vegetables', name: 'Vegetables' });
  const [selectedProduct, setSelectedProduct] = useState<ApiProduceItem | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<{ id: string; name: string; avatar?: string }>({
    id: 'kamal-gunawardana',
    name: 'Kamal Gunawardana',
  });
  const [rateOriginView, setRateOriginView] = useState<'reviews' | 'farmer-public-profile' | 'buyer-orders'>('farmer-public-profile');

  // Communication & Call States
  const [activeChatMeta, setActiveChatMeta] = useState<{
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
    otherUserAvatar?: string;
    otherUserRole?: 'farmer' | 'buyer';
    productTitle?: string;
    productImage?: string;
  }>({
    conversationId: '',
    otherUserId: '',
    otherUserName: 'Farmer',
    otherUserRole: 'farmer',
  });
  const [activeCall, setActiveCall] = useState<{
    visible: boolean;
    name: string;
    avatar: string;
    mode: 'audio' | 'video';
    conversationId?: string;
    otherUserId?: string;
    callId?: string;
    isIncoming?: boolean;
  }>({
    visible: false,
    name: '',
    avatar: '',
    mode: 'audio',
  });

  const [incomingCall, setIncomingCall] = useState<FirestoreCallSession | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    (async () => {
      const u = await getStoredUser();
      if (u && isMounted) {
        const myId = u.id || u._id || '';
        unsubscribe = FirestoreChatService.listenToIncomingCalls(myId, (call) => {
          if (isMounted) setIncomingCall(call);
        });
      }
    })();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ name: string; avatar: string }>({
    name: '',
    avatar: '',
  });

  const handleSelectCategory = (id: string, name: string) => {
    setSelectedCategory({ id, name });
    setCurrentView('category-products');
  };

  const handleSelectProduct = (product: ApiProduceItem) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
  };

  const handleViewFarm = (farmerId: string, farmerName: string) => {
    setSelectedFarmer({ id: farmerId, name: farmerName });
    setCurrentView('farmer-public-profile');
  };

  const handleStartChatWithFarmer = async (
    farmerIdOrName: string,
    farmerName?: string,
    product?: ApiProduceItem | null,
    farmerAvatar?: string
  ) => {
    const user = await getStoredUser();
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to chat with farmers.');
      return;
    }
    const resolvedId = farmerName ? farmerIdOrName : `farmer-${farmerIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const resolvedName = farmerName || farmerIdOrName;
    try {
      const convId = await FirestoreChatService.getOrCreateConversation({
        currentUser: user,
        otherUserId: resolvedId,
        otherUserName: resolvedName,
        otherUserRole: 'farmer',
        otherUserAvatar: farmerAvatar || '',
        productTitle: product?.title,
        productImage: product?.images?.[0],
      });
      setActiveChatMeta({
        conversationId: convId,
        otherUserId: resolvedId,
        otherUserName: resolvedName,
        otherUserAvatar: farmerAvatar || '',
        otherUserRole: 'farmer',
        productTitle: product?.title,
        productImage: product?.images?.[0],
      });
      setCurrentView('chat-conversation');
    } catch (e) {
      console.error('[Chat] handleStartChatWithFarmer error:', e);
      Alert.alert('Error', 'Could not start conversation with this farmer.');
    }
  };

  const handleTabPress = (tab: BuyerTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentView('home');
    } else if (tab === 'market') {
      setCurrentView('categories');
    } else if (tab === 'messages') {
      setCurrentView('messages');
    } else if (tab === 'wishlist') {
      setCurrentView('wishlist');
    } else if (tab === 'profile') {
      setCurrentView('profile');
    }
  };

  const isFullScreenView =
    currentView === 'product-detail' ||
    currentView === 'reviews' ||
    currentView === 'compare-products' ||
    currentView === 'farm-map' ||
    currentView === 'farmer-matching' ||
    currentView === 'product-scanner' ||
    currentView === 'cart' ||
    currentView === 'edit-profile' ||
    currentView === 'add-address' ||
    currentView === 'security' ||
    currentView === 'farmer-public-profile' ||
    currentView === 'buyer-orders' ||
    currentView === 'chat-conversation' ||
    currentView === 'rate-experience' ||
    currentView === 'report-user' ||
    currentView === 'notifications' ||
    currentView === 'notification-preferences' ||
    currentView === 'price-alerts' ||
    currentView === 'help-support' ||
    currentView === 'agro-tools';

  return (
    <View style={styles.container}>
      {/* Active Screen View */}
      <View style={styles.screenContainer}>
        {currentView === 'home' && (
          <BuyerHomeScreen
            onOpenSearch={() => setCurrentView('search')}
            onOpenCategories={() => setCurrentView('categories')}
            onSelectCategory={handleSelectCategory}
            onSelectProduct={handleSelectProduct}
            onOpenFarmsMap={() => setCurrentView('farm-map')}
            onOpenFarmerMatching={() => setCurrentView('farmer-matching')}
            onOpenProductScanner={() => setCurrentView('product-scanner')}
            onOpenWishlist={() => setCurrentView('wishlist')}
            onOpenCart={() => setCurrentView('cart')}
            onOpenOrders={() => setCurrentView('buyer-orders')}
            onOpenChats={() => setCurrentView('messages')}
            onOpenProfile={() => setCurrentView('profile')}
            onSelectFarmer={(farmer) => {
              setSelectedFarmer({
                id: farmer.id,
                name: farmer.name,
                avatar: farmer.avatar,
              });
              setCurrentView('farmer-public-profile');
            }}
          />
        )}

        {currentView === 'categories' && (
          <AllCategoriesScreen
            onBack={() => setCurrentView('home')}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentView === 'category-products' && (
          <CategoryProductsScreen
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onBack={() => setCurrentView('categories')}
            onSelectProduct={handleSelectProduct}
            onExploreAll={() => setCurrentView('categories')}
          />
        )}

        {currentView === 'search' && (
          <SearchScreen
            onBack={() => setCurrentView('home')}
            onSelectProduct={handleSelectProduct}
            onSelectCategory={(catId) => handleSelectCategory(catId, catId)}
          />
        )}

        {currentView === 'product-detail' && selectedProduct && (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setCurrentView('home')}
            onOrderNow={(prod, qty) => {
              Alert.alert(
                'Order Placed! 📦',
                `Your order for ${qty} ${prod.unit} of ${prod.title} has been routed to the farmer. Total: Rs. ${(qty * prod.pricePerUnit).toLocaleString()}`
              );
            }}
            onChatFarmer={() => {
              handleStartChatWithFarmer(
                String(selectedProduct.farmerId || 'farmer-1'),
                selectedProduct.farmerName || 'Verified Farmer',
                selectedProduct,
                selectedProduct.farmerAvatar
              );
            }}
            onOpenReviews={() => setCurrentView('reviews')}
            onOpenSimilar={() => setCurrentView('similar-products')}
            onOpenCompare={() => setCurrentView('compare-products')}
            onOpenFarmMap={() => setCurrentView('farm-map')}
            onOpenWishlist={() => setCurrentView('wishlist')}
            onOpenCart={() => setCurrentView('cart')}
            onOpenFarmerProfile={(farmer) => {
              setSelectedFarmer(farmer);
              setCurrentView('farmer-public-profile');
            }}
          />
        )}

        {currentView === 'reviews' && selectedProduct && (
          <ReviewsScreen
            product={selectedProduct}
            onBack={() => setCurrentView('product-detail')}
            onWriteReview={() => {
              setRateOriginView('reviews');
              setSelectedFarmer({
                id: selectedProduct.farmerId || (selectedProduct as any)._id || selectedProduct.id || 'farmer-1',
                name: selectedProduct.farmerName || 'Farmer',
                avatar: selectedProduct.farmerAvatar,
              });
              setCurrentView('rate-experience');
            }}
          />
        )}

        {currentView === 'similar-products' && (
          <SimilarProductsScreen
            baseProduct={selectedProduct}
            onBack={() => setCurrentView('product-detail')}
            onSelectProduct={handleSelectProduct}
            onOpenCompare={() => setCurrentView('compare-products')}
            onToggleWishlist={() => {}}
          />
        )}

        {currentView === 'compare-products' && (
          <CompareProductsScreen
            initialProduct={selectedProduct}
            onBack={() => setCurrentView('product-detail')}
            onSelectProduct={(compItem) => {
              Alert.alert('Selected', `${compItem.title} selected for comparison.`);
            }}
            onOrderProduct={(compItem) => {
              Alert.alert('Order Initiated', `Ordering ${compItem.title} at Rs. ${compItem.pricePerUnit}/${compItem.unit}`);
            }}
          />
        )}

        {currentView === 'wishlist' && (
          <WishlistScreen
            onBack={() => setCurrentView('home')}
            onViewCart={() => setCurrentView('cart')}
            onSelectProduct={(item) => {
              handleSelectProduct({
                id: item.produceId || item.id,
                _id: item.produceId || item.id,
                title: item.title,
                pricePerUnit: item.pricePerUnit,
                unit: item.unit,
                farmerName: item.farmerName,
                locationCity: item.locationCity,
                images: [item.image],
                category: item.category || 'vegetables',
                isOrganic: item.organic || false,
                availableQuantity: item.inStock ? 100 : 0,
              } as any);
            }}
          />
        )}

        {currentView === 'cart' && (
          <CartScreen
            onBack={() => setCurrentView('home')}
            onExploreMarketplace={() => setCurrentView('home')}
          />
        )}

        {currentView === 'farm-map' && (
          <FarmMapScreen
            initialFarmId={selectedFarmer?.id}
            initialView="map"
            onBack={() => setCurrentView('home')}
            onChatFarmer={(phone) => {
              handleStartChatWithFarmer(selectedFarmer?.id || 'f-1', selectedFarmer?.name || 'Farmer');
            }}
            onOpenFarmerMatching={() => setCurrentView('farmer-matching')}
            onOpenFarmerProfile={(farm) => {
              setSelectedFarmer({
                id: farm.id,
                name: farm.name,
                avatar: farm.avatar,
              });
              setCurrentView('farmer-public-profile');
            }}
          />
        )}

        {currentView === 'farmer-matching' && (
          <FarmerMatchingFlow
            onBack={() => setCurrentView('home')}
            onOrderFarmer={(farmer) => {
              Alert.alert('Direct Order', `Procurement contract sent to ${farmer.name}!`);
            }}
            onChatFarmer={(fId) => {
              handleStartChatWithFarmer(fId);
            }}
          />
        )}

        {currentView === 'product-scanner' && (
          <ProductScannerFlow
            onBack={() => setCurrentView('home')}
            onExploreMatchingFarmers={(_crop) => {
              setCurrentView('farmer-matching');
            }}
          />
        )}

        {currentView === 'messages' && (
          <MessagesListScreen
            currentRole="buyer"
            onOpenConversation={(cId, oId, oName, oAvatar, oRole) => {
              setActiveChatMeta({
                conversationId: cId,
                otherUserId: oId,
                otherUserName: oName,
                otherUserAvatar: oAvatar,
                otherUserRole: oRole,
              });
              setCurrentView('chat-conversation');
            }}
            onStartCall={(name, avatar, mode) => {
              setActiveCall({ visible: true, name, avatar, mode });
            }}
          />
        )}

        {currentView === 'chat-conversation' && (
          <ChatConversationScreen
            conversationId={activeChatMeta.conversationId}
            otherUserId={activeChatMeta.otherUserId}
            otherUserName={activeChatMeta.otherUserName}
            otherUserAvatar={activeChatMeta.otherUserAvatar}
            otherUserRole={activeChatMeta.otherUserRole}
            productTitle={activeChatMeta.productTitle}
            productImage={activeChatMeta.productImage}
            currentRole="buyer"
            onBack={() => setCurrentView(activeTab === 'messages' ? 'messages' : 'home')}
            onStartAudioCall={(name, avatar) => {
              setActiveCall({
                visible: true,
                name,
                avatar,
                mode: 'audio',
                conversationId: activeChatMeta.conversationId,
                otherUserId: activeChatMeta.otherUserId,
              });
            }}
            onStartVideoCall={(name, avatar) => {
              setActiveCall({
                visible: true,
                name,
                avatar,
                mode: 'video',
                conversationId: activeChatMeta.conversationId,
                otherUserId: activeChatMeta.otherUserId,
              });
            }}
            onRequestInspection={() => setShowScheduleModal(true)}
            onRateUser={(uId, uName, uAvatar) => {
              if (uId) {
                setSelectedFarmer({ id: uId, name: uName || 'Farmer', avatar: uAvatar });
              }
              setCurrentView('rate-experience');
            }}
          />
        )}

        {currentView === 'rate-experience' && (
          <RateExperienceScreen
            farmerId={selectedFarmer.id}
            farmerName={selectedFarmer.name}
            farmerAvatar={selectedFarmer.avatar}
            onBack={() => setCurrentView(rateOriginView)}
            onSubmitSuccess={() => setCurrentView(rateOriginView)}
          />
        )}

        {currentView === 'report-user' && (
          <ReportUserScreen
            targetName={reportTarget.name}
            targetAvatar={reportTarget.avatar}
            onBack={() => setCurrentView('home')}
            onSubmitSuccess={() => setCurrentView('home')}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsScreen
            onBack={() => setCurrentView('home')}
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
          <PriceAlertsScreen onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'help-support' && (
          <HelpSupportScreen
            onBack={() => setCurrentView('profile')}
            onOpenLiveChat={() => {
              handleStartChatWithFarmer('Famora Agronomist Support');
            }}
          />
        )}

        {currentView === 'agro-tools' && (
          <AgroToolsScreen onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'profile' && (
          <BuyerProfileScreen
            onEditProfile={() => setCurrentView('edit-profile')}
            onOpenSavedAddresses={() => setCurrentView('saved-addresses')}
            onOpenFavouriteFarms={() => setCurrentView('favourite-farms')}
            onOpenOrderHistory={() => setCurrentView('buyer-orders')}
            onOpenSettings={() => setCurrentView('notification-preferences')}
            onOpenSecurity={() => setCurrentView('security')}
            onOpenHelpSupport={() => setCurrentView('help-support')}
            onLogout={onBackToAuth}
          />
        )}

        {currentView === 'buyer-orders' && (
          <BuyerOrdersScreen
            onBack={() => setCurrentView('home')}
            onChatFarmer={(farmerName, farmerId) => {
              handleStartChatWithFarmer(farmerId || 'farmer-1', farmerName);
            }}
            onRateOrder={(order) => {
              setRateOriginView('buyer-orders');
              setSelectedFarmer({ id: order.farmerId, name: order.farmerName });
              setCurrentView('rate-experience');
            }}
            onReportIssue={(order) => {
              setReportTarget({ name: order.farmerName, avatar: order.farmerAvatar });
              setCurrentView('report-user');
            }}
            onCallFarmer={(farmerName, farmerPhone, avatar) => {
              setActiveCall({
                visible: true,
                name: farmerName,
                avatar: avatar,
                mode: 'audio',
              });
            }}
          />
        )}

        {currentView === 'edit-profile' && (
          <EditProfileScreen
            onBack={() => setCurrentView('profile')}
            onSaved={() => setCurrentView('profile')}
          />
        )}

        {currentView === 'saved-addresses' && (
          <SavedAddressesScreen
            onBack={() => setCurrentView('profile')}
            onAddNewAddress={() => setCurrentView('add-address')}
          />
        )}

        {currentView === 'add-address' && (
          <AddAddressScreen
            onBack={() => setCurrentView('saved-addresses')}
            onAddressAdded={() => setCurrentView('saved-addresses')}
          />
        )}

        {currentView === 'favourite-farms' && (
          <FavouriteFarmsScreen
            onBack={() => setCurrentView('profile')}
            onViewFarm={handleViewFarm}
          />
        )}

        {currentView === 'settings' && (
          <SettingsScreen
            onBack={() => setCurrentView('profile')}
            onOpenEditProfile={() => setCurrentView('edit-profile')}
            onOpenSecurity={() => setCurrentView('security')}
            onLogout={onBackToAuth}
          />
        )}

        {currentView === 'security' && (
          <SecurityScreen
            onBack={() => setCurrentView('settings')}
            onLogout={onBackToAuth}
          />
        )}

        {currentView === 'farmer-public-profile' && (
          <FarmerPublicProfileScreen
            farmerId={selectedFarmer.id}
            farmerName={selectedFarmer.name}
            farmerAvatar={selectedFarmer.avatar}
            onBack={() => setCurrentView('home')}
            onSelectProduce={handleSelectProduct}
            onOpenChat={(f: any) => {
              handleStartChatWithFarmer(f.id, f.name, null, f.avatar || selectedFarmer.avatar);
            }}
            onRateFarmer={(f) => {
              setRateOriginView('farmer-public-profile');
              setSelectedFarmer({ id: f.id, name: f.name, avatar: f.avatar });
              setCurrentView('rate-experience');
            }}
            onViewOnMap={(f) => {
              if (f?.id) {
                setSelectedFarmer((prev) => ({ ...prev, id: f.id, name: f.name || prev.name }));
              }
              setCurrentView('farm-map');
            }}
          />
        )}
      </View>

      {/* Incoming Call Modal */}
      <IncomingCallModal
        call={incomingCall}
        onAccept={(call) => {
          setIncomingCall(null);
          setActiveCall({
            visible: true,
            name: call.callerName,
            avatar: call.callerAvatar,
            mode: call.mode,
            callId: call.id,
            isIncoming: true,
          });
        }}
        onDecline={() => setIncomingCall(null)}
      />

      {/* Voice Call Modal */}
      {activeCall.visible && activeCall.mode === 'audio' && (
        <VoiceCallScreen
          visible={activeCall.visible}
          participantName={activeCall.name}
          participantAvatar={activeCall.avatar}
          conversationId={activeCall.conversationId}
          otherUserId={activeCall.otherUserId}
          callId={activeCall.callId}
          isIncoming={activeCall.isIncoming}
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
          conversationId={activeCall.conversationId}
          otherUserId={activeCall.otherUserId}
          callId={activeCall.callId}
          isIncoming={activeCall.isIncoming}
          onEndCall={() => setActiveCall((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Schedule Live Video Inspection Modal */}
      <ScheduleInspectionModal
        visible={showScheduleModal}
        farmerName={activeCall.name || 'Verified Farmer'}
        onClose={() => setShowScheduleModal(false)}
        onScheduled={async (details) => {
          setShowScheduleModal(false);
          const user = await getStoredUser();
          if (user && activeChatMeta.conversationId) {
            await FirestoreChatService.sendMessage({
              conversationId: activeChatMeta.conversationId,
              currentUser: user,
              text: `📅 Scheduled Live Inspection for ${details.date} at ${details.time} (${details.note})`,
            });
          }
        }}
      />

      {/* Persistent Bottom Tab Bar */}
      {!isFullScreenView && (
        <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 18 : 14) }]}>
          {/* 1. Home */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('home')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'home' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <Path d="M9 22V12h6v10" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              Home
            </Text>
          </Pressable>

          {/* 2. Market / Explore */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('market')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'market' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 6h16M4 12h16M4 18h7" />
              <Path d="M17 15l3 3-3 3" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'market' && styles.tabLabelActive]}>
              Market
            </Text>
          </Pressable>

          {/* 3. Chats / Messages */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('messages')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'messages' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'messages' && styles.tabLabelActive]}>
              Chats
            </Text>
          </Pressable>

          {/* 4. Wishlist */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('wishlist')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'wishlist' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'wishlist' && styles.tabLabelActive]}>
              Wishlist
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
  screenContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
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
});
