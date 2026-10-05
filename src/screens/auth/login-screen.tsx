import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { loginWithApi, ApiUser } from '@/services/api';

interface LoginScreenProps {
  onLoginSuccess?: (user?: ApiUser) => void;
  onForgotPassword?: () => void;
  onCreateAccount?: () => void;
  onBack?: () => void;
}

export function LoginScreen({
  onLoginSuccess,
  onForgotPassword,
  onCreateAccount,
  onBack,
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your mobile number or email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await loginWithApi(identifier.trim(), password);
      console.log('[LoginScreen] Logged in successfully via MongoDB:', data.user.fullName);
      onLoginSuccess?.(data.user);
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
      console.error('[LoginScreen] Error:', msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoFarmer = () => {
    setIdentifier('0771234567');
    setPassword('Farmora@2026');
    setErrorMessage(null);
  };

  const fillDemoBuyer = () => {
    setIdentifier('0779876543');
    setPassword('Farmora@2026');
    setErrorMessage(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Top Header */}
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        ) : (
          <View />
        )}

        <View style={styles.brandContainer}>
          <View style={styles.logoSquare}>
            <View style={styles.sproutMini}>
              <View style={styles.sproutMiniLeafOrange} />
              <View style={styles.sproutMiniLeafWhite} />
              <View style={styles.sproutMiniStem} />
            </View>
          </View>
          <Text style={styles.brandName}>Farmora</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Log in to continue your fresh trading experience.
          </Text>
        </View>

        {/* Demo Credentials Quick-Fill helper */}
        <View style={styles.demoBox}>
          <Text style={styles.demoLabel}>⚡ Quick Fill Demo Accounts (MongoDB):</Text>
          <View style={styles.demoPillsRow}>
            <Pressable style={styles.demoPill} onPress={fillDemoFarmer}>
              <Text style={styles.demoPillText}>🌾 Sunil (Farmer)</Text>
            </Pressable>
            <Pressable style={styles.demoPill} onPress={fillDemoBuyer}>
              <Text style={styles.demoPillText}>🏬 Keells (Buyer)</Text>
            </Pressable>
          </View>
        </View>

        {/* Error Alert */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
          </View>
        )}

        {/* Input Fields */}
        <View style={styles.formContainer}>
          {/* Mobile or Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number or Email</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📞</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter mobile (e.g. 0771234567)"
                placeholderTextColor="#94A3B8"
                value={identifier}
                onChangeText={(t) => {
                  setIdentifier(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMessage) setErrorMessage(null);
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
                style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <Pressable
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}>
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}>
                {rememberMe && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </Pressable>

            <Pressable
              style={styles.forgotPasswordPill}
              onPress={onForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Login Button */}
          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.loginButton,
              loading && styles.loginButtonDisabled,
              pressed && styles.loginButtonPressed,
            ]}
            onPress={handleLogin}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Create Account Link */}
          <View style={styles.createAccountRow}>
            <Text style={styles.noAccountText}>Don&apos;t have an account? </Text>
            <Pressable onPress={onCreateAccount}>
              <Text style={styles.createAccountLink}>Create Account</Text>
            </Pressable>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#1E293B',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#386641',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sproutMini: {
    width: 14,
    height: 14,
    position: 'relative',
    alignItems: 'center',
  },
  sproutMiniLeafOrange: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 5,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E58A54',
    transform: [{ rotate: '-35deg' }],
  },
  sproutMiniLeafWhite: {
    position: 'absolute',
    top: 2,
    right: 1,
    width: 5.5,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '35deg' }],
  },
  sproutMiniStem: {
    position: 'absolute',
    top: 4,
    width: 1.5,
    height: 7,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2E20',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  demoBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#386641',
    borderColor: '#386641',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberMeText: {
    fontSize: 13,
    color: '#64748B',
  },
  forgotPasswordPill: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#386641',
  },
  loginButton: {
    backgroundColor: '#386641',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  noAccountText: {
    fontSize: 14,
    color: '#64748B',
  },
  createAccountLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#386641',
  },
});
