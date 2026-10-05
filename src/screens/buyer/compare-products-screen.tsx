import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { ApiProduceItem } from '@/services/api';

export interface CompareProductItem {
  id: string;
  title: string;
  pricePerUnit: number;
  unit: string;
  image: string;
  farmerName: string;
  farmingMethod: string;
  grade: string;
  harvestDate: string;
  minOrder: number;
  shelfLife: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  isOrganic: boolean;
}

const DEFAULT_COMPARE_PRODUCTS: CompareProductItem[] = [
  {
    id: 'c-1',
    title: 'Organic Red Tomatoes',
    pricePerUnit: 240,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
    farmerName: 'Perera Organic Farm',
    farmingMethod: '100% Organic',
    grade: 'A Grade',
    harvestDate: 'Fresh Today',
    minOrder: 10,
    shelfLife: '7 Days',
    distance: '18.4 km',
    rating: 4.9,
    reviewsCount: 124,
    isOrganic: true,
  },
  {
    id: 'c-2',
    title: 'Roma Standard Tomatoes',
    pricePerUnit: 195,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=500&auto=format&fit=crop&q=60',
    farmerName: 'Highland Fresh Fields',
    farmingMethod: 'Conventional',
    grade: 'Standard',
    harvestDate: 'Yesterday',
    minOrder: 25,
    shelfLife: '5 Days',
    distance: '42.1 km',
    rating: 4.5,
    reviewsCount: 68,
    isOrganic: false,
  },
  {
    id: 'c-3',
    title: 'Cherry Tomatoes Pack',
    pricePerUnit: 320,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=500&auto=format&fit=crop&q=60',
    farmerName: 'Dambulla Valley Hydro',
    farmingMethod: 'Hydroponic Organic',
    grade: 'Premium Select',
    harvestDate: 'Fresh Today',
    minOrder: 5,
    shelfLife: '8 Days',
    distance: '28.0 km',
    rating: 4.8,
    reviewsCount: 92,
    isOrganic: true,
  },
];

interface CompareProductsScreenProps {
  initialProduct?: ApiProduceItem | null;
  onBack: () => void;
  onSelectProduct?: (product: CompareProductItem) => void;
  onOrderProduct?: (product: CompareProductItem) => void;
}

