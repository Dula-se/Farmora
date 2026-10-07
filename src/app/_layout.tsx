import React, { useEffect, useRef, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View, useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '@/hooks/use-notifications';

import { FarmoraSplashScreen } from '@/components/splash-screen';
import { LanguageSelectionScreen, LanguageCode } from '@/screens/language-selection-screen';
import { OnboardingScreen } from '@/screens/onboarding-screen';
import {
  SelectAccountTypeScreen,
  AccountType,
} from '@/screens/auth/select-account-type-screen';
import { LoginScreen } from '@/screens/auth/login-screen';
import { RegisterScreen } from '@/screens/auth/register-screen';
import { BuyerRegisterScreen } from '@/screens/auth/buyer-register-screen';
import { RegistrationSuccessScreen } from '@/screens/auth/registration-success-screen';
import { ForgotPasswordScreen } from '@/screens/auth/forgot-password-screen';
import { OtpVerificationScreen } from '@/screens/auth/otp-verification-screen';
import { ResetPasswordScreen } from '@/screens/auth/reset-password-screen';
import { MarketplaceFlow } from '@/screens/buyer/marketplace-flow';
import { FarmerFlow } from '@/screens/farmer/farmer-flow';
import { getStoredUser, ApiUser } from '@/services/api';
import { CartProvider } from '@/context/cart-context';
import AppTabs from '@/components/app-tabs';

// App root layout with role-based routing (Farmer vs Buyer)

SplashScreen.preventAutoHideAsync().catch(() => {});

type AuthStep =
  | 'splash'
  | 'language'
  | 'onboarding'
  | 'account-type'
  | 'login'
  | 'register'
  | 'registration-success'
  | 'forgot-password'
  | 'otp'
  | 'reset-password'
  | 'authenticated';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [currentStep, setCurrentStep] = useState<AuthStep>('splash');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const [accountType, setAccountType] = useState<'farmer' | 'buyer'>('farmer');
  const [resetIdentifier, setResetIdentifier] = useState('+94 77 XXX XXXX');

  // ── Push Notifications ─────────────────────────────────────────────────────
  // Pass userId here once auth is implemented (e.g. useNotifications(user?.id))
  const { expoPushToken, notificationResponse } = useNotifications();
  const lastNotificationResponse = useRef<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    // Hide native splash screen once JavaScript bundle is mounted
    SplashScreen.hideAsync().catch(() => {});

    // Restore active user session and determine role
    getStoredUser().then((stored) => {
      if (stored) {
        setAccountType(stored.accountType === 'farmer' ? 'farmer' : 'buyer');
      }
    });
  }, []);

  // Handle notification tap navigation (e.g. deep-link into a screen)
  useEffect(() => {
    if (
      notificationResponse &&
      notificationResponse !== lastNotificationResponse.current
    ) {
      lastNotificationResponse.current = notificationResponse;
      const data = notificationResponse.notification.request.content.data as Record<string, unknown>;
      console.log('[Layout] Notification tapped, data:', data);
      // TODO: navigate based on data.screen or data.type
    }
  }, [notificationResponse]);

  const renderContent = () => {
    switch (currentStep) {
      case 'splash':
        return (
          <View style={StyleSheet.absoluteFill}>
            <FarmoraSplashScreen
              autoProgress={true}
              onFinish={() => setCurrentStep('language')}
            />
          </View>
        );

      case 'language':
        return (
          <LanguageSelectionScreen
            onContinue={(lang) => {
              setSelectedLanguage(lang);
              setCurrentStep('onboarding');
            }}
          />
        );

      case 'onboarding':
        return (
          <OnboardingScreen
            onPrevious={() => setCurrentStep('language')}
            onFinish={() => setCurrentStep('account-type')}
          />
        );

      case 'account-type':
        return (
          <SelectAccountTypeScreen
            onBack={() => setCurrentStep('onboarding')}
            onContinue={(type) => {
              setAccountType(type === 'buyer' ? 'buyer' : 'farmer');
              setCurrentStep('register');
            }}
            onLogin={() => setCurrentStep('login')}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onBack={() => setCurrentStep('account-type')}
            onLoginSuccess={(user) => {
              if (user) {
                setAccountType(user.accountType === 'farmer' ? 'farmer' : 'buyer');
              }
              setCurrentStep('authenticated');
            }}
            onCreateAccount={() => setCurrentStep('account-type')}
            onForgotPassword={() => setCurrentStep('forgot-password')}
          />
        );

      case 'register':
        if (accountType === 'buyer') {
          return (
            <BuyerRegisterScreen
              onBackToLogin={() => setCurrentStep('login')}
              onRegisterSuccess={(user) => {
                if (user?.accountType) {
                  setAccountType(user.accountType);
                }
                setCurrentStep('authenticated');
              }}
            />
          );
        }
        return (
          <RegisterScreen
            accountType={accountType}
            onBackToLogin={() => setCurrentStep('login')}
            onRegisterSuccess={() => setCurrentStep('registration-success')}
          />
        );

      case 'registration-success':
        return (
          <RegistrationSuccessScreen
            onCompleteProfile={() => setCurrentStep('authenticated')}
            onSkipForNow={() => setCurrentStep('authenticated')}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBackToLogin={() => setCurrentStep('login')}
            onSendCode={(id) => {
              if (id) setResetIdentifier(id);
              setCurrentStep('otp');
            }}
          />
        );

      case 'otp':
        return (
          <OtpVerificationScreen
            phoneNumber={resetIdentifier.includes('@') ? '+94 77 123 4567' : resetIdentifier}
            email={resetIdentifier.includes('@') ? resetIdentifier : 'farmer@famora.lk'}
            onBack={() => setCurrentStep('forgot-password')}
            onChangeNumber={() => setCurrentStep('forgot-password')}
            onVerify={() => setCurrentStep('reset-password')}
          />
        );

      case 'reset-password':
        return (
          <ResetPasswordScreen
            onBack={() => setCurrentStep('otp')}
            onResetSuccess={() => setCurrentStep('login')}
          />
        );

      case 'authenticated':
      default:
        // STRICT ROLE ENFORCEMENT: Farmer screens accessible ONLY to farmers!
        if (accountType === 'farmer') {
          return (
            <FarmerFlow
              onBackToAuth={() => setCurrentStep('login')}
              onSwitchToBuyerPreview={() => setAccountType('buyer')}
            />
          );
        }
        return <MarketplaceFlow onBackToAuth={() => setCurrentStep('login')} />;
    }
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CartProvider>
        {renderContent()}
      </CartProvider>
    </ThemeProvider>
  );
}
