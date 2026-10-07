import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAuthSession } from '@/services/api';

interface SettingsScreenProps {
  onBack?: () => void;
  onOpenEditProfile?: () => void;
  onOpenSecurity?: () => void;
  onLogout?: () => void;
}

export function SettingsScreen({
  onBack,
  onOpenEditProfile,
  onOpenSecurity,
  onLogout,
}: SettingsScreenProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuthSession();
          onLogout?.();
        },
      },
    ]);
  };

  const handleLanguagePicker = () => {
    Alert.alert('Select Language', 'Choose your preferred display language', [
      { text: 'English', onPress: () => setSelectedLanguage('English') },
      { text: 'සිංහල (Sinhala)', onPress: () => setSelectedLanguage('Sinhala') },
      { text: 'தமிழ் (Tamil)', onPress: () => setSelectedLanguage('Tamil') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Account */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={onOpenEditProfile}>
            <Text style={styles.menuLabel}>Personal & Account Details</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleLanguagePicker}>
            <Text style={styles.menuLabel}>Language</Text>
            <View style={styles.menuRight}>
              <Text style={styles.settingValue}>{selectedLanguage}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.menuItem, styles.menuItemLast]} onPress={onOpenSecurity}>
            <Text style={styles.menuLabel}>Security & Privacy</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Section 2: Notifications */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.menuCard}>
          <View style={styles.switchItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Push Notifications</Text>
              <Text style={styles.menuSub}>Daily market prices and new listings</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ true: '#386641', false: '#E2E8F0' }}
            />
          </View>

          <View style={[styles.switchItem, styles.menuItemLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Order Updates</Text>
              <Text style={styles.menuSub}>Real-time dispatch and delivery alerts</Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={setOrderUpdates}
              trackColor={{ true: '#386641', false: '#E2E8F0' }}
            />
          </View>
        </View>

        {/* Section 3: Legal & Support */}
        <Text style={styles.sectionHeader}>MORE</Text>
        <View style={styles.menuCard}>
          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert('Help & Support', 'Hotline: +94 11 234 5678\nEmail: support@famora.lk')}>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert('Legal', 'Farmora Terms of Service and Privacy Policy v1.0')}>
            <Text style={styles.menuLabel}>Terms of Service & Privacy</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={[styles.menuItem, styles.menuItemLast]}>
            <Text style={styles.menuLabel}>App Version</Text>
            <Text style={styles.settingValue}>1.0.4 (Expo 57)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
          ]}
          onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout from Device</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    color: '#64748B',
  },
  chevron: {
    fontSize: 18,
    color: '#94A3B8',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoutBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#FEF2F2',
  },
  logoutBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
