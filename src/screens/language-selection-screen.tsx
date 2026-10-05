import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type LanguageCode = 'sinhala' | 'english' | 'tamil';

interface LanguageOption {
  id: LanguageCode;
  nativeTitle: string;
  englishLabel: string;
  description: string;
}

interface LanguageSelectionScreenProps {
  onContinue?: (selectedLanguage: LanguageCode) => void;
}

const LANGUAGES: LanguageOption[] = [
  {
    id: 'sinhala',
    nativeTitle: 'සිංහල',
    englishLabel: '(Sinhala)',
    description: 'ශ්‍රී ලංකාවේ ප්‍රධාන භාෂාව',
  },
  {
    id: 'english',
    nativeTitle: 'English',
    englishLabel: '(English)',
    description: 'Global business language',
  },
  {
    id: 'tamil',
    nativeTitle: 'தமிழ்',
    englishLabel: '(Tamil)',
    description: 'இலங்கையின் உத்தியோகபூர்வ மொழி',
  },
];

export function LanguageSelectionScreen({ onContinue }: LanguageSelectionScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('sinhala');

  const handleContinue = () => {
    if (onContinue) {
      onContinue(selectedLanguage);
    }
  };

  const getContinueButtonText = () => {
    switch (selectedLanguage) {
      case 'sinhala':
        return 'Continue / ඉදිරියට';
      case 'tamil':
        return 'Continue / தொடரவும்';
      default:
        return 'Continue / ඉදිරියට / தொடரவும்';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Language</Text>

            {/* Multilingual Subtitle */}
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitleSinhala}>ඔබේ භාෂාව තෝරන්න</Text>
              <Text style={styles.subtitleTamil}>
                / கீழே உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்
              </Text>
            </View>
          </View>

          {/* Language Selection List */}
          <View style={styles.listContainer}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.id;

              return (
                <Pressable
                  key={lang.id}
                  style={({ pressed }) => [
                    styles.card,
                    isSelected ? styles.cardSelected : styles.cardUnselected,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => setSelectedLanguage(lang.id)}>
                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected ? styles.radioOuterSelected : styles.radioOuterUnselected,
                    ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>

                  {/* Language Details */}
                  <View style={styles.textDetails}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.nativeTitle,
                          isSelected && styles.nativeTitleSelected,
                        ]}>
                        {lang.nativeTitle}
                      </Text>
                      <Text style={styles.englishLabel}>{lang.englishLabel}</Text>
                    </View>
                    <Text style={styles.description}>{lang.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Area */}
        <View style={styles.footer}>
          <Text style={styles.settingsNotice}>
            You can change your language later in Settings
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
            onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {getContinueButtonText()}
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2E20',
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
  },
  subtitleSinhala: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  subtitleTamil: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#1A2E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#386641', // Exact agricultural forest green from screenshot
    backgroundColor: '#FFFFFF',
  },
  cardUnselected: {
    borderWidth: 1,
    borderColor: '#E8ECE8',
    backgroundColor: '#FFFFFF',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  radioOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#386641',
  },
  textDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  nativeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  nativeTitleSelected: {
    color: '#1A2E20',
  },
  englishLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
    paddingTop: 12,
    alignItems: 'center',
  },
  settingsNotice: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#386641', // Matching button green from screenshot
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
