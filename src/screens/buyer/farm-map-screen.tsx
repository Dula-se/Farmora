import React, { useRef, useState } from 'react';
import {
  Linking,
  Modal,
  PanResponder,
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
import { LocationPermissionModal, NoFarmsFoundModal } from './location-permission-modal';

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
    name: 'Highland Fresh Fields',
    farmerName: 'Sunil Bandara',
    phone: '+94 71 987 6543',
    address: 'Nanu Oya Road, Blackpool',
    district: 'Nuwara Eliya',
    distanceKm: 12.0,
    driveTimeMin: 28,
    rating: 4.9,
    reviewsCount: 142,
    isVerified: true,
    isOrganic: true,
    latitude: 6.9497,
    longitude: 80.7891,
    image: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=500&auto=format&fit=crop&q=80',
    crops: ['Carrots', 'Leeks', 'Potatoes'],
  },
  {
    id: 'f-2',
    name: 'Perera Organic Farm',
    farmerName: 'Kamal Perera',
    phone: '+94 77 123 4567',
    address: '12/A Fresh Produce Valley, Katugastota',
    district: 'Kandy',
    distanceKm: 18.4,
    driveTimeMin: 35,
    rating: 4.8,
    reviewsCount: 98,
    isVerified: true,
    isOrganic: true,
    latitude: 7.2906,
    longitude: 80.6337,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    crops: ['Tomatoes', 'Green Beans', 'Beetroot'],
  },
  {
    id: 'f-3',
    name: 'Welimada Green Agro',
    farmerName: 'Ranjith Silva',
    phone: '+94 77 444 8899',
    address: 'Boralanda Road, Welimada',
    district: 'Welimada',
    distanceKm: 24.0,
    driveTimeMin: 42,
    rating: 4.9,
    reviewsCount: 210,
    isVerified: true,
    isOrganic: true,
    latitude: 6.9033,
    longitude: 80.9022,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    crops: ['Cabbage', 'Cauliflower', 'Strawberries'],
  },
  {
    id: 'f-4',
    name: 'Matale Spice & Veggie Estate',
    farmerName: 'Nimal Jayawardena',
    phone: '+94 76 555 1234',
    address: 'Kurunegala Junction, Matale',
    district: 'Matale',
    distanceKm: 31.0,
    driveTimeMin: 50,
    rating: 4.7,
    reviewsCount: 67,
    isVerified: true,
    isOrganic: false,
    latitude: 7.4675,
    longitude: 80.6234,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
    crops: ['Sweet Corn', 'Capsicum', 'Black Pepper'],
  },
];

interface FarmMapScreenProps {
  initialFarmId?: string;
  initialView?: 'map' | 'list';
  onBack: () => void;
  onSelectFarmProduct?: (cropName: string) => void;
  onChatFarmer?: (farmerPhone: string) => void;
  onOpenFarmerMatching?: () => void;
  onOpenFarmerProfile?: (farmer: { id: string; name: string; avatar?: string; district?: string }) => void;
}

export const GEOAPIFY_API_KEY =
  'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfYnc1cjIwcnIiLCJqdGkiOiI3MGIxMmFkODMwZTY2MmZmNTYzMDEwYTY2NzI2ZDEyZCJ9.VintDZYgqapaFB1f5_seIlZrYeWbo0ViebMmJxSGsxY';

// Slippy Map / Web Mercator coordinate functions
function latLonToPixel(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * n * 256;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n *
    256;
  return { x, y };
}

function getTileUrl(zoom: number, x: number, y: number, mode: 'street' | 'satellite' | 'dark'): string {
  if (mode === 'satellite') {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}.jpg`;
  }
  if (mode === 'dark') {
    return `https://maps.geoapify.com/v1/tile/dark-matter/${zoom}/${x}/${y}.png?apiKey=${GEOAPIFY_API_KEY}`;
  }
  // Geoapify high-resolution street cartography with authenticated token
  return `https://maps.geoapify.com/v1/tile/osm-bright/${zoom}/${x}/${y}.png?apiKey=${GEOAPIFY_API_KEY}`;
}

