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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ApiProduceItem } from '@/services/api';

interface PriceTrendsModalProps {
  product: ApiProduceItem;
  onBack: () => void;
  onOrderNow?: () => void;
}

export function PriceTrendsModal({
  product,
  onBack,
  onOrderNow,
}: PriceTrendsModalProps) {
  const [activeRange, setActiveRange] = useState<'30d' | '60d' | '1y'>('30d');
  const insets = useSafeAreaInsets();

  // Deterministic top inset ensuring nav bar NEVER gets pushed behind the status bar/notch
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 44
  );

  const basePrice = product.pricePerUnit || 320;
  const lowest = Math.round(basePrice * 0.88);
  const peak = Math.round(basePrice * 1.28);
  const dambullaPrice = Math.round(basePrice * 1.08);
  const pettahPrice = Math.round(basePrice * 1.15);
  const directSavings = Math.round(((pettahPrice - basePrice) / pettahPrice) * 100);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />

      {/* Top Header - Guaranteed visible & fully clickable below status bar/notch */}
      <View style={[styles.headerWrapper, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>Price Trends</Text>
          <View style={styles.headerRightSpace} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Crop Summary */}
        <View style={styles.cropHeaderCard}>
          <View style={styles.cropIconBox}>
            <Text style={{ fontSize: 28 }}>🍅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropTitle}>{product.title}</Text>
            <Text style={styles.marketPriceLabel}>
              Avg. Wholesale Price: <Text style={styles.marketPriceVal}>Rs. {basePrice} /kg</Text>
            </Text>
          </View>
        </View>

        {/* Range Selector */}
        <View style={styles.rangeRow}>
          {[
            { id: '30d', label: '30 Days' },
            { id: '60d', label: '60 Days' },
            { id: '1y', label: '1 Year' },
          ].map((r) => (
            <Pressable
              key={r.id}
              style={[styles.rangePill, activeRange === r.id && styles.rangePillActive]}
              onPress={() => setActiveRange(r.id as any)}>
              <Text style={[styles.rangeText, activeRange === r.id && styles.rangeTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Price Trend Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Historical Wholesale Index</Text>
            <Text style={styles.chartSub}>Dambulla & Pettah DEC verified rates</Text>
          </View>

          {/* SVG Trend Line */}
          <View style={styles.svgWrapper}>
            <Svg width="100%" height="140" viewBox="0 0 320 140" fill="none">
              {/* Grid lines */}
              <Path d="M0 30 H320" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <Path d="M0 70 H320" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <Path d="M0 110 H320" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

              {/* Shaded Area */}
              <Path
                d="M10 100 Q 60 110, 110 70 T 210 50 T 310 35 L 310 130 L 10 130 Z"
                fill="rgba(56, 102, 65, 0.08)"
              />

              {/* Price Curve */}
              <Path
                d="M10 100 Q 60 110, 110 70 T 210 50 T 310 35"
                stroke="#386641"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Peak indicator dot */}
              <Path d="M 307 35 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0" fill="#386641" />
              <Path d="M 107 70 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0" fill="#386641" />
            </Svg>

            {/* Date labels */}
            <View style={styles.dateLabelsRow}>
              <Text style={styles.dateLabel}>Week 1</Text>
              <Text style={styles.dateLabel}>Week 2</Text>
              <Text style={styles.dateLabel}>Week 3</Text>
              <Text style={styles.dateLabel}>Week 4</Text>
              <Text style={styles.dateLabel}>Today</Text>
            </View>
          </View>

          {/* Metrics Trio */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>30-Day Lowest</Text>
              <Text style={[styles.metricVal, { color: '#16A34A' }]}>Rs. {lowest}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Average</Text>
              <Text style={styles.metricVal}>Rs. {basePrice}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>30-Day Peak</Text>
              <Text style={[styles.metricVal, { color: '#D97706' }]}>Rs. {peak}</Text>
            </View>
          </View>
        </View>

        {/* Wholesale Center Comparison (Screen 2 in Figma) */}
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonHeading}>Today&apos;s Wholesale Comparison</Text>

          <View style={styles.comparisonRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.marketName}>Dambulla Economic Centre</Text>
              <Text style={styles.marketSub}>Middlemen / Auction floor</Text>
            </View>
            <Text style={styles.otherPrice}>Rs. {dambullaPrice} /kg</Text>
          </View>

          <View style={styles.comparisonRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.marketName}>Pettah Manning Market</Text>
              <Text style={styles.marketSub}>Wholesale terminal, Colombo</Text>
            </View>
            <Text style={styles.otherPrice}>Rs. {pettahPrice} /kg</Text>
          </View>

          <View style={[styles.comparisonRow, styles.directFarmRow]}>
            <View style={{ flex: 1 }}>
              <View style={styles.directTag}>
                <Text style={styles.directTagText}>BEST PRICE</Text>
              </View>
              <Text style={styles.directMarketName}>Farmora Direct Farm Gate</Text>
              <Text style={styles.directSub}>Direct harvest, zero broker markup</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.directPrice}>Rs. {basePrice} /kg</Text>
              <Text style={styles.savingsText}>Save ~{directSavings}%</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Pressable
          style={styles.orderBtn}
          onPress={() => {
            onBack();
            onOrderNow?.();
          }}>
          <Text style={styles.orderBtnText}>Order at Direct Farm Price (Rs. {basePrice}/kg)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightSpace: {
    width: 42,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  cropHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    gap: 14,
  },
  cropIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  marketPriceLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  marketPriceVal: {
    color: '#166534',
    fontWeight: '700',
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  rangePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rangeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  rangeTextActive: {
    color: '#166534',
    fontWeight: '800',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  svgWrapper: {
    marginVertical: 8,
  },
  dateLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 6,
  },
  dateLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    gap: 12,
  },
  comparisonHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  marketName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  marketSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  otherPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  directFarmRow: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderBottomWidth: 1,
    marginTop: 4,
  },
  directTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 3,
  },
  directTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  directMarketName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  directSub: {
    fontSize: 11,
    color: '#15803D',
  },
  directPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#166534',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
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
  orderBtn: {
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
  orderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
