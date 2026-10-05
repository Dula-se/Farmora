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

interface ResetPasswordScreenProps {
  onResetSuccess?: () => void;
  onBack?: () => void;
}

export function ResetPasswordScreen({
  onResetSuccess,
  onBack,
}: ResetPasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Requirement checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const canSubmit =
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecial &&
    newPassword === confirmPassword;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Create a strong, new password for your account.
          </Text>
        </View>

        {/* Inputs */}
        <View style={styles.formContainer}>
          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="At least 8 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Pressable
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={10}>
                <Text style={styles.eyeIcon}>{showNewPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={10}>
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Password Requirements Box */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsHeader}>PASSWORD REQUIREMENTS</Text>

            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.reqIcon,
                  hasMinLength ? styles.reqIconValid : styles.reqIconPending,
                ]}>
                {hasMinLength ? '✔' : '🔘'}
              </Text>
              <Text
                style={[
                  styles.reqText,
                  hasMinLength && styles.reqTextValid,
                ]}>
                At least 8 characters
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.reqIcon,
                  hasUppercase ? styles.reqIconValid : styles.reqIconPending,
                ]}>
                {hasUppercase ? '✔' : '🔘'}
              </Text>
              <Text
                style={[
                  styles.reqText,
                  hasUppercase && styles.reqTextValid,
                ]}>
                At least one uppercase letter
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.reqIcon,
                  hasNumber ? styles.reqIconValid : styles.reqIconPending,
                ]}>
                {hasNumber ? '✔' : '🔘'}
              </Text>
              <Text
                style={[
                  styles.reqText,
                  hasNumber && styles.reqTextValid,
                ]}>
                At least one number
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.reqIcon,
                  hasSpecial ? styles.reqIconValid : styles.reqIconPending,
                ]}>
                {hasSpecial ? '✔' : '🔘'}
              </Text>
              <Text
                style={[
                  styles.reqText,
                  hasSpecial && styles.reqTextValid,
                ]}>
                At least one special character
              </Text>
            </View>
          </View>

          {/* Reset Password Button */}
          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              !canSubmit && styles.resetButtonDisabled,
              pressed && canSubmit && styles.resetButtonPressed,
            ]}
            disabled={!canSubmit}
            onPress={onResetSuccess}>
            <Text style={styles.resetButtonText}>Reset Password</Text>
          </Pressable>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 26,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 54,
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
  requirementsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  requirementsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqIcon: {
    fontSize: 13,
  },
  reqIconValid: {
    color: '#16A34A',
    fontWeight: '800',
  },
  reqIconPending: {
    color: '#94A3B8',
  },
  reqText: {
    fontSize: 13,
    color: '#64748B',
  },
  reqTextValid: {
    color: '#16A34A',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#386641',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  resetButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  resetButtonPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
