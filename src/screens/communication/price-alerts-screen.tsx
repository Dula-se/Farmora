import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface PriceAlertItem {
  id: string;
  cropName: string;
  emoji: string;
  currentPrice: number;
  targetPrice: number;
  condition: 'below' | 'above';
  market: string;
  enabled: boolean;
}

const INITIAL_ALERTS: PriceAlertItem[] = [
  {
    id: 'a1',
    cropName: 'Organic Red Tomatoes',
    emoji: '🍅',
    currentPrice: 240,
    targetPrice: 210,
    condition: 'below',
    market: 'Manning Market & Kandy',
    enabled: true,
  },
  {
    id: 'a2',
    cropName: 'Highland Carrots',
    emoji: '🥕',
    currentPrice: 350,
    targetPrice: 300,
    condition: 'below',
    market: 'Dambulla Dedicated Economic Centre',
    enabled: true,
  },
  {
    id: 'a3',
    cropName: 'Ceylon Green Chilies',
    emoji: '🌶️',
    currentPrice: 650,
    targetPrice: 550,
    condition: 'below',
    market: 'All Wholesale Hubs',
    enabled: false,
  },
];

interface PriceAlertsScreenProps {
  onBack: () => void;
}

export function PriceAlertsScreen({ onBack }: PriceAlertsScreenProps) {
  const [alerts, setAlerts] = useState<PriceAlertItem[]>(INITIAL_ALERTS);
  const [showAddModal, setShowAddModal] = useState(false);

  // New alert form
  const [newCrop, setNewCrop] = useState('Green Bell Peppers');
  const [newTarget, setNewTarget] = useState('280');
  const [newCondition, setNewCondition] = useState<'below' | 'above'>('below');

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleAddAlert = () => {
    const target = parseFloat(newTarget);
    if (!target || target <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid target price.');
      return;
    }

    const newItem: PriceAlertItem = {
      id: `a_${Date.now()}`,
      cropName: newCrop,
      emoji: '🫑',
      currentPrice: 320,
      targetPrice: target,
      condition: newCondition,
      market: 'Island-wide Wholesale Index',
      enabled: true,
    };

    setAlerts([newItem, ...alerts]);
    setShowAddModal(false);
    Alert.alert('Alert Set! 🔔', `You will be notified when ${newCrop} price drops below Rs. ${target}/kg.`);
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
        <Text style={styles.headerTitle}>Price Watch Alarms</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>📈</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Smart Wholesale Tracking</Text>
            <Text style={styles.bannerSub}>
              Famora monitors daily economic center auctions and alerts you the moment prices match your procurement targets.
            </Text>
          </View>
        </View>

        {/* Active Alarms */}
        <Text style={styles.sectionHeading}>My Active Price Alarms ({alerts.filter((a) => a.enabled).length})</Text>

        {alerts.map((item) => (
          <View key={item.id} style={styles.alertCard}>
            <View style={styles.cropIconCircle}>
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alertCropName}>{item.cropName}</Text>
              <Text style={styles.alertTargetText}>
                Target: {item.condition === 'below' ? '≤' : '≥'} Rs. {item.targetPrice} /kg
              </Text>
              <Text style={styles.alertMarketText}>
                Current: Rs. {item.currentPrice}/kg • {item.market}
              </Text>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleAlert(item.id)}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={item.enabled ? '#1E5E3A' : '#94A3B8'}
            />
          </View>
        ))}

        {/* Wholesale Index Summary */}
        <View style={styles.indexCard}>
          <Text style={styles.indexTitle}>Today's Economic Centre Averages</Text>
          <View style={styles.indexRow}>
            <Text style={styles.indexCrop}>Red Tomatoes</Text>
            <Text style={styles.indexPrice}>Rs. 240 /kg</Text>
            <Text style={styles.indexTrendDown}>-8%</Text>
          </View>
          <View style={styles.indexRow}>
            <Text style={styles.indexCrop}>Highland Carrots</Text>
            <Text style={styles.indexPrice}>Rs. 350 /kg</Text>
            <Text style={styles.indexTrendUp}>+4%</Text>
          </View>
          <View style={[styles.indexRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.indexCrop}>Green Chilies</Text>
            <Text style={styles.indexPrice}>Rs. 650 /kg</Text>
            <Text style={styles.indexTrendDown}>-15%</Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Alert Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Price Alarm</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Crop / Commodity Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCrop}
              onChangeText={setNewCrop}
            />

            <Text style={styles.inputLabel}>Target Price (LKR / kg)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={newTarget}
              onChangeText={setNewTarget}
            />

            <Text style={styles.inputLabel}>Trigger Alert When Price</Text>
            <View style={styles.conditionRow}>
              <Pressable
                style={[styles.condBtn, newCondition === 'below' && styles.condBtnActive]}
                onPress={() => setNewCondition('below')}>
                <Text style={[styles.condText, newCondition === 'below' && styles.condTextActive]}>
                  Drops Below Target
                </Text>
              </Pressable>
              <Pressable
                style={[styles.condBtn, newCondition === 'above' && styles.condBtnActive]}
                onPress={() => setNewCondition('above')}>
                <Text style={[styles.condText, newCondition === 'above' && styles.condTextActive]}>
                  Surges Above Target
                </Text>
              </Pressable>
            </View>

            <Pressable style={styles.modalSubmitBtn} onPress={handleAddAlert}>
              <Text style={styles.modalSubmitBtnText}>Set Price Alert</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  addBtn: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  bannerSub: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCropName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  alertTargetText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E5E3A',
    marginTop: 2,
  },
  alertMarketText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  indexCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  indexTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  indexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  indexCrop: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  indexPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 10,
  },
  indexTrendDown: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  indexTrendUp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  condBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  condBtnActive: {
    backgroundColor: '#1E5E3A',
  },
  condText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  condTextActive: {
    color: '#FFFFFF',
  },
  modalSubmitBtn: {
    backgroundColor: '#1E5E3A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
