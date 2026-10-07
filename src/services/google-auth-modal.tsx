import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { googleAuthApi, ApiUser } from './api';

export interface GoogleAuthModalProps {
  visible: boolean;
  accountType?: 'farmer' | 'buyer';
  buyerType?: string;
  onClose: () => void;
  onSuccess: (user: ApiUser, token: string) => void;
}

const DEFAULT_GOOGLE_PROFILES = [
  {
    email: 'dushan.agro@gmail.com',
    fullName: 'Dushan Pasindu',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
  },
  {
    email: 'kamal.perera.farm@gmail.com',
    fullName: 'Kamal Perera',
    avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=100',
  },
  {
    email: 'sunil.freshbuyers@gmail.com',
    fullName: 'Sunil Dissanayake',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  },
];

export function GoogleAuthModal({
  visible,
  accountType = 'buyer',
  buyerType,
  onClose,
  onSuccess,
}: GoogleAuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectProfile = async (profile: { email: string; fullName: string; avatar?: string }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await googleAuthApi({
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatar,
        googleId: `google_${profile.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        accountType,
        buyerType,
      });

      if (res.user && res.token) {
        onSuccess(res.user, res.token);
        onClose();
      } else {
        setErrorMsg('Google sign in failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      setErrorMsg(err.message || 'Could not authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = () => {
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google email address.');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    handleSelectProfile({
      email: customEmail.trim(),
      fullName: name,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Google G Logo Header */}
          <View style={styles.header}>
            <View style={styles.gLogoBadge}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <Path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <Path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <Path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </Svg>
            </View>
            <Text style={styles.title}>Sign in with Google</Text>
            <Text style={styles.subtitle}>
              Choose an account to continue to <Text style={{ fontWeight: '700', color: '#2E7D32' }}>Farmora</Text> as {accountType === 'farmer' ? 'Farmer' : 'Buyer'}
            </Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loaderText}>Authenticating with Google...</Text>
            </View>
          ) : !showCustomInput ? (
            <View style={styles.profileList}>
              {DEFAULT_GOOGLE_PROFILES.map((p) => (
                <Pressable
                  key={p.email}
                  style={({ pressed }) => [styles.profileItem, pressed && styles.profileItemPressed]}
                  onPress={() => handleSelectProfile(p)}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{p.fullName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{p.fullName}</Text>
                    <Text style={styles.profileEmail}>{p.email}</Text>
                  </View>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </Pressable>
              ))}

              <Pressable
                style={styles.addAnotherBtn}
                onPress={() => setShowCustomInput(true)}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 5v14M5 12h14" />
                </Svg>
                <Text style={styles.addAnotherText}>Use another Google account</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.customForm}>
              <Text style={styles.inputLabel}>Enter Google Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={customEmail}
                onChangeText={setCustomEmail}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Display Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor="#94A3B8"
                value={customName}
                onChangeText={setCustomName}
              />

              <View style={styles.customActions}>
                <Pressable
                  style={styles.cancelCustomBtn}
                  onPress={() => setShowCustomInput(false)}>
                  <Text style={styles.cancelCustomText}>Back</Text>
                </Pressable>
                <Pressable
                  style={styles.confirmCustomBtn}
                  onPress={handleCustomSubmit}>
                  <Text style={styles.confirmCustomText}>Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  loaderBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  profileList: {
    gap: 10,
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  profileItemPressed: {
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addAnotherText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  customForm: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  customActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelCustomBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelCustomText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmCustomBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
  },
  confirmCustomText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
