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
import { registerWithApi, ApiUser } from '@/services/api';

interface RegisterScreenProps {
  accountType?: 'farmer' | 'buyer';
  onRegisterSuccess?: (user?: ApiUser) => void;
  onBackToLogin?: () => void;
}

export function RegisterScreen({
  accountType = 'farmer',
  onRegisterSuccess,
  onBackToLogin,
}: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field touch states for showing errors
  const [touched, setTouched] = useState({
    fullName: false,
    mobileNumber: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });

  // Validation logic
  const isFullNameValid = fullName.trim().length >= 2;
  const isMobileValid = /^0\d{9}$/.test(mobileNumber.replace(/\s+/g, ''));
  const isEmailValid =
    !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isConfirmPasswordValid =
    confirmPassword.length > 0 && confirmPassword === password;

  const isFormValid =
    isFullNameValid &&
    isMobileValid &&
    isEmailValid &&
    isPasswordValid &&
    isConfirmPasswordValid &&
    termsAccepted;

  const handleSubmit = async () => {
    setTouched({
      fullName: true,
      mobileNumber: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (!isFormValid) {
      if (!isFullNameValid) setErrorMessage('Please enter a valid full name (at least 2 letters).');
      else if (!isMobileValid) setErrorMessage('Please enter a valid 10-digit Sri Lankan mobile number (e.g. 0771234567).');
      else if (!isPasswordValid) setErrorMessage('Password must be 8+ chars with uppercase, number & symbol.');
      else if (!isConfirmPasswordValid) setErrorMessage('Passwords do not match.');
      else if (!termsAccepted) setErrorMessage('You must accept the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await registerWithApi({
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.replace(/\s+/g, ''),
        email: email.trim() || undefined,
        password,
        accountType: accountType || 'farmer',
      });
      console.log('[RegisterScreen] Registered successfully via MongoDB:', data.user.fullName);
      onRegisterSuccess?.(data.user);
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      console.error('[RegisterScreen] Error:', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Top Header */}
      <View style={styles.header}>
        {onBackToLogin ? (
          <Pressable onPress={onBackToLogin} hitSlop={12} style={styles.backButton}>
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
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {accountType === 'farmer' ? '🌾 Farmer Account' : '🛍️ Buyer Account'}
            </Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join the Farmora agricultural marketplace
          </Text>
        </View>

        {/* Error Alert */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          {/* 1. Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View
              style={[
                styles.inputContainer,
                touched.fullName && !isFullNameValid && styles.inputContainerError,
              ]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={(t) => {
                  setFullName(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
              />
            </View>
            {touched.fullName && !isFullNameValid && (
              <Text style={styles.errorText}>ⓘ Full name must be at least 2 characters</Text>
            )}
          </View>

          {/* 2. Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View
              style={[
                styles.inputContainer,
                touched.mobileNumber && !isMobileValid && styles.inputContainerError,
              ]}>
              <Text style={styles.inputIcon}>📞</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0771234567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={(t) => {
                  setMobileNumber(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setTouched((p) => ({ ...p, mobileNumber: true }))}
              />
            </View>
            {touched.mobileNumber && !isMobileValid && (
              <Text style={styles.errorText}>
                ⓘ Must be a valid 10-digit Sri Lankan number (e.g. 0771234567)
              </Text>
            )}
          </View>

          {/* 3. Email (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <View
              style={[
                styles.inputContainer,
                touched.email && !isEmailValid && styles.inputContainerError,
              ]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              />
            </View>
            {touched.email && !isEmailValid && (
              <Text style={styles.errorText}>ⓘ Please enter a valid email address</Text>
            )}
          </View>

          {/* 4. Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                touched.password && !isPasswordValid && styles.inputContainerError,
              ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
                style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>
            {touched.password && !isPasswordValid && (
              <Text style={styles.errorText}>
                ⓘ 8+ chars with uppercase, number & symbol required
              </Text>
            )}
          </View>

          {/* 5. Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View
              style={[
                styles.inputContainer,
                touched.confirmPassword &&
                  !isConfirmPasswordValid &&
                  styles.inputContainerError,
              ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
              />
            </View>
            {touched.confirmPassword && !isConfirmPasswordValid && (
              <Text style={styles.errorText}>ⓘ Passwords do not match</Text>
            )}
          </View>

          {/* 6. Terms Checkbox */}
          <Pressable
            style={styles.termsContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}>
            <View
              style={[
                styles.checkbox,
                termsAccepted && styles.checkboxChecked,
                touched.terms && !termsAccepted && styles.checkboxError,
              ]}>
              {termsAccepted && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text
              style={[
                styles.termsText,
                touched.terms && !termsAccepted && styles.termsTextError,
              ]}>
              I accept the Terms and Privacy Policy
            </Text>
          </Pressable>

          {/* Create Account Action Button */}
          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.createButton,
              (!isFormValid || loading) && styles.createButtonDisabled,
              pressed && isFormValid && styles.createButtonPressed,
            ]}
            onPress={handleSubmit}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Account</Text>
            )}
          </Pressable>

          {/* Back to Login link */}
          <View style={styles.loginLinkRow}>
            <Text style={styles.alreadyAccountText}>Already have an account? </Text>
            <Pressable onPress={onBackToLogin}>
              <Text style={styles.loginLink}>Log In</Text>
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
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
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
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
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
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#386641',
    borderColor: '#386641',
  },
  checkboxError: {
    borderColor: '#EF4444',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  termsTextError: {
    color: '#EF4444',
  },
  createButton: {
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
  createButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  createButtonTextDisabled: {
    color: '#F1F5F9',
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  alreadyAccountText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#386641',
  },
});
