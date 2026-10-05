import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SplashScreenProps {
  onFinish?: () => void;
  autoProgress?: boolean;
}

const { width, height } = Dimensions.get('window');

export function FarmoraSplashScreen({ onFinish, autoProgress = true }: SplashScreenProps) {
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle background float/breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress bar animation
    if (autoProgress) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2800,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }
  }, [autoProgress, fadeAnim, floatAnim, onFinish, progressAnim, scaleAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3D633D" translucent />

      {/* Ambient background orbs for lighting & depth */}
      <View style={styles.backgroundLayer}>
        {/* Top Right large glowing circle */}
        <View style={styles.orbTopRight} />

        {/* Mid Left ambient circle */}
        <View style={styles.orbMidLeft} />

        {/* Lower Right ambient circle */}
        <View style={styles.orbBottomRight} />

        {/* Bottom overlapping hill waves */}
        <View style={styles.bottomHillBack} />
        <View style={styles.bottomHillFront} />

        {/* Bottom decorative tree/crop markers */}
        <View style={styles.bottomTreeMarkers}>
          {/* Left Tree */}
          <View style={styles.treeItem}>
            <View style={styles.treeHead} />
            <View style={styles.treeStem} />
          </View>
          {/* Center Tree */}
          <View style={[styles.treeItem, styles.treeCenter]}>
            <View style={[styles.treeHead, styles.treeHeadLarge]} />
            <View style={[styles.treeStem, styles.treeStemTall]} />
          </View>
          {/* Right Tree */}
          <View style={styles.treeItem}>
            <View style={styles.treeHead} />
            <View style={styles.treeStem} />
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.safeContent}>
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: floatTranslate }],
            },
          ]}>
          {/* Center Logo Squircle */}
          <View style={styles.logoCard}>
            {/* Sprout Icon Graphic */}
            <View style={styles.sproutContainer}>
              {/* Left Orange Leaf */}
              <View style={styles.orangeLeaf} />
              {/* Right White Leaf */}
              <View style={styles.whiteLeaf} />
              {/* Vertical White Stem */}
              <View style={styles.sproutStem} />
              {/* Base shadow pedestal */}
              <View style={styles.sproutBase} />
            </View>
          </View>

          {/* Typography */}
          <View style={styles.titleSection}>
            <Text style={styles.brandTitle}>Farmora</Text>
            <Text style={styles.tagline}>FRESH FROM FARMERS</Text>
          </View>

          {/* Sri Lanka Pill Badge */}
          <View style={styles.countryBadge}>
            <Text style={styles.flagEmoji}>🇱🇰</Text>
            <Text style={styles.badgeText}>Sri Lanka&apos;s Agricultural Marketplace</Text>
          </View>
        </Animated.View>

        {/* Bottom Loading Section */}
        <View style={styles.bottomSection}>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3E623E', // Rich agricultural olive/forest green
    overflow: 'hidden',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbTopRight: {
    position: 'absolute',
    top: -60,
    right: -70,
    width: width * 0.92,
    height: width * 0.92,
    borderRadius: (width * 0.92) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  orbMidLeft: {
    position: 'absolute',
    top: height * 0.16,
    left: -width * 0.28,
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: (width * 0.72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: height * 0.12,
    right: -width * 0.22,
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomHillBack: {
    position: 'absolute',
    bottom: -110,
    width: width * 1.5,
    height: 240,
    borderRadius: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  bottomHillFront: {
    position: 'absolute',
    bottom: -70,
    width: width * 1.25,
    height: 180,
    borderRadius: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  bottomTreeMarkers: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 40,
    paddingBottom: 4,
  },
  treeItem: {
    alignItems: 'center',
  },
  treeCenter: {
    transform: [{ translateY: -10 }],
  },
  treeHead: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
  },
  treeHeadLarge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  treeStem: {
    width: 2.5,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginTop: 2,
  },
  treeStemTall: {
    height: 26,
  },
  safeContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  sproutContainer: {
    width: 50,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orangeLeaf: {
    position: 'absolute',
    top: 6,
    left: 7,
    width: 17,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#E58A54', // Warm harvest seed/orange leaf
    transform: [{ rotate: '-38deg' }],
  },
  whiteLeaf: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 18,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '36deg' }],
  },
  sproutStem: {
    position: 'absolute',
    top: 14,
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  sproutBase: {
    position: 'absolute',
    bottom: 5,
    width: 22,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  brandTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 2.2,
    marginTop: 8,
    textAlign: 'center',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginTop: 4,
  },
  flagEmoji: {
    fontSize: 15,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.96)',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
  },
  progressBarTrack: {
    width: 220,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E37946', // Vibrant warm harvest orange
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 12,
  },
});
