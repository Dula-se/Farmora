import React, { useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FirestoreCallSession, FirestoreChatService } from '@/services/firestore-chat-service';

interface IncomingCallModalProps {
  call: FirestoreCallSession | null;
  onAccept: (call: FirestoreCallSession) => void;
  onDecline: () => void;
}

export function IncomingCallModal({ call, onAccept, onDecline }: IncomingCallModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (call) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [call, pulseAnim]);

  if (!call) return null;

  const handleAccept = async () => {
    await FirestoreChatService.acceptCall(call.id);
    onAccept(call);
  };

  const handleDecline = async () => {
    await FirestoreChatService.declineCall(call.id);
    onDecline();
  };

  const initial = (call.callerName || 'U').trim().charAt(0).toUpperCase();

  return (
    <Modal visible={!!call} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#06101E" />

        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.callTypeBadge}>
            {call.mode === 'video' ? '📹 LIVE FARM INSPECTION' : '📞 ENCRYPTED HD VOICE CALL'}
          </Text>
          <Text style={styles.statusRinging}>Incoming Call...</Text>
        </View>

        {/* Center Pulsing Avatar */}
        <View style={styles.centerSection}>
          <Animated.View style={[styles.pulseRingOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.pulseRingInner}>
              {call.callerAvatar ? (
                <Image
                  source={{ uri: call.callerAvatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitialText}>{initial}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          <Text style={styles.callerName}>{call.callerName || 'Famora User'}</Text>
          <Text style={styles.callerSub}>
            Direct farmer-to-buyer connection
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {/* Decline Button */}
          <Pressable style={styles.actionBtnWrap} onPress={handleDecline}>
            <View style={styles.declineBtn}>
              <Text style={styles.btnIcon}>📞</Text>
            </View>
            <Text style={styles.actionLabel}>Decline</Text>
          </Pressable>

          {/* Accept Button */}
          <Pressable style={styles.actionBtnWrap} onPress={handleAccept}>
            <View style={styles.acceptBtn}>
              <Text style={styles.btnIconAccept}>📞</Text>
            </View>
            <Text style={styles.actionLabelAccept}>Accept Call</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06101E',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  topHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  callTypeBadge: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  statusRinging: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRingOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  pulseRingInner: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    backgroundColor: '#1E3A2F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarInitialText: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
  },
  callerName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  callerSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionBtnWrap: {
    alignItems: 'center',
  },
  declineBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  btnIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    transform: [{ rotate: '135deg' }],
  },
  actionLabel: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  acceptBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  btnIconAccept: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  actionLabelAccept: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
});
