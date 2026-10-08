import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { HarvestService, HarvestItem } from '@/services/harvest-service';

interface ScheduleHarvestWizardProps {
  onBack: () => void;
  onHarvestCreated: (harvest: HarvestItem) => void;
}

const PRESET_CROPS = [
  {
    name: 'Red Onion (Rathu Lunu)',
    variety: 'Dambulla Special',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
    defaultPrice: 380,
    marketPrice: 450,
  },
  {
    name: 'Keeri Samba Rice (Paddy)',
    variety: 'BG 360 Certified',
    category: 'Grains',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop',
    defaultPrice: 240,
    marketPrice: 290,
  },
  {
    name: 'Nuwara Eliya Carrots',
    variety: 'Kuroda Premium',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&fit=crop',
    defaultPrice: 290,
    marketPrice: 360,
  },
  {
    name: 'Green Chillies (Amu Miris)',
    variety: 'MI-2 Spicy Grade A',
    category: 'Spices',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&fit=crop',
    defaultPrice: 720,
    marketPrice: 850,
  },
];

export function ScheduleHarvestWizard({ onBack, onHarvestCreated }: ScheduleHarvestWizardProps) {
  const insets = useSafeAreaInsets();
  const [selectedPreset, setSelectedPreset] = useState(PRESET_CROPS[0]);
  const [cropName, setCropName] = useState(PRESET_CROPS[0].name);
  const [variety, setVariety] = useState(PRESET_CROPS[0].variety);
  const [category, setCategory] = useState(PRESET_CROPS[0].category);
  const [harvestDate, setHarvestDate] = useState('2026-11-15');
  const [estimatedYield, setEstimatedYield] = useState('2000');
  const [minPreOrder, setMinPreOrder] = useState('50');
  const [preOrderPrice, setPreOrderPrice] = useState('380');
  const [marketPrice, setMarketPrice] = useState('450');
  const [depositPercent, setDepositPercent] = useState<number>(20);
  const [district, setDistrict] = useState('Dambulla, Matale');
  const [notes, setNotes] = useState('Certified organic cultivation using drip irrigation & natural neem compost.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (crop: typeof PRESET_CROPS[0]) => {
    setSelectedPreset(crop);
    setCropName(crop.name);
    setVariety(crop.variety);
    setCategory(crop.category);
    setPreOrderPrice(crop.defaultPrice.toString());
    setMarketPrice(crop.marketPrice.toString());
  };

  const handlePublish = async () => {
    if (!cropName.trim()) {
      Alert.alert('Missing Field', 'Please enter crop name.');
      return;
    }
    const yieldNum = parseInt(estimatedYield, 10);
    if (isNaN(yieldNum) || yieldNum <= 0) {
      Alert.alert('Invalid Yield', 'Please enter estimated harvest yield in kg.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await HarvestService.createHarvest({
        cropName: cropName.trim(),
        variety: variety.trim(),
        category,
        image: selectedPreset.image,
        expectedHarvestDate: harvestDate.trim(),
        estimatedYieldKg: yieldNum,
        minPreOrderQty: parseInt(minPreOrder, 10) || 10,
        preOrderPricePerKg: parseInt(preOrderPrice, 10) || 100,
        marketPricePerKg: parseInt(marketPrice, 10) || 120,
        depositPercent,
        locationDistrict: district.trim(),
        fieldNotes: notes.trim(),
      });

      setIsSubmitting(false);
      Alert.alert(
        'Harvest Published!',
        `Your upcoming harvest of ${created.cropName} is now open for pre-orders.`,
        [{ text: 'OK', onPress: () => onHarvestCreated(created) }]
      );
    } catch (e: any) {
      setIsSubmitting(false);
      Alert.alert('Publish Failed', e?.message || 'Could not save harvest batch.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.navTitleCenter}>
          <Text style={styles.navTitle}>Schedule Harvest</Text>
          <Text style={styles.navSub}>List upcoming crop batch for pre-orders</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Preset Crop Picker */}
        <Text style={styles.sectionTitle}>Select Crop Template</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {PRESET_CROPS.map((p) => {
            const isSel = selectedPreset.name === p.name;
            return (
              <Pressable
                key={p.name}
                style={[styles.presetCard, isSel && styles.presetCardActive]}
                onPress={() => handleSelectPreset(p)}
              >
                <Image source={{ uri: p.image }} style={styles.presetImg} contentFit="cover" />
                <Text style={styles.presetName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.presetPrice}>Rs. {p.defaultPrice}/kg</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Form Fields */}
        <View style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Crop Name</Text>
            <TextInput
              style={styles.input}
              value={cropName}
              onChangeText={setCropName}
              placeholder="e.g. Red Onions"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Variety / Seed</Text>
              <TextInput
                style={styles.input}
                value={variety}
                onChangeText={setVariety}
                placeholder="e.g. Dambulla Special"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Expected Harvest Date</Text>
              <TextInput
                style={styles.input}
                value={harvestDate}
                onChangeText={setHarvestDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Estimated Yield (kg)</Text>
              <TextInput
                style={styles.input}
                value={estimatedYield}
                onChangeText={setEstimatedYield}
                keyboardType="number-pad"
                placeholder="2000"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Min Pre-Order (kg)</Text>
              <TextInput
                style={styles.input}
                value={minPreOrder}
                onChangeText={setMinPreOrder}
                keyboardType="number-pad"
                placeholder="50"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Pre-Order Price / kg (Rs.)</Text>
              <TextInput
                style={styles.input}
                value={preOrderPrice}
                onChangeText={setPreOrderPrice}
                keyboardType="number-pad"
                placeholder="380"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Projected Market Price (Rs.)</Text>
              <TextInput
                style={styles.input}
                value={marketPrice}
                onChangeText={setMarketPrice}
                keyboardType="number-pad"
                placeholder="450"
              />
            </View>
          </View>

          {/* Deposit Percent Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Required Booking Deposit (%)</Text>
            <View style={styles.depositChoiceRow}>
              {[10, 20, 25, 30].map((pct) => (
                <Pressable
                  key={pct}
                  style={[styles.depositPill, depositPercent === pct && styles.depositPillActive]}
                  onPress={() => setDepositPercent(pct)}
                >
                  <Text style={[styles.depositPillText, depositPercent === pct && styles.depositPillTextActive]}>
                    {pct}% Deposit
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Farm District / Location</Text>
            <TextInput
              style={styles.input}
              value={district}
              onChangeText={setDistrict}
              placeholder="e.g. Dambulla, Matale"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cultivation & Field Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Irrigation, organic inputs, harvest readiness..."
            />
          </View>
        </View>

        {/* Publish Button */}
        <Pressable
          style={[styles.publishBtn, isSubmitting && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishBtnText}>Publish Harvest Schedule</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitleCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  presetScroll: {
    marginBottom: 16,
  },
  presetCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  presetCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  presetImg: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  depositChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  depositPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  depositPillActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  depositPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  depositPillTextActive: {
    color: '#FFFFFF',
  },
  publishBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishBtnDisabled: {
    opacity: 0.7,
  },
  publishBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
