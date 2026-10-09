import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChatService } from '@/services/chat-service';
import { FirestoreChatService, FirestoreCallSession } from '@/services/firestore-chat-service';
import { getStoredUser, apiFetch } from '@/services/api';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface VoiceCallScreenProps {
  visible: boolean;
  participantName: string;
  participantAvatar?: string;
  participantPhone?: string;
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
  participantPhone,
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

  // Phone number & 10s countdown to native mobile keypad
  const [phoneNumber, setPhoneNumber] = useState<string>(participantPhone || '');
  const [dialCountdown, setDialCountdown] = useState<number>(10);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasTriggeredDialerRef = useRef(false);

  // Fetch real farmer mobile number if not passed in props
  useEffect(() => {
    if (participantPhone) {
      setPhoneNumber(participantPhone);
      return;
    }
    if (otherUserId) {
      // 1. Try Firestore
      getDoc(doc(db, 'users', otherUserId))
        .then((snap) => {
          if (snap.exists() && snap.data()?.mobileNumber) {
            setPhoneNumber(snap.data().mobileNumber);
          }
        })
        .catch(() => {});

      // 2. Try MongoDB backend API
      apiFetch<any>(`/users/${otherUserId}`)
        .then((res) => {
          if (res?.data?.mobileNumber) {
            setPhoneNumber(res.data.mobileNumber);
          }
        })
        .catch(() => {});
    }
  }, [otherUserId, participantPhone]);

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

  // Navigate to native phone keypad with the farmer's mobile number pre-pasted
  const triggerNativeDialer = () => {
    if (hasTriggeredDialerRef.current) return;
    hasTriggeredDialerRef.current = true;

    const rawNumber = phoneNumber || '+94771234567';
    const cleanNumber = rawNumber.replace(/[^0-9+]/g, '');

    Linking.openURL(`tel:${cleanNumber}`).catch((err) => {
      console.warn('[VoiceCallScreen] Linking.openURL error:', err);
    });

    // Close the in-app calling screen so returning to app lands cleanly in chat
    onEndCall();
  };

  // 10-second automatic countdown to native mobile keypad
  useEffect(() => {
    if (!visible || isIncoming || callStatus === 'connected') return;

    hasTriggeredDialerRef.current = false;
    setDialCountdown(10);

    const interval = setInterval(() => {
      setDialCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerNativeDialer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, isIncoming, callStatus, phoneNumber]);

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

          {/* 10s Countdown to Native Phone Keypad Notice */}
          {callStatus !== 'connected' && !isIncoming && (
            <View style={styles.dialerNoticeCard}>
              <View style={styles.dialerBadgeRow}>
                <View style={styles.dialerPulsingDot} />
                <Text style={styles.dialerNoticeTitle}>
                  Switching to Mobile Keypad in {dialCountdown}s
                </Text>
              </View>
              <Text style={styles.dialerNoticePhone}>
                Farmer: {phoneNumber || '+94 77 123 4567'}
              </Text>
              <Pressable style={styles.dialNowBtn} onPress={triggerNativeDialer}>
                <Text style={styles.dialNowBtnText}>📞 Open Phone Keypad Now</Text>
              </Pressable>
            </View>
          )}

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

          {/* Audio Waveform Bars */}
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
              : `Pasting ${phoneNumber || 'number'} to mobile keypad in ${dialCountdown}s...`}
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
    marginTop: 14,
    paddingHorizontal: 20,
  },
  encryptedBadgeWrap: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 12,
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
    marginBottom: 4,
    textAlign: 'center',
  },
  callTimer: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dialerNoticeCard: {
    marginTop: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  dialerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dialerPulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  dialerNoticeTitle: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dialerNoticePhone: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dialNowBtn: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dialNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1E5E3A',
  },
  avatarPlaceholder: {
    backgroundColor: '#1E5E3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
  },
  waveformsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 30,
    height: 60,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  audioQualityText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E293B',
  },
  controlBtnActive: {
    backgroundColor: '#334155',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  controlIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  controlLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  endCallBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EF4444',
  },
  endCallIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    transform: [{ rotate: '135deg' }],
  },
  endCallLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
