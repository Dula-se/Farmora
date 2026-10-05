import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';

export type AccountType = 'farmer' | 'buyer' | 'restaurant' | 'supermarket' | 'exporter';

interface SelectAccountTypeScreenProps {
  onContinue?: (selectedType: AccountType) => void;
  onSelectFarmer?: () => void;
  onSelectBuyer?: () => void;
  onLogin?: () => void;
  onBack?: () => void;
}

export function SelectAccountTypeScreen({
  onContinue,
  onSelectFarmer,
  onSelectBuyer,
  onLogin,
  onBack,
}: SelectAccountTypeScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'buyer'>('farmer');

  const handleSelect = (role: 'farmer' | 'buyer') => {
    setSelectedRole(role);
    if (role === 'farmer') {
      onSelectFarmer ? onSelectFarmer() : onContinue?.('farmer');
    } else {
      onSelectBuyer ? onSelectBuyer() : onContinue?.('buyer');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Optional Top Bar for Back button */}
      <View style={styles.topBar}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>

      <View style={styles.contentContainer}>
        {/* Top Leaf Emblem */}
        <View style={styles.badgeWrapper}>
          <View style={styles.leafBadge}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              {/* Stylized leaf matching screenshot */}
              <Path
                d="M19.5 4.5C14.5 4 8 7 5.5 12C3 17 5 20.5 7.5 20.5C10 20.5 14 18.5 17 14.5C20 10.5 20 6.5 19.5 4.5Z"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M8.5 17.5C10.8 15.2 13.5 13 16.5 11"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Welcome to Farmora</Text>
        <Text style={styles.subtitle}>Choose how you want to use Farmora</Text>

        {/* Option Cards */}
        <View style={styles.cardsContainer}>
          {/* 1. Register as Farmer */}
          <Pressable
            style={({ pressed }) => [
              styles.card,
              selectedRole === 'farmer' ? styles.cardFarmerActive : styles.cardInactive,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handleSelect('farmer')}>
            <View style={styles.farmerIconCircle}>
              {/* Tractor Icon */}
              <Svg
                width={26}
                height={26}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D5A27"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round">
                <Path d="M 3 16.5 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0" />
                <Path d="M 15 17.5 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0" />
                <Path d="M6.5 13V6.5H12V13" />
                <Path d="M12 9H17.5V15H15" />
                <Path d="M10 16.5H15" />
                <Path d="M6.5 6.5H4" />
                <Path d="M14 6.5V9" />
              </Svg>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Register as Farmer</Text>
              <Text style={styles.cardDescription}>
                Sell your fresh produce directly to buyers across Sri Lanka
              </Text>
            </View>

            <View style={styles.arrowContainer}>
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
            </View>
          </Pressable>

          {/* 2. Register as Buyer */}
          <Pressable
            style={({ pressed }) => [
              styles.card,
              selectedRole === 'buyer' ? styles.cardBuyerActive : styles.cardInactive,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handleSelect('buyer')}>
            <View style={styles.buyerIconCircle}>
              {/* Shopping Bag / Basket Icon */}
              <Svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E67E22"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round">
                <Path d="M6 2L3 6V20C3 20.53 3.21 21.04 3.59 21.41C3.96 21.79 4.47 22 5 22H19C19.53 22 20.04 21.79 20.41 21.41C20.79 21.04 21 20.53 21 20V6L18 2H6Z" />
                <Path d="M3 6H21" />
                <Path d="M16 10C16 12.21 14.21 14 12 14C9.79 14 8 12.21 8 10" />
              </Svg>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Register as Buyer</Text>
              <Text style={styles.cardDescription}>
                Buy fresh produce directly from local farmers
              </Text>
            </View>

            <View style={styles.arrowContainer}>
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Bottom Footer: Already have an account? Log In */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={onLogin} hitSlop={12}>
          <Text style={styles.loginLink}>Log In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  topBar: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 24 : 16,
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  leafBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#386641',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16281D',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 44,
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardFarmerActive: {
    borderWidth: 1.8,
    borderColor: '#386641',
  },
  cardBuyerActive: {
    borderWidth: 1.8,
    borderColor: '#386641',
  },
  cardInactive: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  farmerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  arrowContainer: {
    paddingLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
  },
  footerText: {
    fontSize: 14.5,
    color: '#64748B',
    fontWeight: '400',
  },
  loginLink: {
    fontSize: 14.5,
    color: '#386641',
    fontWeight: '700',
  },
});
