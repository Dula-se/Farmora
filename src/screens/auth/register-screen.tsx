import React, { useState } from 'react';
import {
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

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onBackToLogin?: () => void;
}

export function RegisterScreen({
  onRegisterSuccess,
  onBackToLogin,
}: RegisterScreenProps) {
  const [fullName, setFullName] = useState('John Silva');
  const [mobileNumber, setMobileNumber] = useState('0771234567');
  const [email, setEmail] = useState('john@gmail.com');
  const [password, setPassword] = useState('Farmora@2026');
  const [confirmPassword, setConfirmPassword] = useState('Farmora@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

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
  const isFullNameValid = fullName.trim().length > 0;
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

  const handleSubmit = () => {
    setTouched({
      fullName: true,
      mobileNumber: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (isFormValid) {
      onRegisterSuccess?.();
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join the Farmora agricultural marketplace
          </Text>
        </View>

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
                onChangeText={setFullName}
                onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
              />
            </View>
            {touched.fullName && !isFullNameValid && (
              <Text style={styles.errorText}>ⓘ Full name is required</Text>
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
                placeholder="e.g. 0771234567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                onBlur={() => setTouched((p) => ({ ...p, mobileNumber: true }))}
              />
            </View>
            {touched.mobileNumber && !isMobileValid && (
              <Text style={styles.errorText}>
                ⓘ Please enter a valid 10-digit mobile number
              </Text>
            )}
          </View>

          {/* 3. Email (Optional) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>Optional</Text>
              </View>
            </View>
            <View
              style={[
                styles.inputContainer,
                touched.email && !isEmailValid && styles.inputContainerError,
              ]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="john@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              />
            </View>
            {touched.email && !isEmailValid && (
              <Text style={styles.errorText}>
                ⓘ Please enter a valid email address
              </Text>
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
                placeholder="At least 8 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>
            {touched.password && !isPasswordValid && (
              <Text style={styles.errorText}>
                ⓘ Password must be at least 8 characters with uppercase, number, and
                special character
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
                onChangeText={setConfirmPassword}
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
              You must accept the Terms and Privacy Policy
            </Text>
          </Pressable>

          {/* Create Account Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              !isFormValid && styles.createButtonDisabled,
              pressed && isFormValid && styles.createButtonPressed,
            ]}
            onPress={handleSubmit}>
            <Text
              style={[
                styles.createButtonText,
                !isFormValid && styles.createButtonTextDisabled,
              ]}>
              Create Account
            </Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  optionalBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionalText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16,
    marginTop: 2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '800',
  },
  termsText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },
  termsTextError: {
    color: '#DC2626',
  },
  createButton: {
    backgroundColor: '#386641',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#CBD5E1',
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
    color: '#64748B',
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
