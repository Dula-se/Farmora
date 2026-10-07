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
import { updateProfileApi, clearAuthSession } from '@/services/api';

interface SecurityScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
}

export function SecurityScreen({ onBack, onLogout }: SecurityScreenProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [devices, setDevices] = useState([
    {
      id: 'd-1',
      name: 'Google Pixel 8 Pro',
      location: 'Colombo, Sri Lanka',
      current: true,
      lastActive: 'Active now',
    },
    {
      id: 'd-2',
      name: 'Samsung Galaxy Tab S8',
      location: 'Kandy, Sri Lanka',
      current: false,
      lastActive: '3 days ago',
    },
  ]);

  const handleToggle2FA = async (val: boolean) => {
    setTwoFactorEnabled(val);
    try {
      await updateProfileApi({
        securitySettings: {
          twoFactorEnabled: val,
          biometricLoginEnabled: biometricEnabled,
        },
      } as any);
    } catch {
      // ignore
    }
  };

  const handleToggleBiometric = async (val: boolean) => {
    setBiometricEnabled(val);
    try {
      await updateProfileApi({
        securitySettings: {
          twoFactorEnabled,
          biometricLoginEnabled: val,
        },
      } as any);
    } catch {
      // ignore
    }
  };

  const handleLogoutDevice = (deviceId: string, deviceName: string) => {
    Alert.alert('Sign Out Device', `Sign out from ${deviceName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          setDevices((prev) => prev.filter((d) => d.id !== deviceId));
          Alert.alert('Signed Out', `${deviceName} has been de-authenticated.`);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account Warning',
      'Are you sure you want to permanently delete your Farmora account and all registered data? This action cannot be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            await clearAuthSession();
            onLogout?.();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Authentication Card */}
        <Text style={styles.sectionHeader}>LOGIN SECURITY</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.menuRow}
            onPress={() => Alert.alert('Change Password', 'Enter current and new password dialog')}>
            <View>
              <Text style={styles.rowTitle}>Change Password</Text>
              <Text style={styles.rowSub}>Last changed 3 months ago</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Two-Factor Authentication (2FA)</Text>
              <Text style={styles.rowSub}>Require OTP code via Google Email or SMS on sign-in</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ true: '#386641', false: '#E2E8F0' }}
            />
          </View>

          <View style={[styles.switchRow, styles.rowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Biometric Authentication</Text>
              <Text style={styles.rowSub}>Use fingerprint or Face ID for fast checkout</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ true: '#386641', false: '#E2E8F0' }}
            />
          </View>
        </View>

        {/* Active Devices */}
        <Text style={styles.sectionHeader}>ACTIVE DEVICES</Text>
        <View style={styles.card}>
          {devices.map((device, idx) => (
            <View
              key={device.id}
              style={[
                styles.deviceRow,
                idx === devices.length - 1 && styles.rowLast,
              ]}>
              <View style={styles.deviceIconCircle}>
                <Text style={styles.deviceIcon}>📱</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.deviceNameRow}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  {device.current && (
                    <View style={styles.thisDeviceBadge}>
                      <Text style={styles.thisDeviceText}>This Device</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.deviceMeta}>
                  {device.location} • {device.lastActive}
                </Text>
              </View>

              {!device.current && (
                <Pressable
                  style={styles.deviceLogoutBtn}
                  onPress={() => handleLogoutDevice(device.id, device.name)}>
                  <Text style={styles.deviceLogoutText}>Log out</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionHeader}>DANGER ZONE</Text>
        <View style={styles.card}>
          <Pressable style={styles.deleteRow} onPress={handleDeleteAccount}>
            <Text style={styles.deleteIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.deleteTitle}>Delete Farmora Account</Text>
              <Text style={styles.deleteSub}>
                Permanently purge your buyer history and profile data.
              </Text>
            </View>
          </Pressable>
        </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: '#94A3B8',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIcon: {
    fontSize: 16,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  thisDeviceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  thisDeviceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  deviceMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deviceLogoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  deviceLogoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFF5F5',
  },
  deleteIcon: {
    fontSize: 20,
  },
  deleteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteSub: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
});
