/**
 * firestore-chat-service.ts
 *
 * Real-time chat using Firebase Firestore + Firebase Storage & base64 audio fallback.
 *
 * Firestore structure:
 *   conversations/{conversationId}                      – ConversationDoc
 *   conversations/{conversationId}/messages/{messageId} – MessageDoc
 *   users/{userId}                                      – User platform directory doc
 *
 * A conversation ID is deterministic:
 *   sortedJoin([userId1, userId2])  →  "abc_xyz"
 *
 * Voice notes:
 *   - Encoded as base64 using expo-file-system (instant sync across devices)
 *   - Uploaded to Firebase Storage as primary/secondary audio URL
 *   - Both sender and receiver can play the audio smoothly.
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocFromCache,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, storage } from '@/config/firebase';
import { getStoredUser, ApiUser, fetchProduceListings } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FirestoreMessage {
  id: string;
  senderId: string;           // Firebase UID / MongoDB user id
  senderName: string;
  senderRole: 'farmer' | 'buyer';
  text: string;
  timestamp: string;          // ISO string or formatted time
  rawTimestamp?: string | null; // ISO string for 24-hour edit calculation
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  imageUri?: string;          // base64 data URL or https download URL
  isVoiceNote?: boolean;
  voiceDuration?: string;     // "0:18"
  voiceWaveform?: number[];
  voiceUrl?: string;          // Firebase Storage download URL for playback
  voiceBase64?: string;       // Base64 audio string (guarantees playback across devices)
  offer?: FirestoreOffer;
}

export interface FirestoreOffer {
  id: string;
  productTitle: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  counterBy?: 'buyer' | 'farmer';
}

export interface FirestoreConversation {
  id: string;
  participants: string[];            // [userId1, userId2] (MongoDB IDs)
  participantNames: Record<string, string>;   // {userId: displayName}
  participantAvatars: Record<string, string>; // {userId: avatarUrl}
  participantRoles: Record<string, 'farmer' | 'buyer'>;
  productTitle?: string;
  productImage?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCounts: Record<string, number>; // {userId: count}
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUserDirectoryItem {
  id: string;
  fullName: string;
  role: 'farmer' | 'buyer';
  avatarUrl: string;
  district?: string;
  subtitle?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Stable conversation ID from two user IDs */
export function makeConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

function waveformFromDuration(durationSecs: number): number[] {
  const count = Math.max(10, Math.min(30, durationSecs * 2));
  return Array.from({ length: count }, () => 8 + Math.floor(Math.random() * 24));
}

