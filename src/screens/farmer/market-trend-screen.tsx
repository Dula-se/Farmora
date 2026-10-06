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
import { fetchMarketTrends } from '../../services/api';

interface MarketTrendScreenProps {
  onBack: () => void;
}

export const MarketTrendScreen: React.FC<MarketTrendScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendData();
  }, []);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const res = await fetchMarketTrends('Organic Red Tomatoes', 'Nuwara Eliya');
      setData(res);
    } catch {
      setData({
        crop: 'Organic Red Tomatoes',
        district: 'Nuwara Eliya District',
        currentWholesalePrice: 340,
        priceChangeToday: '+Rs. 12',
        trendDirection: 'up',
        qualityGrade: 'Grade A',
        history: [
          { day: 'Mon', date: 'Oct 01', price: 300, volume: '4.2 tons' },
          { day: 'Tue', date: 'Oct 02', price: 310, volume: '4.8 tons' },
          { day: 'Wed', date: 'Oct 03', price: 315, volume: '3.9 tons' },
          { day: 'Thu', date: 'Oct 04', price: 328, volume: '3.5 tons' },
          { day: 'Fri', date: 'Oct 05', price: 335, volume: '3.1 tons' },
          { day: 'Sat', date: 'Oct 06', price: 340, volume: '2.9 tons' },
        ],
        forecast: {
          expectedNextWeek: 'Rs. 355 - 375 / kg',
          trend: 'Bullish (Upward)',
          reason:
            'Heavy monsoon rains expected in Central Province will limit harvesting, pushing market supply lower and farmgate prices higher.',
        },
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
        <Text style={styles.headerTitle}>Tomato Market Trend</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chips Header */}
        <View style={styles.tagsRow}>
          <View style={styles.districtChip}>
            <Text style={styles.districtChipText}>📍 {data?.district || 'Nuwara Eliya District'}</Text>
          </View>
          <View style={styles.gradeChip}>
            <Text style={styles.gradeChipText}>{data?.qualityGrade || 'Grade A'}</Text>
          </View>
        </View>

        {/* Current Price Big Box */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Current Wholesale Benchmark</Text>
          <View style={styles.priceValueRow}>
            <Text style={styles.priceMain}>Rs. {data?.currentWholesalePrice || 340}</Text>
            <Text style={styles.priceUnit}>/ kg</Text>
          </View>
          <View style={styles.changeBadge}>
            <Text style={styles.changeBadgeText}>
              📈 {data?.priceChangeToday || '+Rs. 12'} vs yesterday
            </Text>
          </View>
        </View>

        {/* Predictive Forecast Card */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastTitle}>🔮 Next Week Projection</Text>
            <Text style={styles.forecastTrendTag}>{data?.forecast?.trend || 'Bullish'}</Text>
          </View>
          <Text style={styles.forecastPriceRange}>
            Expected: {data?.forecast?.expectedNextWeek || 'Rs. 355 - 375 / kg'}
          </Text>
          <Text style={styles.forecastReason}>{data?.forecast?.reason}</Text>
        </View>

        {/* 7-Day Historical Price List */}
        <Text style={styles.historySectionTitle}>7-Day Daily Mandi Price Log</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.historyList}>
            {data?.history?.map((item: any, idx: number) => (
              <View key={idx} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.dayText}>{item.day}</Text>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <View style={styles.volumeBox}>
                  <Text style={styles.volumeText}>Vol: {item.volume}</Text>
                </View>
                <Text style={styles.historyPrice}>Rs. {item.price} / kg</Text>
              </View>
            ))}
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
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  districtChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  districtChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  gradeChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  priceMain: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2E7D32',
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  changeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  forecastCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  forecastTrendTag: {
    backgroundColor: '#D97706',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  forecastPriceRange: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 6,
  },
  forecastReason: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  historySectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    width: 32,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  volumeBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  volumeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
});
