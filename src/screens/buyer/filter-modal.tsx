import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export interface FilterState {
  district: string;
  category: string;
  isOrganicOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating: number;
  stockStatus: string;
}

interface FilterModalProps {
  visible: boolean;
  initialFilters?: Partial<FilterState>;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

const DISTRICT_OPTIONS = [
  'All Districts',
  'Colombo',
  'Kandy',
  'Nuwara Eliya',
  'Jaffna',
  'Anuradhapura',
  'Kurunegala',
  'Badulla',
];

const CATEGORY_OPTIONS = [
  { id: '', label: 'All Categories' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'grains', label: 'Grains & Rice' },
  { id: 'spices', label: 'Spices' },
  { id: 'organic', label: 'Organic' },
  { id: 'tea', label: 'Ceylon Tea' },
];

const RATING_OPTIONS = [0, 3.5, 4.0, 4.5];
const STOCK_OPTIONS = ['All', 'available', 'harvesting_soon'];

export function FilterModal({
  visible,
  initialFilters,
  onClose,
  onApply,
  onReset,
}: FilterModalProps) {
  const [district, setDistrict] = useState(initialFilters?.district || 'All Districts');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [isOrganicOnly, setIsOrganicOnly] = useState(initialFilters?.isOrganicOnly || false);
  const [minRating, setMinRating] = useState(initialFilters?.minRating || 0);
  const [stockStatus, setStockStatus] = useState(initialFilters?.stockStatus || 'All');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(initialFilters?.maxPrice);

  const handleApply = () => {
    onApply({
      district: district === 'All Districts' ? '' : district,
      category,
      isOrganicOnly,
      maxPrice,
      minRating,
      stockStatus,
    });
    onClose();
  };

  const handleReset = () => {
    setDistrict('All Districts');
    setCategory('');
    setIsOrganicOnly(false);
    setMinRating(0);
    setStockStatus('All');
    setMaxPrice(undefined);
    onReset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable onPress={handleReset} hitSlop={10}>
            <Text style={styles.resetBtnText}>Reset All</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* 1. Location / District */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Delivery Location / District</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
              <View style={styles.pillsRow}>
                {DISTRICT_OPTIONS.map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.pill,
                      district === d && styles.pillActive,
                    ]}
                    onPress={() => setDistrict(d)}>
                    <Text
                      style={[
                        styles.pillText,
                        district === d && styles.pillTextActive,
                      ]}>
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 2. Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.pillsWrap}>
              {CATEGORY_OPTIONS.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.pill,
                    category === cat.id && styles.pillActive,
                  ]}
                  onPress={() => setCategory(cat.id)}>
                  <Text
                    style={[
                      styles.pillText,
                      category === cat.id && styles.pillTextActive,
                    ]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 3. Price Filter */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>Max Price (Rs. / kg)</Text>
              <Text style={styles.activePriceLabel}>
                {maxPrice ? `Under Rs. ${maxPrice}` : 'Any Price'}
              </Text>
            </View>
            <View style={styles.pillsWrap}>
              {[undefined, 300, 500, 800, 1500].map((p) => (
                <Pressable
                  key={p === undefined ? 'any' : String(p)}
                  style={[
                    styles.pill,
                    maxPrice === p && styles.pillActive,
                  ]}
                  onPress={() => setMaxPrice(p)}>
                  <Text
                    style={[
                      styles.pillText,
                      maxPrice === p && styles.pillTextActive,
                    ]}>
                    {p === undefined ? 'Any Price' : `< Rs. ${p}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 4. Organic Switch */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>🌱 Certified Organic Only</Text>
              <Text style={styles.switchSub}>
                Only show certified pesticide-free crops
              </Text>
            </View>
            <Switch
              value={isOrganicOnly}
              onValueChange={setIsOrganicOnly}
              trackColor={{ false: '#CBD5E1', true: '#386641' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* 5. Farmer Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Minimum Farmer Rating</Text>
            <View style={styles.pillsRow}>
              {RATING_OPTIONS.map((r) => (
                <Pressable
                  key={r}
                  style={[
                    styles.pill,
                    minRating === r && styles.pillActive,
                  ]}
                  onPress={() => setMinRating(r)}>
                  <Text
                    style={[
                      styles.pillText,
                      minRating === r && styles.pillTextActive,
                    ]}>
                    {r === 0 ? 'Any Rating' : `★ ${r}+`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  scrollContent: {
    padding: 20,
    gap: 22,
    paddingBottom: 100,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activePriceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  pillsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#386641',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#166534',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyBtn: {
    backgroundColor: '#386641',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
