import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ApiUser, getAuthToken } from './api';
import { signInWithRealGoogleAccount } from './firebase-google-auth';

export interface GoogleAuthModalProps {
  visible: boolean;
  accountType?: 'farmer' | 'buyer';
  buyerType?: string;
  onClose: () => void;
  onSuccess: (user: ApiUser, token: string) => void;
}

export function GoogleAuthModal({
  visible,
  accountType = 'buyer',
  buyerType,
  onClose,
  onSuccess,
}: GoogleAuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Launch Real Google Sign-In (Web popup or Native Play Services sheet)
  const handleRealGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { user } = await signInWithRealGoogleAccount({
        accountType,
        buyerType,
      });
      const token = (await getAuthToken()) || '';
      onSuccess(user, token);
      onClose();
    } catch (err: any) {
      console.warn('[Google Auth] Sign-in notice:', err.message);
      setErrorMsg(err.message || 'Could not complete Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Google G Logo Header */}
          <View style={styles.header}>
            <View style={styles.gLogoBadge}>
              <Svg width={26} height={26} viewBox="0 0 24 24">
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
            <Text style={styles.title}>Google Sign-In</Text>
            <Text style={styles.subtitle}>
              Sign in with your verified Google account to continue to{' '}
              <Text style={{ fontWeight: '700', color: '#2E7D32' }}>Farmora</Text> as{' '}
              {accountType === 'farmer' ? 'Farmer' : 'Buyer'}
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
          ) : (
            <View style={styles.contentContainer}>
              {/* Primary Real Google Action */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryOAuthBtn,
                  pressed && styles.primaryOAuthBtnPressed,
                ]}
                onPress={handleRealGoogleSignIn}>
                <View style={styles.gMiniCircle}>
                  <Text style={styles.gMiniText}>G</Text>
                </View>
                <Text style={styles.primaryOAuthBtnText}>
                  {Platform.OS === 'web'
                    ? 'Sign in with Google Popup'
                    : 'Sign in with Google'}
                </Text>
              </Pressable>
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
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    textAlign: 'center',
    lineHeight: 16,
  },
  loaderBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  contentContainer: {
    gap: 12,
    marginBottom: 8,
  },
  primaryOAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A73E8',
    height: 52,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryOAuthBtnPressed: {
    backgroundColor: '#1557B0',
  },
  gMiniCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gMiniText: {
    color: '#1A73E8',
    fontSize: 15,
    fontWeight: '900',
  },
  primaryOAuthBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
