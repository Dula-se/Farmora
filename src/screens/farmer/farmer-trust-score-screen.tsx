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
import { fetchFarmerTrustScore } from '../../services/api';

interface FarmerTrustScoreScreenProps {
  onBack: () => void;
}

export const FarmerTrustScoreScreen: React.FC<FarmerTrustScoreScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrustScore();
  }, []);

  const loadTrustScore = async () => {
    setLoading(true);
    try {
      const res = await fetchFarmerTrustScore();
      setData(res);
    } catch {
      setData({
        score: 94,
        grade: 'Grade A+ Certified Farmer',
        ranking: 'Top 5% of farmers in Central Province',
        reviewCount: 48,
        metrics: [
          { label: 'Quality Consistency', percentage: 96, color: '#22C55E' },
          { label: 'On-Time Dispatch', percentage: 92, color: '#3B82F6' },
          { label: 'Buyer Satisfaction', percentage: 95, color: '#10B981' },
          { label: 'Packaging & Handling', percentage: 93, color: '#F59E0B' },
        ],
        badges: [
          { name: 'Verified Farm', icon: '🎖️', description: 'Land deed verified by Agrarian Services' },
          { name: '100% Organic', icon: '🌿', description: 'Certified pesticide-free highland soil' },
          { name: 'Fast Shipper', icon: '⚡', description: 'Dispatched within 24 hours' },
          { name: 'Top Rated 2026', icon: '🌟', description: 'Zero refund or return claims' },
        ],
        growthTips: [
          'Maintain same-day dispatch for next 5 orders to earn the "Ultra Reliable" badge.',
          'Upload photo verification of your cold-storage area to gain +2 score points.',
        ],
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
        <Text style={styles.headerTitle}>Farmer Trust Score</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Score Gauge Card */}
            <View style={styles.gaugeCard}>
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle}>
                  <Text style={styles.scoreNumber}>{data?.score || 94}</Text>
                  <Text style={styles.scoreMax}>/ 100</Text>
                </View>
              </View>

              <Text style={styles.gradeTitle}>{data?.grade || 'Grade A+ Certified Farmer'}</Text>
              <Text style={styles.rankingSub}>{data?.ranking}</Text>

              <View style={styles.verifiedRow}>
                <Text style={styles.verifiedBadge}>✓ Farmora Trust Verified</Text>
                <Text style={styles.reviewsCount}>({data?.reviewCount || 48} Buyer Ratings)</Text>
              </View>
            </View>

            {/* Quality Breakdown Bars */}
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>Performance Breakdown</Text>
              {data?.metrics?.map((m: any, idx: number) => (
                <View key={idx} style={styles.metricRow}>
                  <View style={styles.metricLabelRow}>
                    <Text style={styles.metricLabel}>{m.label}</Text>
                    <Text style={styles.metricPercent}>{m.percentage}%</Text>
                  </View>
                  <View style={styles.metricTrack}>
                    <View
                      style={[
                        styles.metricBar,
                        { width: `${m.percentage}%`, backgroundColor: m.color || '#22C55E' },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Earned Badges Carousel / Grid */}
            <View style={styles.badgesCard}>
              <Text style={styles.sectionTitle}>Earned Trust Badges</Text>
              <View style={styles.badgesGrid}>
                {data?.badges?.map((b: any, idx: number) => (
                  <View key={idx} style={styles.badgeItem}>
                    <Text style={styles.badgeIcon}>{b.icon}</Text>
                    <Text style={styles.badgeName}>{b.name}</Text>
                    <Text style={styles.badgeDesc}>{b.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tips to increase score */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>🚀 Next Steps to Reach 98+ Score</Text>
              {data?.growthTips?.map((tip: string, idx: number) => (
                <View key={idx} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
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
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
  },
  innerCircle: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#15803D',
    lineHeight: 38,
  },
  scoreMax: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  gradeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  rankingSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewsCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  metricRow: {
    marginBottom: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  metricPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    borderRadius: 4,
  },
  badgesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipBullet: {
    color: '#3B82F6',
    fontWeight: '900',
    marginRight: 6,
    fontSize: 14,
  },
  tipText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
    flex: 1,
  },
});
