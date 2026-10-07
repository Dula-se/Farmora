import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchFavouriteFarms, toggleFavouriteFarmApi } from '@/services/api';

interface FavouriteFarmsScreenProps {
  onBack?: () => void;
  onViewFarm?: (farmerId: string, farmerName: string) => void;
}

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Organic', 'Spices'];

export function FavouriteFarmsScreen({ onBack, onViewFarm }: FavouriteFarmsScreenProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    setLoading(true);
    try {
      await fetchFavouriteFarms();
    } catch {
      // ignore
    }

    // Curated high quality mock farms matching Screen 10 in Figma
    setFarms([
      {
        id: 'kamal-gunawardana',
        name: 'Govigedara Organic Farm',
        farmerName: 'Kamal Gunawardana',
        district: 'Nuwara Eliya',
        category: 'Vegetables',
        rating: 4.9,
        reviewsCount: 124,
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
        badges: ['GAP Certified', 'USDA Organic'],
        cropsCount: 14,
      },
      {
        id: 'lanka-greens',
        name: 'Lanka Greens Agro Estate',
        farmerName: 'Sunil Bandara',
        district: 'Dambulla',
        category: 'Vegetables',
        rating: 4.8,
        reviewsCount: 98,
        image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=600',
        badges: ['Direct Source', 'Wholesale Ready'],
        cropsCount: 8,
      },
      {
        id: 'central-highlands',
        name: 'Central Highlands Cooperative',
        farmerName: 'Ravi Fernando',
        district: 'Badulla',
        category: 'Fruits',
        rating: 4.7,
        reviewsCount: 85,
        image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600',
        badges: ['Organic', 'Eco Friendly'],
        cropsCount: 11,
      },
    ]);
    setLoading(false);
  };

  const handleToggleRemove = async (farmId: string, farmName: string) => {
    Alert.alert('Remove Favourite', `Remove ${farmName} from your favourite farms?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await toggleFavouriteFarmApi(farmId);
          } catch {
            // ignore
          }
          setFarms((prev) => prev.filter((f) => f.id !== farmId));
        },
      },
    ]);
  };

  const filteredFarms = farms.filter((f) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Organic') return f.badges?.includes('Organic') || f.badges?.includes('USDA Organic');
    return f.category === activeCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Favourite Farms</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryChip,
                activeCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(cat)}>
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#386641" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.farmsList}>
            {filteredFarms.map((farm) => (
              <View key={farm.id} style={styles.farmCard}>
                <Image source={{ uri: farm.image }} style={styles.farmImage} />

                {/* Remove heart button */}
                <Pressable
                  style={styles.heartBtn}
                  onPress={() => handleToggleRemove(farm.id, farm.name)}>
                  <Text style={styles.heartIcon}>❤️</Text>
                </Pressable>

                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.farmName}>{farm.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.starIcon}>★</Text>
                      <Text style={styles.ratingScore}>{farm.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.farmerSub}>
                    Farmer: {farm.farmerName} • 📍 {farm.district}
                  </Text>

                  {/* Badges */}
                  <View style={styles.badgesRow}>
                    {farm.badges?.map((badge: string) => (
                      <View key={badge} style={styles.badgePill}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                    <Text style={styles.cropsCountText}>{farm.cropsCount} Crops Listed</Text>
                  </View>

                  {/* View Farm Button */}
                  <Pressable
                    style={styles.viewFarmBtn}
                    onPress={() => onViewFarm?.(farm.id, farm.farmerName)}>
                    <Text style={styles.viewFarmBtnText}>View Farm & Produce →</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  categoriesScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#386641',
    borderColor: '#386641',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  farmsList: {
    gap: 16,
  },
  farmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  farmImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    color: '#EAB308',
    fontSize: 14,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  badgePill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  cropsCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  viewFarmBtn: {
    backgroundColor: '#EDF4EC',
    borderWidth: 1,
    borderColor: '#D4E2D3',
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFarmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
});
