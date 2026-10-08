import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface NotificationItem {
  id: string;
  type: 'order' | 'price' | 'message' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'order',
    title: 'Order Dispatched #1042',
    description: 'Farmer Kusuma Bandara dispatched 50kg Organic Tomatoes via Welimada cold truck.',
    timestamp: '15m ago',
    isRead: false,
    actionLabel: 'Track Delivery',
  },
  {
    id: 'n2',
    type: 'message',
    title: 'New Price Counter-Offer',
    description: 'Green Leaf Supermarket proposed Rs. 210/kg for your 100kg highland carrots.',
    timestamp: '42m ago',
    isRead: false,
    actionLabel: 'View Offer',
  },
  {
    id: 'n3',
    type: 'price',
    title: 'Price Drop Alert 📉',
    description: 'Manning Market wholesale rate for Red Tomatoes dropped to Rs. 220/kg (-12%).',
    timestamp: '2h ago',
    isRead: true,
    actionLabel: 'View Trends',
  },
  {
    id: 'n4',
    type: 'order',
    title: 'Escrow Payment Released',
    description: 'Payment of Rs. 24,000 for Order #1041 cleared into your verified commercial account.',
    timestamp: '1d ago',
    isRead: true,
    actionLabel: 'View Receipt',
  },
  {
    id: 'n5',
    type: 'system',
    title: 'SL-GAP Certification Renewed',
    description: 'Your Department of Agriculture organic badge is valid until April 2027.',
    timestamp: '3d ago',
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
  const [filterTab, setFilterTab] = useState<'all' | 'order' | 'price' | 'message'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);

  const filtered = notifications.filter((n) => {
    if (filterTab === 'all') return true;
    return n.type === filterTab;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'price':
        return '📊';
      case 'message':
        return '💬';
      case 'system':
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
        {(['all', 'order', 'price', 'message'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, filterTab === tab && styles.tabBtnActive]}
            onPress={() => setFilterTab(tab)}>
            <Text style={[styles.tabText, filterTab === tab && styles.tabTextActive]}>
              {tab === 'all' && 'All'}
              {tab === 'order' && 'Orders'}
              {tab === 'price' && 'Price Alerts'}
              {tab === 'message' && 'Chats'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Mark All Read button */}
      <View style={styles.markReadRow}>
        <Text style={styles.unreadCountText}>
          {notifications.filter((n) => !n.isRead).length} new updates
        </Text>
        <Pressable onPress={markAllRead}>
          <Text style={styles.markReadBtnText}>Mark all as read</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
            onPress={() => onActionPress?.(item)}>
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
