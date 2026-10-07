import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { requestOtpApi, verifyOtpApi } from '@/services/api';

interface OtpVerificationScreenProps {
  phoneNumber?: string;
  email?: string;
  onVerify?: (code: string) => void;
  onBack?: () => void;
  onChangeNumber?: () => void;
}

export function OtpVerificationScreen({
  phoneNumber = '+94 77 123 4567',
  email = 'farmer@famora.lk',
  onVerify,
  onBack,
  onChangeNumber,
}: OtpVerificationScreenProps) {
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [googleEmailInput, setGoogleEmailInput] = useState(email);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [serverOtpHint, setServerOtpHint] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto-request OTP on mount
  useEffect(() => {
    handleSendOtp(channel);
  }, [channel]);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleSendOtp = async (targetChannel: 'email' | 'sms') => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const identifier = targetChannel === 'email' ? googleEmailInput : phoneNumber;
      const res = await requestOtpApi({
        identifier,
        email: targetChannel === 'email' ? googleEmailInput : undefined,
        mobileNumber: targetChannel === 'sms' ? phoneNumber : undefined,
        channel: targetChannel,
      });

      if (res?.otpCode) {
        setServerOtpHint(res.otpCode);
        // Pre-fill digits for effortless UX testing
        const digits = res.otpCode.split('');
        if (digits.length === 6) {
          setOtp(digits);
        }
      }
      setTimerSeconds(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    setErrorMsg(null);

    // Auto move to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const identifier = channel === 'email' ? googleEmailInput : phoneNumber;
      const isValid = await verifyOtpApi(identifier, fullCode, channel);
      if (isValid) {
        onVerify?.(fullCode);
      } else {
        setErrorMsg('Invalid verification code. Please check and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to{' '}
            <Text style={styles.phoneNumberHighlight}>
              {channel === 'email' ? googleEmailInput : phoneNumber}
            </Text>
          </Text>
        </View>

        {/* Verification Method Toggle */}
        <View style={styles.channelToggle}>
          <Pressable
            style={[
              styles.toggleTab,
              channel === 'email' && styles.toggleTabActive,
            ]}
            onPress={() => setChannel('email')}>
            <Text style={styles.toggleIcon}>✉️</Text>
            <Text
              style={[
                styles.toggleLabel,
                channel === 'email' && styles.toggleLabelActive,
              ]}>
              Google Email Code
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleTab,
              channel === 'sms' && styles.toggleTabActive,
            ]}
            onPress={() => setChannel('sms')}>
            <Text style={styles.toggleIcon}>📱</Text>
            <Text
              style={[
                styles.toggleLabel,
                channel === 'sms' && styles.toggleLabelActive,
              ]}>
              SMS Code
            </Text>
          </Pressable>
        </View>

        {channel === 'email' && (
          <View style={styles.emailContainer}>
            <Text style={styles.inputHelp}>Google Account Email:</Text>
            <View style={styles.emailInputWrapper}>
              <Text style={styles.emailIcon}>G</Text>
              <TextInput
                style={styles.emailInput}
                value={googleEmailInput}
                onChangeText={setGoogleEmailInput}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Enter google email"
              />
              <Pressable
                onPress={() => handleSendOtp('email')}
                style={styles.resendCodeMiniBtn}>
                <Text style={styles.resendCodeMiniText}>Send Code</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Server OTP Hint Pill (Instant convenience during review/testing) */}
        {serverOtpHint && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintBannerText}>
              📬 {channel === 'email' ? 'Google Email OTP Code' : 'SMS Code'}:{' '}
              <Text style={styles.hintCodeText}>{serverOtpHint}</Text>
            </Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {/* 6 Digit OTP Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => {
            const isFilled = Boolean(digit);
            return (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpBox,
                  isFilled ? styles.otpBoxFilled : styles.otpBoxEmpty,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleOtpChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
              />
            );
          })}
        </View>

        {/* Timer & Resend Controls */}
        <View style={styles.timerSection}>
          <View style={styles.timerRow}>
            <Text style={styles.clockIcon}>🕒</Text>
            <Text style={styles.timerText}>{formatTimer()}</Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => handleSendOtp(channel)}
              disabled={timerSeconds > 0 || loading}>
              <Text
                style={[
                  styles.actionLink,
                  (timerSeconds > 0 || loading) && styles.actionLinkDisabled,
                ]}>
                {channel === 'email' ? 'Resend Email Code' : 'Resend SMS'}
              </Text>
            </Pressable>
            <Text style={styles.divider}>|</Text>
            <Pressable onPress={onChangeNumber}>
              <Text style={styles.actionLinkGreen}>
                {channel === 'email' ? 'Change email' : 'Change mobile number'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Verify Button */}
        <Pressable
          style={({ pressed }) => [
            styles.verifyButton,
            pressed && styles.verifyButtonPressed,
            loading && { opacity: 0.8 },
          ]}
          disabled={loading}
          onPress={handleVerify}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </Pressable>
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
    marginBottom: 28,
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
  phoneNumberHighlight: {
    color: '#0F172A',
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderWidth: 2,
    borderColor: '#386641',
  },
  otpBoxEmpty: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIcon: {
    fontSize: 14,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionLink: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  actionLinkDisabled: {
    color: '#94A3B8',
  },
  divider: {
    color: '#CBD5E1',
  },
  actionLinkGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  verifyButton: {
    backgroundColor: '#386641',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyButtonPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  channelToggle: {
    flexDirection: 'row',
    backgroundColor: '#EDF4EC',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleIcon: {
    fontSize: 14,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleLabelActive: {
    color: '#1A2E20',
    fontWeight: '700',
  },
  emailContainer: {
    marginBottom: 16,
  },
  inputHelp: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  emailIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA4335',
    marginRight: 8,
  },
  emailInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  resendCodeMiniBtn: {
    backgroundColor: '#386641',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resendCodeMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  hintBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  hintBannerText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  hintCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 2,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
});
