import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fetchWholesaleVsRetail } from '../../services/api';

interface WholesaleRetailScreenProps {
  onBack: () => void;
}

export const WholesaleRetailScreen: React.FC<WholesaleRetailScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bulkPercent, setBulkPercent] = useState(70);

  useEffect(() => {
    loadStrategy();
  }, []);

  const loadStrategy = async () => {
    setLoading(true);
    try {
      const res = await fetchWholesaleVsRetail('Organic Red Tomatoes');
      setData(res);
    } catch {
      setData({
        crop: 'Organic Red Tomatoes',
        basePrice: 350,
        wholesaleTier: {
          price: 280,
          unit: 'kg',
          minOrderQty: 50,
          discountPercent: '20% OFF',
          pros: [
            'Instant bulk inventory clearance',
            'Lower packaging & handling overhead',
            'Guaranteed verified supermarket buyers',
          ],
          turnaroundHours: '24 - 48 hrs',
        },
        retailTier: {
          price: 350,
          unit: 'kg',
          minOrderQty: 2,
          discountPercent: 'Standard Rate',
          pros: [
            'Maximum profit margin per kg',
            'Direct household & boutique cafe buyers',
            'Builds repeat regular buyers',
          ],
          turnaroundHours: '3 - 5 days',
        },
        recommendedStrategy:
          'Split inventory: Allocate 70% of harvest to Wholesale (50kg+ tier) for quick cash flow and 30% for direct retail.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.headerBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wholesale vs Retail</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Crop Title */}
        <View style={styles.cropBar}>
          <Text style={styles.cropTitle}>Pricing Strategy: {data?.crop || 'Organic Red Tomatoes'}</Text>
          <Text style={styles.cropSub}>Optimize profit margins vs harvest clearance speed</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Side by side Tier Cards */}
            <View style={styles.tiersGrid}>
              {/* Wholesale Tier */}
              <View style={[styles.tierCard, styles.tierCardWholesale]}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierTagWholesale}>BULK B2B</Text>
                  <Text style={styles.tierTitle}>Wholesale Tier</Text>
                </View>
                <Text style={styles.tierPrice}>Rs. {data?.wholesaleTier?.price} / kg</Text>
                <Text style={styles.minQtyText}>Min order: {data?.wholesaleTier?.minOrderQty} kg</Text>

                <View style={styles.turnaroundBox}>
                  <Text style={styles.turnaroundLabel}>Turnaround Speed</Text>
                  <Text style={styles.turnaroundVal}>⚡ {data?.wholesaleTier?.turnaroundHours}</Text>
                </View>

                <View style={styles.prosList}>
                  {data?.wholesaleTier?.pros?.map((p: string, idx: number) => (
                    <Text key={idx} style={styles.proItem}>✓ {p}</Text>
                  ))}
                </View>
              </View>

              {/* Retail Tier */}
              <View style={[styles.tierCard, styles.tierCardRetail]}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierTagRetail}>DIRECT B2C</Text>
                  <Text style={styles.tierTitle}>Retail Tier</Text>
                </View>
                <Text style={styles.tierPrice}>Rs. {data?.retailTier?.price} / kg</Text>
                <Text style={styles.minQtyText}>Min order: {data?.retailTier?.minOrderQty} kg</Text>

                <View style={styles.turnaroundBox}>
                  <Text style={styles.turnaroundLabel}>Turnaround Speed</Text>
                  <Text style={styles.turnaroundVal}>⏳ {data?.retailTier?.turnaroundHours}</Text>
                </View>

                <View style={styles.prosList}>
                  {data?.retailTier?.pros?.map((p: string, idx: number) => (
                    <Text key={idx} style={styles.proItem}>✓ {p}</Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Split Ratio Slider Simulator */}
            <View style={styles.simulatorCard}>
              <Text style={styles.simulatorTitle}>Harvest Split Simulator</Text>
              <Text style={styles.simulatorSub}>
                Allocate your total harvest between bulk fast sales and maximum margin
              </Text>

              <View style={styles.ratioDisplay}>
                <View style={styles.ratioItem}>
                  <Text style={styles.ratioValWholesale}>{bulkPercent}%</Text>
                  <Text style={styles.ratioLabel}>Wholesale</Text>
                </View>
                <Text style={styles.ratioDivider}>:</Text>
                <View style={styles.ratioItem}>
                  <Text style={styles.ratioValRetail}>{100 - bulkPercent}%</Text>
                  <Text style={styles.ratioLabel}>Direct Retail</Text>
                </View>
              </View>

              {/* Stepper buttons for split */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperPill}
                  onPress={() => setBulkPercent((prev) => Math.max(20, prev - 10))}>
                  <Text style={styles.stepperPillText}>- 10% Wholesale</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepperPill, styles.stepperPillGreen]}
                  onPress={() => setBulkPercent((prev) => Math.min(90, prev + 10))}>
                  <Text style={styles.stepperPillTextGreen}>+ 10% Wholesale</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* AI Recommendation */}
            <View style={styles.recommendCard}>
              <Text style={styles.recommendTitle}>💡 Recommended Pricing Strategy</Text>
              <Text style={styles.recommendText}>{data?.recommendedStrategy}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cropBar: {
    marginBottom: 16,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cropSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tiersGrid: {
    gap: 14,
    marginBottom: 16,
  },
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
  },
  tierCardWholesale: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  tierCardRetail: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierTagWholesale: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierTagRetail: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tierPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2E7D32',
    marginBottom: 2,
  },
  minQtyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 12,
  },
  turnaroundBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnaroundLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  turnaroundVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  prosList: {
    gap: 6,
  },
  proItem: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  simulatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    alignItems: 'center',
  },
  simulatorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  simulatorSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 6,
  },
  ratioDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 14,
  },
  ratioItem: {
    alignItems: 'center',
  },
  ratioValWholesale: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2E7D32',
  },
  ratioValRetail: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0284C7',
  },
  ratioLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  ratioDivider: {
    fontSize: 24,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  stepperPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  stepperPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  stepperPillGreen: {
    backgroundColor: '#DCFCE7',
  },
  stepperPillTextGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  recommendCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  recommendTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6,
  },
  recommendText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 18,
  },
});
