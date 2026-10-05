import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type AccountType =
  | 'farmer'
  | 'buyer'
  | 'restaurant'
  | 'supermarket'
  | 'exporter';

interface AccountOption {
  id: AccountType;
  icon: string;
  title: string;
  description: string;
}

const ACCOUNT_OPTIONS: AccountOption[] = [
  {
    id: 'farmer',
    icon: '🌱',
    title: 'Farmer /\n/ விவசாயි',
    description: 'Sell your fresh harvest directly to buyers & get fair prices.',
  },
  {
    id: 'buyer',
    icon: '👤',
    title: 'Individual Buyer',
    description: 'Buy fresh home groceries directly from verified local growers.',
  },
  {
    id: 'restaurant',
    icon: '🍴',
    title: 'Restaurant / Chef',
    description: 'Source bulk fresh produce directly for your kitchen daily.',
  },
  {
    id: 'supermarket',
    icon: '🏪',
    title: 'Supermarket Buyer',
    description: 'High volume supply chain matching and guaranteed scheduled supply.',
  },
  {
    id: 'exporter',
    icon: '📦',
    title: 'Exporter / Wholesaler',
    description: 'Procure export quality commodities with full origin traceability.',
  },
];

interface SelectAccountTypeScreenProps {
  onContinue?: (selectedType: AccountType) => void;
  onBack?: () => void;
}

export function SelectAccountTypeScreen({
  onContinue,
  onBack,
}: SelectAccountTypeScreenProps) {
  const [selectedType, setSelectedType] = useState<AccountType>('farmer');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

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

        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={styles.backLink}>Back</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Select Account Type</Text>
          <Text style={styles.subtitle}>
            Choose how you want to use the Farmora ecosystem
          </Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {ACCOUNT_OPTIONS.map((option) => {
            const isSelected = selectedType === option.id;

            return (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.card,
                  isSelected ? styles.cardSelected : styles.cardUnselected,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setSelectedType(option.id)}>
                {/* Icon Container */}
                <View
                  style={[
                    styles.iconCircle,
                    isSelected && styles.iconCircleSelected,
                  ]}>
                  <Text style={styles.iconText}>{option.icon}</Text>
                </View>

                {/* Text Content */}
                <View style={styles.textContent}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isSelected && styles.cardTitleSelected,
                    ]}>
                    {option.title}
                  </Text>
                  <Text
                    style={styles.cardDescription}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {option.description}
                  </Text>
                </View>

                {/* Radio Circle */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  ]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
          onPress={() => onContinue?.(selectedType)}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
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
  backLink: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  optionsList: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#1A2E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#386641',
  },
  cardUnselected: {
    borderWidth: 1,
    borderColor: '#E8ECE8',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircleSelected: {
    backgroundColor: '#EAF4EC',
  },
  iconText: {
    fontSize: 22,
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
  },
  cardTitleSelected: {
    color: '#1A2E20',
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderWidth: 2.5,
    borderColor: '#386641',
  },
  radioOuterUnselected: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#386641',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
    paddingTop: 12,
  },
  continueButton: {
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
  continueButtonPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
