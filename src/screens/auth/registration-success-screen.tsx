import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RegistrationSuccessScreenProps {
  onCompleteProfile?: () => void;
  onSkipForNow?: () => void;
}

export function RegistrationSuccessScreen({
  onCompleteProfile,
  onSkipForNow,
}: RegistrationSuccessScreenProps) {
  // Animation for smooth scale and entrance
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      <View style={styles.container}>
        {/* Center Content */}
        <Animated.View
          style={[
            styles.centerSection,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          {/* Double Circle Checkmark */}
          <View style={styles.outerHaloCircle}>
            <View style={styles.innerGreenCircle}>
              <Text style={styles.checkmarkIcon}>✓</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Account Created!</Text>

          {/* Description */}
          <Text style={styles.description}>
            Your Farmora account has been successfully created. Complete your
            profile now to start buying or selling Sri Lanka&apos;s freshest
            produce.
          </Text>
        </Animated.View>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          {/* Complete Profile Button */}
          <Pressable
            style={({ pressed }) => [
              styles.completeButton,
              pressed && styles.completeButtonPressed,
            ]}
            onPress={onCompleteProfile}>
            <Text style={styles.completeButtonText}>Complete Profile</Text>
          </Pressable>

          {/* Skip for Now Link */}
          <Pressable
            style={styles.skipButton}
            hitSlop={12}
            onPress={onSkipForNow}>
            <Text style={styles.skipText}>Skip for Now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  outerHaloCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E4F3E6', // Soft light mint halo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  innerGreenCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#386641', // Deep forest green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
    paddingTop: 12,
    alignItems: 'center',
    gap: 16,
  },
  completeButton: {
    width: '100%',
    backgroundColor: '#386641',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  completeButtonPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
