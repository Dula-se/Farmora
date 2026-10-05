import React, { useEffect, useRef, useState } from 'react';
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

interface OtpVerificationScreenProps {
  phoneNumber?: string;
  onVerify?: (code: string) => void;
  onBack?: () => void;
  onChangeNumber?: () => void;
}

export function OtpVerificationScreen({
  phoneNumber = '+94 77 XXX XXXX',
  onVerify,
  onBack,
  onChangeNumber,
}: OtpVerificationScreenProps) {
  const [otp, setOtp] = useState(['8', '4', '3', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(150); // 02:30
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = otp.join('');
    onVerify?.(fullCode);
  };

  const handleResend = () => {
    setTimerSeconds(150);
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
            <Text style={styles.phoneNumberHighlight}>{phoneNumber}</Text>
          </Text>
        </View>

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
            <Pressable onPress={handleResend} disabled={timerSeconds > 0}>
              <Text
                style={[
                  styles.actionLink,
                  timerSeconds > 0 && styles.actionLinkDisabled,
                ]}>
                Resend OTP
              </Text>
            </Pressable>
            <Text style={styles.divider}>|</Text>
            <Pressable onPress={onChangeNumber}>
              <Text style={styles.actionLinkGreen}>Change mobile number</Text>
            </Pressable>
          </View>
        </View>

        {/* Verify Button */}
        <Pressable
          style={({ pressed }) => [
            styles.verifyButton,
            pressed && styles.verifyButtonPressed,
          ]}
          onPress={handleVerify}>
          <Text style={styles.verifyButtonText}>Verify</Text>
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
});
