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
import Svg, { Path } from 'react-native-svg';

interface FarmerPrivacyScreenProps {
  onBack: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export function FarmerPrivacyScreen({
  onBack,
  onOpenPrivacyPolicy,
}: FarmerPrivacyScreenProps) {
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [locationVisibility, setLocationVisibility] = useState(true);
  const [contactVisibility, setContactVisibility] = useState(false);

  const handleDownloadData = () => {
    Alert.alert(
      'Download Data',
      'A complete archive of your Farmora profile, listings, and order history will be sent to your registered email address within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () =>
            Alert.alert(
              'Request Submitted',
              'Your export request has been queued. You will receive an email shortly.'
            ),
        },
      ]
    );
  };

  const handleBlockedUsers = () => {
    Alert.alert('Blocked Users', 'You currently have 0 blocked users.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={onBack}
          hitSlop={8}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke="#0F172A"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <Text style={styles.headerTitle}>Privacy</Text>

        <View style={styles.headerRightBadge}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="#1E5E3A"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Visibility Toggles Section */}
        <View style={styles.sectionCard}>
          {/* Profile Visibility */}
          <View style={styles.toggleRow}>
            <View style={styles.iconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 11a4 4 0 100-8 4 4 0 000 8z"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Profile Visibility</Text>
              <Text style={styles.toggleSubtitle}>
                Allow buyers/farmers to see your profile
              </Text>
            </View>
            <Switch
              value={profileVisibility}
              onValueChange={setProfileVisibility}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={profileVisibility ? '#1E5E3A' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Location Visibility */}
          <View style={styles.toggleRow}>
            <View style={styles.iconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 13a3 3 0 100-6 3 3 0 000 6z"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Location Visibility</Text>
              <Text style={styles.toggleSubtitle}>
                Show your farm/area location to others
              </Text>
            </View>
            <Switch
              value={locationVisibility}
              onValueChange={setLocationVisibility}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={locationVisibility ? '#1E5E3A' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Contact Visibility */}
          <View style={styles.toggleRow}>
            <View style={styles.iconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Contact Visibility</Text>
              <Text style={styles.toggleSubtitle}>
                Allow direct messages from other users
              </Text>
            </View>
            <Switch
              value={contactVisibility}
              onValueChange={setContactVisibility}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={contactVisibility ? '#1E5E3A' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Account Privacy Navigation List */}
        <View style={styles.sectionCard}>
          {/* Blocked Users */}
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            onPress={handleBlockedUsers}>
            <View style={styles.iconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Blocked Users</Text>
              <Text style={styles.actionSubtitle}>0 blocked users</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <View style={styles.divider} />

          {/* Download My Data */}
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            onPress={handleDownloadData}>
            <View style={styles.iconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M7 10l5 5 5-5"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 15V3"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Download My Data</Text>
              <Text style={styles.actionSubtitle}>
                Request a copy of all your Farmora data
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <View style={styles.divider} />

          {/* Privacy Policy */}
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            onPress={
              onOpenPrivacyPolicy ||
              (() =>
                Alert.alert(
                  'Privacy Policy',
                  'Farmora is committed to protecting your farm data and agricultural records in accordance with national privacy laws.'
                ))
            }>
            <View style={styles.iconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                  stroke="#1E5E3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Privacy Policy</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDF4EC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 52,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  actionRowPressed: {
    backgroundColor: '#F8FAFC',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
