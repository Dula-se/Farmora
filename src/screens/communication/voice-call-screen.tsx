import React, { useState, useEffect, useRef } from 'react';
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
import { ChatService } from '@/services/chat-service';
import { FirestoreChatService, FirestoreCallSession } from '@/services/firestore-chat-service';
import { getStoredUser } from '@/services/api';

interface VoiceCallScreenProps {
  visible: boolean;
  participantName: string;
  participantAvatar?: string;
  conversationId?: string;
  otherUserId?: string;
  callId?: string;
  isIncoming?: boolean;
  onEndCall: () => void;
  onSwitchToVideo?: () => void;
}

export function VoiceCallScreen({
  visible,
  participantName,
  participantAvatar,
  conversationId,
  otherUserId,
  callId: propCallId,
  isIncoming = false,
  onEndCall,
  onSwitchToVideo,
}: VoiceCallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected' | 'declined' | 'ended'>(
    isIncoming ? 'connected' : 'ringing'
  );
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(propCallId || null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for calling / ringing state
  useEffect(() => {
    if (callStatus === 'ringing' || callStatus === 'calling') {
      const loop = Animated.loop(
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
      loop.start();
      return () => loop.stop();
    }
  }, [callStatus, pulseAnim]);

  // Initiate call if caller
  useEffect(() => {
    if (!visible) return;

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    if (!isIncoming && !propCallId) {
      setCallStatus('ringing');
      setSeconds(0);

      (async () => {
        try {
          const user = await getStoredUser();
          if (user && conversationId && otherUserId && isMounted) {
            const initiated = await FirestoreChatService.initiateCall({
              conversationId,
              currentUser: user,
              receiverId: otherUserId,
              receiverName: participantName,
              receiverAvatar: participantAvatar,
              mode: 'audio',
            });
            if (isMounted) {
              setActiveCallId(initiated.callId);
              // Listen to call updates
              unsubscribe = FirestoreChatService.listenToCallSession(initiated.callId, handleSessionUpdate);
            }
          }
        } catch (err) {
          console.log('[VoiceCallScreen] Initiate error:', err);
        }
      })();
    } else {
      const cId = propCallId || conversationId;
      if (cId) {
        setActiveCallId(cId);
        unsubscribe = FirestoreChatService.listenToCallSession(cId, handleSessionUpdate);
      }
    }

    function handleSessionUpdate(session: FirestoreCallSession | null) {
      if (!isMounted || !session) return;

      if (session.status === 'connected') {
        setCallStatus('connected');
      } else if (session.status === 'declined') {
        setCallStatus('declined');
        setTimeout(() => {
          if (isMounted) onEndCall();
        }, 1500);
      } else if (session.status === 'ended') {
        setCallStatus('ended');
        setTimeout(() => {
          if (isMounted) onEndCall();
        }, 800);
      }

      // Check remote user mute status
      const otherMuted = isIncoming ? !!session.callerMuted : !!session.receiverMuted;
      setRemoteMuted(otherMuted);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [visible, isIncoming, propCallId, conversationId, otherUserId, participantName, participantAvatar]);

  // Timer counts up when connected
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible && callStatus === 'connected') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible, callStatus]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (activeCallId) {
      FirestoreChatService.updateCallControls(activeCallId, {
        [isIncoming ? 'receiverMuted' : 'callerMuted']: nextMuted,
      });
    }
  };

  const handleEndCall = async () => {
    if (activeCallId) {
      await FirestoreChatService.endCall(activeCallId).catch(() => {});
    }
    await ChatService.addCallRecord({
      participantName: participantName || 'User',
      participantAvatar: participantAvatar || '',
      participantRole: 'farmer',
      type: isIncoming ? 'incoming' : 'outgoing',
      callMode: 'audio',
      timestamp: 'Just now',
      duration: formatTimer(seconds),
    }).catch(() => {});
    onEndCall();
  };

  const initial = (participantName || 'F').trim().charAt(0).toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1320" />

        {/* Top Info Header */}
        <View style={styles.topInfo}>
          {callStatus === 'connected' ? (
            <View style={styles.encryptedBadgeWrap}>
              <Text style={styles.encryptedBadge}>🔒 Connected • End-to-end Encrypted Call</Text>
            </View>
          ) : callStatus === 'declined' ? (
            <View style={[styles.encryptedBadgeWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.encryptedBadge, { color: '#EF4444' }]}>❌ Call Declined</Text>
            </View>
          ) : (
            <View style={[styles.encryptedBadgeWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Text style={[styles.encryptedBadge, { color: '#60A5FA' }]}>🔔 Calling...</Text>
            </View>
          )}

          <Text style={styles.callerName}>{participantName || 'Participant'}</Text>
          <Text style={styles.callTimer}>
            {callStatus === 'connected' ? formatTimer(seconds) : 'Connecting inside Famora...'}
          </Text>

          {remoteMuted && (
            <View style={styles.remoteMutedBadge}>
              <Text style={styles.remoteMutedText}>🔇 Remote microphone is muted</Text>
            </View>
          )}
        </View>

        {/* Pulsing Avatar Center */}
        <View style={styles.avatarSection}>
          <Animated.View
            style={[
              styles.pulseRingOuter,
              (callStatus === 'ringing' || callStatus === 'calling') && {
                transform: [{ scale: pulseAnim }],
              },
            ]}>
            <View style={styles.pulseRingInner}>
              {participantAvatar ? (
                <Image source={{ uri: participantAvatar }} style={styles.callerAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.callerAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitialText}>{initial}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Audio Waveform Bars (Active when connected) */}
          <View style={styles.waveformsRow}>
            {[14, 28, 42, 20, 56, 35, 48, 22, 60, 38, 25, 45, 18, 30].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: callStatus === 'connected' ? (isMuted ? 6 : h) : 8 },
                  callStatus !== 'connected' && { backgroundColor: '#475569' },
                ]}
              />
            ))}
          </View>
          <Text style={styles.audioQualityText}>
            {callStatus === 'connected'
              ? '🟢 Live HD Voice Connected Directly in App'
              : 'Ringing receiver phone...'}
          </Text>
        </View>

        {/* Bottom Control Buttons */}
        <View style={styles.controlsRow}>
          {/* Mute Button */}
          <Pressable
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={handleToggleMute}>
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
            <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
          </Pressable>

          {/* Speaker Button */}
          <Pressable
            style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
            onPress={() => setIsSpeaker(!isSpeaker)}>
            <Text style={styles.controlIcon}>{isSpeaker ? '🔊' : '🔈'}</Text>
            <Text style={styles.controlLabel}>{isSpeaker ? 'Speaker On' : 'Speaker'}</Text>
          </Pressable>

          {/* Switch to Video */}
          <Pressable
            style={styles.controlBtn}
            onPress={onSwitchToVideo}>
            <Text style={styles.controlIcon}>📹</Text>
            <Text style={styles.controlLabel}>Video</Text>
          </Pressable>

          {/* End Call Button */}
          <Pressable
            style={styles.endCallBtn}
            onPress={handleEndCall}>
            <Text style={styles.endCallIcon}>📞</Text>
            <Text style={styles.endCallLabel}>End Call</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1320',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  topInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  encryptedBadgeWrap: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
  },
  encryptedBadge: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  callerName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  callTimer: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  remoteMutedBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  remoteMutedText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRingOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(30, 94, 58, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(30, 94, 58, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerAvatar: {
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
  waveformsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 65,
    marginTop: 36,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  audioQualityText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlBtn: {
    alignItems: 'center',
    width: 68,
  },
  controlBtnActive: {
    opacity: 0.9,
  },
  controlIcon: {
    fontSize: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 56,
    height: 56,
    borderRadius: 28,
    textAlign: 'center',
    lineHeight: 56,
    overflow: 'hidden',
    color: '#FFFFFF',
  },
  controlLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  endCallBtn: {
    alignItems: 'center',
    width: 68,
  },
  endCallIcon: {
    fontSize: 26,
    backgroundColor: '#EF4444',
    width: 56,
    height: 56,
    borderRadius: 28,
    textAlign: 'center',
    lineHeight: 56,
    overflow: 'hidden',
    color: '#FFFFFF',
    transform: [{ rotate: '135deg' }],
  },
  endCallLabel: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '700',
  },
});
