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
import { getStoredUser, ApiUser, fetchProduceListings, apiFetch } from './api';
import { sendFcmPushNotification } from './notifications';

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
  callInvitation?: FirestoreCallInvitation;
}

export interface FirestoreCallInvitation {
  callId: string;
  meetingUrl: string;
  hostName: string;
  hostAvatar?: string;
  mode: 'video' | 'audio';
  type: 'instant' | 'scheduled';
  scheduledDate?: string;
  scheduledTime?: string;
  status: 'active' | 'scheduled' | 'ended';
  provider: 'cal.com' | 'google-video';
  calBookingUid?: string;
  notes?: string;
  inspectionFocus?: string[];
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

export interface FirestoreCallSession {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  mode: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'declined' | 'ended';
  callerMuted?: boolean;
  receiverMuted?: boolean;
  callerVideoPaused?: boolean;
  receiverVideoPaused?: boolean;
  createdAt: string;
  connectedAt?: string;
  endedAt?: string;
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

// Registry for real-time in-app message listeners per conversation
const activeMessageListeners = new Map<string, Set<(msgs: FirestoreMessage[]) => void>>();

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

    let otherAvatar = params.otherUserAvatar || '';
    if (!otherAvatar) {
      try {
        const otherUserSnap = await getDoc(doc(db, 'users', params.otherUserId));
        if (otherUserSnap.exists() && otherUserSnap.data()?.avatarUrl) {
          otherAvatar = otherUserSnap.data().avatarUrl;
        }
      } catch {}
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
          [params.otherUserId]: otherAvatar,
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
      if (otherAvatar) updates[`participantAvatars.${params.otherUserId}`] = otherAvatar;
      if (myAvatar) updates[`participantAvatars.${myId}`] = myAvatar;
      await setDoc(convRef, updates, { merge: true });
    }

