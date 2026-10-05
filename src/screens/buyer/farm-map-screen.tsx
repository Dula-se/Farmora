import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
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
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

export interface FarmLocation {
  id: string;
  name: string;
  farmerName: string;
  phone: string;
  address: string;
  district: string;
  distanceKm: number;
  driveTimeMin: number;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  isOrganic: boolean;
  latitude: number;
  longitude: number;
  image: string;
  crops: string[];
}

const MOCK_FARMS: FarmLocation[] = [
  {
    id: 'f-1',
    name: 'Perera Organic Farm',
    farmerName: 'K. Perera',
    phone: '+94 77 123 4567',
    address: '12/A Fresh Produce Valley, Katugastota',
    district: 'Kandy',
    distanceKm: 18.4,
    driveTimeMin: 35,
    rating: 4.9,
    reviewsCount: 124,
    isVerified: true,
    isOrganic: true,
    latitude: 7.2906,
    longitude: 80.6337,
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&auto=format&fit=crop&q=60',
    crops: ['Tomatoes', 'Green Beans', 'Beetroot'],
  },
  {
    id: 'f-2',
    name: 'Highland Fresh Fields',
    farmerName: 'Sunil Bandara',
    phone: '+94 71 987 6543',
    address: 'Nanu Oya Road, Blackpool',
    district: 'Nuwara Eliya',
    distanceKm: 42.1,
    driveTimeMin: 75,
    rating: 4.7,
    reviewsCount: 88,
    isVerified: true,
    isOrganic: false,
    latitude: 6.9497,
    longitude: 80.7891,
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=60',
    crops: ['Carrots', 'Leeks', 'Potatoes'],
  },
  {
    id: 'f-3',
    name: 'Dambulla Harvest Valley',
    farmerName: 'Chaminda Silva',
    phone: '+94 76 555 1234',
    address: 'Kurunegala Junction, Dambulla',
    district: 'Matale',
    distanceKm: 28.0,
    driveTimeMin: 45,
    rating: 4.8,
    reviewsCount: 156,
    isVerified: true,
    isOrganic: true,
    latitude: 7.8742,
    longitude: 80.6511,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop&q=60',
    crops: ['Sweet Corn', 'Onions', 'Capsicum'],
  },
];

interface FarmMapScreenProps {
  onBack: () => void;
  onSelectFarmProduct?: (cropName: string) => void;
  onChatFarmer?: (farmerPhone: string) => void;
}

