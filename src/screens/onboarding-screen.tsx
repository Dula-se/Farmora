import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  badge: {
    icon: string;
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left';
    variant: 'amber' | 'dark' | 'green';
  };
  image: any;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Direct Farmer-to-Buyer Marketplace',
    description:
      'By cutting out middlemen, Farmora ensures farmers receive higher earnings for their harvest, while buyers enjoy much fresher produce at highly competitive rates.',
    badge: {
      icon: '🏷️',
      text: 'Fair Price',
      position: 'top-left',
      variant: 'amber',
    },
    image: require('@/assets/images/onboarding/onboarding1.jpg'),
  },
  {
    id: 2,
    title: 'Discover Nearby Farms',
    description:
      'Locate verified fresh produce right around your district or town. Use GPS features to purchase local, reduce transport costs, and strengthen your community.',
    badge: {
      icon: '📍',
      text: '3.5 km Nearby',
      position: 'top-right',
      variant: 'dark',
    },
    image: require('@/assets/images/onboarding/onboarding2.jpg'),
  },
  {
    id: 3,
    title: 'Bid, Communicate & Order',
    description:
      'Participate in transparent price bidding, examine products visually via our video features, and book island-wide reliable agricultural delivery with just a tap.',
    badge: {
      icon: '🚚',
      text: 'Fast Transport Arranged',
      position: 'bottom-left',
      variant: 'green',
    },
    image: require('@/assets/images/onboarding/onboarding3.jpg'),
  },
];

interface OnboardingScreenProps {
  onFinish?: () => void;
  onPrevious?: () => void;
}

export function OnboardingScreen({ onFinish, onPrevious }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentSlide = ONBOARDING_SLIDES[currentIndex];

  const changeSlide = (newIndex: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      changeSlide(currentIndex + 1);
    } else if (onFinish) {
      onFinish();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      changeSlide(currentIndex - 1);
    } else if (onPrevious) {
      onPrevious();
    }
  };

  const handleSkip = () => {
    if (onFinish) {
      onFinish();
    }
  };

  const renderBadge = (badge: OnboardingSlide['badge']) => {
    const positionStyle =
      badge.position === 'top-left'
        ? styles.badgeTopLeft
        : badge.position === 'top-right'
        ? styles.badgeTopRight
        : styles.badgeBottomLeft;

    const variantStyle =
      badge.variant === 'amber'
        ? styles.badgeAmber
        : badge.variant === 'dark'
        ? styles.badgeDark
        : styles.badgeGreen;

    const textStyle =
      badge.variant === 'amber' ? styles.badgeTextDark : styles.badgeTextWhite;

    return (
      <View style={[styles.badgeContainer, positionStyle, variantStyle]}>
        <Text style={styles.badgeIcon}>{badge.icon}</Text>
        <Text style={[styles.badgeText, textStyle]}>{badge.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
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

        {currentIndex < ONBOARDING_SLIDES.length - 1 && (
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slide Body */}
      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        {/* Illustration Container with rounded border & shadow */}
        <View style={styles.imageCard}>
          <Image source={currentSlide.image} style={styles.slideImage} />
          {renderBadge(currentSlide.badge)}
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>
      </Animated.View>

      {/* Bottom Area: Pagination Dots + Navigation Buttons */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {ONBOARDING_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        {/* Action Buttons: 2 buttons at every page */}
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handlePrevious}>
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              styles.splitPrimaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNext}>
            <Text style={styles.primaryButtonText}>
              {currentIndex === ONBOARDING_SLIDES.length - 1
                ? 'Get Started'
                : 'Next'}
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
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
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageCard: {
    width: '100%',
    height: width * 0.76,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#EAEFE9',
    position: 'relative',
    shadowColor: '#1A2E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeTopLeft: {
    top: 14,
    left: 14,
  },
  badgeTopRight: {
    top: 14,
    right: 14,
  },
  badgeBottomLeft: {
    bottom: 14,
    left: 14,
  },
  badgeAmber: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeDark: {
    backgroundColor: 'rgba(26, 46, 32, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeGreen: {
    backgroundColor: 'rgba(30, 68, 38, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextDark: {
    color: '#92400E',
  },
  badgeTextWhite: {
    color: '#FFFFFF',
  },
  textSection: {
    marginTop: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    paddingTop: 12,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 26,
    backgroundColor: '#386641',
  },
  dotInactive: {
    width: 7,
    backgroundColor: '#E2E8F0',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullWidthButton: {
    width: '100%',
  },
  splitPrimaryButton: {
    flex: 1.25,
  },
  primaryButton: {
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
  secondaryButton: {
    flex: 1,
    backgroundColor: '#EAF4EC',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#386641',
    fontSize: 16,
    fontWeight: '700',
  },
});
