import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import {
  ChatService,
  Conversation,
  CallRecord,
} from '@/services/chat-service';

interface MessagesListScreenProps {
  onBack?: () => void;
  onOpenConversation: (conversationId: string) => void;
  onStartCall?: (participantName: string, participantAvatar: string, mode: 'audio' | 'video') => void;
  currentRole?: 'buyer' | 'farmer';
}

export function MessagesListScreen({
  onBack,
  onOpenConversation,
  onStartCall,
  currentRole = 'buyer',
}: MessagesListScreenProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'calls'>('chats');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'farmers' | 'buyers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const convs = await ChatService.getConversations();
    const callLogs = await ChatService.getCallHistory();
    setConversations(convs);
    setCalls(callLogs);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredConversations = conversations.filter((c) => {
    const matchSearch =
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.productTitle && c.productTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (filterType === 'unread') return c.unreadCount > 0;
    if (filterType === 'farmers') return c.participantRole === 'farmer';
    if (filterType === 'buyers') return c.participantRole === 'buyer';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable
          style={styles.newChatBtn}
          onPress={() => onOpenConversation('c1')}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E5E3A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </Svg>
        </Pressable>
      </View>

      {/* Segment Switcher: Chats vs Calls */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'chats' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('chats')}>
          <Text style={[styles.segmentBtnText, activeTab === 'chats' && styles.segmentBtnTextActive]}>
            Chats ({conversations.reduce((acc, c) => acc + (c.unreadCount > 0 ? 1 : 0), 0)} unread)
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'calls' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('calls')}>
          <Text style={[styles.segmentBtnText, activeTab === 'calls' && styles.segmentBtnTextActive]}>
            Calls ({calls.length})
          </Text>
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'chats' ? 'Search messages or crops...' : 'Search call history...'}
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

      {/* Filter Chips for Chats */}
      {activeTab === 'chats' && (
        <View style={styles.filterRow}>
          {(['all', 'unread', 'farmers', 'buyers'] as const).map((ft) => (
            <Pressable
              key={ft}
              style={[styles.filterChip, filterType === ft && styles.filterChipActive]}
              onPress={() => setFilterType(ft)}>
              <Text style={[styles.filterChipText, filterType === ft && styles.filterChipTextActive]}>
                {ft === 'all' && 'All'}
                {ft === 'unread' && 'Unread'}
                {ft === 'farmers' && 'Farmers'}
                {ft === 'buyers' && 'Buyers'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Content: Conversation List or Call Logs */}
      {activeTab === 'chats' ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E5E3A" />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.convCard, pressed && styles.convCardPressed]}
              onPress={() => onOpenConversation(item.id)}>
              {/* Avatar with Online indicator */}
              <View style={styles.avatarWrap}>
                <Image source={{ uri: item.participantAvatar }} style={styles.avatarImg} contentFit="cover" />
                {item.isOnline && <View style={styles.onlineDot} />}
              </View>

              {/* Chat Info */}
              <View style={styles.convMain}>
                <View style={styles.convHeaderRow}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.participantName} numberOfLines={1}>
                      {item.participantName}
                    </Text>
                    {item.verified && (
                      <View style={styles.verifiedTick}>
                        <Text style={styles.verifiedTickText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.timeText}>{item.lastMessageTime}</Text>
                </View>

                {/* Product Reference Chip */}
                {item.productTitle && (
                  <View style={styles.cropRefBadge}>
                    <Text style={styles.cropRefText}>🌱 {item.productTitle}</Text>
                  </View>
                )}

                {/* Message preview & Unread badge */}
                <View style={styles.convFooterRow}>
                  <Text
                    style={[styles.lastMsgText, item.unreadCount > 0 && styles.lastMsgUnread]}
                    numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={styles.emptyTitle}>No messages found</Text>
              <Text style={styles.emptySub}>
                Inquire about produce listings or send price offers to start chatting.
              </Text>
            </View>
          }
        />
      ) : (
        /* Calls Log Tab */
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E5E3A" />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.callCard}>
              <Image source={{ uri: item.participantAvatar }} style={styles.avatarImg} contentFit="cover" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.participantName}>{item.participantName}</Text>
                <View style={styles.callMetaRow}>
                  <Text style={{ fontSize: 12, marginRight: 4 }}>
                    {item.type === 'incoming' && '↙️'}
                    {item.type === 'outgoing' && '↗️'}
                    {item.type === 'missed' && '❌'}
                  </Text>
                  <Text style={[styles.callTypeText, item.type === 'missed' && { color: '#EF4444' }]}>
                    {item.callMode === 'video' ? 'Video Call' : 'Audio Call'} • {item.timestamp}
                  </Text>
                  {item.duration && <Text style={styles.callDuration}>({item.duration})</Text>}
                </View>
              </View>
              <Pressable
                style={styles.callBackBtn}
                onPress={() => onStartCall?.(item.participantName, item.participantAvatar, item.callMode)}>
                <Text style={{ fontSize: 16 }}>{item.callMode === 'video' ? '📹' : '📞'}</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  newChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#1E5E3A',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#1E5E3A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  convCardPressed: {
    backgroundColor: '#F8FAFC',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  convMain: {
    flex: 1,
    marginLeft: 12,
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedTick: {
    marginLeft: 4,
    backgroundColor: '#1E5E3A',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTickText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cropRefBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  cropRefText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  convFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMsgText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  lastMsgUnread: {
    color: '#0F172A',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#1E5E3A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  callMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  callTypeText: {
    fontSize: 12,
    color: '#64748B',
  },
  callDuration: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 6,
  },
  callBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