function tsToString(ts: any): string {
  if (!ts) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (typeof ts === 'string') return ts;
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── FirestoreChatService ─────────────────────────────────────────────────────

export const FirestoreChatService = {

  /** Get the currently logged-in user from AsyncStorage */
  async getCurrentUser(): Promise<ApiUser | null> {
    return getStoredUser();
  },

  /** Sync active user profile to Firestore directory for discovery */
  async syncUserToFirestore(user: ApiUser): Promise<void> {
    const uid = user.id || user._id;
    if (!uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          id: uid,
          fullName: user.fullName || 'User',
          accountType: user.accountType === 'farmer' ? 'farmer' : 'buyer',
          avatarUrl: user.avatarUrl || '',
          district: user.district || '',
          mobileNumber: user.mobileNumber || '',
          farmName: user.farmDetails?.farmName || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Firestore] syncUserToFirestore error:', err);
    }
  },

  /**
   * Fetch real platform users (farmers or buyers) from Firestore users directory
   * combined with active MongoDB produce listings.
   */
  async fetchPlatformUsers(roleToFetch?: 'farmer' | 'buyer', currentUserId?: string): Promise<PlatformUserDirectoryItem[]> {
    const results: Map<string, PlatformUserDirectoryItem> = new Map();

    // 1. Fetch from Firestore users collection
    try {
      const usersRef = collection(db, 'users');
      const q = roleToFetch
        ? query(usersRef, where('accountType', '==', roleToFetch))
        : query(usersRef);
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const u = d.data();
        if (currentUserId && d.id === currentUserId) return;
        results.set(d.id, {
          id: d.id,
          fullName: u.fullName || 'User',
          role: u.accountType || 'farmer',
          avatarUrl: u.avatarUrl || '',
          district: u.district || '',
          subtitle: u.farmName ? `🌾 ${u.farmName}` : (u.district ? `📍 ${u.district}` : ''),
        });
      });
    } catch (err) {
      console.warn('[Firestore] fetchPlatformUsers firestore query failed:', err);
    }

    // 2. Also populate farmers from active produce listings (real MongoDB farmers)
    if (!roleToFetch || roleToFetch === 'farmer') {
      try {
        const produceList = await fetchProduceListings();
        produceList.forEach((item) => {
          if (item.farmerId && (!currentUserId || item.farmerId !== currentUserId)) {
            if (!results.has(item.farmerId)) {
              results.set(item.farmerId, {
                id: item.farmerId,
                fullName: item.farmerName || 'Farmer',
                role: 'farmer',
                avatarUrl: item.farmerAvatar || '',
                district: item.locationDistrict || '',
                subtitle: `🌾 Supplies ${item.title} (${item.locationDistrict || 'Local Farm'})`,
              });
            }
          }
        });
      } catch (e) {
        console.warn('[Firestore] fetchProduceListings for users failed:', e);
      }
    }

    return Array.from(results.values());
  },

  // ── Conversations ──────────────────────────────────────────────────────────

  /**
   * Get or create a conversation between two users.
   * Returns the stable conversation ID.
   */
  async getOrCreateConversation(params: {
    currentUser: ApiUser;
    otherUserId: string;
    otherUserName: string;
    otherUserRole: 'farmer' | 'buyer';
    otherUserAvatar?: string;
    productTitle?: string;
    productImage?: string;
  }): Promise<string> {
    const myId = params.currentUser.id || params.currentUser._id || '';
    if (!myId || !params.otherUserId) {
      throw new Error('Both currentUser ID and otherUserId are required to start a chat.');
    }

    const convId = makeConversationId(myId, params.otherUserId);
    const convRef = doc(db, 'conversations', convId);

    const myRole = params.currentUser.accountType === 'farmer' ? 'farmer' : 'buyer';
    const myName = params.currentUser.fullName || 'You';
    const myAvatar = params.currentUser.avatarUrl || '';

    let docExists = false;
    try {
      const cacheSnap = await getDocFromCache(convRef).catch(() => null);
      if (cacheSnap && cacheSnap.exists()) {
        docExists = true;
      } else {
        const snap = await getDoc(convRef);
        docExists = snap.exists();
      }
    } catch {
      // Offline / network establishing: continue gracefully without logging warnings
      docExists = false;
    }

    if (!docExists) {
      const now = new Date().toISOString();
      const convData: Omit<FirestoreConversation, 'id'> = {
        participants: [myId, params.otherUserId].sort(),
        participantNames: {
          [myId]: myName,
          [params.otherUserId]: params.otherUserName || 'User',
        },
        participantAvatars: {
          [myId]: myAvatar,
          [params.otherUserId]: params.otherUserAvatar || '',
        },
        participantRoles: {
          [myId]: myRole,
          [params.otherUserId]: params.otherUserRole,
        },
        productTitle: params.productTitle || '',
        productImage: params.productImage || '',
        lastMessage: 'Chat opened',
        lastMessageTime: now,
        unreadCounts: {
          [myId]: 0,
          [params.otherUserId]: 0,
        },
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(convRef, convData, { merge: true });
    } else {
      const updates: any = {
        updatedAt: new Date().toISOString(),
      };
      if (params.productTitle) updates.productTitle = params.productTitle;
      if (params.productImage) updates.productImage = params.productImage;
      if (params.otherUserName) updates[`participantNames.${params.otherUserId}`] = params.otherUserName;
      if (params.otherUserAvatar) updates[`participantAvatars.${params.otherUserId}`] = params.otherUserAvatar;
      await setDoc(convRef, updates, { merge: true });
    }

    return convId;
  },

  /** Cache conversations locally for instant 0ms mount */
  async cacheConversations(userId: string, convs: FirestoreConversation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`@famora_convs_cache_v2_${userId}`, JSON.stringify(convs));
    } catch {}
  },

  /** Get cached conversations */
  async getCachedConversations(userId: string): Promise<FirestoreConversation[]> {
    try {
      const raw = await AsyncStorage.getItem(`@famora_convs_cache_v2_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** Cache messages locally for instant conversation open */
  async cacheMessages(conversationId: string, messages: FirestoreMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`@famora_msgs_cache_v2_${conversationId}`, JSON.stringify(messages));
    } catch {}
  },

  /** Get cached messages */
  async getCachedMessages(conversationId: string): Promise<FirestoreMessage[]> {
    try {
      const raw = await AsyncStorage.getItem(`@famora_msgs_cache_v2_${conversationId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Listen to all conversations the user is in.
   * Accepts a single userId or array of user IDs (e.g. mongo id + custom id).
   * Note: We avoid combining array-contains with orderBy('updatedAt') directly in the Firestore query
   * because that requires a composite index. Sorting in JS guarantees instant delivery without index errors.
   */
  listenToConversations(
    userIdOrIds: string | string[],
    onUpdate: (convs: FirestoreConversation[]) => void
  ): () => void {
    const rawIds = Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds];
    const ids = Array.from(new Set(rawIds.filter(Boolean)));
    if (ids.length === 0) {
      onUpdate([]);
      return () => {};
    }

    const unsubs: (() => void)[] = [];
    const convMap = new Map<string, FirestoreConversation>();

    const emitSorted = () => {
      const convs = Array.from(convMap.values());
      convs.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.lastMessageTime || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.lastMessageTime || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      // Cache conversations locally
      if (ids[0]) {
        FirestoreChatService.cacheConversations(ids[0], convs);
      }
      onUpdate(convs);
    };

    ids.forEach((uid) => {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', uid)
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          snap.docs.forEach((d) => {
            convMap.set(d.id, {
              id: d.id,
              ...(d.data() as Omit<FirestoreConversation, 'id'>),
            });
          });
          emitSorted();
        },
        (error) => {
          console.error(`[Firestore] listenToConversations snapshot error for uid ${uid}:`, error);
        }
      );
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  },

  /**
   * Listen to messages in a conversation in real-time.
   * Avoids dropping messages with missing/pending timestamps by ordering in JS.
   */
  listenToMessages(
    conversationId: string,
    onUpdate: (messages: FirestoreMessage[]) => void
  ): () => void {
    const msgsRef = collection(db, 'conversations', conversationId, 'messages');

    return onSnapshot(
      msgsRef,
      (snap) => {
        const msgs: FirestoreMessage[] = snap.docs.map((d) => {
          const data = d.data();
          const raw =
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate().toISOString()
              : data.createdAt ||
                (typeof data.timestamp === 'string' ? data.timestamp : null);

          return {
            id: d.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            text: data.text || '',
            timestamp: tsToString(data.timestamp) || tsToString(data.createdAt) || 'Just now',
            rawTimestamp: raw,
            isRead: data.isRead ?? false,
            isEdited: data.isEdited ?? false,
            editedAt: data.editedAt,
            isDeleted: data.isDeleted ?? false,
            deletedAt: data.deletedAt,
            imageUri: data.imageUri,
            isVoiceNote: data.isVoiceNote,
            voiceDuration: data.voiceDuration,
            voiceWaveform: data.voiceWaveform,
            voiceUrl: data.voiceUrl,
            voiceBase64: data.voiceBase64,
            offer: data.offer,
          } as FirestoreMessage;
        });

        const getSortTime = (m: FirestoreMessage) => {
          if (m.rawTimestamp) {
            const t = new Date(m.rawTimestamp).getTime();
            if (!isNaN(t)) return t;
          }
          return 0;
        };

        msgs.sort((a, b) => getSortTime(a) - getSortTime(b));

        // Auto-cache messages for instant 0ms retrieval on next open
        FirestoreChatService.cacheMessages(conversationId, msgs);

        onUpdate(msgs);
      },
      (error) => {
        console.error('[Firestore] listenToMessages snapshot error:', error);
      }
    );
  },

  /**
   * Send a text or photo message.
   */
  async sendMessage(params: {
    conversationId: string;
    currentUser: ApiUser;
    text: string;
    imageUri?: string;  // base64 or URL
    offer?: FirestoreOffer;
  }): Promise<void> {
    const myId = params.currentUser.id || params.currentUser._id || '';
    const myRole = params.currentUser.accountType === 'farmer' ? 'farmer' : 'buyer';
    const msgsRef = collection(db, 'conversations', params.conversationId, 'messages');

    const msgData: any = {
      senderId: myId,
      senderName: params.currentUser.fullName,
      senderRole: myRole,
      text: params.text || '',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      isRead: false,
      isEdited: false,
      isDeleted: false,
    };

    if (params.imageUri) msgData.imageUri = params.imageUri;
    if (params.offer) msgData.offer = params.offer;

    await addDoc(msgsRef, msgData);

    // Update conversation last message & unread count
    const convRef = doc(db, 'conversations', params.conversationId);
    try {
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const convData = convSnap.data() as Omit<FirestoreConversation, 'id'>;
        const otherUserId = convData.participants.find((p) => p !== myId) || '';
        const currentUnread = convData.unreadCounts?.[otherUserId] || 0;

        await updateDoc(convRef, {
          lastMessage: params.text || (params.imageUri ? '📷 Photo' : '🤝 Offer proposal'),
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          [`unreadCounts.${otherUserId}`]: currentUnread + 1,
        });
      }
    } catch {
      await setDoc(
        convRef,
        {
          lastMessage: params.text || (params.imageUri ? '📷 Photo' : '🤝 Offer proposal'),
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }
  },

  /**
   * Send a real voice note:
   * 1. Reads local file as base64 via FileSystem (ensuring instantaneous delivery & playback on both sides).
   * 2. Attempts Firebase Storage upload in background for permanent URL.
   * 3. Saves to Firestore messages subcollection.
   */
  async sendVoiceNote(params: {
    conversationId: string;
    currentUser: ApiUser;
    audioUri: string;    // local file:// URI from expo-audio recording or picked audio file
    durationSeconds: number;
    waveform?: number[];
  }): Promise<void> {
    const myId = params.currentUser.id || params.currentUser._id || '';
    const myRole = params.currentUser.accountType === 'farmer' ? 'farmer' : 'buyer';

    // 1. Read audio file as base64 (ultra-fast and 100% reliable)
    let base64Audio = '';
    try {
      base64Audio = await FileSystem.readAsStringAsync(params.audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (fsErr) {
      console.warn('[VoiceNote] Failed to read audio as base64:', fsErr);
    }

    // 2. Try Firebase Storage upload
    let downloadUrl = '';
    try {
      const response = await fetch(params.audioUri);
      const blob = await response.blob();
      const msgId = `voice_${Date.now()}`;
      const audioRef = storageRef(storage, `voice-notes/${params.conversationId}/${msgId}.m4a`);
      await uploadBytes(audioRef, blob, { contentType: 'audio/m4a' });
      downloadUrl = await getDownloadURL(audioRef);
    } catch (storageErr) {
      console.warn('[VoiceNote] Firebase Storage upload error, falling back to base64 audio:', storageErr);
    }

    const mins = Math.floor(params.durationSeconds / 60);
    const secs = params.durationSeconds % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    // 3. Write message doc to Firestore
    const msgsRef = collection(db, 'conversations', params.conversationId, 'messages');
    await addDoc(msgsRef, {
      senderId: myId,
      senderName: params.currentUser.fullName,
      senderRole: myRole,
      text: '',
      isVoiceNote: true,
      voiceDuration: durationStr,
      voiceWaveform: params.waveform || waveformFromDuration(params.durationSeconds),
      ...(downloadUrl ? { voiceUrl: downloadUrl } : {}),
      ...(base64Audio ? { voiceBase64: base64Audio } : {}),
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      isRead: false,
      isEdited: false,
      isDeleted: false,
    });

    // 4. Update conversation metadata
    const convRef = doc(db, 'conversations', params.conversationId);
    try {
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const convData = convSnap.data() as Omit<FirestoreConversation, 'id'>;
        const otherUserId = convData.participants.find((p) => p !== myId) || '';
        const currentUnread = convData.unreadCounts?.[otherUserId] || 0;

        await updateDoc(convRef, {
          lastMessage: `🎙️ Voice note (${durationStr})`,
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          [`unreadCounts.${otherUserId}`]: currentUnread + 1,
        });
      }
    } catch {
      await setDoc(
        convRef,
        {
          lastMessage: `🎙️ Voice note (${durationStr})`,
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }
  },

  // ── Offers ─────────────────────────────────────────────────────────────────

  async updateOfferStatus(
    conversationId: string,
    messageId: string,
    status: 'accepted' | 'declined' | 'countered'
  ): Promise<void> {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, { 'offer.status': status });
  },

  // ── Edit & Delete Messages ────────────────────────────────────────────────

  /**
   * Edit a sent text message within 24 hours.
   */
  async editMessage(params: {
    conversationId: string;
    messageId: string;
    newText: string;
    rawTimestamp?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    // 24-hour validation check
    if (params.rawTimestamp) {
      const msgDate = new Date(params.rawTimestamp).getTime();
      if (!isNaN(msgDate)) {
        const diffHours = (Date.now() - msgDate) / (1000 * 60 * 60);
        if (diffHours > 24) {
          return {
            success: false,
            error: 'Messages older than 24 hours cannot be edited.',
          };
        }
      }
    }

    const trimmed = params.newText.trim();
    if (!trimmed) {
      return { success: false, error: 'Message content cannot be empty.' };
    }

    try {
      const msgRef = doc(db, 'conversations', params.conversationId, 'messages', params.messageId);
      await updateDoc(msgRef, {
        text: trimmed,
        isEdited: true,
        editedAt: new Date().toISOString(),
      });

      // Update conversation lastMessage
      const convRef = doc(db, 'conversations', params.conversationId);
      await setDoc(
        convRef,
        {
          lastMessage: trimmed,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});

      return { success: true };
    } catch (err: any) {
      console.error('[Firestore] editMessage error:', err);
      return { success: false, error: err?.message || 'Could not update message.' };
    }
  },

  /**
   * Delete a message for everyone.
   * Marks message as deleted so both parties see "🚫 This message was deleted".
   */
  async deleteMessage(params: {
    conversationId: string;
    messageId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const msgRef = doc(db, 'conversations', params.conversationId, 'messages', params.messageId);
      await updateDoc(msgRef, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        text: 'This message was deleted',
        imageUri: null,
        voiceUrl: null,
        voiceBase64: null,
      });

      // Update conversation lastMessage
      const convRef = doc(db, 'conversations', params.conversationId);
      await setDoc(
        convRef,
        {
          lastMessage: '🚫 This message was deleted',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});

      return { success: true };
    } catch (err: any) {
      console.error('[Firestore] deleteMessage error:', err);
      return { success: false, error: err?.message || 'Could not delete message.' };
    }
  },

  // ── Read receipts ──────────────────────────────────────────────────────────

  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, { [`unreadCounts.${userId}`]: 0 });
    } catch {}
  },
};
