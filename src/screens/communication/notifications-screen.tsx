import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  getStoredUser,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  ApiNotificationItem,
} from '@/services/api';
import { sendLocalNotification } from '@/services/notifications';

export interface NotificationItem {
  id: string;
  type: 'order' | 'bid' | 'price' | 'message' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionRoute?: string;
  data?: Record<string, any>;
}

const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'f1',
    type: 'order',
    title: 'Order Placed #1042',
    description: 'Farmer Kusuma Bandara dispatched 50kg Organic Tomatoes via Welimada cold truck.',
    timestamp: '15m ago',
    isRead: false,
    actionLabel: 'Track Delivery',
  },
  {
    id: 'f2',
    type: 'bid',
    title: 'New Bid on Auction',
    description: 'A buyer placed a leading bid of Rs. 260/kg for Highland Carrots.',
    timestamp: '35m ago',
    isRead: false,
    actionLabel: 'View Auction',
  },
  {
    id: 'f3',
    type: 'system',
    title: '🔐 Security Alert: Login Detected',
    description: 'New login session verified on this device.',
    timestamp: '1h ago',
    isRead: true,
  },
];

interface NotificationsScreenProps {
  onBack: () => void;
  onOpenPreferences?: () => void;
  onActionPress?: (item: NotificationItem) => void;
}

export function NotificationsScreen({
  onBack,
  onOpenPreferences,
  onActionPress,
}: NotificationsScreenProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'order' | 'bid' | 'price' | 'message'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await getStoredUser();
      const myId = user?.id || user?._id || '';
      setCurrentUserId(myId);

      if (myId) {
        const liveNotifs = await fetchNotifications(myId);
        if (liveNotifs && liveNotifs.length > 0) {
          setNotifications(liveNotifs);
          setLoading(false);
          return;
        }
      }
      setNotifications(FALLBACK_NOTIFICATIONS);
    } catch {
      setNotifications(FALLBACK_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const filtered = notifications.filter((n) => {
    if (filterTab === 'all') return true;
    return n.type === filterTab;
  });

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (currentUserId) {
      await markAllNotificationsAsRead(currentUserId);
    }
  };

  const handleItemPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      if (!item.id.startsWith('f')) {
        markNotificationAsRead(item.id);
      }
    }
    onActionPress?.(item);
  };

  const handleSendTestAlert = async () => {
    const testCases = [
      {
        title: '🔐 Security Alert: New Login Detected',
        body: 'Someone logged into your Farmora account from a new Android device.',
        type: 'system' as const,
      },
      {
        title: '🔨 New Bid on Nuwara Eliya Leeks!',
        body: 'Sunil Dissanayake placed a leading bid of Rs. 380/kg (150 kg lot).',
        type: 'bid' as const,
      },
      {
        title: '📦 New Order Placed: #1089',
        body: 'Green Leaf Supermarket placed an order for Highland Carrots worth Rs. 24,000!',
        type: 'order' as const,
      },
    ];

    const pick = testCases[Math.floor(Math.random() * testCases.length)];
    await sendLocalNotification(pick.title, pick.body, { test: true });

    const newNotif: NotificationItem = {
      id: 'test-' + Date.now(),
      title: pick.title,
      description: pick.body,
      type: pick.type,
      timestamp: 'Just now',
      isRead: false,
      actionLabel: 'View Details',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'bid':
        return '🔨';
      case 'price':
        return '📊';
      case 'message':
        return '💬';
      case 'system':
        return '🔐';
      default:
        return '🌱';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={onOpenPreferences} hitSlop={12} style={styles.settingsBtn}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </Pressable>
      </View>

      {/* Top Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['all', 'order', 'bid', 'price', 'message'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, filterTab === tab && styles.tabBtnActive]}
            onPress={() => setFilterTab(tab)}>
            <Text style={[styles.tabText, filterTab === tab && styles.tabTextActive]}>
              {tab === 'all' && 'All'}
              {tab === 'order' && 'Orders'}
              {tab === 'bid' && 'Bids 🔨'}
              {tab === 'price' && 'Prices'}
              {tab === 'message' && 'Chats'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Mark All Read & Test Alert buttons */}
      <View style={styles.markReadRow}>
        <Text style={styles.unreadCountText}>
          {notifications.filter((n) => !n.isRead).length} unread updates
        </Text>
        <View style={styles.actionBtnsGroup}>
          <Pressable style={styles.testBtn} onPress={handleSendTestAlert}>
            <Text style={styles.testBtnText}>🔔 Test Alert</Text>
          </Pressable>
          <Pressable onPress={markAllRead}>
            <Text style={styles.markReadBtnText}>Mark all read</Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E5E3A" />
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 10 }}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E5E3A" />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              onPress={() => handleItemPress(item)}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 20 }}>{getIcon(item.type)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.notifHeaderRow}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.timestampText}>{item.timestamp}</Text>
                </View>
                <Text style={styles.descText}>{item.description}</Text>

                {item.actionLabel && (
                  <View style={styles.actionRow}>
                    <Text style={styles.actionBtnText}>{item.actionLabel} →</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  settingsBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#1E5E3A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  markReadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  unreadCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  markReadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5E3A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifCardUnread: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 6,
  },
  notifTitleUnread: {
    color: '#0F172A',
    fontWeight: '800',
  },
  timestampText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  descText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  actionRow: {
    marginTop: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5E3A',
  },
});
