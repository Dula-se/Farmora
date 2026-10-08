import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface NotificationPreferencesScreenProps {
  onBack: () => void;
}

export function NotificationPreferencesScreen({
  onBack,
}: NotificationPreferencesScreenProps) {
  // Push toggles
  const [pushOrders, setPushOrders] = useState(true);
  const [pushPrice, setPushPrice] = useState(true);
  const [pushChats, setPushChats] = useState(true);
  const [pushWeather, setPushWeather] = useState(true);

  // SMS toggles
  const [smsOrders, setSmsOrders] = useState(true);
  const [smsPrice, setSmsPrice] = useState(false);
  const [smsOtp, setSmsOtp] = useState(true);

  // Email toggles
  const [emailInvoices, setEmailInvoices] = useState(true);
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(false);

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
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mobile Push Notifications */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mobile App Push Notifications</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Order Status & Dispatch</Text>
              <Text style={styles.toggleSub}>Real-time updates on crate dispatch, pickup, and delivery</Text>
            </View>
            <Switch
              value={pushOrders}
              onValueChange={setPushOrders}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={pushOrders ? '#1E5E3A' : '#94A3B8'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Price Watch Alerts</Text>
              <Text style={styles.toggleSub}>Instant notifications when commodity prices drop or surge</Text>
            </View>
            <Switch
              value={pushPrice}
              onValueChange={setPushPrice}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={pushPrice ? '#1E5E3A' : '#94A3B8'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Direct Buyer/Farmer Messages</Text>
              <Text style={styles.toggleSub}>Incoming inquiries, offers, and counter-proposals</Text>
            </View>
            <Switch
              value={pushChats}
              onValueChange={setPushChats}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={pushChats ? '#1E5E3A' : '#94A3B8'}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Harvest & Weather Alerts</Text>
              <Text style={styles.toggleSub}>Rain warnings and pest advisories for your district</Text>
            </View>
            <Switch
              value={pushWeather}
              onValueChange={setPushWeather}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={pushWeather ? '#1E5E3A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* SMS Text Notifications */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SMS Mobile Alerts</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Dispatch & Payment SMS</Text>
              <Text style={styles.toggleSub}>Receive SMS when payment clears or delivery arrives</Text>
            </View>
            <Switch
              value={smsOrders}
              onValueChange={setSmsOrders}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={smsOrders ? '#1E5E3A' : '#94A3B8'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Price Watch via SMS</Text>
              <Text style={styles.toggleSub}>Daily wholesale rates summary via SMS</Text>
            </View>
            <Switch
              value={smsPrice}
              onValueChange={setSmsPrice}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={smsPrice ? '#1E5E3A' : '#94A3B8'}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Security & Verification PINs</Text>
              <Text style={styles.toggleSub}>Critical login codes and verification confirmations</Text>
            </View>
            <Switch
              value={smsOtp}
              onValueChange={setSmsOtp}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={smsOtp ? '#1E5E3A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Email Notifications */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Email Preferences</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Commercial Invoices & VAT Receipts</Text>
              <Text style={styles.toggleSub}>PDF documentation sent directly to your registered email</Text>
            </View>
            <Switch
              value={emailInvoices}
              onValueChange={setEmailInvoices}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={emailInvoices ? '#1E5E3A' : '#94A3B8'}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.toggleLabel}>Weekly Market Report</Text>
              <Text style={styles.toggleSub}>District crop pricing trends and upcoming harvest forecasts</Text>
            </View>
            <Switch
              value={emailWeeklySummary}
              onValueChange={setEmailWeeklySummary}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={emailWeeklySummary ? '#1E5E3A' : '#94A3B8'}
            />
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  toggleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
});