export function FarmMapScreen({
  initialFarmId,
  initialView = 'map',
  onBack,
  onSelectFarmProduct,
  onChatFarmer,
  onOpenFarmerMatching,
  onOpenFarmerProfile,
}: FarmMapScreenProps) {
  const [activeView, setActiveView] = useState<'map' | 'list'>(initialView);
  const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'dark'>('street');
  const [zoom, setZoom] = useState<number>(11);
  const [searchQuery, setSearchQuery] = useState('');

  const initialFarm = initialFarmId
    ? MOCK_FARMS.find(
        (f) =>
          f.id === initialFarmId ||
          f.id.replace('-', '') === initialFarmId.replace('-', '') ||
          f.farmerName.toLowerCase().includes(initialFarmId.toLowerCase())
      ) || MOCK_FARMS[0]
    : MOCK_FARMS[0];

  const [selectedFarm, setSelectedFarm] = useState<FarmLocation | null>(initialFarm);
  const [centerCoord, setCenterCoord] = useState<{ lat: number; lon: number }>({
    lat: initialFarm?.latitude || 7.20,
    lon: initialFarm?.longitude || 80.72,
  });
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 380, height: 480 });

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNoFarmsModal, setShowNoFarmsModal] = useState(false);
  const [savedFarms, setSavedFarms] = useState<string[]>([]);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState(50);
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(true);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        panStartRef.current = { ...currentOffsetRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const nextX = panStartRef.current.x + gesture.dx;
        const nextY = panStartRef.current.y + gesture.dy;
        currentOffsetRef.current = { x: nextX, y: nextY };
        setPanOffset({ x: nextX, y: nextY });
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const centerOnFarm = (farm: FarmLocation) => {
    setSelectedFarm(farm);
    setCenterCoord({ lat: farm.latitude, lon: farm.longitude });
    currentOffsetRef.current = { x: 0, y: 0 };
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 14));
    currentOffsetRef.current = { x: 0, y: 0 };
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 9));
    currentOffsetRef.current = { x: 0, y: 0 };
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleSaveFarm = (farmId: string) => {
    if (savedFarms.includes(farmId)) {
      setSavedFarms((prev) => prev.filter((id) => id !== farmId));
    } else {
      setSavedFarms((prev) => [...prev, farmId]);
    }
  };

  const openGoogleMapsDirections = (farm: FarmLocation) => {
    const lat = farm.latitude;
    const lon = farm.longitude;
    const label = encodeURIComponent(farm.name);
    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lon}`,
      android: `google.navigation:q=${lat},${lon}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    });

    if (nativeUrl) {
      Linking.canOpenURL(nativeUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(nativeUrl);
          } else {
            return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
          }
        })
        .catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
        });
    }
  };

  const callFarmer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getFarmCropEmoji = (crops: string[]) => {
    const first = crops[0]?.toLowerCase() || '';
    if (first.includes('carrot') || first.includes('beet')) return '🥕';
    if (first.includes('tomato')) return '🍅';
    if (first.includes('corn')) return '🌽';
    if (first.includes('cabbage') || first.includes('leek')) return '🥬';
    if (first.includes('strawberr')) return '🍓';
    return '🌱';
  };

  const filteredFarms = MOCK_FARMS.filter((farm) => {
    if (onlyOrganic && !farm.isOrganic) return false;
    if (onlyVerified && !farm.isVerified) return false;
    if (farm.distanceKm > maxDistance) return false;
    if (
      searchQuery.trim() &&
      !farm.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !farm.district.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !farm.farmerName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Calculate real tiles for viewport
  const centerPixel = latLonToPixel(centerCoord.lat, centerCoord.lon, zoom);
  const viewLeft = centerPixel.x - mapSize.width / 2 - panOffset.x;
  const viewTop = centerPixel.y - mapSize.height / 2 - panOffset.y;

  const minTileX = Math.floor(viewLeft / 256) - 1;
  const maxTileX = Math.floor((viewLeft + mapSize.width) / 256) + 1;
  const minTileY = Math.floor(viewTop / 256) - 1;
  const maxTileY = Math.floor((viewTop + mapSize.height) / 256) + 1;

  const visibleTiles: { key: string; screenX: number; screenY: number; url: string }[] = [];
  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      visibleTiles.push({
        key: `${zoom}-${tx}-${ty}-${mapMode}`,
        screenX: tx * 256 - viewLeft,
        screenY: ty * 256 - viewTop,
        url: getTileUrl(zoom, tx, ty, mapMode),
      });
    }
  }

  // Calculate pixel positions for real markers
  const markerPositions = filteredFarms.map((farm) => {
    const fPixel = latLonToPixel(farm.latitude, farm.longitude, zoom);
    return {
      farm,
      screenX: fPixel.x - viewLeft,
      screenY: fPixel.y - viewTop,
      isSelected: selectedFarm?.id === farm.id,
    };
  });

  const userPixel = latLonToPixel(7.2906, 80.6337, zoom);
  const userScreenX = userPixel.x - viewLeft;
  const userScreenY = userPixel.y - viewTop;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Search & Filter Bar */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16} style={styles.navBtn} accessibilityLabel="Back">
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search farm, district or grower..."
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
            🗺️ Live Real Map ({filteredFarms.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, activeView === 'list' && styles.toggleBtnActive]}
          onPress={() => setActiveView('list')}>
          <Text style={[styles.toggleBtnText, activeView === 'list' && styles.toggleBtnTextActive]}>
            📋 Farms Directory ({filteredFarms.length})
          </Text>
        </Pressable>
      </View>

      {/* Main View Area */}
      {activeView === 'map' ? (
        <View
          style={styles.mapCanvas}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setMapSize({ width, height });
            }
          }}
          {...panResponder.panHandlers}>
          {/* Real Embedded Cartographic / Satellite Map Tiles */}
          {visibleTiles.map((tile) => (
            <Image
              key={tile.key}
              source={{ uri: tile.url }}
              style={{
                position: 'absolute',
                left: tile.screenX,
                top: tile.screenY,
                width: 256,
                height: 256,
              }}
              contentFit="cover"
              cachePolicy="disk"
            />
          ))}

          {/* Real Farm Markers Positioned on Slippy Map Tiles */}
          {markerPositions.map(({ farm, screenX, screenY, isSelected }) => (
            <Pressable
              key={farm.id}
              style={[
                styles.mapPin,
                {
                  left: screenX - 22,
                  top: screenY - 50,
                },
              ]}
              onPress={() => centerOnFarm(farm)}>
              {/* Pin Callout Badge */}
              <View
                style={[
                  styles.pinCallout,
                  isSelected && styles.pinCalloutActive,
                ]}>
                <Text
                  style={[
                    styles.pinCalloutName,
                    isSelected && styles.pinCalloutNameActive,
                  ]}
                  numberOfLines={1}>
                  {farm.farmerName.split(' ')[0]}
                </Text>
                <Text style={styles.pinCalloutDist}>• {farm.distanceKm}km</Text>
              </View>

              {/* Pin Emoji Bubble */}
              <View
                style={[
                  styles.pinBubble,
                  isSelected && styles.pinBubbleActive,
                ]}>
                <Text style={styles.pinEmoji}>
                  {getFarmCropEmoji(farm.crops)}
                </Text>
              </View>
              <View
                style={[
                  styles.pinStem,
                  isSelected && styles.pinStemActive,
                ]}
              />
            </Pressable>
          ))}

          {/* User Live GPS Marker */}
          <View
            style={[
              styles.userDotContainer,
              {
                left: userScreenX - 14,
                top: userScreenY - 14,
              },
            ]}>
            <View style={styles.userPulse} />
            <View style={styles.userDot} />
            <View style={styles.userCallout}>
              <Text style={styles.userCalloutText}>📍 You (Kandy Hub)</Text>
            </View>
          </View>

          {/* Floating Live GPS & Google Maps Launcher Bar */}
          <View style={styles.mapTopFloatingBar}>
            <Pressable
              style={styles.mapFloatingBackBtn}
              onPress={onBack}
              hitSlop={12}
              accessibilityLabel="Back">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
              <Text style={styles.mapFloatingBackText}>Back</Text>
            </Pressable>

            <View style={styles.gpsLiveBadge}>
              <View style={styles.gpsLiveIndicator} />
              <Text style={styles.gpsLiveText}>
                Geoapify Real Map • {selectedFarm ? `${selectedFarm.latitude.toFixed(3)}°N, ${selectedFarm.longitude.toFixed(3)}°E` : 'Active'}
              </Text>
            </View>

            <Pressable
              style={styles.openGoogleMapsHeaderBtn}
              onPress={() => openGoogleMapsDirections(selectedFarm || MOCK_FARMS[0])}>
              <Text style={styles.googleMapsHeaderIcon}>🚀</Text>
              <Text style={styles.googleMapsHeaderText}>Real Google Maps</Text>
            </Pressable>
          </View>

          {/* Floating Controls: Mode Switcher (Street / Satellite / Dark), Zoom In/Out, Re-center */}
          <View style={styles.mapFloatingControls}>
            <Pressable
              style={[
                styles.floatingControlBtn,
                (mapMode === 'satellite' || mapMode === 'dark') && styles.floatingControlBtnActive,
              ]}
              onPress={() => {
                if (mapMode === 'street') setMapMode('satellite');
                else if (mapMode === 'satellite') setMapMode('dark');
                else setMapMode('street');
              }}>
              <Text style={styles.floatingControlIcon}>
                {mapMode === 'satellite' ? '🛰️' : mapMode === 'dark' ? '🌙' : '🗺️'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.floatingControlBtn}
              onPress={handleZoomIn}>
              <Text style={styles.floatingControlIcon}>➕</Text>
            </Pressable>

            <Pressable
              style={styles.floatingControlBtn}
              onPress={handleZoomOut}>
              <Text style={styles.floatingControlIcon}>➖</Text>
            </Pressable>

            {selectedFarm && (
              <Pressable
                style={styles.floatingControlBtn}
                onPress={() => centerOnFarm(selectedFarm)}>
                <Text style={styles.floatingControlIcon}>🎯</Text>
              </Pressable>
            )}
          </View>

          {/* Bottom Floating Farm Details Sheet */}
          {selectedFarm && (
            <View style={styles.bottomFarmSheet}>
              {/* Route ETA Banner */}
              <View style={styles.etaBanner}>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaText}>
                    ⚡ {selectedFarm.driveTimeMin} min ({selectedFarm.distanceKm} km)
                  </Text>
                </View>
                <Text style={styles.etaSub}>Fastest route via Sri Lanka A1 / A5</Text>
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
                  <Text style={styles.sheetFarmerSub} numberOfLines={1}>
                    Grower: {selectedFarm.farmerName} • {selectedFarm.district}
                  </Text>
                  <Text style={styles.sheetRating}>
                    ★ {selectedFarm.rating} ({selectedFarm.reviewsCount} reviews) • {selectedFarm.isOrganic ? '🌱 Organic' : 'Conventional'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.sheetActionsRow}>
                {/* Farmer Profile & Rate Button */}
                <Pressable
                  style={styles.sheetProfileBtn}
                  onPress={() => {
                    if (onOpenFarmerProfile) {
                      onOpenFarmerProfile({
                        id: selectedFarm.id,
                        name: selectedFarm.farmerName || selectedFarm.name,
                        avatar: selectedFarm.image,
                        district: selectedFarm.district,
                      });
                    }
                  }}>
                  <Text style={styles.sheetProfileBtnIcon}>👨‍🌾</Text>
                  <Text style={styles.sheetProfileBtnText}>Profile & Rate</Text>
                </Pressable>

                {/* Call Farmer */}
                <Pressable
                  style={styles.sheetActionBtn}
                  onPress={() => callFarmer(selectedFarm.phone)}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </Svg>
                  <Text style={styles.sheetActionText}>Call</Text>
                </Pressable>

                {/* Launch Real Google Maps */}
                <Pressable
                  style={styles.sheetDirectionsBtn}
                  onPress={() => openGoogleMapsDirections(selectedFarm)}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 11l19-9-9 19-2-8-8-2z" />
                  </Svg>
                  <Text style={styles.sheetDirectionsText}>Directions</Text>
                </Pressable>
              </View>

              {/* Save Farm Button */}
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
        /* List View (Matching Figma Screen 1) */
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}>
          {/* Top Mini Map Preview Card with Real Map Tiles */}
          <Pressable
            style={styles.topMiniMapCard}
            onPress={() => setActiveView('map')}>
            <View style={styles.miniMapGraphic}>
              <Image
                source={{
                  uri: `https://maps.geoapify.com/v1/tile/osm-bright/11/1482/982.png?apiKey=${GEOAPIFY_API_KEY}`,
                }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(0,0,0,0.1)' },
                ]}
              />
              <View style={{ position: 'absolute', top: 35, left: 60, alignItems: 'center' }}>
                <Text style={{ fontSize: 16 }}>🌱</Text>
              </View>
              <View style={{ position: 'absolute', top: 50, left: 160, alignItems: 'center' }}>
                <Text style={{ fontSize: 16 }}>🥕</Text>
              </View>
              <View style={{ position: 'absolute', top: 25, left: 240, alignItems: 'center' }}>
                <Text style={{ fontSize: 16 }}>🍓</Text>
              </View>
            </View>
            <View style={styles.miniMapFooter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniMapTitle}>Regional Delivery Network</Text>
                <Text style={styles.miniMapSub}>Central Province, Sri Lanka • Real Map Navigation</Text>
              </View>
              <Pressable
                style={styles.expandMapBtn}
                onPress={() => setActiveView('map')}>
                <Text style={styles.expandMapText}>Open Map ↗</Text>
              </Pressable>
            </View>
          </Pressable>

          {/* Quick AI Match Banner */}
          {onOpenFarmerMatching && (
            <Pressable
              style={styles.aiMatchBanner}
              onPress={onOpenFarmerMatching}>
              <View style={styles.aiMatchBadge}>
                <Text style={styles.aiMatchBadgeText}>AI SEARCH</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={styles.aiMatchTitle}>Find Custom Farm Match</Text>
                <Text style={styles.aiMatchSub}>Let our engine select suppliers matching your criteria</Text>
              </View>
              <Text style={styles.aiMatchArrow}>→</Text>
            </Pressable>
          )}

          {/* Header Row: "FARMS IN YOUR RANGE" */}
          <View style={styles.rangeHeaderRow}>
            <Text style={styles.rangeHeaderTitle}>
              FARMS IN YOUR RANGE <Text style={{ color: '#2E7D32' }}>({filteredFarms.length})</Text>
            </Text>
            <Pressable onPress={() => setShowLocationModal(true)}>
              <Text style={styles.changeLocText}>📍 Change Region</Text>
            </Pressable>
          </View>

          {filteredFarms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyTitle}>No Farms Found In This Range</Text>
              <Text style={styles.emptySub}>
                Try widening your distance filter or changing districts.
              </Text>
              <Pressable
                style={styles.expandRadiusBtn}
                onPress={() => {
                  setMaxDistance(100);
                  setOnlyOrganic(false);
                }}>
                <Text style={styles.expandRadiusText}>Increase Search Radius (100km)</Text>
              </Pressable>
            </View>
          ) : (
            filteredFarms.map((farm) => (
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
                    📍 {farm.address}, {farm.district} • ⚡ {farm.driveTimeMin} min
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
            ))
          )}
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

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        onAllowLocation={() => {
          setShowLocationModal(false);
        }}
        onManualLocation={() => {
          setShowLocationModal(false);
          setShowFiltersModal(true);
        }}
        onClose={() => setShowLocationModal(false)}
      />

      {/* No Farms Modal */}
      <NoFarmsFoundModal
        visible={showNoFarmsModal}
        searchRadiusKm={maxDistance}
        onIncreaseRadius={() => {
          setMaxDistance(100);
          setShowNoFarmsModal(false);
        }}
        onChangeLocation={() => {
          setShowNoFarmsModal(false);
          setShowFiltersModal(true);
        }}
        onExploreAll={() => {
          setMaxDistance(200);
          setShowNoFarmsModal(false);
        }}
        onClose={() => setShowNoFarmsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 0,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#0F172A',
  },
  mapGraphicContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  realMapImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mapTopFloatingBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  mapFloatingBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },
  mapFloatingBackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  gpsLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gpsLiveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  gpsLiveText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  openGoogleMapsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  googleMapsHeaderIcon: {
    fontSize: 12,
  },
  googleMapsHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  mapFloatingControls: {
    position: 'absolute',
    top: 54,
    right: 12,
    gap: 8,
    zIndex: 10,
  },
  floatingControlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floatingControlBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  floatingControlIcon: {
    fontSize: 16,
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  pinCallout: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  pinCalloutActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  pinCalloutName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  pinCalloutNameActive: {
    color: '#FFFFFF',
  },
  pinCalloutDist: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
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
  pinStemActive: {
    backgroundColor: '#15803D',
    width: 3.5,
  },
  userDotContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
  },
  userPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userCallout: {
    position: 'absolute',
    top: -24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  userCalloutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 20,
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
  sheetFarmerSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
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
    gap: 8,
    marginBottom: 10,
  },
  sheetProfileBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  sheetProfileBtnIcon: {
    fontSize: 13,
  },
  sheetProfileBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  sheetActionBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  sheetActionText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  sheetDirectionsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    gap: 5,
  },
  sheetDirectionsText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  topMiniMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniMapGraphic: {
    height: 100,
    backgroundColor: '#F1F5F9',
  },
  miniMapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  miniMapTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  miniMapSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  expandMapBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  expandMapText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  aiMatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B4332',
    padding: 12,
    borderRadius: 12,
  },
  aiMatchBadge: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiMatchBadgeText: {
    color: '#D8F3DC',
    fontSize: 9,
    fontWeight: '800',
  },
  aiMatchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aiMatchSub: {
    fontSize: 10,
    color: '#D8F3DC',
  },
  aiMatchArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rangeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rangeHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  changeLocText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  expandRadiusBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  expandRadiusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
