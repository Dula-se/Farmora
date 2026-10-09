/**
 * chat-conversation-screen.tsx
 *
 * Real-time chat powered by Firebase Firestore.
 * Voice notes: recorded with expo-audio, uploaded to Firebase Storage, played back on tap.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  PermissionsAndroid,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Safe lazy loader for expo-audio (Expo SDK 57 official audio package)
function getExpoAudio(): typeof import('expo-audio') | null {
  try {
    const nativeAudio = requireOptionalNativeModule('ExpoAudio');
    if (!nativeAudio) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-audio');
  } catch {
    return null;
  }
}
import {
  FirestoreChatService,
  FirestoreMessage,
  FirestoreConversation,
  FirestoreOffer,
  FirestoreCallInvitation,
} from '@/services/firestore-chat-service';
import { CalComService } from '@/services/calcom-service';
import { ScheduleInspectionModal } from './schedule-inspection-modal';
import { getStoredUser, ApiUser, apiFetch } from '@/services/api';
import {
  capturePhotoFromCamera,
  pickImageFromGallery,
  pickAudioFile,
} from '@/services/media-picker';

interface ChatConversationScreenProps {
  conversationId: string;               // Firestore conversation doc ID
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  otherUserRole?: 'farmer' | 'buyer';
  productTitle?: string;
  productImage?: string;
  onBack: () => void;
  onStartAudioCall: (name: string, avatar: string) => void;
  onStartVideoCall: (name: string, avatar: string) => void;
  onRequestInspection?: () => void;
  onRateUser?: (userId: string, userName: string, userAvatar: string, role: 'farmer' | 'buyer') => void;
  currentRole?: 'buyer' | 'farmer';
}

export function ChatConversationScreen({
  conversationId,
  otherUserId,
  otherUserName = 'Unknown',
  otherUserAvatar = '',
  otherUserRole = 'farmer',
  productTitle,
  productImage,
  onBack,
  onStartAudioCall,
  onStartVideoCall,
  onRequestInspection,
  onRateUser,
  currentRole = 'buyer',
}: ChatConversationScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [convMeta, setConvMeta] = useState<FirestoreConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showLocalScheduleModal, setShowLocalScheduleModal] = useState(false);
  const [liveOtherAvatar, setLiveOtherAvatar] = useState<string>('');

  // Edit & Delete message actions
  const [selectedMsgForAction, setSelectedMsgForAction] = useState<FirestoreMessage | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMsg, setEditingMsg] = useState<FirestoreMessage | null>(null);
  const [editingText, setEditingText] = useState('');
  const [updatingMsg, setUpdatingMsg] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordingRef = useRef<any>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micPulse = useRef(new Animated.Value(1)).current;
  const micAnim = useRef<Animated.CompositeAnimation | null>(null);

  // Voice playback
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);

  // Offer form
  const [offerQty, setOfferQty] = useState('100');
  const [offerPrice, setOfferPrice] = useState('210');

  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadUserAndListen();
    return () => {
      unsubscribeRef.current?.();
      stopRecording(false);
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.remove?.();
        } catch {}
      }
    };
  }, [conversationId]);

  const loadUserAndListen = async () => {
    // 1. Instantly display cached messages from AsyncStorage (0ms latency!)
    try {
      const cached = await FirestoreChatService.getCachedMessages(conversationId);
      if (cached && cached.length > 0) {
        setMessages(cached);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
      }
    } catch {}

    const user = await getStoredUser();
    setCurrentUser(user);

    // 2. Fetch conversation metadata & other user's real database avatar non-blocking in background
    const fetchMetadata = async () => {
      try {
        const convSnap = await getDoc(doc(db, 'conversations', conversationId));
        if (convSnap.exists()) {
          const cData = convSnap.data() as any;
          setConvMeta({ id: convSnap.id, ...cData });
          const targetUid = otherUserId || cData.participants?.find((p: string) => p !== (user?.id || user?._id));
          if (targetUid) {
            try {
              const uSnap = await getDoc(doc(db, 'users', targetUid));
              if (uSnap.exists() && uSnap.data()?.avatarUrl) {
                setLiveOtherAvatar(uSnap.data().avatarUrl);
              }
            } catch {}
          }
          return;
        }
      } catch (e: any) {
        // Only warn for unexpected errors, offline fallback handles offline state cleanly
        if (!e?.message?.includes('offline')) {
          console.warn('[Chat] Firestore getDoc notice:', e);
        }
      }

      // Fallback: Fetch from backend MongoDB API for new devices/offline
      try {
        const res = await apiFetch<any>(`/chat/conversations/${conversationId}`);
        if (res?.data) {
          const cData = res.data;
          setConvMeta(cData);
          const targetUid = otherUserId || cData.participants?.find((p: string) => p !== (user?.id || user?._id));
          if (targetUid && cData.participantAvatars?.[targetUid]) {
            setLiveOtherAvatar(cData.participantAvatars[targetUid]);
          }
        }
      } catch {}
    };
    fetchMetadata();

    // 3. Real-time messages listener immediately
    const unsub = FirestoreChatService.listenToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    });
    unsubscribeRef.current = unsub;

    // 4. Mark as read
    if (user) {
      const myId = user.id || user._id || '';
      FirestoreChatService.markConversationRead(conversationId, myId);
    }
  };

  // ── Audio permission ────────────────────────────────────────────────────

  const ensureAudioPermission = async (): Promise<boolean> => {
    // 1. Android runtime permission request via PermissionsAndroid (directly triggers system dialog)
    if (Platform.OS === 'android') {
      try {
        const hasPerm = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (hasPerm) return true;

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Farmora needs microphone access so you can send voice notes in chat.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }

        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Microphone Permission Required',
            'Microphone access is currently disabled for Farmora. Tap Open Settings to enable it.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }

        return false;
      } catch (err) {
        console.warn('[Audio] PermissionsAndroid error:', err);
      }
    }

    // 2. Fallback / iOS check via expo-audio
    const Audio = getExpoAudio();
    if (Audio?.requestRecordingPermissionsAsync) {
      try {
        const { status, canAskAgain } = await Audio.requestRecordingPermissionsAsync();
        if (status === 'granted') return true;

        if (!canAskAgain) {
          Alert.alert(
            'Microphone Permission Required',
            'Microphone access is currently disabled for Farmora. Tap Open Settings to enable it.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }

        return false;
      } catch (e) {
        console.warn('[Audio] Permission error:', e);
        return false;
      }
    }

    return false;
  };

  // ── Recording ───────────────────────────────────────────────────────────

  const startMicPulse = () => {
    micAnim.current = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.4, duration: 500, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    micAnim.current.start();
  };

  const stopMicPulse = () => {
    micAnim.current?.stop();
    micPulse.setValue(1);
  };

  const handleStartRecording = async () => {
    const Audio = getExpoAudio();
    if (!Audio) {
      Alert.alert(
        'Voice Recording',
        'Direct microphone recording requires rebuilding the APK ("npx expo run:android") with the audio module.\n\nWould you like to attach an audio file or voice recording from your device instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Attach Audio Note', onPress: () => handlePickAndSendAudio() },
        ]
      );
      return;
    }

    const ok = await ensureAudioPermission();
    if (!ok) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AudioModule = require('expo-audio/build/AudioModule').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createRecordingOptions } = require('expo-audio/build/utils/options');
      const options = createRecordingOptions(Audio.RecordingPresets.HIGH_QUALITY);
      const recorder = new AudioModule.AudioRecorder(options);
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      startMicPulse();

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('[Voice] Start recording error:', err);
      Alert.alert('Recording Failed', 'Could not start recording. You can also attach an audio note directly.');
    }
  };

  const stopRecording = async (send: boolean) => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    stopMicPulse();

    const duration = recordSeconds;
    setIsRecording(false);
    setRecordSeconds(0);

    const recorder = recordingRef.current;
    recordingRef.current = null;

    if (!recorder) return;

    try {
      await recorder.stop();
      const Audio = getExpoAudio();
      if (Audio) {
        await Audio.setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      }

      if (!send || duration < 1 || !currentUser) return;

      const uri = recorder.uri;
      if (!uri) return;

      const waveform = Array.from({ length: 20 }, () => 8 + Math.floor(Math.random() * 24));
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      // Optimistic message bubble
      const tempId = `temp_voice_${Date.now()}`;
      const optimisticMsg: FirestoreMessage = {
        id: tempId,
        senderId: currentUser.id || currentUser._id || '',
        senderName: currentUser.fullName || 'You',
        senderRole: currentUser.accountType === 'farmer' ? 'farmer' : 'buyer',
        text: `🎙️ Voice note (${durationStr})`,
        isVoiceNote: true,
        voiceDuration: durationStr,
        voiceWaveform: waveform,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTimestamp: new Date().toISOString(),
        isRead: false,
        isEdited: false,
        isDeleted: false,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      setSending(true);
      try {
        const confirmed = await FirestoreChatService.sendVoiceNote({
          conversationId,
          currentUser,
          audioUri: uri,
          durationSeconds: duration,
          waveform,
        });
        if (confirmed) {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === tempId);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = confirmed;
              return next;
            }
            return [...prev.filter((m) => m.id !== confirmed.id), confirmed];
          });
        }
      } catch (err) {
        console.error('[Voice] Stop/send error:', err);
        Alert.alert('Error', 'Could not send voice note.');
      } finally {
        setSending(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (recorderErr) {
      console.warn('[Voice] Recorder error:', recorderErr);
      setSending(false);
    }
  };

  // ── Audio Attachment Fallback (Always Works) ─────────────────────────────

  const handlePickAndSendAudio = async () => {
    try {
      const picked = await pickAudioFile();
      if (!picked || !picked.uri || !currentUser) return;

      const waveform = Array.from({ length: 20 }, () => 8 + Math.floor(Math.random() * 24));
      const estimatedDuration = Math.max(3, Math.min(30, Math.round((picked.size || 60000) / 16000)));
      const mins = Math.floor(estimatedDuration / 60);
      const secs = estimatedDuration % 60;
      const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      const tempId = `temp_voice_${Date.now()}`;
      const optimisticMsg: FirestoreMessage = {
        id: tempId,
        senderId: currentUser.id || currentUser._id || '',
        senderName: currentUser.fullName || 'You',
        senderRole: currentUser.accountType === 'farmer' ? 'farmer' : 'buyer',
        text: `🎙️ Voice note (${durationStr})`,
        isVoiceNote: true,
        voiceDuration: durationStr,
        voiceWaveform: waveform,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTimestamp: new Date().toISOString(),
        isRead: false,
        isEdited: false,
        isDeleted: false,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      setSending(true);
      try {
        const confirmed = await FirestoreChatService.sendVoiceNote({
          conversationId,
          currentUser,
          audioUri: picked.uri,
          durationSeconds: estimatedDuration,
          waveform,
        });
        if (confirmed) {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === tempId);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = confirmed;
              return next;
            }
            return [...prev.filter((m) => m.id !== confirmed.id), confirmed];
          });
        }
      } catch (err: any) {
        console.error('[Voice] Attach audio error:', err);
        Alert.alert('Error', err?.message || 'Could not attach audio note.');
      } finally {
        setSending(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {
      setSending(false);
    }
  };

  // ── Playback ─────────────────────────────────────────────────────────────

  const handlePlayVoice = async (msg: FirestoreMessage) => {
    if (!msg.voiceUrl && !msg.voiceBase64) {
      Alert.alert('Not available', 'Voice note audio is not available.');
      return;
    }

    const Audio = getExpoAudio();
    if (!Audio) {
      Alert.alert(
        'Audio Playback',
        'Audio playback requires rebuilding the Android app ("npx expo run:android") with the new audio module.'
      );
      return;
    }

    // Stop current playback if any
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove?.();
      } catch {}
      playerRef.current = null;
    }

    // If tapping the same message that is playing, stop it
    if (playingMsgId === msg.id) {
      setPlayingMsgId(null);
      return;
    }

    try {
      setPlayingMsgId(msg.id);
      await Audio.setAudioModeAsync({
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false, // Ensures loudspeaker playback
      });

      let playUri = msg.voiceUrl || '';

      // If base64 audio exists, save to local cache for 100% reliable local playback
      if (msg.voiceBase64) {
        try {
          const cachePath = `${FileSystem.cacheDirectory}vn_${msg.id}.m4a`;
          const info = await FileSystem.getInfoAsync(cachePath);
          if (!info.exists) {
            await FileSystem.writeAsStringAsync(cachePath, msg.voiceBase64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          playUri = cachePath;
        } catch (fsErr) {
          console.warn('[Voice] Local cache write failed, falling back to voiceUrl:', fsErr);
        }
      }

      if (!playUri) {
        setPlayingMsgId(null);
        Alert.alert('Error', 'No playable audio URI found');
        return;
      }

      const player = Audio.createAudioPlayer(playUri);
      playerRef.current = player;
      player.play();

      player.addListener('playbackStatusUpdate', (status: any) => {
        if (
          status.playbackState === 'ended' ||
          (status.isLoaded && !status.playing && status.currentTime >= (status.duration - 0.2))
        ) {
          setPlayingMsgId(null);
          try {
            player.remove?.();
          } catch {}
          if (playerRef.current === player) {
            playerRef.current = null;
          }
        }
      });
    } catch (err) {
      console.error('[Voice] Playback error:', err);
      setPlayingMsgId(null);
      Alert.alert('Playback Error', 'Could not play voice note.');
    }
  };

  // ── Send text ─────────────────────────────────────────────────────────────

  const handleSendText = async (text?: string) => {
    const msg = text || inputText.trim();
    if (!msg || !currentUser) return;
    setInputText('');

    // Optimistic UI: display bubble immediately without waiting for network roundtrip
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: FirestoreMessage = {
      id: tempId,
      senderId: currentUser.id || currentUser._id || '',
      senderName: currentUser.fullName || 'You',
      senderRole: currentUser.accountType === 'farmer' ? 'farmer' : 'buyer',
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rawTimestamp: new Date().toISOString(),
      isRead: false,
      isEdited: false,
      isDeleted: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    setSending(true);
    try {
      const confirmed = await FirestoreChatService.sendMessage({
        conversationId,
        currentUser,
        text: msg,
      });
      if (confirmed) {
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === tempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = confirmed;
            return next;
          }
          return [...prev.filter((m) => m.id !== confirmed.id), confirmed];
        });
      }
    } catch (err) {
      console.warn('[Chat] handleSendText error:', err);
    } finally {
      setSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Send photo ────────────────────────────────────────────────────────────

  const handleSendPhoto = async (source: 'camera' | 'gallery') => {
    setShowActionSheet(false);
    if (!currentUser) return;
    const result =
      source === 'camera'
        ? await capturePhotoFromCamera({ quality: 0.5 })
        : await pickImageFromGallery({ quality: 0.5 });

    if (result) {
      const tempId = `temp_photo_${Date.now()}`;
      const optimisticMsg: FirestoreMessage = {
        id: tempId,
        senderId: currentUser.id || currentUser._id || '',
        senderName: currentUser.fullName || 'You',
        senderRole: currentUser.accountType === 'farmer' ? 'farmer' : 'buyer',
        text: '📷 Photo',
        imageUri: result.dataUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTimestamp: new Date().toISOString(),
        isRead: false,
        isEdited: false,
        isDeleted: false,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      setSending(true);
      try {
        const confirmed = await FirestoreChatService.sendMessage({
          conversationId,
          currentUser,
          text: '📷 Photo',
          imageUri: result.dataUrl,
        });
        if (confirmed) {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === tempId);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = confirmed;
              return next;
            }
            return [...prev.filter((m) => m.id !== confirmed.id), confirmed];
          });
        }
      } catch (err) {
        console.warn('[Chat] handleSendPhoto error:', err);
      } finally {
        setSending(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }
  };

  // ── Send offer ────────────────────────────────────────────────────────────

  const handleSendOffer = async () => {
    if (!currentUser) return;
    const qty = parseFloat(offerQty) || 50;
    const price = parseFloat(offerPrice) || 200;
    const total = qty * price;

    const offer: FirestoreOffer = {
      id: `off_${Date.now()}`,
      productTitle: productTitle || convMeta?.productTitle || 'Produce',
      quantity: qty,
      unit: 'kg',
      pricePerUnit: price,
      totalAmount: total,
      status: 'pending',
      counterBy: currentRole,
    };

    const tempId = `temp_offer_${Date.now()}`;
    const optimisticMsg: FirestoreMessage = {
      id: tempId,
      senderId: currentUser.id || currentUser._id || '',
      senderName: currentUser.fullName || 'You',
      senderRole: currentUser.accountType === 'farmer' ? 'farmer' : 'buyer',
      text: `Proposed offer: ${qty} kg @ Rs. ${price}/kg`,
      offer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rawTimestamp: new Date().toISOString(),
      isRead: false,
      isEdited: false,
      isDeleted: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setShowOfferModal(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    setSending(true);
    try {
      const confirmed = await FirestoreChatService.sendMessage({
        conversationId,
        currentUser,
        text: `Proposed offer: ${qty} kg @ Rs. ${price}/kg`,
        offer,
      });
      if (confirmed) {
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === tempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = confirmed;
            return next;
          }
          return [...prev.filter((m) => m.id !== confirmed.id), confirmed];
        });
      }
    } catch (err) {
      console.warn('[Chat] handleSendOffer error:', err);
    } finally {
      setSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Accept / Decline offer ────────────────────────────────────────────────

  const handleAcceptOffer = async (msgId: string) => {
    await FirestoreChatService.updateOfferStatus(conversationId, msgId, 'accepted');
    handleSendText('✅ Offer accepted! Let\'s confirm the order.');
    Alert.alert('Offer Accepted! 🎉', 'The price offer has been agreed. Proceed to confirm your order.');
  };

  const handleDeclineOffer = async (msgId: string) => {
    await FirestoreChatService.updateOfferStatus(conversationId, msgId, 'declined');
    handleSendText('Sorry, I cannot accept this offer.');
  };

  // ── Edit & Delete message handlers ────────────────────────────────────────

  const handleLongPressMessage = (msg: FirestoreMessage) => {
    if (msg.isDeleted) return;
    const currentMyId = currentUser?.id || currentUser?._id || myId || '';
    const isMeSender =
      msg.senderId === currentMyId ||
      (currentUser?.id && msg.senderId === currentUser.id) ||
      (currentUser?._id && msg.senderId === currentUser._id) ||
      (myId && msg.senderId === myId);

    if (!isMeSender) {
      Alert.alert('Notice', 'You can only edit or delete messages sent by you.');
      return;
    }
    setSelectedMsgForAction(msg);
  };

  const handleTriggerEdit = () => {
    if (!selectedMsgForAction) return;
    const msg = selectedMsgForAction;
    setSelectedMsgForAction(null);

    if (msg.isVoiceNote) {
      Alert.alert('Cannot Edit Voice Note', 'Voice notes cannot be edited. You can delete the message and send a new one.');
      return;
    }
    if (msg.offer) {
      Alert.alert('Cannot Edit Offer', 'Price offers cannot be modified directly. You can make a counter offer instead.');
      return;
    }

    // 24-hour validation check
    const rawTime = msg.rawTimestamp;
    if (rawTime) {
      const msgTime = new Date(rawTime).getTime();
      if (!isNaN(msgTime)) {
        const diffHours = (Date.now() - msgTime) / (1000 * 60 * 60);
        if (diffHours > 24) {
          Alert.alert(
            'Cannot Edit Message',
            'Messages older than 24 hours cannot be edited. Only messages sent within the last 24 hours can be updated.'
          );
          return;
        }
      }
    }

    setEditingMsg(msg);
    setEditingText(msg.text || '');
    setEditModalVisible(true);
  };

  const handleTriggerDelete = () => {
    if (!selectedMsgForAction) return;
    const msg = selectedMsgForAction;
    setSelectedMsgForAction(null);

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? It will be removed for everyone in this chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for Everyone',
          style: 'destructive',
          onPress: async () => {
            const targetId = msg.id;
            // Optimistic instant local update
            setMessages((prev) =>
              prev.map((m) =>
                m.id === targetId
                  ? {
                      ...m,
                      isDeleted: true,
                      deletedAt: new Date().toISOString(),
                      text: 'This message was deleted',
                      imageUri: undefined,
                      voiceUrl: undefined,
                      voiceBase64: undefined,
                    }
                  : m
              )
            );
            const res = await FirestoreChatService.deleteMessage({
              conversationId,
              messageId: targetId,
            });
            if (!res.success) {
              Alert.alert('Error', res.error || 'Could not delete message.');
            }
          },
        },
      ]
    );
  };

  const handleSaveEditedMessage = async () => {
    if (!editingMsg) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Message text cannot be empty.');
      return;
    }

    const targetMsgId = editingMsg.id;
    const rawTime = editingMsg.rawTimestamp;

    // Optimistic instant local update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === targetMsgId
          ? { ...m, text: trimmed, isEdited: true, editedAt: new Date().toISOString() }
          : m
      )
    );
    setEditModalVisible(false);
    setEditingMsg(null);
    setEditingText('');

    setUpdatingMsg(true);
    const res = await FirestoreChatService.editMessage({
      conversationId,
      messageId: targetMsgId,
      newText: trimmed,
      rawTimestamp: rawTime,
    });
    setUpdatingMsg(false);

    if (!res.success) {
      Alert.alert('Validation Error', res.error || 'Could not update message.');
    }
  };

  // ── Video Call (Google Video + Cal.com) Handlers ──────────────────────────

  const handleInitiateVideoCall = () => {
    if (!currentUser) return;
    Alert.alert(
      'Live Video Inspection 📹',
      `Choose how you would like to connect with ${participantName}:`,
      [
        {
          text: '📅 Schedule with Cal.com',
          onPress: () => setShowLocalScheduleModal(true),
        },
        {
          text: '⚡ Instant Video Call',
          onPress: startInstantVideoCall,
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const startInstantVideoCall = async () => {
    if (!currentUser) return;
    setSending(true);

    try {
      // 1. Create real Cal.com video call booking / Cal Video room
      const booking = await CalComService.createInstantCallBooking({
        hostName: currentUser.fullName || 'Farmer',
        hostEmail: currentUser.email,
        clientName: otherUserName,
        productTitle: productTitle || convMeta?.productTitle,
      });

      const meetingUrl = booking.meetingUrl;

      // 2. Send invitation in conversation screen so client can tap and join
      const callInvitation: FirestoreCallInvitation = {
        callId: booking.calBookingUid || `call_${Date.now()}`,
        meetingUrl,
        hostName: currentUser.fullName || 'You',
        hostAvatar: currentUser.avatarUrl,
        mode: 'video',
        type: 'instant',
        status: 'active',
        provider: 'cal.com',
      };

      await FirestoreChatService.sendMessage({
        conversationId,
        currentUser,
        text: `📹 Video call started via Cal.com! Tap 'Join Video Call' below to enter the meeting.`,
        callInvitation,
      });

      // 3. Navigate host to the video meeting room
      try {
        await Linking.openURL(meetingUrl);
      } catch {
        Alert.alert('Video Call', `Call link: ${meetingUrl}`);
      }

      // 4. Keep parent flow synced
      if (onStartVideoCall) {
        onStartVideoCall(participantName, participantAvatar);
      }
    } catch (err: any) {
      console.warn('[Chat] Failed to initiate video call:', err);
      Alert.alert('Video Call Error', err?.message || 'Could not initiate video call.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenMeetingUrl = async (meetingUrl: string) => {
    if (!meetingUrl) return;
    try {
      await Linking.openURL(meetingUrl);
    } catch {
      Alert.alert('Video Meeting', `Open in your browser:\n${meetingUrl}`);
    }
  };

  const handleShareMeetingUrl = async (meetingUrl: string) => {
    if (!meetingUrl) return;
    try {
      await Share.share({
        message: `Join my live video call on Famora: ${meetingUrl}`,
        url: meetingUrl,
      });
    } catch {}
  };

  const handleLocalInspectionScheduled = async (details: {
    date: string;
    time: string;
    note: string;
    meetingUrl: string;
    calBookingUid?: string;
    inspectionFocus: string[];
  }) => {
    setShowLocalScheduleModal(false);
    if (!currentUser) return;

    const callInvitation: FirestoreCallInvitation = {
      callId: details.calBookingUid || `sched_${Date.now()}`,
      meetingUrl: details.meetingUrl,
      hostName: currentUser.fullName || 'You',
      hostAvatar: currentUser.avatarUrl,
      mode: 'video',
      type: 'scheduled',
      status: 'scheduled',
      scheduledDate: details.date,
      scheduledTime: details.time,
      provider: 'cal.com',
      calBookingUid: details.calBookingUid,
      notes: details.note,
      inspectionFocus: details.inspectionFocus,
    };

    await FirestoreChatService.sendMessage({
      conversationId,
      currentUser,
      text: `📅 Scheduled a live video inspection for ${details.date} at ${details.time} via Cal.com.`,
      callInvitation,
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const myId = currentUser?.id || currentUser?._id || '';
  const fmtTimer = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const actualOtherUserId =
    otherUserId ||
    (convMeta?.participants?.find((p) => p !== myId) || '');
  const participantAvatar =
    liveOtherAvatar ||
    (actualOtherUserId && convMeta?.participantAvatars?.[actualOtherUserId]) ||
    otherUserAvatar ||
    '';
  const participantName =
    (actualOtherUserId && convMeta?.participantNames?.[actualOtherUserId]) ||
    otherUserName ||
    'User';
  const participantRole =
    (actualOtherUserId && convMeta?.participantRoles?.[actualOtherUserId]) ||
    otherUserRole ||
    'farmer';
  const pinnedProduct = productTitle || convMeta?.productTitle;
  const pinnedImage = productImage || convMeta?.productImage;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.headerParticipant}>
          <View style={styles.avatarWrap}>
            {participantAvatar ? (
              <Image source={{ uri: participantAvatar }} style={styles.headerAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                  {participantName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerName} numberOfLines={1}>{participantName}</Text>
            <Text style={styles.headerSub}>
              {otherUserRole === 'farmer' ? '🌾 Verified Farmer' : '🛒 Buyer'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerIconBtn} onPress={() => onStartAudioCall(participantName, participantAvatar)}>
            <Text style={{ fontSize: 17 }}>📞</Text>
          </Pressable>
          <Pressable style={styles.headerIconBtn} onPress={handleInitiateVideoCall}>
            <Text style={{ fontSize: 17 }}>📹</Text>
          </Pressable>
          {onRateUser && otherUserId && (
            <Pressable style={styles.headerIconBtn} onPress={() => onRateUser(otherUserId, participantName, participantAvatar, otherUserRole)}>
              <Text style={{ fontSize: 17 }}>⭐</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Pinned product bar ──────────────────────────────────────────────── */}
      {pinnedProduct && (
        <View style={styles.pinnedBar}>
          {pinnedImage && (
            <Image source={{ uri: pinnedImage }} style={styles.pinnedThumb} contentFit="cover" />
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.pinnedTitle} numberOfLines={1}>{pinnedProduct}</Text>
            <Text style={styles.pinnedSub}>Direct Farm Price • Grade A</Text>
          </View>
          <Pressable style={styles.offerPillBtn} onPress={() => setShowOfferModal(true)}>
            <Text style={styles.offerPillText}>Make Offer</Text>
          </Pressable>
        </View>
      )}

      {/* ── Quick prompts ───────────────────────────────────────────────────── */}
      <View style={styles.promptsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsContent}>
          {[
            { label: '🌾 Available this week?', text: 'Is this harvest available for pickup this week?' },
            { label: '💰 Bulk discount?', text: 'Can you give a bulk discount for orders over 100 kg?' },
            { label: '📜 Certifications?', text: 'What certifications do you hold for this produce?' },
            { label: '🚚 Delivery available?', text: 'Do you offer delivery to Colombo?' },
          ].map((p) => (
            <Pressable key={p.label} style={styles.promptPill} onPress={() => handleSendText(p.text)}>
              <Text style={styles.promptPillText}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>

        {messages.length === 0 ? (
          <View style={styles.emptyChatBox}>
            <Text style={{ fontSize: 40 }}>💬</Text>
            <Text style={styles.emptyChatTitle}>Start the conversation</Text>
            <Text style={styles.emptyChatSub}>Say hello or make a price offer to begin!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMe = item.senderId === myId;
              const isPlayingThis = playingMsgId === item.id;

              return (
                <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                  {!isMe && (
                    participantAvatar ? (
                      <Image source={{ uri: participantAvatar }} style={styles.msgAvatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.msgAvatar, styles.avatarPlaceholder]}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                          {participantName.charAt(0)}
                        </Text>
                      </View>
                    )
                  )}

                  <Pressable
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                      item.isDeleted && (isMe ? styles.bubbleMeDeleted : styles.bubbleThemDeleted),
                    ]}
                    onLongPress={() => handleLongPressMessage(item)}
                    delayLongPress={350}
                  >
                    {item.isDeleted ? (
                      <View style={styles.deletedContainer}>
                        <Text style={[styles.deletedMsgText, isMe ? styles.deletedMsgTextMe : styles.deletedMsgTextThem]}>
                          🚫 This message was deleted
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* Photo */}
                        {item.imageUri && item.imageUri !== '📷 Photo' && (
                          <View style={styles.imgWrap}>
                            <Image source={{ uri: item.imageUri }} style={styles.imgAttach} contentFit="cover" />
                          </View>
                        )}

                        {/* Voice note */}
                        {item.isVoiceNote && (
                          <Pressable style={styles.voiceRow} onPress={() => handlePlayVoice(item)}>
                            <View style={[styles.playCircle, isMe && styles.playCircleMe]}>
                              {isPlayingThis ? (
                                <View style={styles.pauseIcon}>
                                  <View style={styles.pauseBar} />
                                  <View style={styles.pauseBar} />
                                </View>
                              ) : (
                                <Text style={{ fontSize: 11, color: '#FFF' }}>▶</Text>
                              )}
                            </View>
                            <View style={styles.waveWrap}>
                              {(item.voiceWaveform || Array(15).fill(14)).map((h: number, i: number) => (
                                <Animated.View
                                  key={i}
                                  style={[
                                    styles.wavebar,
                                    {
                                      height: isPlayingThis ? h * (0.5 + Math.random() * 0.5) : h,
                                      backgroundColor: isMe
                                        ? (isPlayingThis ? '#A7F3D0' : 'rgba(255,255,255,0.8)')
                                        : (isPlayingThis ? '#1E5E3A' : '#64748B'),
                                    },
                                  ]}
                                />
                              ))}
                            </View>
                            <Text style={[styles.voiceDur, isMe ? { color: '#DCFCE7' } : { color: '#64748B' }]}>
                              {item.voiceDuration || '0:00'}
                            </Text>
                          </Pressable>
                        )}

                        {/* Text */}
                        {!item.isVoiceNote && !item.offer && !item.callInvitation && item.text && (
                          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
                            {item.text}
                          </Text>
                        )}

                        {/* Call Invitation card */}
                        {item.callInvitation && (
                          <View style={styles.callCard}>
                            <View style={styles.callHeader}>
                              <View style={styles.callHeaderBadgeRow}>
                                <View
                                  style={[
                                    styles.callStatusDot,
                                    item.callInvitation.type === 'instant' ? styles.callDotLive : styles.callDotScheduled,
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.callBadgeText,
                                    item.callInvitation.type === 'instant' ? styles.callBadgeTextLive : styles.callBadgeTextScheduled,
                                  ]}>
                                  {item.callInvitation.type === 'instant' ? 'LIVE CAL.COM VIDEO' : 'CAL.COM INSPECTION'}
                                </Text>
                              </View>
                              <Text style={styles.callProviderTag}>
                                {item.callInvitation.provider === 'cal.com' ? '⚡ Cal.com' : '⚡ Google Video'}
                              </Text>
                            </View>

                            <Text style={styles.callTitle}>
                              {item.callInvitation.type === 'instant'
                                ? `Video Call Invitation from ${item.senderName}`
                                : `Live Farm Inspection Scheduled`}
                            </Text>

                            {item.callInvitation.type === 'scheduled' && (
                              <View style={styles.callScheduleInfoBox}>
                                <Text style={styles.callScheduleTime}>
                                  🗓️ {item.callInvitation.scheduledDate} at {item.callInvitation.scheduledTime}
                                </Text>
                                {item.callInvitation.inspectionFocus && item.callInvitation.inspectionFocus.length > 0 && (
                                  <Text style={styles.callScheduleFocus} numberOfLines={2}>
                                    🎯 Focus: {item.callInvitation.inspectionFocus.join(', ')}
                                  </Text>
                                )}
                              </View>
                            )}

                            {item.callInvitation.notes ? (
                              <Text style={styles.callNotesText} numberOfLines={2}>
                                💬 "{item.callInvitation.notes}"
                              </Text>
                            ) : null}

                            {/* Main CTA: Join Video Call */}
                            <Pressable
                              style={styles.joinCallBtn}
                              onPress={() => handleOpenMeetingUrl(item.callInvitation?.meetingUrl || '')}>
                              <Text style={{ fontSize: 16 }}>📹</Text>
                              <Text style={styles.joinCallBtnText}>
                                {item.callInvitation.type === 'instant' ? 'Join Video Call Now' : 'Open Video Room'}
                              </Text>
                            </Pressable>

                            {/* Meeting URL & Share Link */}
                            <View style={styles.callUrlRow}>
                              <Text style={styles.callUrlText} numberOfLines={1}>
                                {item.callInvitation.meetingUrl}
                              </Text>
                              <Pressable
                                style={styles.copyLinkBtn}
                                onPress={() => handleShareMeetingUrl(item.callInvitation?.meetingUrl || '')}>
                                <Text style={styles.copyLinkBtnText}>Share</Text>
                              </Pressable>
                            </View>
                          </View>
                        )}

                        {/* Offer card */}
                        {item.offer && (
                          <View style={styles.offerCard}>
                            <View style={styles.offerHeader}>
                              <Text style={{ fontSize: 20 }}>🤝</Text>
                              <Text style={styles.offerCardTitle}>Price Offer Proposal</Text>
                            </View>
                            <Text style={styles.offerProduct}>{item.offer.productTitle}</Text>
                            {item.text ? <Text style={styles.offerNote}>{item.text}</Text> : null}
                            <View style={styles.offerRow}>
                              <View style={styles.offerChip}>
                                <Text style={styles.offerChipLabel}>Quantity</Text>
                                <Text style={styles.offerChipVal}>{item.offer.quantity} {item.offer.unit}</Text>
                              </View>
                              <View style={styles.offerChip}>
                                <Text style={styles.offerChipLabel}>Rate</Text>
                                <Text style={styles.offerChipVal}>Rs. {item.offer.pricePerUnit}/{item.offer.unit}</Text>
                              </View>
                            </View>
                            <View style={styles.offerTotalRow}>
                              <Text style={styles.offerTotalLabel}>Total:</Text>
                              <Text style={styles.offerTotalVal}>Rs. {item.offer.totalAmount.toLocaleString()}</Text>
                            </View>

                            {item.offer.status === 'pending' ? (
                              !isMe ? (
                                <View style={styles.offerBtns}>
                                  <Pressable style={styles.offerAcceptBtn} onPress={() => handleAcceptOffer(item.id)}>
                                    <Text style={styles.offerAcceptTxt}>✓ Accept</Text>
                                  </Pressable>
                                  <Pressable style={styles.offerDeclineBtn} onPress={() => handleDeclineOffer(item.id)}>
                                    <Text style={styles.offerDeclineTxt}>✕ Decline</Text>
                                  </Pressable>
                                  <Pressable style={styles.offerCounterBtn} onPress={() => setShowOfferModal(true)}>
                                    <Text style={styles.offerCounterTxt}>Counter</Text>
                                  </Pressable>
                                </View>
                              ) : (
                                <View style={styles.offerPendingBox}>
                                  <Text style={styles.offerPendingTxt}>⏳ Awaiting response...</Text>
                                </View>
                              )
                            ) : (
                              <View style={[styles.offerStatusBox,
                                item.offer.status === 'accepted' ? styles.offerStatusAccepted : styles.offerStatusDeclined]}>
                                <Text style={styles.offerStatusTxt}>
                                  {item.offer.status === 'accepted' ? '✓ Offer Accepted' : '✕ Offer Declined'}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </>
                    )}

                    {/* Timestamp & Edited badge */}
                    <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeThem, item.isDeleted && styles.msgTimeDeleted]}>
                      {item.timestamp}{item.isEdited && !item.isDeleted ? ' • Edited' : ''}{isMe ? '  ✓✓' : ''}
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        {/* ── Voice recording bar ─────────────────────────────────────────── */}
        {isRecording ? (
          <View style={[styles.recordBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8) }]}>
            <Pressable style={styles.cancelRecordBtn} onPress={() => stopRecording(false)}>
              <Text style={styles.cancelRecordTxt}>✕ Cancel</Text>
            </Pressable>
            <View style={styles.recordCenter}>
              <Animated.View style={[styles.recordDot, { transform: [{ scale: micPulse }] }]} />
              <Text style={styles.recordTimer}>{fmtTimer(recordSeconds)}</Text>
              <Text style={styles.recordHint}>Recording...</Text>
            </View>
            <Pressable style={styles.sendRecordBtn} onPress={() => stopRecording(true)}>
              <Text style={styles.sendRecordTxt}>Send ➤</Text>
            </Pressable>
          </View>
        ) : (
          /* ── Input bar ─────────────────────────────────────────────────── */
          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8) }]}>
            <Pressable style={styles.inputIconBtn} onPress={() => setShowActionSheet(true)}>
              <Text style={{ fontSize: 20, color: '#1E5E3A', fontWeight: '800' }}>+</Text>
            </Pressable>
            <Pressable style={styles.inputIconBtn} onPress={() => handleSendPhoto('camera')}>
              <Text style={{ fontSize: 18 }}>📷</Text>
            </Pressable>

            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            {sending ? (
              <ActivityIndicator size="small" color="#1E5E3A" style={{ width: 38 }} />
            ) : inputText.trim().length > 0 ? (
              <Pressable style={styles.sendBtn} onPress={() => handleSendText()}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 2L11 13" />
                  <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </Svg>
              </Pressable>
            ) : (
              <Pressable style={styles.micBtn} onPress={handleStartRecording}>
                <Text style={{ fontSize: 18 }}>🎙️</Text>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Action Sheet ────────────────────────────────────────────────────── */}
      <Modal visible={showActionSheet} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowActionSheet(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Share & Negotiate</Text>

            {[
              { icon: '📹', title: 'Start Instant Video Call', sub: 'Launch live HD room & send invitation to client', action: () => { setShowActionSheet(false); handleInitiateVideoCall(); } },
              { icon: '🌐', title: 'Open Google Meet', sub: 'Create new meeting on meet.google.com', action: () => { setShowActionSheet(false); Linking.openURL('https://meet.google.com/new'); } },
              { icon: '📅', title: 'Schedule Video Call (Cal.com)', sub: 'Book live farm inspection via Cal.com scheduler', action: () => { setShowActionSheet(false); onRequestInspection ? onRequestInspection() : setShowLocalScheduleModal(true); } },
              { icon: '💰', title: 'Make Price Offer', sub: 'Negotiate direct bulk farm gate price', action: () => { setShowActionSheet(false); setShowOfferModal(true); } },
              { icon: '🎙️', title: 'Attach Audio / Voice Note', sub: 'Send audio note file from device', action: () => { setShowActionSheet(false); handlePickAndSendAudio(); } },
              { icon: '🖼️', title: 'Send Photo from Gallery', sub: 'Attach produce photos', action: () => handleSendPhoto('gallery') },
              { icon: '📍', title: 'Share Farm Location', sub: 'Send coordinates for collection', action: () => { setShowActionSheet(false); handleSendText('📍 Shared Location: Please check my farm coordinates on the map.'); } },
            ].map((item) => (
              <Pressable key={item.title} style={styles.sheetItem} onPress={item.action}>
                <Text style={styles.sheetIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetItemTitle}>{item.title}</Text>
                  <Text style={styles.sheetItemSub}>{item.sub}</Text>
                </View>
              </Pressable>
            ))}

            <Pressable style={styles.sheetCancel} onPress={() => setShowActionSheet(false)}>
              <Text style={styles.sheetCancelTxt}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Offer Modal ──────────────────────────────────────────────────────── */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowOfferModal(false)}>
          <View style={styles.offerModal}>
            <View style={styles.offerModalHeader}>
              <Text style={styles.offerModalTitle}>Negotiate Price Offer</Text>
              <Pressable onPress={() => setShowOfferModal(false)} hitSlop={8}>
                <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.offerModalSub}>
              Propose a custom volume and unit rate directly to {participantName}.
            </Text>

            <View style={styles.offerInputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Quantity (kg)</Text>
                <TextInput style={styles.offerInput} keyboardType="numeric" value={offerQty} onChangeText={setOfferQty} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Price / kg (LKR)</Text>
                <TextInput style={styles.offerInput} keyboardType="numeric" value={offerPrice} onChangeText={setOfferPrice} />
              </View>
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>
                Rs. {((parseFloat(offerQty) || 0) * (parseFloat(offerPrice) || 0)).toLocaleString()}
              </Text>
            </View>

            <Pressable style={styles.submitBtn} onPress={handleSendOffer} disabled={sending}>
              {sending
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.submitBtnTxt}>Send Offer 🤝</Text>
              }
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Message Options Modal (Edit / Delete) ─────────────────────────── */}
      <Modal visible={!!selectedMsgForAction} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setSelectedMsgForAction(null)}>
          <View style={styles.msgActionModal}>
            <View style={styles.msgActionHeader}>
              <Text style={styles.msgActionTitle}>Message Options</Text>
              <Pressable onPress={() => setSelectedMsgForAction(null)} hitSlop={8}>
                <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
              </Pressable>
            </View>

            {selectedMsgForAction?.text && !selectedMsgForAction.isVoiceNote && !selectedMsgForAction.offer && (
              <View style={styles.msgActionPreview}>
                <Text style={styles.msgActionPreviewTxt} numberOfLines={2}>
                  "{selectedMsgForAction.text}"
                </Text>
              </View>
            )}

            {!selectedMsgForAction?.isVoiceNote && !selectedMsgForAction?.offer && (
              <Pressable style={styles.msgActionBtn} onPress={handleTriggerEdit}>
                <Text style={{ fontSize: 20 }}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.msgActionBtnTxt}>Update Message</Text>
                  <Text style={styles.msgActionBtnSub}>Edit text (valid within 24 hours)</Text>
                </View>
              </Pressable>
            )}

            <Pressable style={styles.msgActionBtn} onPress={handleTriggerDelete}>
              <Text style={{ fontSize: 20 }}>🗑️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.msgActionBtnTxt, { color: '#EF4444' }]}>Delete Message</Text>
                <Text style={styles.msgActionBtnSub}>Remove message for both parties</Text>
              </View>
            </Pressable>

            <Pressable style={styles.sheetCancel} onPress={() => setSelectedMsgForAction(null)}>
              <Text style={styles.sheetCancelTxt}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Edit Message Modal ──────────────────────────────────────────────── */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.editCard}>
            <View style={styles.editCardHeader}>
              <Text style={styles.editCardTitle}>✏️ Update Message</Text>
              <Pressable onPress={() => setEditModalVisible(false)} hitSlop={8}>
                <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.editCardSub}>
              Edit your message text. Note: Messages can only be edited within 24 hours of sending.
            </Text>

            <TextInput
              style={styles.editInput}
              value={editingText}
              onChangeText={setEditingText}
              multiline
              autoFocus
              placeholder="Enter updated message..."
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.editBtnRow}>
              <Pressable style={styles.editCancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.editCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.editSaveBtn, (!editingText.trim() || updatingMsg) && { opacity: 0.5 }]}
                disabled={!editingText.trim() || updatingMsg}
                onPress={handleSaveEditedMessage}
              >
                {updatingMsg ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.editSaveText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Schedule Live Inspection Modal (Cal.com) ─────────────────────────── */}
      <ScheduleInspectionModal
        visible={showLocalScheduleModal}
        farmerName={participantName}
        farmerEmail={currentUser?.accountType === 'farmer' ? currentUser.email : ''}
        buyerName={currentUser?.accountType === 'buyer' ? currentUser.fullName : participantName}
        buyerEmail={currentUser?.accountType === 'buyer' ? currentUser.email : ''}
        productTitle={pinnedProduct}
        onClose={() => setShowLocalScheduleModal(false)}
        onScheduled={handleLocalInspectionScheduled}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 6, marginRight: 4 },
  headerParticipant: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  avatarPlaceholder: { backgroundColor: '#1E5E3A', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#166534', fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },

  // Pinned bar
  pinnedBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#DCFCE7',
  },
  pinnedThumb: { width: 36, height: 36, borderRadius: 8 },
  pinnedTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  pinnedSub: { fontSize: 11, color: '#64748B' },
  offerPillBtn: { backgroundColor: '#1E5E3A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  offerPillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Quick prompts
  promptsWrap: { backgroundColor: '#FFFFFF', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  promptsContent: { paddingHorizontal: 12, gap: 8 },
  promptPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  promptPillText: { fontSize: 11, color: '#334155', fontWeight: '600' },

  // Empty state
  emptyChatBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyChatTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptyChatSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 },

  // Messages
  msgList: { paddingHorizontal: 14, paddingVertical: 12 },
  msgRow: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 6, marginBottom: 4 },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMe: { backgroundColor: '#1E5E3A', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMe: { color: '#FFFFFF' },
  msgTextThem: { color: '#0F172A' },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: '#DCFCE7' },
  msgTimeThem: { color: '#94A3B8' },

  // Image
  imgWrap: { width: 200, height: 150, borderRadius: 12, overflow: 'hidden', marginBottom: 6 },
  imgAttach: { width: '100%', height: '100%' },

  // Voice note
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minWidth: 160 },
  playCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(100,116,139,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  playCircleMe: { backgroundColor: 'rgba(255,255,255,0.25)' },
  pauseIcon: { flexDirection: 'row', gap: 3 },
  pauseBar: { width: 3, height: 12, backgroundColor: '#FFFFFF', borderRadius: 2 },
  waveWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  wavebar: { width: 3, borderRadius: 2 },
  voiceDur: { fontSize: 11, fontWeight: '600' },

  // Offer card
  offerCard: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 12, marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 230,
  },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  offerCardTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  offerProduct: { fontSize: 12, color: '#1E5E3A', fontWeight: '700', marginBottom: 4 },
  offerNote: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  offerRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  offerChip: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 8 },
  offerChipLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  offerChipVal: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  offerTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0', marginBottom: 10 },
  offerTotalLabel: { fontSize: 12, color: '#64748B' },
  offerTotalVal: { fontSize: 16, fontWeight: '800', color: '#1E5E3A' },
  offerBtns: { flexDirection: 'row', gap: 6 },
  offerAcceptBtn: { flex: 1, backgroundColor: '#1E5E3A', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  offerAcceptTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  offerDeclineBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  offerDeclineTxt: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },
  offerCounterBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  offerCounterTxt: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  offerPendingBox: { backgroundColor: '#FFF7ED', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  offerPendingTxt: { color: '#C2410C', fontSize: 11, fontWeight: '600' },
  offerStatusBox: { borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  offerStatusAccepted: { backgroundColor: '#DCFCE7' },
  offerStatusDeclined: { backgroundColor: '#FEE2E2' },
  offerStatusTxt: { fontSize: 12, fontWeight: '700', color: '#0F172A' },

  // Recording bar
  recordBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  cancelRecordBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelRecordTxt: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  recordCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  recordDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444' },
  recordTimer: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  recordHint: { fontSize: 11, color: '#64748B' },
  sendRecordBtn: { backgroundColor: '#1E5E3A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  sendRecordTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingVertical: 8,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 6,
  },
  inputIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  textInput: {
    flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 14, color: '#0F172A', maxHeight: 100,
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1E5E3A', alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },

  // Action sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 14 },
  sheetIcon: { fontSize: 24 },
  sheetItemTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  sheetItemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sheetCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  sheetCancelTxt: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },

  // Offer modal
  offerModal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  offerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  offerModalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  offerModalSub: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 18 },
  offerInputRow: { flexDirection: 'row', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  offerInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 16, fontWeight: '700', color: '#0F172A',
  },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginBottom: 16 },
  totalLabel: { fontSize: 13, color: '#166534', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#1E5E3A' },
  submitBtn: { backgroundColor: '#1E5E3A', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  // Deleted message bubble styles
  bubbleMeDeleted: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  bubbleThemDeleted: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  deletedContainer: { paddingVertical: 2, paddingHorizontal: 2 },
  deletedMsgText: { fontSize: 13, fontStyle: 'italic' },
  deletedMsgTextMe: { color: '#64748B' },
  deletedMsgTextThem: { color: '#64748B' },
  msgTimeDeleted: { color: '#94A3B8' },

  // Message action modal
  msgActionModal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  msgActionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  msgActionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  msgActionPreview: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  msgActionPreviewTxt: { fontSize: 13, color: '#334155', fontStyle: 'italic' },
  msgActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 14 },
  msgActionBtnTxt: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  msgActionBtnSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Edit card modal
  editCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  editCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  editCardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  editCardSub: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  editInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: 12, padding: 12, fontSize: 14, color: '#0F172A',
    minHeight: 80, maxHeight: 150, textAlignVertical: 'top', marginBottom: 14,
  },
  editBtnRow: { flexDirection: 'row', gap: 10 },
  editCancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  editCancelText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  editSaveBtn: { flex: 1, backgroundColor: '#1E5E3A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  editSaveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Call Invitation Card
  callCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    minWidth: 240,
    maxWidth: 290,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 2,
    marginBottom: 4,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  callHeaderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  callDotLive: {
    backgroundColor: '#EF4444',
  },
  callDotScheduled: {
    backgroundColor: '#4F46E5',
  },
  callBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  callBadgeTextLive: {
    color: '#DC2626',
  },
  callBadgeTextScheduled: {
    color: '#4F46E5',
  },
  callProviderTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  callTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  callScheduleInfoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  callScheduleTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  callScheduleFocus: {
    fontSize: 11,
    color: '#4338CA',
    marginTop: 2,
  },
  callNotesText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  joinCallBtn: {
    backgroundColor: '#1E5E3A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  joinCallBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  callUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  callUrlText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    marginRight: 6,
  },
  copyLinkBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyLinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
