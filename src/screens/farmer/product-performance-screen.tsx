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
import { fetchProducePerformance, ApiProduceItem } from '../../services/api';

interface ProductPerformanceScreenProps {
  product: ApiProduceItem;
  onBack: () => void;
}

export const ProductPerformanceScreen: React.FC<ProductPerformanceScreenProps> = ({
  product,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadPerformance();
  }, [product]);

  const loadPerformance = async () => {
    setLoading(true);
    try {
      const prodId = product._id || product.id;
      const perf = await fetchProducePerformance(prodId);
      setData(perf);
    } catch {
      // Fallback matching Figma Screen 7
      setData({
        produceId: product.id,
        title: product.title,
        pricePerUnit: product.pricePerUnit,
        unit: product.unit,
        totalRevenue: 42350,
        revenueChangePercent: '+14% vs last week',
        totalSoldKg: 121,
        pageViews: 428,
        conversionRate: '28%',
        dailyTrend: [
          { day: 'Mon', revenue: 4500, kg: 13 },
          { day: 'Tue', revenue: 6200, kg: 18 },
          { day: 'Wed', revenue: 5800, kg: 16 },
          { day: 'Thu', revenue: 7100, kg: 20 },
          { day: 'Fri', revenue: 8900, kg: 26 },
          { day: 'Sat', revenue: 9850, kg: 28 },
        ],
        recentOrders: [
          { buyerName: 'Keells Supermarket', kg: 50, amount: 17500, time: '2 hours ago' },
          { buyerName: 'Colombo Fresh Organics', kg: 35, amount: 12250, time: 'Yesterday' },
          { buyerName: 'Green House Cafe', kg: 15, amount: 5250, time: '2 days ago' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const maxDailyRevenue = data?.dailyTrend
    ? Math.max(...data.dailyTrend.map((d: any) => d.revenue))
    : 10000;

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
        <Text style={styles.headerTitle}>Product Performance</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Crop summary title card */}
          <View style={styles.cropHeaderCard}>
            <View>
              <Text style={styles.cropTitle}>{product.title}</Text>
              <Text style={styles.cropPrice}>
                Rs. {product.pricePerUnit} / {product.unit} • {product.availableQuantity} {product.unit} in stock
              </Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>Active</Text>
            </View>
          </View>

          {/* Big Revenue Card */}
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue Generated</Text>
            <Text style={styles.revenueValue}>
              Rs. {data?.totalRevenue?.toLocaleString() || '42,350'}
            </Text>
            <View style={styles.growthBadge}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 15l-6-6-6 6" />
              </Svg>
              <Text style={styles.growthText}>{data?.revenueChangePercent || '+14% vs last week'}</Text>
            </View>
          </View>

          {/* Metric Trio Grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Total Sold</Text>
              <Text style={styles.metricNumber}>{data?.totalSoldKg || 121} kg</Text>
              <Text style={styles.metricSub}>Direct Farmgate</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Page Views</Text>
              <Text style={styles.metricNumber}>{data?.pageViews || 428}</Text>
              <Text style={styles.metricSub}>Verified Buyers</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Conversion</Text>
              <Text style={styles.metricNumber}>{data?.conversionRate || '28%'}</Text>
              <Text style={styles.metricSub}>High Demand</Text>
            </View>
          </View>

          {/* Visual Sales Trend Bar Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>7-Day Sales Trend</Text>
              <Text style={styles.chartSub}>LKR Revenue</Text>
            </View>

            <View style={styles.barsContainer}>
              {data?.dailyTrend?.map((item: any, idx: number) => {
                const heightPct = Math.round((item.revenue / maxDailyRevenue) * 100);
                return (
                  <View key={idx} style={styles.barCol}>
                    <Text style={styles.barRevenueText}>
                      {(item.revenue / 1000).toFixed(1)}k
                    </Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                    </View>
                    <Text style={styles.barDayText}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Orders Breakdown */}
          <View style={styles.ordersCard}>
            <Text style={styles.ordersTitle}>Recent Orders for this Crop</Text>
            {data?.recentOrders?.map((ord: any, idx: number) => (
              <View key={idx} style={styles.orderRow}>
                <View style={styles.orderLeft}>
                  <Text style={styles.buyerName}>{ord.buyerName}</Text>
                  <Text style={styles.orderVolume}>
                    {ord.kg} {product.unit} ordered • {ord.time}
                  </Text>
                </View>
                <Text style={styles.orderAmount}>Rs. {ord.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cropHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cropPrice: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  activeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  revenueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2E7D32',
    marginBottom: 8,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    paddingBottom: 4,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barRevenueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  barTrack: {
    width: 22,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 6,
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  ordersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ordersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  orderLeft: {
    flex: 1,
  },
  buyerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderVolume: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
});
