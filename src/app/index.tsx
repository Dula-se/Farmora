import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { FarmoraSplashScreen } from '@/components/splash-screen';
import { LanguageSelectionScreen } from '@/screens/language-selection-screen';
import { OnboardingScreen } from '@/screens/onboarding-screen';
import { SelectAccountTypeScreen } from '@/screens/auth/select-account-type-screen';
import { LoginScreen } from '@/screens/auth/login-screen';
import { RegisterScreen } from '@/screens/auth/register-screen';
import { ForgotPasswordScreen } from '@/screens/auth/forgot-password-screen';
import { OtpVerificationScreen } from '@/screens/auth/otp-verification-screen';
import { ResetPasswordScreen } from '@/screens/auth/reset-password-screen';
import { RegistrationSuccessScreen } from '@/screens/auth/registration-success-screen';
import { MarketplaceFlow } from '@/screens/buyer/marketplace-flow';
import { FarmerFlow } from '@/screens/farmer/farmer-flow';
import { fetchProduceListings, ApiProduceItem, getStoredUser, ApiUser } from '@/services/api';
import { Spacing } from '@/constants/theme';

type PreviewModal =
  | 'splash'
  | 'language'
  | 'onboarding'
  | 'account-type'
  | 'login'
  | 'register'
  | 'success'
  | 'forgot'
  | 'otp'
  | 'reset'
  | null;

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<'marketplace' | 'flow-explorer'>('marketplace');
  const [activeModal, setActiveModal] = useState<PreviewModal>(null);
  const [produceList, setProduceList] = useState<ApiProduceItem[]>([]);
  const [loadingProduce, setLoadingProduce] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setApiError(null);
      const [items, user] = await Promise.all([
        fetchProduceListings(),
        getStoredUser(),
      ]);
      setProduceList(items);
      setCurrentUser(user);
    } catch (err: any) {
      console.error('[HomeScreen] Failed to fetch real data from MongoDB:', err);
      setApiError(err.message || 'Could not connect to MongoDB API.');
    } finally {
      setLoadingProduce(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (viewMode === 'marketplace') {
    if (currentUser?.accountType === 'farmer') {
      return (
        <View style={{ flex: 1 }}>
          <FarmerFlow onBackToAuth={() => setViewMode('flow-explorer')} />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <MarketplaceFlow onBackToAuth={() => setViewMode('flow-explorer')} />
      </View>
    );
  }

  // Derive real statistics from MongoDB database
  const totalListings = produceList.length;
  const uniqueDistricts = new Set(produceList.map((p) => p.locationDistrict)).size;
  const totalVolumeKg = produceList.reduce((sum, p) => sum + (p.availableQuantity || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Return to Marketplace pill */}
      <View style={styles.topSwitcherBar}>
        <Pressable
          style={styles.returnMarketplaceBtn}
          onPress={() => setViewMode('marketplace')}>
          <Text style={styles.returnMarketplaceBtnText}>🛒 Open Buyer Marketplace (12 Screens) →</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#386641"
            colors={['#386641']}
          />
        }>
        {/* Header Banner */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>MongoDB Connected</Text>
            </View>
            <Text style={styles.countryTag}>🇱🇰 Sri Lanka</Text>
          </View>
          <Text style={styles.title}>Farmora</Text>
          <Text style={styles.subtitle}>FRESH FROM LOCAL FARMERS</Text>

          {currentUser ? (
            <View style={styles.loggedInBadge}>
              <Text style={styles.loggedInText}>
                👋 Welcome, <Text style={styles.boldText}>{currentUser.fullName}</Text> (
                {currentUser.accountType})
              </Text>
            </View>
          ) : (
            <Text style={styles.taglineDescription}>
              Connecting verified local growers directly with buyers across the island.
            </Text>
          )}
        </View>

        {/* Real Live Statistics from MongoDB */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalListings}</Text>
            <Text style={styles.statLabel}>Live Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{uniqueDistricts || '25+'}</Text>
            <Text style={styles.statLabel}>Districts Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg` : 'Fresh'}
            </Text>
            <Text style={styles.statLabel}>Available Stock</Text>
          </View>
        </View>

        {/* Real MongoDB Produce Section */}
        <View style={styles.produceSectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>🥬 Live Market Produce</Text>
            <Text style={styles.sectionSubtitle}>
              Real records loaded directly from MongoDB
            </Text>
          </View>
          <Pressable onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </Pressable>
        </View>

        {apiError && (
          <View style={styles.errorNotice}>
            <Text style={styles.errorNoticeText}>⚠️ {apiError}</Text>
            <Text style={styles.errorNoticeSub}>
              Make sure backend is running on port 5001 (`npm run dev` in backend folder).
            </Text>
          </View>
        )}

        {loadingProduce ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#386641" />
            <Text style={styles.loaderText}>Fetching real produce from MongoDB...</Text>
          </View>
        ) : produceList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🌾</Text>
            <Text style={styles.emptyTitle}>No produce listings found</Text>
            <Text style={styles.emptySub}>
              Start the backend seeder to populate demo crops or create a listing.
            </Text>
          </View>
        ) : (
          <View style={styles.produceGrid}>
            {produceList.map((item) => (
              <View key={item.id || item._id} style={styles.produceCard}>
                {item.images && item.images[0] ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.produceImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.produceImage, styles.produceImagePlaceholder]}>
                    <Text style={styles.placeholderEmoji}>🌱</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <View style={styles.tagRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                    </View>
                    {item.isOrganic && (
                      <View style={styles.organicBadge}>
                        <Text style={styles.organicText}>🌱 Organic</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.produceTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <Text style={styles.farmerLine}>
                    🧑‍🌾 {item.farmerName} • 📍 {item.locationCity}, {item.locationDistrict}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      <Text style={styles.priceCurrency}>Rs. </Text>
                      {item.pricePerUnit}
                      <Text style={styles.priceUnit}> /{item.unit}</Text>
                    </Text>

                    <Text style={styles.stockText}>
                      📦 {item.availableQuantity} {item.unit} left
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Screen Previews / Explorer Drawer */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>📱</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Farmora Flow Explorer</Text>
              <Text style={styles.cardSubtitle}>
                Test screens & MongoDB authentication
              </Text>
            </View>
          </View>

          <View style={styles.buttonGrid}>
            <Pressable
              style={styles.previewBtnPrimary}
              onPress={() => setActiveModal('account-type')}>
              <Text style={styles.previewBtnPrimaryText}>
                ✨ 2-Role Select Screen (Welcome to Farmora)
              </Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('login')}>
              <Text style={styles.previewBtnText}>🔑 Real MongoDB Login</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('register')}>
              <Text style={styles.previewBtnText}>📝 Real MongoDB Register</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('language')}>
              <Text style={styles.previewBtnText}>🌐 Language Selection</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('onboarding')}>
              <Text style={styles.previewBtnText}>🚀 3 Onboarding Slides</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('forgot')}>
              <Text style={styles.previewBtnText}>❓ Forgot Password</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('otp')}>
              <Text style={styles.previewBtnText}>🔢 OTP Verification</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Screen Preview Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setActiveModal(null)}>
        <View style={StyleSheet.absoluteFill}>
          {activeModal === 'splash' && (
            <FarmoraSplashScreen autoProgress={true} onFinish={() => {}} />
          )}

          {activeModal === 'language' && (
            <LanguageSelectionScreen onContinue={() => setActiveModal(null)} />
          )}

          {activeModal === 'onboarding' && (
            <OnboardingScreen onFinish={() => setActiveModal(null)} />
          )}

          {activeModal === 'account-type' && (
            <SelectAccountTypeScreen
              onBack={() => setActiveModal(null)}
              onContinue={() => setActiveModal('register')}
              onLogin={() => setActiveModal('login')}
            />
          )}

          {activeModal === 'login' && (
            <LoginScreen
              onBack={() => setActiveModal(null)}
              onForgotPassword={() => setActiveModal('forgot')}
              onCreateAccount={() => setActiveModal('register')}
              onLoginSuccess={() => {
                setActiveModal(null);
                loadData();
              }}
            />
          )}

          {activeModal === 'register' && (
            <RegisterScreen
              onBackToLogin={() => setActiveModal('login')}
              onRegisterSuccess={() => {
                setActiveModal('success');
                loadData();
              }}
            />
          )}

          {activeModal === 'success' && (
            <RegistrationSuccessScreen
              onCompleteProfile={() => setActiveModal(null)}
              onSkipForNow={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'forgot' && (
            <ForgotPasswordScreen
              onBackToLogin={() => setActiveModal('login')}
              onSendCode={() => setActiveModal('otp')}
            />
          )}

          {activeModal === 'otp' && (
            <OtpVerificationScreen
              onBack={() => setActiveModal('forgot')}
              onChangeNumber={() => setActiveModal('forgot')}
              onVerify={() => setActiveModal('reset')}
            />
          )}

          {activeModal === 'reset' && (
            <ResetPasswordScreen
              onBack={() => setActiveModal('otp')}
              onResetSuccess={() => setActiveModal('login')}
            />
          )}

          {/* Close Floating Button */}
          <SafeAreaView style={styles.modalCloseOverlay}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setActiveModal(null)}>
              <Text style={styles.closeButtonText}>✕ Close Preview</Text>
            </Pressable>
          </SafeAreaView>
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
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  countryTag: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  taglineDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 20,
  },
  loggedInBadge: {
    backgroundColor: '#EBF5EE',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C6E3D0',
  },
  loggedInText: {
    fontSize: 13,
    color: '#1E5E3A',
  },
  boldText: {
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  produceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  errorNotice: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },
  errorNoticeText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  errorNoticeSub: {
    color: '#7F1D1D',
    fontSize: 11,
    marginTop: 4,
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  produceGrid: {
    gap: 14,
  },
  produceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#1A2E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  produceImage: {
    width: '100%',
    height: 170,
    backgroundColor: '#E2E8F0',
  },
  produceImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 44,
  },
  cardInfo: {
    padding: 14,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  organicBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  organicText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  produceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  farmerLine: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#166534',
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.four,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  buttonGrid: {
    gap: 8,
  },
  previewBtnPrimary: {
    backgroundColor: '#386641',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  previewBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  previewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseOverlay: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 999,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  floatingSwitcher: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 24,
    right: 16,
    zIndex: 9999,
  },
  switcherPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  switcherPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  topSwitcherBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  returnMarketplaceBtn: {
    backgroundColor: '#386641',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  returnMarketplaceBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