    // Sync to MongoDB backend for persistent multi-device history
    apiFetch('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: convId,
        participants: [myId, params.otherUserId],
        participantNames: {
          [myId]: myName,
          [params.otherUserId]: params.otherUserName || 'User',
        },
        participantAvatars: {
          [myId]: myAvatar,
          [params.otherUserId]: otherAvatar,
        },
        participantRoles: {
          [myId]: myRole,
          [params.otherUserId]: params.otherUserRole,
        },
        productTitle: params.productTitle || '',
        productImage: params.productImage || '',
      }),
    }).catch(() => {});

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

  /** Append a confirmed or optimistic message to cache */
  async appendCachedMessage(conversationId: string, message: FirestoreMessage): Promise<FirestoreMessage[]> {
    try {
      const current = await FirestoreChatService.getCachedMessages(conversationId);
      const filtered = current.filter((m) => m.id !== message.id && (!m.id.startsWith('temp_') || m.text !== message.text));
      const updated = [...filtered, message];
      updated.sort((a, b) => {
        const tA = new Date(a.rawTimestamp || 0).getTime();
        const tB = new Date(b.rawTimestamp || 0).getTime();
        return tA - tB;
      });
      await FirestoreChatService.cacheMessages(conversationId, updated);
      return updated;
    } catch {
      return [message];
    }
  },

  /** Notify any active real-time listeners of an updated message list */
  notifyMessageListeners(conversationId: string, messages: FirestoreMessage[]) {
    const listeners = activeMessageListeners.get(conversationId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(messages);
        } catch {}
      });
    }
  },

  /**
   * Listen to all conversations the user is in.
   * Dual-layer: Real-time Firestore + MongoDB persistent backend API.
   * Guarantees conversations load seamlessly when logging into a new phone.
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

    // 1. Fetch from MongoDB backend (restores chats on brand new phones)
    const loadFromBackend = () => {
      apiFetch<FirestoreConversation[]>(`/chat/conversations?userIds=${encodeURIComponent(ids.join(','))}`)
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            res.data.forEach((c) => {
              convMap.set(c.id, c);
            });
            emitSorted();
          }
        })
        .catch(() => {});
    };

    loadFromBackend();
    const pollInterval = setInterval(loadFromBackend, 3500);

    // 2. Safety timer: If network / Firestore is delayed or offline, clear loading spinner!
    const safetyTimer = setTimeout(() => {
      emitSorted();
    }, 1200);

    // 3. Real-time Firestore listener
    ids.forEach((uid) => {
      try {
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
            console.warn(`[Firestore] listenToConversations snapshot notice for uid ${uid}:`, error);
            emitSorted(); // Ensure loading completes on new devices
          }
        );
        unsubs.push(unsub);
      } catch (err) {
        console.warn(`[Firestore] Query error for uid ${uid}:`, err);
        emitSorted();
      }
    });

    return () => {
      clearInterval(pollInterval);
      clearTimeout(safetyTimer);
      unsubs.forEach((u) => u());
    };

  },

  /**
   * Listen to messages in a conversation in real-time.
   * Dual-layer: Real-time Firestore + active MongoDB backend polling & instant local emitter.
   */
  listenToMessages(
    conversationId: string,
    onUpdate: (messages: FirestoreMessage[]) => void
  ): () => void {
    // Register active listener for instant local dispatch
    if (!activeMessageListeners.has(conversationId)) {
      activeMessageListeners.set(conversationId, new Set());
    }
    activeMessageListeners.get(conversationId)!.add(onUpdate);

    // 0. Instantly emit cached messages from local AsyncStorage (0ms load)
    FirestoreChatService.getCachedMessages(conversationId)
      .then((cached) => {
        if (cached && cached.length > 0) {
          onUpdate(cached);
        }
      })
      .catch(() => {});

    // 1. Fetch from MongoDB API
    const loadFromBackend = () => {
      apiFetch<FirestoreMessage[]>(`/chat/conversations/${conversationId}/messages`)
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            onUpdate(res.data);
            FirestoreChatService.cacheMessages(conversationId, res.data);
          }
        })
        .catch(() => {});
    };

    loadFromBackend();

    // 2. Active background polling while the chat screen is open (every 2.5s)
    // Ensures real-time delivery even if Firestore permissions or project are disabled
    const pollTimer = setInterval(() => {
      loadFromBackend();
    }, 2500);

    // 3. Real-time Firestore snapshot listener
    let unsubSnapshot = () => {};
    try {
      const msgsRef = collection(db, 'conversations', conversationId, 'messages');
      unsubSnapshot = onSnapshot(
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
              text: data.text,
              timestamp: tsToString(data.timestamp),
              rawTimestamp: raw,
              isRead: data.isRead ?? false,
              isEdited: data.isEdited ?? false,
              editedAt: data.editedAt ? tsToString(data.editedAt) : undefined,
              isDeleted: data.isDeleted ?? false,
              imageUri: data.imageUri || undefined,
              isVoiceNote: data.isVoiceNote ?? false,
              voiceDuration: data.voiceDuration || undefined,
              voiceWaveform: data.voiceWaveform || undefined,
              voiceUrl: data.voiceUrl || undefined,
              voiceBase64: data.voiceBase64 || undefined,
              offer: data.offer || undefined,
              callInvitation: data.callInvitation || undefined,
            };
          });

          msgs.sort((a, b) => {
            const tA = new Date(a.rawTimestamp || 0).getTime();
            const tB = new Date(b.rawTimestamp || 0).getTime();
            return tA - tB;
          });

          FirestoreChatService.cacheMessages(conversationId, msgs);
          onUpdate(msgs);
        },
        (error) => {
          console.warn(`[Firestore] listenToMessages notice:`, error);
          loadFromBackend();
        }
      );
    } catch {
      unsubSnapshot = () => {};
    }

    return () => {
      clearInterval(pollTimer);
      unsubSnapshot();
      const listeners = activeMessageListeners.get(conversationId);
      if (listeners) {
        listeners.delete(onUpdate);
        if (listeners.size === 0) {
          activeMessageListeners.delete(conversationId);
        }
      }
    };
  },

  /**
   * Send a text, photo, offer, or call invitation message.
   * Fast-path: immediately saves to MongoDB backend, updates local cache and notifies UI,
   * then updates Firestore & sends push notifications in background without blocking the UI.
   */
  async sendMessage(params: {
    conversationId: string;
    currentUser: ApiUser;
    text: string;
    imageUri?: string;  // base64 or URL
    offer?: FirestoreOffer;
    callInvitation?: FirestoreCallInvitation;
  }): Promise<FirestoreMessage> {
    const myId = params.currentUser.id || params.currentUser._id || '';
    const myRole = params.currentUser.accountType === 'farmer' ? 'farmer' : 'buyer';
    const now = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let confirmedMsg: FirestoreMessage = {
      id: `msg_${Date.now()}`,
      senderId: myId,
      senderName: params.currentUser.fullName || 'You',
      senderRole: myRole,
      text: params.text || '',
      timestamp: timeFormatted,
      rawTimestamp: now,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      imageUri: params.imageUri,
      isVoiceNote: false,
      offer: params.offer,
      callInvitation: params.callInvitation,
    };

    // 1. FAST PATH: Save to MongoDB backend
    try {
      const parts = params.conversationId.includes('_') ? params.conversationId.split('_') : [myId];
      const res = await apiFetch<FirestoreMessage>(`/chat/conversations/${params.conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          senderId: myId,
          senderName: params.currentUser.fullName || 'User',
          senderRole: myRole,
          text: params.text || '',
          imageUri: params.imageUri,
          isVoiceNote: false,
          offer: params.offer,
          callInvitation: params.callInvitation,
          participants: parts,
        }),
      });
      if (res?.data && res.data.id) {
        confirmedMsg = res.data;
      }
    } catch (apiErr) {
      console.warn('[Chat] apiFetch sendMessage notice:', apiErr);
    }

    // 2. Immediately update local cache and push to active UI listener
    FirestoreChatService.appendCachedMessage(params.conversationId, confirmedMsg).then((updated) => {
      FirestoreChatService.notifyMessageListeners(params.conversationId, updated);
    }).catch(() => {});

    // 3. BACKGROUND PATH: Non-blocking sync to Firestore & push notification (never blocks UI)
    (async () => {
      try {
        const msgsRef = collection(db, 'conversations', params.conversationId, 'messages');
        const msgData: any = {
          senderId: myId,
          senderName: params.currentUser.fullName,
          senderRole: myRole,
          text: params.text || '',
          timestamp: serverTimestamp(),
          createdAt: now,
          isRead: false,
          isEdited: false,
          isDeleted: false,
        };
        if (params.imageUri) msgData.imageUri = params.imageUri;
        if (params.offer) msgData.offer = params.offer;
        if (params.callInvitation) msgData.callInvitation = params.callInvitation;

        await Promise.race([
          addDoc(msgsRef, msgData),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
        ]).catch(() => {});

        const convRef = doc(db, 'conversations', params.conversationId);
        const convSnap = await Promise.race([
          getDoc(convRef),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]).catch(() => null);

        if (convSnap && convSnap.exists()) {
          const convData = convSnap.data() as Omit<FirestoreConversation, 'id'>;
          const otherUserId = convData.participants.find((p) => p !== myId) || '';
          const currentUnread = convData.unreadCounts?.[otherUserId] || 0;
          const previewText = params.callInvitation
            ? (params.callInvitation.type === 'scheduled' ? '📅 Video Inspection Scheduled' : '📹 Video Call Invitation')
            : params.text || (params.imageUri ? '📷 Photo' : '🤝 Offer proposal');

          await updateDoc(convRef, {
            lastMessage: previewText,
            lastMessageTime: now,
            updatedAt: now,
            [`unreadCounts.${otherUserId}`]: currentUnread + 1,
          }).catch(() => {});

          if (otherUserId) {
            sendFcmPushNotification({
              recipientUserId: otherUserId,
              title: params.currentUser.fullName || 'New Message',
              body: previewText,
              data: {
                conversationId: params.conversationId,
                senderId: myId,
                type: 'chat_message',
              },
            }).catch(() => {});
          }
        }
      } catch {}
    })();

    return confirmedMsg;
  },

  /**
   * Send a real voice note:
   * 1. Reads local file as base64 via FileSystem.
   * 2. Saves to MongoDB backend immediately.
   * 3. Syncs to Firebase Storage / Firestore asynchronously in background.
   */
  async sendVoiceNote(params: {
    conversationId: string;
    currentUser: ApiUser;
    audioUri: string;
    durationSeconds: number;
    waveform?: number[];
  }): Promise<FirestoreMessage> {
    const myId = params.currentUser.id || params.currentUser._id || '';
    const myRole = params.currentUser.accountType === 'farmer' ? 'farmer' : 'buyer';
    const now = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const mins = Math.floor(params.durationSeconds / 60);
    const secs = params.durationSeconds % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    // 1. Read audio file as base64
    let base64Audio = '';
    try {
      base64Audio = await FileSystem.readAsStringAsync(params.audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (fsErr) {
      console.warn('[VoiceNote] Failed to read audio as base64:', fsErr);
    }

    let confirmedMsg: FirestoreMessage = {
      id: `voice_${Date.now()}`,
      senderId: myId,
      senderName: params.currentUser.fullName || 'You',
      senderRole: myRole,
      text: `🎙️ Voice note (${durationStr})`,
      timestamp: timeFormatted,
      rawTimestamp: now,
      isRead: false,
      isVoiceNote: true,
      voiceDuration: durationStr,
      voiceWaveform: params.waveform || waveformFromDuration(params.durationSeconds),
      voiceBase64: base64Audio || undefined,
    };

    // 2. FAST PATH: Save to MongoDB backend
    try {
      const parts = params.conversationId.includes('_') ? params.conversationId.split('_') : [myId];
      const res = await apiFetch<FirestoreMessage>(`/chat/conversations/${params.conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          senderId: myId,
          senderName: params.currentUser.fullName || 'User',
          senderRole: myRole,
          text: `🎙️ Voice note (${durationStr})`,
          isVoiceNote: true,
          voiceDuration: durationStr,
          voiceBase64: base64Audio || undefined,
          participants: parts,
        }),
      });
      if (res?.data && res.data.id) {
        confirmedMsg = res.data;
      }
    } catch (apiErr) {
      console.warn('[Chat] apiFetch sendVoiceNote notice:', apiErr);
    }

    // 3. Immediately update local cache and push to active listener
    FirestoreChatService.appendCachedMessage(params.conversationId, confirmedMsg).then((updated) => {
      FirestoreChatService.notifyMessageListeners(params.conversationId, updated);
    }).catch(() => {});

    // 4. BACKGROUND PATH: Storage & Firestore sync (never blocks UI)
    (async () => {
      try {
        let downloadUrl = '';
        try {
          const response = await fetch(params.audioUri);
          const blob = await response.blob();
          const msgId = `voice_${Date.now()}`;
          const audioRef = storageRef(storage, `voice-notes/${params.conversationId}/${msgId}.m4a`);
          await Promise.race([
            uploadBytes(audioRef, blob, { contentType: 'audio/m4a' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
          ]);
          downloadUrl = await getDownloadURL(audioRef);
        } catch {}

        const msgsRef = collection(db, 'conversations', params.conversationId, 'messages');
        await Promise.race([
          addDoc(msgsRef, {
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
            createdAt: now,
            isRead: false,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
        ]).catch(() => {});

        const convRef = doc(db, 'conversations', params.conversationId);
        const convSnap = await Promise.race([
          getDoc(convRef),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]).catch(() => null);

        if (convSnap && convSnap.exists()) {
          const convData = convSnap.data() as Omit<FirestoreConversation, 'id'>;
          const otherUserId = convData.participants.find((p) => p !== myId) || '';
          const currentUnread = convData.unreadCounts?.[otherUserId] || 0;

          await updateDoc(convRef, {
            lastMessage: `🎙️ Voice note (${durationStr})`,
            lastMessageTime: now,
            updatedAt: now,
            [`unreadCounts.${otherUserId}`]: currentUnread + 1,
          }).catch(() => {});

          if (otherUserId) {
            sendFcmPushNotification({
              recipientUserId: otherUserId,
              title: params.currentUser.fullName || 'New Voice Note',
              body: `🎙️ Sent a voice note (${durationStr})`,
              data: {
                conversationId: params.conversationId,
                senderId: myId,
                type: 'chat_message',
              },
            }).catch(() => {});
          }
        }
      } catch {}
    })();

    return confirmedMsg;
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
    try {
      apiFetch(`/chat/conversations/${conversationId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    } catch {}
  },

  // ── Audio & Video Call Sessions ──────────────────────────────────────────

  /**
   * Initiate a real audio or video call session with instant FCM notification and Firestore signaling
   */
  async initiateCall(params: {
    conversationId: string;
    currentUser: ApiUser;
    receiverId: string;
    receiverName: string;
    receiverAvatar?: string;
    mode: 'audio' | 'video';
  }): Promise<{ callId: string }> {
    const callId = params.conversationId || `call_${Date.now()}`;
    const myId = params.currentUser.id || params.currentUser._id || '';
    const myName = params.currentUser.fullName || 'User';
    const myAvatar = params.currentUser.avatarUrl || '';

    const callDocRef = doc(db, 'calls', callId);
    await setDoc(callDocRef, {
      id: callId,
      conversationId: params.conversationId,
      callerId: myId,
      callerName: myName,
      callerAvatar: myAvatar,
      receiverId: params.receiverId,
      receiverName: params.receiverName,
      receiverAvatar: params.receiverAvatar || '',
      mode: params.mode,
      status: 'ringing',
      callerMuted: false,
      receiverMuted: false,
      callerVideoPaused: false,
      receiverVideoPaused: false,
      createdAt: new Date().toISOString(),
    });

    // 🔔 Notify receiver via FCM Push Notification
    sendFcmPushNotification({
      recipientUserId: params.receiverId,
      title: `📞 Incoming ${params.mode === 'video' ? 'Video' : 'Audio'} Call`,
      body: `${myName} is calling you on Famora...`,
      data: {
        callId,
        mode: params.mode,
        callerName: myName,
        callerAvatar: myAvatar,
        type: 'incoming_call',
      },
    }).catch(() => {});

    return { callId };
  },

  /**
   * Accept an incoming call session
   */
  async acceptCall(callId: string): Promise<void> {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, {
        status: 'connected',
        connectedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.log('[Firestore] acceptCall error:', e);
    }
  },

  /**
   * Decline an incoming call session
   */
  async declineCall(callId: string): Promise<void> {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, {
        status: 'declined',
        endedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.log('[Firestore] declineCall error:', e);
    }
  },

  /**
   * End a call session in Firestore
   */
  async endCall(callId: string): Promise<void> {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, {
        status: 'ended',
        endedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.log('[Firestore] endCall error:', e);
    }
  },

  /**
   * Update audio/video controls in real time during a call
   */
  async updateCallControls(
    callId: string,
    updates: Partial<{
      callerMuted: boolean;
      receiverMuted: boolean;
      callerVideoPaused: boolean;
      receiverVideoPaused: boolean;
    }>
  ): Promise<void> {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, updates);
    } catch (e) {
      console.log('[Firestore] updateCallControls error:', e);
    }
  },

  /**
   * Listen to an active call session
   */
  listenToCallSession(
    callId: string,
    onUpdate: (session: FirestoreCallSession | null) => void
  ): () => void {
    if (!callId) return () => {};
    const callRef = doc(db, 'calls', callId);
    return onSnapshot(
      callRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as FirestoreCallSession);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.log('[Firestore] listenToCallSession notice:', err);
      }
    );
  },

  /**
   * Listen for any incoming call for the specified user
   */
  listenToIncomingCalls(
    userId: string,
    onIncomingCall: (call: FirestoreCallSession | null) => void
  ): () => void {
    if (!userId) return () => {};
    try {
      const q = query(
        collection(db, 'calls'),
        where('receiverId', '==', userId),
        where('status', '==', 'ringing')
      );
      return onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs[0].data() as FirestoreCallSession;
            onIncomingCall(data);
          } else {
            onIncomingCall(null);
          }
        },
        (err) => {
          console.log('[Firestore] listenToIncomingCalls notice:', err);
        }
      );
    } catch (e) {
      console.log('[Firestore] listenToIncomingCalls catch:', e);
      return () => {};
    }
  },
};
