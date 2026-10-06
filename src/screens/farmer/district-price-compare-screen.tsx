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
import { fetchDistrictPriceCompare } from '../../services/api';

interface DistrictPriceCompareScreenProps {
  onBack: () => void;
}

export const DistrictPriceCompareScreen: React.FC<DistrictPriceCompareScreenProps> = ({
  onBack,
}) => {
  const [selectedCrop, setSelectedCrop] = useState('Organic Red Tomatoes');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const crops = ['Organic Red Tomatoes', 'Nuwara Eliya Carrots', 'Cooking Melon', 'Green Chillies'];

  useEffect(() => {
    loadPriceData();
  }, [selectedCrop]);

  const loadPriceData = async () => {
    setLoading(true);
    try {
      const res = await fetchDistrictPriceCompare(selectedCrop, 'Nuwara Eliya');
      setData(res);
    } catch {
      // Fallback data
      setData({
        crop: selectedCrop,
        localDistrict: 'Nuwara Eliya',
        localAveragePrice: 350,
        currency: 'Rs.',
        unit: 'kg',
        updatedAt: 'Today, 06:00 AM',
        districts: [
          {
            name: 'Colombo (Manning Market)',
            price: 410,
            diffPercent: '+17%',
            diffStatus: 'higher',
            demand: 'Very High',
            distanceKm: 145,
            netAdvantage: 'Rs. +45/kg after transport',
          },
          {
            name: 'Dambulla Economic Centre',
            price: 320,
            diffPercent: '-8%',
            diffStatus: 'lower',
            demand: 'High',
            distanceKm: 85,
            netAdvantage: 'High volume wholesale',
          },
          {
            name: 'Kandy Central Market',
            price: 380,
            diffPercent: '+8%',
            diffStatus: 'higher',
            demand: 'Moderate',
            distanceKm: 65,
            netAdvantage: 'Rs. +22/kg after transport',
          },
          {
            name: 'Meegoda Dedicated Centre',
            price: 395,
            diffPercent: '+13%',
            diffStatus: 'higher',
            demand: 'High',
            distanceKm: 135,
            netAdvantage: 'Direct supermarket retail buyers',
          },
        ],
        recommendation:
          'Shipping this week to Colombo Manning Market yields a +17% higher net profit margin even factoring transport costs.',
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
        <Text style={styles.headerTitle}>District Price Compare</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Crop Selection Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cropChipsRow}>
          {crops.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.cropChip, selectedCrop === c && styles.cropChipActive]}
              onPress={() => setSelectedCrop(c)}>
              <Text style={[styles.cropChipText, selectedCrop === c && styles.cropChipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Local District Benchmark Card */}
        <View style={styles.benchmarkCard}>
          <View>
            <Text style={styles.benchmarkSub}>Your Farmgate District</Text>
            <Text style={styles.benchmarkDistrict}>Nuwara Eliya (Local Benchmark)</Text>
          </View>
          <View style={styles.benchmarkPriceBox}>
            <Text style={styles.benchmarkPrice}>Rs. {data?.localAveragePrice || 350}</Text>
            <Text style={styles.benchmarkUnit}>per kg</Text>
          </View>
        </View>

        {/* Market Comparison List */}
        <Text style={styles.sectionHeader}>Major Economic Centres (Live DEC Rates)</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.districtsList}>
            {data?.districts?.map((d: any, idx: number) => {
              const isHigher = d.diffStatus === 'higher';
              return (
                <View key={idx} style={styles.marketCard}>
                  <View style={styles.marketCardTop}>
                    <View style={styles.marketInfo}>
                      <Text style={styles.marketName}>{d.name}</Text>
                      <Text style={styles.distanceText}>
                        📍 {d.distanceKm} km away • Demand: {d.demand}
                      </Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.marketPrice}>Rs. {d.price}</Text>
                      <View
                        style={[
                          styles.diffBadge,
                          isHigher ? styles.diffBadgeHigh : styles.diffBadgeLow,
                        ]}>
                        <Text
                          style={[
                            styles.diffBadgeText,
                            isHigher ? styles.diffBadgeTextHigh : styles.diffBadgeTextLow,
                          ]}>
                          {d.diffPercent}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.marketCardBottom}>
                    <Text style={styles.advantageText}>💡 {d.netAdvantage}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* AI Margin Recommendation Box */}
        {data?.recommendation && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>🎯 Logistics Recommendation</Text>
            <Text style={styles.recommendationText}>{data.recommendation}</Text>
          </View>
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
  cropChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cropChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  cropChipTextActive: {
    color: '#FFFFFF',
  },
  benchmarkCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  benchmarkSub: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
    marginBottom: 2,
  },
  benchmarkDistrict: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  benchmarkPriceBox: {
    alignItems: 'flex-end',
  },
  benchmarkPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2E7D32',
  },
  benchmarkUnit: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  districtsList: {
    gap: 12,
    marginBottom: 20,
  },
  marketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  marketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#64748B',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  marketPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffBadgeHigh: {
    backgroundColor: '#DCFCE7',
  },
  diffBadgeLow: {
    backgroundColor: '#FEE2E2',
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  diffBadgeTextHigh: {
    color: '#15803D',
  },
  diffBadgeTextLow: {
    color: '#DC2626',
  },
  marketCardBottom: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  advantageText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
});
