import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [activeModal, setActiveModal] = useState<PreviewModal>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Farmora Live</Text>
            </View>
            <Text style={styles.countryTag}>🇱🇰 Sri Lanka</Text>
          </View>
          <Text style={styles.title}>Farmora</Text>
          <Text style={styles.subtitle}>FRESH FROM FARMERS</Text>
          <Text style={styles.taglineDescription}>
            Connecting local growers directly with buyers across the island.
          </Text>
        </View>

        {/* Experience Previews Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>📱</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Farmora Flow Explorer</Text>
              <Text style={styles.cardSubtitle}>
                Preview all onboarding and authentication screens
              </Text>
            </View>
          </View>

          <Text style={styles.cardBody}>
            Tap any screen below to preview its design and interaction.
          </Text>

          <View style={styles.buttonGrid}>
            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('splash')}>
              <Text style={styles.previewBtnText}>✨ Splash Screen</Text>
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
              onPress={() => setActiveModal('account-type')}>
              <Text style={styles.previewBtnText}>👥 Select Account Type</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('login')}>
              <Text style={styles.previewBtnText}>🔑 Login Screen</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('register')}>
              <Text style={styles.previewBtnText}>📝 Register / Validation</Text>
            </Pressable>

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('success')}>
              <Text style={styles.previewBtnText}>🎉 Account Created (Success)</Text>
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

            <Pressable
              style={styles.previewBtn}
              onPress={() => setActiveModal('reset')}>
              <Text style={styles.previewBtnText}>🔒 Reset Password</Text>
            </Pressable>
          </View>
        </View>

        {/* Agricultural Highlights */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Direct from Farmers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>25+</Text>
            <Text style={styles.statLabel}>Districts Covered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Fresh</Text>
            <Text style={styles.statLabel}>Daily Harvests</Text>
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
            <FarmoraSplashScreen
              autoProgress={true}
              onFinish={() => {}}
            />
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
              onContinue={() => setActiveModal('login')}
            />
          )}

          {activeModal === 'login' && (
            <LoginScreen
              onBack={() => setActiveModal(null)}
              onForgotPassword={() => setActiveModal('forgot')}
              onCreateAccount={() => setActiveModal('register')}
              onLoginSuccess={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'register' && (
            <RegisterScreen
              onBackToLogin={() => setActiveModal('login')}
              onRegisterSuccess={() => setActiveModal('success')}
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
    paddingVertical: Spacing.three,
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
  cardBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: Spacing.three,
  },
  buttonGrid: {
    gap: 8,
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
});
