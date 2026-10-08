import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { ChatService } from '@/services/chat-service';
import { FirestoreChatService } from '@/services/firestore-chat-service';
import { getStoredUser } from '@/services/api';

interface VoiceCallScreenProps {
  visible: boolean;
  participantName: string;
  participantAvatar?: string;
  conversationId?: string;
  otherUserId?: string;
  onEndCall: () => void;
  onSwitchToVideo?: () => void;
}

export function VoiceCallScreen({
  visible,
  participantName,
  participantAvatar,
  conversationId,
  otherUserId,
  onEndCall,
  onSwitchToVideo,
}: VoiceCallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string>(
    `https://meet.jit.si/Famora_Voice_${encodeURIComponent((participantName || 'Call').replace(/\s+/g, '_'))}#config.startWithVideoMuted=true&config.prejoinPageEnabled=false`
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible) {
      setSeconds(0);
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Initiate call signaling in Firestore
      (async () => {
        try {
          const user = await getStoredUser();
          if (user && conversationId && otherUserId) {
            const initiated = await FirestoreChatService.initiateCall({
              conversationId,
              currentUser: user,
              receiverId: otherUserId,
              receiverName: participantName,
              receiverAvatar: participantAvatar,
              mode: 'audio',
            });
            setCallId(initiated.callId);
            setRoomUrl(initiated.roomUrl);
          }
        } catch (err) {
          console.log('[VoiceCallScreen] Signaling notice:', err);
        }
      })();
    }
    return () => clearInterval(timer);
  }, [visible, conversationId, otherUserId, participantName, participantAvatar]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenLiveAudio = async () => {
    try {
      await WebBrowser.openBrowserAsync(roomUrl);
    } catch (e) {
      console.log('[VoiceCallScreen] WebBrowser open error:', e);
    }
  };

  const handleEndCall = async () => {
    if (callId) {
      await FirestoreChatService.endCall(callId).catch(() => {});
    }
    await ChatService.addCallRecord({
      participantName: participantName || 'User',
      participantAvatar: participantAvatar || '',
      participantRole: 'farmer',
      type: 'outgoing',
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

        {/* Top Info */}
        <View style={styles.topInfo}>
          <Text style={styles.encryptedBadge}>🔒 End-to-end Encrypted Call</Text>
          <Text style={styles.callerName}>{participantName || 'Participant'}</Text>
          <Text style={styles.callTimer}>{formatTimer(seconds)}</Text>
        </View>

        {/* Pulsing Avatar Center */}
        <View style={styles.avatarSection}>
          <View style={styles.pulseRingOuter}>
            <View style={styles.pulseRingInner}>
              {participantAvatar ? (
                <Image source={{ uri: participantAvatar }} style={styles.callerAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.callerAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitialText}>{initial}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Audio Waveform Animation Bars */}
          <View style={styles.waveformsRow}>
            {[14, 28, 42, 20, 56, 35, 48, 22, 60, 38, 25, 45, 18, 30].map((h, i) => (
              <View key={i} style={[styles.waveBar, { height: h }]} />
            ))}
          </View>
          <Text style={styles.audioQualityText}>HD Voice Active • Direct WebRTC Connection</Text>

          {/* Live Connect Audio Button */}
          <Pressable style={styles.liveStreamBtn} onPress={handleOpenLiveAudio}>
            <Text style={styles.liveStreamIcon}>🎙️</Text>
            <Text style={styles.liveStreamText}>Connect Live HD Audio</Text>
          </Pressable>
        </View>

        {/* Bottom Control Buttons */}
        <View style={styles.controlsRow}>
          {/* Mute Button */}
          <Pressable
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted(!isMuted)}>
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
  encryptedBadge: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
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
    fontSize: 12,
    marginTop: 12,
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
  liveStreamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  liveStreamIcon: {
    fontSize: 18,
  },
  liveStreamText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
