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
import { AuctionService, AuctionItem } from '@/services/auction-service';

interface CreateAuctionWizardProps {
  onBack: () => void;
  onAuctionCreated: (auction: AuctionItem) => void;
}

const PRESET_LOTS = [
  {
    title: 'Grade-A Dambulla Red Onions (Rathu Lunu)',
    variety: 'Dambulla Special Bulb',
    grade: 'A+ Export Grade',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
    defaultLotKg: 1000,
    startPrice: 320,
    reservePrice: 380,
  },
  {
    title: 'Highland Crisp Cabbage Lot',
    variety: 'Green Coronet',
    grade: 'Super Grade A',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&fit=crop',
    defaultLotKg: 2000,
    startPrice: 140,
    reservePrice: 170,
  },
  {
    title: 'Polonnaruwa Premium Keeri Samba (Paddy)',
    variety: 'BG 360 Certified',
    grade: 'Paddy Board Certified',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop',
    defaultLotKg: 5000,
    startPrice: 210,
    reservePrice: 240,
  },
];

export function CreateAuctionWizard({ onBack, onAuctionCreated }: CreateAuctionWizardProps) {
  const insets = useSafeAreaInsets();
  const [selectedPreset, setSelectedPreset] = useState(PRESET_LOTS[0]);
  const [title, setTitle] = useState(PRESET_LOTS[0].title);
  const [variety, setVariety] = useState(PRESET_LOTS[0].variety);
  const [grade, setGrade] = useState(PRESET_LOTS[0].grade);
  const [lotSizeKg, setLotSizeKg] = useState(PRESET_LOTS[0].defaultLotKg.toString());
  const [startingPrice, setStartingPrice] = useState(PRESET_LOTS[0].startPrice.toString());
  const [reservePrice, setReservePrice] = useState(PRESET_LOTS[0].reservePrice.toString());
  const [durationHours, setDurationHours] = useState<number>(4);
  const [district, setDistrict] = useState('Dambulla, Matale');
  const [description, setDescription] = useState('Wholesale harvested produce, packed in standard 50kg ventilated mesh bags. Ready for prompt pickup or nationwide refrigerated transport.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (p: typeof PRESET_LOTS[0]) => {
    setSelectedPreset(p);
    setTitle(p.title);
    setVariety(p.variety);
    setGrade(p.grade);
    setLotSizeKg(p.defaultLotKg.toString());
    setStartingPrice(p.startPrice.toString());
    setReservePrice(p.reservePrice.toString());
  };

  const handleLaunch = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter lot title.');
      return;
    }
    const lotKg = parseInt(lotSizeKg, 10);
    const startP = parseInt(startingPrice, 10);
    const reserveP = parseInt(reservePrice, 10);

    if (isNaN(lotKg) || lotKg <= 0) {
      Alert.alert('Invalid Lot Size', 'Please enter wholesale quantity in kg.');
      return;
    }
    if (isNaN(startP) || startP <= 0) {
      Alert.alert('Invalid Price', 'Please enter starting bid per kg.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endTime = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
      const created = await AuctionService.createAuction({
        cropName: title.trim(),
        variety: variety.trim(),
        grade: grade.trim(),
        lotSizeKg: lotKg,
        image: selectedPreset.image,
        startingPricePerKg: startP,
        reservePricePerKg: isNaN(reserveP) ? startP : reserveP,
        minBidIncrement: 5,
        endTime,
        locationDistrict: district.trim(),
        description: description.trim(),
      });

      setIsSubmitting(false);
      Alert.alert(
        'Auction Live!',
        `Your auction for ${created.cropName} is now live and accepting buyer bids.`,
        [{ text: 'View Room', onPress: () => onAuctionCreated(created) }]
      );
    } catch (e: any) {
      setIsSubmitting(false);
      Alert.alert('Error', e?.message || 'Could not launch auction.');
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
          <Text style={styles.navTitle}>Create Produce Auction</Text>
          <Text style={styles.navSub}>Wholesale bidding for verified commercial buyers</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Preset Templates */}
        <Text style={styles.sectionTitle}>Select Lot Preset</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {PRESET_LOTS.map((p) => {
            const isSel = selectedPreset.title === p.title;
            return (
              <Pressable
                key={p.title}
                style={[styles.presetCard, isSel && styles.presetCardActive]}
                onPress={() => handleSelectPreset(p)}
              >
                <Image source={{ uri: p.image }} style={styles.presetImg} contentFit="cover" />
                <Text style={styles.presetTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.presetKg}>{p.defaultLotKg} kg lot</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Inputs */}
        <View style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Auction Lot Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Grade-A Dambulla Red Onions"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Variety</Text>
              <TextInput
                style={styles.input}
                value={variety}
                onChangeText={setVariety}
                placeholder="e.g. Special Bulb"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Quality Grade</Text>
              <TextInput
                style={styles.input}
                value={grade}
                onChangeText={setGrade}
                placeholder="e.g. A+ Export"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Wholesale Lot (kg)</Text>
              <TextInput
                style={styles.input}
                value={lotSizeKg}
                onChangeText={setLotSizeKg}
                keyboardType="number-pad"
                placeholder="1000"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Starting Bid / kg (Rs.)</Text>
              <TextInput
                style={styles.input}
                value={startingPrice}
                onChangeText={setStartingPrice}
                keyboardType="number-pad"
                placeholder="320"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Reserve Price / kg (Rs.)</Text>
              <TextInput
                style={styles.input}
                value={reservePrice}
                onChangeText={setReservePrice}
                keyboardType="number-pad"
                placeholder="380"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>District / Hub</Text>
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
                placeholder="e.g. Dambulla"
              />
            </View>
          </View>

          {/* Duration Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Auction Duration</Text>
            <View style={styles.durationRow}>
              {[1, 4, 12, 24].map((hrs) => (
                <Pressable
                  key={hrs}
                  style={[styles.durationPill, durationHours === hrs && styles.durationPillActive]}
                  onPress={() => setDurationHours(hrs)}
                >
                  <Text style={[styles.durationText, durationHours === hrs && styles.durationTextActive]}>
                    {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Lot Packaging & Transport Notes</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Launch Button */}
        <Pressable
          style={[styles.launchBtn, isSubmitting && styles.launchBtnDisabled]}
          onPress={handleLaunch}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.launchBtnText}>Launch Live Auction Lot</Text>
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
    width: 150,
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
  presetTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetKg: {
    fontSize: 11.5,
    fontWeight: '700',
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
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  durationPillActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  durationTextActive: {
    color: '#FFFFFF',
  },
  launchBtn: {
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
  launchBtnDisabled: {
    opacity: 0.7,
  },
  launchBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
