import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { FarmoraSplashScreen } from '@/components/splash-screen';
import { LanguageSelectionScreen, LanguageCode } from '@/screens/language-selection-screen';
import { OnboardingScreen } from '@/screens/onboarding-screen';
import {
  SelectAccountTypeScreen,
  AccountType,
} from '@/screens/auth/select-account-type-screen';
import { LoginScreen } from '@/screens/auth/login-screen';
import { RegisterScreen } from '@/screens/auth/register-screen';
import { RegistrationSuccessScreen } from '@/screens/auth/registration-success-screen';
import { ForgotPasswordScreen } from '@/screens/auth/forgot-password-screen';
import { OtpVerificationScreen } from '@/screens/auth/otp-verification-screen';
import { ResetPasswordScreen } from '@/screens/auth/reset-password-screen';
import AppTabs from '@/components/app-tabs';

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
  const [accountType, setAccountType] = useState<AccountType>('farmer');
  const [resetIdentifier, setResetIdentifier] = useState('+94 77 XXX XXXX');

  useEffect(() => {
    // Hide native splash screen once JavaScript bundle is mounted
    SplashScreen.hideAsync().catch(() => {});
  }, []);

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
              setAccountType(type);
              setCurrentStep('login');
            }}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onBack={() => setCurrentStep('account-type')}
            onLoginSuccess={() => setCurrentStep('authenticated')}
            onCreateAccount={() => setCurrentStep('register')}
            onForgotPassword={() => setCurrentStep('forgot-password')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
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
            phoneNumber={resetIdentifier}
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
        return <AppTabs />;
    }
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {renderContent()}
    </ThemeProvider>
  );
}
