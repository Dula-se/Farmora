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
import { ChatService } from '@/services/chat-service';

interface VideoCallScreenProps {
  visible: boolean;
  participantName: string;
  participantAvatar: string;
  onEndCall: () => void;
}

export function VideoCallScreen({
  visible,
  participantName,
  participantAvatar,
  onEndCall,
}: VideoCallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [videoPaused, setVideoPaused] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible) {
      setSeconds(0);
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    await ChatService.addCallRecord({
      participantName,
      participantAvatar,
      participantRole: 'farmer',
      type: 'outgoing',
      callMode: 'video',
      timestamp: 'Just now',
      duration: formatTimer(seconds),
    });
    onEndCall();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Main Background Stream: High-res Farm Inspection view */}
        <Image
          source={{
            uri: videoPaused
              ? participantAvatar
              : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1200&auto=format&fit=crop&q=80',
          }}
          style={styles.fullVideoStream}
          contentFit="cover"
        />

        {/* Top Dark Gradient Header Overlay */}
        <SafeAreaView style={styles.topOverlay} edges={['top', 'left', 'right']}>
          <View style={styles.topInfoRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.liveRedDot} />
                <Text style={styles.inspectionTitle}>Live Farm Inspection</Text>
              </View>
              <Text style={styles.participantName}>{participantName}</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Picture-in-Picture (Self Video Preview) */}
        <View style={styles.pipContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
            }}
            style={styles.pipImage}
            contentFit="cover"
          />
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
});