export function FarmMapScreen({
  onBack,
  onSelectFarmProduct,
  onChatFarmer,
}: FarmMapScreenProps) {
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<FarmLocation | null>(MOCK_FARMS[0]);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [savedFarms, setSavedFarms] = useState<string[]>([]);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState(50);
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(true);

  const toggleSaveFarm = (farmId: string) => {
    if (savedFarms.includes(farmId)) {
      setSavedFarms((prev) => prev.filter((id) => id !== farmId));
    } else {
      setSavedFarms((prev) => [...prev, farmId]);
    }
  };

  const openGoogleMapsDirections = (farm: FarmLocation) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${farm.latitude},${farm.longitude}(${encodeURIComponent(farm.name)})`,
      android: `geo:0,0?q=${farm.latitude},${farm.longitude}(${encodeURIComponent(farm.name)})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${farm.latitude},${farm.longitude}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(farm.address + ' ' + farm.district)}`);
      });
    }
  };

  const callFarmer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const filteredFarms = MOCK_FARMS.filter((farm) => {
    if (onlyOrganic && !farm.isOrganic) return false;
    if (onlyVerified && !farm.isVerified) return false;
    if (farm.distanceKm > maxDistance) return false;
    if (
      searchQuery.trim() &&
      !farm.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !farm.district.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Search & Filter Bar (Matching Figma Screens 8 & 9) */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search farm name or region..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable
          style={styles.filterBtn}
          onPress={() => setShowFiltersModal(true)}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </Svg>
        </Pressable>
      </View>

      {/* Toggle View Tabs: Map vs List */}
      <View style={styles.viewToggleRow}>
        <Pressable
          style={[styles.toggleBtn, activeView === 'map' && styles.toggleBtnActive]}
          onPress={() => setActiveView('map')}>
          <Text style={[styles.toggleBtnText, activeView === 'map' && styles.toggleBtnTextActive]}>
            🗺️ Map View
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, activeView === 'list' && styles.toggleBtnActive]}
          onPress={() => setActiveView('list')}>
          <Text style={[styles.toggleBtnText, activeView === 'list' && styles.toggleBtnTextActive]}>
            📋 Nearby Farms ({filteredFarms.length})
          </Text>
        </Pressable>
      </View>

      {/* Main View Area */}
      {activeView === 'map' ? (
        <View style={styles.mapCanvas}>
          {/* Simulated High-Res Map Grid Graphic */}
          <View style={styles.mapGraphicContainer}>
            {/* SVG Roads & Terrain overlay */}
            <Svg width="100%" height="100%" viewBox="0 0 400 500" style={StyleSheet.absoluteFill}>
              {/* Grid map tiles */}
              <Path d="M 0 120 L 400 120 M 0 260 L 400 260 M 0 380 L 400 380" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4,4" />
              <Path d="M 120 0 L 120 500 M 260 0 L 260 500" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4,4" />
              {/* River / Road */}
              <Path d="M -20 180 Q 140 160 200 240 T 420 310" stroke="#93C5FD" strokeWidth={14} fill="none" opacity={0.4} />
              {/* Main Highway Route */}
              <Path d="M 30 420 C 100 350 120 280 200 230 C 260 190 310 130 330 60" stroke="#22C55E" strokeWidth={5} fill="none" strokeLinecap="round" />
            </Svg>

            {/* Farm Pin 1 */}
            <Pressable
              style={[styles.mapPin, { top: 60, left: 310 }]}
              onPress={() => setSelectedFarm(MOCK_FARMS[0])}>
              <View style={[styles.pinBubble, selectedFarm?.id === 'f-1' && styles.pinBubbleActive]}>
                <Text style={styles.pinEmoji}>🌱</Text>
              </View>
              <View style={styles.pinStem} />
            </Pressable>

            {/* Farm Pin 2 */}
            <Pressable
              style={[styles.mapPin, { top: 220, left: 180 }]}
              onPress={() => setSelectedFarm(MOCK_FARMS[1])}>
              <View style={[styles.pinBubble, selectedFarm?.id === 'f-2' && styles.pinBubbleActive]}>
                <Text style={styles.pinEmoji}>🥕</Text>
              </View>
              <View style={styles.pinStem} />
            </Pressable>

            {/* Farm Pin 3 */}
            <Pressable
              style={[styles.mapPin, { top: 350, left: 70 }]}
              onPress={() => setSelectedFarm(MOCK_FARMS[2])}>
              <View style={[styles.pinBubble, selectedFarm?.id === 'f-3' && styles.pinBubbleActive]}>
                <Text style={styles.pinEmoji}>🌽</Text>
              </View>
              <View style={styles.pinStem} />
            </Pressable>

            {/* User Location Marker (Blue Dot) */}
            <View style={[styles.userDotContainer, { top: 400, left: 35 }]}>
              <View style={styles.userPulse} />
              <View style={styles.userDot} />
            </View>
          </View>

          {/* Bottom Floating Direction / Farm Sheet (Matching Figma Screens 11 & 12) */}
          {selectedFarm && (
            <View style={styles.bottomFarmSheet}>
              {/* Transit Route ETA Banner */}
              <View style={styles.etaBanner}>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaText}>
                    ⚡ {selectedFarm.driveTimeMin} min ({selectedFarm.distanceKm} km)
                  </Text>
                </View>
                <Text style={styles.etaSub}>Fastest route via A1 / Katugastota</Text>
              </View>

              {/* Farm Details Row */}
              <View style={styles.sheetHeader}>
                <Image
                  source={{ uri: selectedFarm.image }}
                  style={styles.sheetThumb}
                  contentFit="cover"
                />
                <View style={styles.sheetInfo}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {selectedFarm.name}
                  </Text>
                  <Text style={styles.sheetAddress} numberOfLines={1}>
                    📍 {selectedFarm.address}, {selectedFarm.district}
                  </Text>
                  <Text style={styles.sheetRating}>
                    ★ {selectedFarm.rating} ({selectedFarm.reviewsCount} reviews) • {selectedFarm.isOrganic ? '🌱 Organic' : 'Conventional'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Call, Chat, Directions */}
              <View style={styles.sheetActionsRow}>
                <Pressable
                  style={styles.sheetActionBtn}
                  onPress={() => callFarmer(selectedFarm.phone)}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </Svg>
                  <Text style={styles.sheetActionText}>Call</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetActionBtn}
                  onPress={() => onChatFarmer?.(selectedFarm.phone)}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </Svg>
                  <Text style={styles.sheetActionText}>Chat</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetDirectionsBtn}
                  onPress={() => openGoogleMapsDirections(selectedFarm)}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 11l19-9-9 19-2-8-8-2z" />
                  </Svg>
                  <Text style={styles.sheetDirectionsText}>Directions</Text>
                </Pressable>
              </View>

              {/* Save Farm To List button */}
              <Pressable
                style={styles.saveFarmBtn}
                onPress={() => toggleSaveFarm(selectedFarm.id)}>
                <Text style={styles.saveFarmBtnText}>
                  {savedFarms.includes(selectedFarm.id)
                    ? '✓ Farm Saved to Personal List'
                    : '+ Save Farm to My List'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        /* List View (Matching Figma Screen 10) */
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}>
          {filteredFarms.map((farm) => (
            <View key={farm.id} style={styles.farmCard}>
              <Image
                source={{ uri: farm.image }}
                style={styles.farmCardImage}
                contentFit="cover"
              />
              <View style={styles.farmCardBody}>
                <View style={styles.farmCardTitleRow}>
                  <Text style={styles.farmCardTitle}>{farm.name}</Text>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceBadgeText}>{farm.distanceKm} km</Text>
                  </View>
                </View>

                <Text style={styles.farmCardLocation}>
                  📍 {farm.address}, {farm.district}
                </Text>

                <View style={styles.cropsRow}>
                  {farm.crops.map((crop) => (
                    <Pressable
                      key={crop}
                      style={styles.cropPill}
                      onPress={() => onSelectFarmProduct?.(crop)}>
                      <Text style={styles.cropPillText}>{crop}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.farmCardBottomRow}>
                  <Text style={styles.ratingLabel}>★ {farm.rating} ({farm.reviewsCount})</Text>

                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.viewOnMapBtn}
                      onPress={() => {
                        setSelectedFarm(farm);
                        setActiveView('map');
                      }}>
                      <Text style={styles.viewOnMapText}>View on Map</Text>
                    </Pressable>

                    <Pressable
                      style={styles.directionsBtnSmall}
                      onPress={() => openGoogleMapsDirections(farm)}>
                      <Text style={styles.directionsBtnSmallText}>Directions</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Map Filters Modal (Matching Figma Screen 9) */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFiltersModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.filtersSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Map Filters</Text>
              <Pressable
                onPress={() => {
                  setSelectedCategory('All');
                  setMaxDistance(50);
                  setOnlyOrganic(false);
                  setOnlyVerified(true);
                }}>
                <Text style={styles.resetFiltersText}>Reset</Text>
              </Pressable>
            </View>

            {/* Crop Categories */}
            <Text style={styles.filterSectionTitle}>Crop Categories</Text>
            <View style={styles.catChipsRow}>
              {['All', 'Vegetables', 'Fruits', 'Spices', 'Grains'].map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.catChip,
                    selectedCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}>
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat && styles.catChipTextActive,
                    ]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Distance Slider */}
            <View style={styles.distanceSection}>
              <View style={styles.distanceHeader}>
                <Text style={styles.filterSectionTitle}>Max Distance</Text>
                <Text style={styles.distanceValue}>{maxDistance} km</Text>
              </View>
              <View style={styles.distancePresetsRow}>
                {[15, 30, 50, 100].map((dist) => (
                  <Pressable
                    key={dist}
                    style={[
                      styles.distPresetBtn,
                      maxDistance === dist && styles.distPresetBtnActive,
                    ]}
                    onPress={() => setMaxDistance(dist)}>
                    <Text
                      style={[
                        styles.distPresetText,
                        maxDistance === dist && styles.distPresetTextActive,
                      ]}>
                      &lt; {dist} km
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Verification Toggles */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Verified Farmers Only</Text>
              <Switch
                value={onlyVerified}
                onValueChange={setOnlyVerified}
                trackColor={{ false: '#CBD5E1', true: '#2E7D32' }}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>100% Organic Certified</Text>
              <Switch
                value={onlyOrganic}
                onValueChange={setOnlyOrganic}
                trackColor={{ false: '#CBD5E1', true: '#2E7D32' }}
              />
            </View>

            {/* Apply Button */}
            <Pressable
              style={styles.applyFilterBtn}
              onPress={() => setShowFiltersModal(false)}>
              <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  mapGraphicContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pinBubbleActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#15803D',
    transform: [{ scale: 1.15 }],
  },
  pinEmoji: {
    fontSize: 16,
  },
  pinStem: {
    width: 3,
    height: 8,
    backgroundColor: '#15803D',
  },
  userDotContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bottomFarmSheet: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  etaBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  etaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  etaSub: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  sheetHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sheetThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  sheetInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetRating: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 4,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  sheetActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  sheetActionText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetDirectionsBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    gap: 6,
  },
  sheetDirectionsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  saveFarmBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveFarmBtnText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  // List View Styles
  listContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  farmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  farmCardImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#E2E8F0',
  },
  farmCardBody: {
    padding: 14,
  },
  farmCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  distanceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  farmCardLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  cropsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  cropPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cropPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  farmCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EAB308',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewOnMapBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  viewOnMapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  directionsBtnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
  },
  directionsBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  resetFiltersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  catChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#2E7D32',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  distanceSection: {
    marginBottom: 18,
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },
  distancePresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  distPresetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  distPresetBtnActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  distPresetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  distPresetTextActive: {
    color: '#15803D',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  applyFilterBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
