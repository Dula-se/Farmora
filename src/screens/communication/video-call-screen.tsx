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
import { getStoredUser, ApiUser } from '@/services/api';

interface VideoCallScreenProps {
  visible: boolean;
  participantName: string;
  participantAvatar?: string;
  conversationId?: string;
  otherUserId?: string;
  onEndCall: () => void;
}

export function VideoCallScreen({
  visible,
  participantName,
  participantAvatar,
  conversationId,
  otherUserId,
  onEndCall,
}: VideoCallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [videoPaused, setVideoPaused] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string>(
    `https://meet.jit.si/Famora_Live_${encodeURIComponent((participantName || 'Call').replace(/\s+/g, '_'))}#config.prejoinPageEnabled=false`
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible) {
      setSeconds(0);
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Load current user and initiate call signaling in Firestore
      (async () => {
        try {
          const u = await getStoredUser();
          if (u) {
            setCurrentUser(u);
            if (conversationId && otherUserId) {
              const initiated = await FirestoreChatService.initiateCall({
                conversationId,
                currentUser: u,
                receiverId: otherUserId,
                receiverName: participantName,
                receiverAvatar: participantAvatar,
                mode: 'video',
              });
              setCallId(initiated.callId);
              setRoomUrl(initiated.roomUrl);
            }
          }
        } catch (err) {
          console.log('[VideoCallScreen] Signaling error:', err);
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

  const handleOpenLiveVideo = async () => {
    try {
      await WebBrowser.openBrowserAsync(roomUrl);
    } catch (e) {
      console.log('[VideoCallScreen] WebBrowser open error:', e);
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
      callMode: 'video',
      timestamp: 'Just now',
      duration: formatTimer(seconds),
    }).catch(() => {});
    onEndCall();
  };

  const myInitial = (currentUser?.fullName || 'You').trim().charAt(0).toUpperCase();
  const participantInitial = (participantName || 'F').trim().charAt(0).toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Main Background Stream: Real avatar or stream placeholder backdrop */}
        {participantAvatar && !videoPaused ? (
          <Image
            source={{ uri: participantAvatar }}
            style={styles.fullVideoStream}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.fullVideoStream, styles.emptyStreamBackdrop]}>
            <View style={styles.centerAvatarBadge}>
              <Text style={styles.centerAvatarText}>{participantInitial}</Text>
            </View>
            <Text style={styles.streamNoticeText}>
              {videoPaused ? 'Video Feed Paused' : 'Live WebRTC Video Stream Active'}
            </Text>
          </View>
        )}

        {/* Top Dark Gradient Header Overlay */}
        <SafeAreaView style={styles.topOverlay} edges={['top', 'left', 'right']}>
          <View style={styles.topInfoRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.liveRedDot} />
                <Text style={styles.inspectionTitle}>Live Farm Video Inspection</Text>
              </View>
              <Text style={styles.participantName}>{participantName || 'Participant'}</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
            </View>
          </View>

          {/* Quick Connect Live WebRTC Button */}
          <Pressable style={styles.openWebRtcBtn} onPress={handleOpenLiveVideo}>
            <Text style={styles.openWebRtcIcon}>📹</Text>
            <Text style={styles.openWebRtcText}>Connect HD Video Feed</Text>
          </Pressable>
        </SafeAreaView>

        {/* Picture-in-Picture (Self Video Preview) */}
        <View style={styles.pipContainer}>
          {currentUser?.avatarUrl ? (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              style={styles.pipImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.pipImage, styles.pipFallbackBadge]}>
              <Text style={styles.pipFallbackInitial}>{myInitial}</Text>
            </View>
          )}
          <View style={styles.pipLabelBadge}>
            <Text style={styles.pipLabelText}>You ({cameraFacing})</Text>
          </View>
        </View>

        {/* Bottom Control Bar */}
        <SafeAreaView style={styles.bottomOverlay} edges={['bottom', 'left', 'right']}>
          <View style={styles.controlsRow}>
            {/* Flip Camera */}
            <Pressable
              style={styles.controlCircle}
              onPress={() => setCameraFacing(cameraFacing === 'front' ? 'back' : 'front')}>
              <Text style={styles.controlIconText}>🔄</Text>
              <Text style={styles.controlSubText}>Flip</Text>
            </Pressable>

            {/* Mute Mic */}
            <Pressable
              style={[styles.controlCircle, isMuted && styles.controlCircleActive]}
              onPress={() => setIsMuted(!isMuted)}>
              <Text style={styles.controlIconText}>{isMuted ? '🔇' : '🎙️'}</Text>
              <Text style={styles.controlSubText}>{isMuted ? 'Muted' : 'Mic'}</Text>
            </Pressable>

            {/* Pause Video */}
            <Pressable
              style={[styles.controlCircle, videoPaused && styles.controlCircleActive]}
              onPress={() => setVideoPaused(!videoPaused)}>
              <Text style={styles.controlIconText}>{videoPaused ? '🙈' : '📹'}</Text>
              <Text style={styles.controlSubText}>{videoPaused ? 'Paused' : 'Camera'}</Text>
            </Pressable>

            {/* End Call Button */}
            <Pressable
              style={styles.endCallCircle}
              onPress={handleEndCall}>
              <Text style={styles.endCallIcon}>📞</Text>
              <Text style={styles.endCallText}>End</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullVideoStream: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  inspectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
    textTransform: 'uppercase',
  },
  participantName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pipContainer: {
    position: 'absolute',
    top: 90,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  pipImage: {
    width: '100%',
    height: '100%',
  },
  pipLabelBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pipLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 16,
    paddingBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlCircle: {
    alignItems: 'center',
    width: 60,
  },
  controlCircleActive: {
    opacity: 0.8,
  },
  controlIconText: {
    fontSize: 22,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 50,
    overflow: 'hidden',
    color: '#FFFFFF',
  },
  controlSubText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  endCallCircle: {
    alignItems: 'center',
    width: 60,
  },
  endCallIcon: {
    fontSize: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EF4444',
    textAlign: 'center',
    lineHeight: 50,
    overflow: 'hidden',
    color: '#FFFFFF',
    transform: [{ rotate: '135deg' }],
  },
  endCallText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
  },
  emptyStreamBackdrop: {
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerAvatarBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E3A2F',
    borderWidth: 3,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  centerAvatarText: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
  },
  streamNoticeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  openWebRtcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  openWebRtcIcon: {
    fontSize: 16,
  },
  openWebRtcText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pipFallbackBadge: {
    backgroundColor: '#1E3A2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipFallbackInitial: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
});
