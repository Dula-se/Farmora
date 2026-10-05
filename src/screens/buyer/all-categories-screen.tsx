import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  count: string;
  color: string;
}

export const MARKET_CATEGORIES: CategoryItem[] = [
  { id: 'vegetables', name: 'Vegetables', emoji: '🥦', count: '120+ crops', color: '#DCFCE7' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎', count: '85+ fruits', color: '#FEE2E2' },
  { id: 'grains', name: 'Grains & Rice', emoji: '🌾', count: '40+ types', color: '#FEF3C7' },
  { id: 'spices', name: 'Ceylon Spices', emoji: '🌶️', count: '30+ spices', color: '#FFEDD5' },
  { id: 'organic', name: 'Certified Organic', emoji: '🌱', count: '65+ crops', color: '#E0F2FE' },
  { id: 'tea', name: 'Pure Ceylon Tea', emoji: '🍵', count: '25+ estates', color: '#ECFCCB' },
  { id: 'tubers', name: 'Tubers & Roots', emoji: '🥔', count: '18+ varieties', color: '#F3E8FF' },
  { id: 'herbs', name: 'Fresh Herbs', emoji: '🌿', count: '22+ herbs', color: '#E0E7FF' },
  { id: 'mushrooms', name: 'Mushrooms', emoji: '🍄', count: '12+ farms', color: '#FCE7F3' },
  { id: 'dairy', name: 'Farm Dairy', emoji: '🥛', count: '15+ products', color: '#E0F2FE' },
  { id: 'flowers', name: 'Fresh Cut Flowers', emoji: '🌸', count: '10+ growers', color: '#FFE4E6' },
  { id: 'other', name: 'Other Farm Produce', emoji: '📦', count: '45+ items', color: '#F1F5F9' },
];

interface AllCategoriesScreenProps {
  onBack: () => void;
  onSelectCategory: (categoryId: string, categoryName: string) => void;
}

export function AllCategoriesScreen({
  onBack,
  onSelectCategory,
}: AllCategoriesScreenProps) {
  const [search, setSearch] = useState('');

  const filtered = MARKET_CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.placeholderBtn} />
      </View>

      {/* Search Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filtered.map((cat) => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                styles.categoryCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => onSelectCategory(cat.id, cat.name)}>
              <View style={[styles.iconCircle, { backgroundColor: cat.color }]}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {cat.name}
              </Text>
              <Text style={styles.categoryCount}>{cat.count}</Text>
            </Pressable>
          ))}
        </View>
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
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  placeholderBtn: {
    width: 36,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearBtn: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 16,
    height: 32,
  },
  categoryCount: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
});
