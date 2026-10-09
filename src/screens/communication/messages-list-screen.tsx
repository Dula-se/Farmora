/**
 * messages-list-screen.tsx
 *
 * Real-time conversations list powered by Firebase Firestore.
 * Shows only real registered farmers and buyers (no mock demos).
 * Supports starting real chats with any active farmer or buyer on the platform.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import {
  FirestoreChatService,
  FirestoreConversation,
  PlatformUserDirectoryItem,
} from '@/services/firestore-chat-service';
import { getStoredUser, ApiUser, fetchProduceListings } from '@/services/api';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface MessagesListScreenProps {
  onBack?: () => void;
  onOpenConversation: (
    conversationId: string,
    otherUserId: string,
    otherUserName: string,
    otherUserAvatar: string,
    otherUserRole: 'farmer' | 'buyer'
  ) => void;
  onStartCall?: (participantName: string, participantAvatar: string, mode: 'audio' | 'video') => void;
  currentRole?: 'buyer' | 'farmer';
}

export function MessagesListScreen({
  onBack,
  onOpenConversation,
  onStartCall,
  currentRole = 'buyer',
}: MessagesListScreenProps) {
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [conversations, setConversations] = useState<FirestoreConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbAvatars, setDbAvatars] = useState<Record<string, string>>({});

  // New Chat Modal with real platform farmers/buyers
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [platformUsers, setPlatformUsers] = useState<PlatformUserDirectoryItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [startingChatWithId, setStartingChatWithId] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initListener();
    return () => unsubscribeRef.current?.();
  }, []);

  const initListener = async () => {
    const user = await getStoredUser();
    setCurrentUser(user);
    if (!user) {
      setLoading(false);
      return;
    }

    const myIds = [
      user.id,
      user._id,
      user.mobileNumber,
      user.mobileNumber?.replace(/\s+/g, ''),
      user.email,
      user.accountType === 'farmer' ? 'user-farmer-1' : 'user-buyer-1',
    ].filter(Boolean) as string[];
    const primaryId = myIds[0] || '';

    // 1. Instant 0ms load: Show cached conversations immediately
    try {
      const cached = await FirestoreChatService.getCachedConversations(primaryId);
      if (cached && cached.length > 0) {
        setConversations(cached);
        setLoading(false);
      }
    } catch {}

    // 2. Sync self into Firestore directory non-blocking
    FirestoreChatService.syncUserToFirestore(user);

    // 3. Load live database avatars for registered platform users & farmers
    loadDatabaseAvatars();

    // 4. Safety timer: ensure loading indicator finishes even on brand new phone
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 1200);

    // 5. Dual-layer Firestore + MongoDB listener
    const unsub = FirestoreChatService.listenToConversations(myIds, (convs) => {
      clearTimeout(safetyTimeout);
      setConversations(convs);
      setLoading(false);
    });
    unsubscribeRef.current = () => {
      clearTimeout(safetyTimeout);
      unsub();
    };
  };

  const loadDatabaseAvatars = async () => {
    const avatarMap: Record<string, string> = {};
    try {
      // 1. Fetch real avatars from Firestore users directory
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        const u = d.data();
        if (u.avatarUrl) {
          avatarMap[d.id] = u.avatarUrl;
          if (u.fullName) avatarMap[u.fullName.toLowerCase().trim()] = u.avatarUrl;
        }
      });
    } catch {}

    try {
      // 2. Fetch real avatars from MongoDB produce listings
      const prods = await fetchProduceListings();
      prods.forEach((p) => {
        if (p.farmerAvatar) {
          if (p.farmerId) avatarMap[p.farmerId] = p.farmerAvatar;
          if (p.farmerName) avatarMap[p.farmerName.toLowerCase().trim()] = p.farmerAvatar;
        }
      });
    } catch {}

    setDbAvatars(avatarMap);
  };

  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingUsers(true);
    const targetRole = currentRole === 'buyer' ? 'farmer' : 'buyer';
    const myId = currentUser?.id || currentUser?._id || '';
    const users = await FirestoreChatService.fetchPlatformUsers(targetRole, myId);
    setPlatformUsers(users);
    setLoadingUsers(false);
  };

  const handleSelectUserToChat = async (targetUser: PlatformUserDirectoryItem) => {
    if (!currentUser) return;
    setStartingChatWithId(targetUser.id);
    try {
      const convId = await FirestoreChatService.getOrCreateConversation({
        currentUser,
        otherUserId: targetUser.id,
        otherUserName: targetUser.fullName,
        otherUserRole: targetUser.role,
        otherUserAvatar: targetUser.avatarUrl,
      });

      setShowNewChatModal(false);
      onOpenConversation(
        convId,
        targetUser.id,
        targetUser.fullName,
        targetUser.avatarUrl,
        targetUser.role
      );
    } catch (e) {
      console.error('[NewChat] Error starting conversation:', e);
    } finally {
      setStartingChatWithId(null);
    }
  };

  const myIds = currentUser
    ? [
        currentUser.id,
        currentUser._id,
        currentUser.mobileNumber,
        currentUser.mobileNumber?.replace(/\s+/g, ''),
        currentUser.email,
        currentUser.accountType === 'farmer' ? 'user-farmer-1' : 'user-buyer-1',
      ].filter(Boolean) as string[]
    : [];

  const myId = currentUser?.id || currentUser?._id || '';

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const participants = Object.values(c.participantNames || {}).join(' ').toLowerCase();
    return (
      participants.includes(q) ||
      (c.productTitle || '').toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q)
    );
  });

  const getOtherUserId = (conv: FirestoreConversation): string => {
    const found = conv.participants.find((p) => !myIds.includes(p));
    if (found) return found;
    const nameKeys = Object.keys(conv.participantNames || {});
    const otherKey = nameKeys.find((k) => !myIds.includes(k));
    if (otherKey) return otherKey;
    return conv.participants[0] || '';
  };

  const getOtherName = (conv: FirestoreConversation): string => {
    const otherId = getOtherUserId(conv);
    if (conv.participantNames?.[otherId] && conv.participantNames[otherId] !== 'User') {
      return conv.participantNames[otherId];
    }
    for (const [k, v] of Object.entries(conv.participantNames || {})) {
      if (!myIds.includes(k) && v && v !== 'User') return v;
    }
    if (conv.participantNames?.[otherId]) return conv.participantNames[otherId];
    return currentRole === 'buyer' ? 'Farmer' : 'Buyer';
  };

  const getOtherAvatar = (conv: FirestoreConversation): string => {
    const otherId = getOtherUserId(conv);
    const otherName = getOtherName(conv).toLowerCase().trim();
    if (dbAvatars[otherId]) return dbAvatars[otherId];
    if (dbAvatars[otherName]) return dbAvatars[otherName];
    if (conv.participantAvatars?.[otherId]) return conv.participantAvatars[otherId];
    for (const [k, v] of Object.entries(conv.participantAvatars || {})) {
      if (!myIds.includes(k) && v) return v;
    }
    return '';
  };

  const getOtherRole = (conv: FirestoreConversation): 'farmer' | 'buyer' => {
    const otherId = getOtherUserId(conv);
    if (conv.participantRoles?.[otherId]) return conv.participantRoles[otherId];
    for (const [k, v] of Object.entries(conv.participantRoles || {})) {
      if (!myIds.includes(k) && v) return v;
    }
    return currentRole === 'buyer' ? 'farmer' : 'buyer';
  };

  const getUnread = (conv: FirestoreConversation): number => {
    for (const id of myIds) {
      if (conv.unreadCounts?.[id]) return conv.unreadCounts[id];
    }
    return 0;
  };


  const fmtTime = (iso: string): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </Pressable>
        ) : (
          <View style={{ width: 34 }} />
        )}
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable
          style={styles.newChatBtn}
          onPress={handleOpenNewChatModal}
          hitSlop={8}>
          <Text style={styles.newChatBtnTxt}>+ New Chat</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder="Search real conversations..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Text style={{ color: '#94A3B8', fontSize: 16 }}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E5E3A" />
          <Text style={{ color: '#64748B', fontSize: 14, marginTop: 12 }}>Loading conversations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 44, marginBottom: 8 }}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            {currentRole === 'buyer'
              ? 'Connect directly with verified farmers to negotiate prices and send voice notes.'
              : 'Buyers will contact you directly through your listed harvests.'}
          </Text>
          <Pressable style={styles.startFirstChatBtn} onPress={handleOpenNewChatModal}>
            <Text style={styles.startFirstChatTxt}>
              {currentRole === 'buyer' ? '🌾 Chat with a Real Farmer' : '🛒 Chat with a Buyer'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={initListener} tintColor="#1E5E3A" />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const otherId = getOtherUserId(item);
            const otherName = getOtherName(item);
            const otherAvatar = getOtherAvatar(item);
            const otherRole = getOtherRole(item);
            const unread = getUnread(item);

            return (
              <Pressable
                style={({ pressed }) => [styles.convCard, pressed && styles.convCardPressed]}
                onPress={() => onOpenConversation(item.id, otherId, otherName, otherAvatar, otherRole)}>

                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  {otherAvatar ? (
                    <Image source={{ uri: otherAvatar }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 18 }}>
                        {otherName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {otherRole === 'farmer' && (
                    <View style={styles.roleDot}>
                      <Text style={{ fontSize: 8 }}>🌾</Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.convContent}>
                  <View style={styles.convTop}>
                    <Text style={[styles.convName, unread > 0 && styles.convNameBold]} numberOfLines={1}>
                      {otherName}
                    </Text>
                    <Text style={[styles.convTime, unread > 0 && styles.convTimeUnread]}>
                      {fmtTime(item.lastMessageTime)}
                    </Text>
                  </View>

                  {item.productTitle ? (
                    <View style={styles.productChip}>
                      <Text style={styles.productChipTxt} numberOfLines={1}>🌱 {item.productTitle}</Text>
                    </View>
                  ) : null}

                  <View style={styles.convBottom}>
                    <Text
                      style={[styles.lastMsg, unread > 0 && styles.lastMsgUnread]}
                      numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadTxt}>{unread > 99 ? '99+' : unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Real Users Directory Modal (Start New Chat) */}
      <Modal
        visible={showNewChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {currentRole === 'buyer' ? 'Real Verified Farmers' : 'Real Platform Buyers'}
                </Text>
                <Text style={styles.modalSub}>
                  Select any active member to start a live 1-on-1 chat
                </Text>
              </View>
              <Pressable onPress={() => setShowNewChatModal(false)} hitSlop={10} style={styles.closeBtn}>
                <Text style={{ fontSize: 20, color: '#64748B' }}>✕</Text>
              </Pressable>
            </View>

            {loadingUsers ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1E5E3A" />
                <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>
                  Fetching verified members...
                </Text>
              </View>
            ) : platformUsers.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>👨‍🌾</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                  No members found
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                  Browse produce in the marketplace and click 'Chat' on any listing.
                </Text>
              </View>
            ) : (
              <FlatList
                data={platformUsers}
                keyExtractor={(u) => u.id}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item: u }) => (
                  <Pressable
                    style={styles.userItem}
                    disabled={startingChatWithId === u.id}
                    onPress={() => handleSelectUserToChat(u)}>
                    <View style={styles.avatarWrap}>
                      {u.avatarUrl ? (
                        <Image source={{ uri: u.avatarUrl }} style={styles.avatar} contentFit="cover" />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 18 }}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {u.role === 'farmer' && (
                        <View style={styles.roleDot}>
                          <Text style={{ fontSize: 8 }}>🌾</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.userName} numberOfLines={1}>{u.fullName}</Text>
                      {u.subtitle ? (
                        <Text style={styles.userSub} numberOfLines={1}>{u.subtitle}</Text>
                      ) : null}
                    </View>

                    {startingChatWithId === u.id ? (
                      <ActivityIndicator size="small" color="#1E5E3A" />
                    ) : (
                      <View style={styles.chatActionBadge}>
                        <Text style={styles.chatActionBadgeTxt}>Chat</Text>
                      </View>
                    )}
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  newChatBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newChatBtnTxt: { fontSize: 13, fontWeight: '700', color: '#166534' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  startFirstChatBtn: {
    backgroundColor: '#1E5E3A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  startFirstChatTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  listContent: { paddingVertical: 4 },
  convCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  convCardPressed: { backgroundColor: '#F8FAFC' },

  avatarWrap: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { backgroundColor: '#1E5E3A', alignItems: 'center', justifyContent: 'center' },
  roleDot: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#DCFCE7', borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },

  convContent: { flex: 1, marginLeft: 12 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1 },
  convNameBold: { fontWeight: '800' },
  convTime: { fontSize: 12, color: '#94A3B8', marginLeft: 8 },
  convTimeUnread: { color: '#1E5E3A', fontWeight: '700' },

  productChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    marginVertical: 3,
  },
  productChipTxt: { fontSize: 11, color: '#166534', fontWeight: '600' },

  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  lastMsg: { fontSize: 13, color: '#64748B', flex: 1 },
  lastMsgUnread: { color: '#0F172A', fontWeight: '700' },
  unreadBadge: {
    backgroundColor: '#1E5E3A', borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, marginLeft: 8,
  },
  unreadTxt: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { padding: 4 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  userName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  userSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  chatActionBadge: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  chatActionBadgeTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