export function CompareProductsScreen({
  initialProduct,
  onBack,
  onSelectProduct,
  onOrderProduct,
}: CompareProductsScreenProps) {
  const [selectedCol, setSelectedCol] = useState<number>(0);

  // If an initial product is provided, personalize column 0 with its details
  const products: CompareProductItem[] = [
    initialProduct
      ? {
          id: initialProduct._id || initialProduct.id || 'c-1',
          title: initialProduct.title,
          pricePerUnit: initialProduct.pricePerUnit,
          unit: initialProduct.unit || 'kg',
          image: initialProduct.images?.[0] || DEFAULT_COMPARE_PRODUCTS[0].image,
          farmerName: initialProduct.farmerName || 'Local Farmer',
          farmingMethod: initialProduct.isOrganic ? '100% Organic' : 'Conventional',
          grade: 'A Grade',
          harvestDate: initialProduct.harvestDate || 'Fresh Today',
          minOrder: initialProduct.minimumOrderQuantity || 10,
          shelfLife: '7 Days',
          distance: '18.4 km',
          rating: 4.9,
          reviewsCount: 124,
          isOrganic: !!initialProduct.isOrganic,
        }
      : DEFAULT_COMPARE_PRODUCTS[0],
    DEFAULT_COMPARE_PRODUCTS[1],
    DEFAULT_COMPARE_PRODUCTS[2],
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <Text style={styles.navTitle}>Compare Products</Text>

        <Pressable hitSlop={12} style={styles.navBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Subtitle / Tip banner */}
        <View style={styles.tipBanner}>
          <Text style={styles.tipText}>
            Comparing 3 varieties side-by-side to help you get the best farm-direct deal.
          </Text>
        </View>

        {/* Column Headers (Photos & Names) */}
        <View style={styles.columnsHeaderRow}>
          <View style={styles.attributeLabelCol}>
            <Text style={styles.attributeColTitle}>Features</Text>
          </View>

          {products.map((p, idx) => (
            <Pressable
              key={p.id}
              style={[
                styles.productColHeader,
                selectedCol === idx && styles.productColActive,
              ]}
              onPress={() => setSelectedCol(idx)}>
              <View style={styles.imageBox}>
                <Image
                  source={{ uri: p.image }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
                {p.isOrganic && (
                  <View style={styles.organicTag}>
                    <Text style={styles.organicTagText}>🌱</Text>
                  </View>
                )}
              </View>

              <Text style={styles.headerTitle} numberOfLines={2}>
                {p.title}
              </Text>
              <Text style={styles.headerPrice}>
                Rs. {p.pricePerUnit}
                <Text style={styles.headerUnit}>/{p.unit}</Text>
              </Text>

              {/* Selection Indicator */}
              <View
                style={[
                  styles.selectPill,
                  selectedCol === idx && styles.selectPillActive,
                ]}>
                <Text
                  style={[
                    styles.selectPillText,
                    selectedCol === idx && styles.selectPillTextActive,
                  ]}>
                  {selectedCol === idx ? 'Selected' : `Select ${idx + 1}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Comparison Rows */}
        <View style={styles.tableContainer}>
          {/* Row 1: Farm Origin */}
          <View style={styles.tableRow}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Farm</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <Text style={styles.cellTextBold} numberOfLines={2}>
                  {p.farmerName}
                </Text>
              </View>
            ))}
          </View>

          {/* Row 2: Farming Method */}
          <View style={[styles.tableRow, styles.rowAlt]}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Farming</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <View
                  style={[
                    styles.badgeChip,
                    p.isOrganic ? styles.badgeOrganic : styles.badgeConv,
                  ]}>
                  <Text
                    style={[
                      styles.badgeChipText,
                      p.isOrganic ? styles.badgeOrganicText : styles.badgeConvText,
                    ]}>
                    {p.farmingMethod}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Row 3: Quality Grade */}
          <View style={styles.tableRow}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Grade</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <Text style={styles.cellText}>{p.grade}</Text>
              </View>
            ))}
          </View>

          {/* Row 4: Harvest Date */}
          <View style={[styles.tableRow, styles.rowAlt]}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Harvest</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <Text style={styles.cellTextHighlight}>{p.harvestDate}</Text>
              </View>
            ))}
          </View>

          {/* Row 5: Min Order */}
          <View style={styles.tableRow}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Min Order</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <Text style={styles.cellText}>{p.minOrder} {p.unit}</Text>
              </View>
            ))}
          </View>

          {/* Row 6: Shelf Life */}
          <View style={[styles.tableRow, styles.rowAlt]}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Shelf Life</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <Text style={styles.cellText}>{p.shelfLife}</Text>
              </View>
            ))}
          </View>

          {/* Row 7: Distance */}
          <View style={styles.tableRow}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Distance</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <Text style={styles.cellText}>📍 {p.distance}</Text>
              </View>
            ))}
          </View>

          {/* Row 8: Ratings */}
          <View style={[styles.tableRow, styles.rowAlt]}>
            <View style={styles.attributeLabelCol}>
              <Text style={styles.rowLabel}>Rating</Text>
            </View>
            {products.map((p) => (
              <View key={p.id} style={styles.cellCol}>
                <Text style={styles.ratingText}>★ {p.rating}</Text>
                <Text style={styles.ratingCount}>({p.reviewsCount})</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected Product Action Bottom CTA */}
        <View style={styles.bottomCard}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomTitle}>
              Selected: <Text style={{ color: '#2E7D32' }}>{products[selectedCol]?.title}</Text>
            </Text>
            <Text style={styles.bottomPrice}>
              Rs. {products[selectedCol]?.pricePerUnit} /{products[selectedCol]?.unit}
            </Text>
          </View>

          <Pressable
            style={styles.orderSelectedBtn}
            onPress={() => onOrderProduct?.(products[selectedCol])}>
            <Text style={styles.orderSelectedBtnText}>Order Selected Product</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  tipBanner: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    marginBottom: 14,
  },
  tipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  columnsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  attributeLabelCol: {
    width: 80,
    justifyContent: 'center',
    paddingRight: 6,
  },
  attributeColTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  productColHeader: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  productColActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  imageBox: {
    width: 58,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  organicTag: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(22, 101, 52, 0.9)',
    borderRadius: 4,
    padding: 1,
  },
  organicTagText: {
    fontSize: 9,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    height: 28,
  },
  headerPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 2,
    marginBottom: 6,
  },
  headerUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  selectPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    width: '100%',
    alignItems: 'center',
  },
  selectPillActive: {
    backgroundColor: '#2E7D32',
  },
  selectPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  selectPillTextActive: {
    color: '#FFFFFF',
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowAlt: {
    backgroundColor: '#F8FAFC',
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cellCol: {
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#1E293B',
    textAlign: 'center',
  },
  cellTextBold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  cellTextHighlight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    textAlign: 'center',
  },
  badgeChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeOrganic: {
    backgroundColor: '#DCFCE7',
  },
  badgeConv: {
    backgroundColor: '#F1F5F9',
  },
  badgeChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeOrganicText: {
    color: '#15803D',
  },
  badgeConvText: {
    color: '#64748B',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EAB308',
  },
  ratingCount: {
    fontSize: 10,
    color: '#64748B',
  },
  bottomCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  bottomPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
  },
  orderSelectedBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderSelectedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
