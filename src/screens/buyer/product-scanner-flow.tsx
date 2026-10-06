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

export type ScannerStep =
  | 'scanner'
  | 'identified'
  | 'quality'
  | 'price-rec'
  | 'demand';

interface ProductScannerFlowProps {
  onBack: () => void;
  onExploreMatchingFarmers?: (cropName: string) => void;
}

export function ProductScannerFlow({
  onBack,
  onExploreMatchingFarmers,
}: ProductScannerFlowProps) {
  const [currentStep, setCurrentStep] = useState<ScannerStep>('scanner');
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedGrade, setSelectedGrade] = useState<'Grade 1 (Alba)' | 'Grade 2 (Continental)'>('Grade 1 (Alba)');

  const handleBack = () => {
    if (currentStep === 'demand') {
      setCurrentStep('price-rec');
    } else if (currentStep === 'price-rec') {
      setCurrentStep('quality');
    } else if (currentStep === 'quality') {
      setCurrentStep('identified');
    } else if (currentStep === 'identified') {
      setCurrentStep('scanner');
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <Text style={styles.navTitle}>
          {currentStep === 'scanner' && 'Product Scanner'}
          {currentStep === 'identified' && 'Product Identified'}
          {currentStep === 'quality' && 'Quality Estimate'}
          {currentStep === 'price-rec' && 'Price Recommendation'}
          {currentStep === 'demand' && 'Demand Forecast'}
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* SCREEN 8: PRODUCT SCANNER VIEWPORT                                       */}
        {/* ========================================================================= */}
        {currentStep === 'scanner' && (
          <View style={styles.scannerWrapper}>
            {/* Camera Viewfinder View */}
            <View style={styles.viewfinderBox}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80' }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />

              {/* Dark tint overlay */}
              <View style={styles.cameraOverlay} />

              {/* Glowing Corner Brackets */}
              <View style={styles.reticleBox}>
                <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
                <View style={[styles.cornerBracket, styles.bracketTopRight]} />
                <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
                <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

                {/* Laser scan line indicator */}
                <View style={styles.scanLaser} />
              </View>

              <Text style={styles.reticleHint}>
                Align produce or barcode inside the frame
              </Text>
            </View>

            {/* Shutter Bar */}
            <View style={styles.shutterRow}>
              {/* Gallery icon */}
              <Pressable
                style={styles.shutterSubBtn}
                onPress={() => setCurrentStep('identified')}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </Svg>
              </Pressable>

              {/* Main Shutter Button */}
              <Pressable
                style={styles.mainShutterOuter}
                onPress={() => setCurrentStep('identified')}>
                <View style={styles.mainShutterInner} />
              </Pressable>

              {/* Flash / Light toggle */}
              <Pressable style={styles.shutterSubBtn}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </Svg>
              </Pressable>
            </View>

            {/* Hint Card */}
            <View style={styles.scannerHintCard}>
              <Text style={styles.scannerHintEmoji}>🔬</Text>
              <Text style={styles.scannerHintText}>
                Our multi-spectrum crop model automatically detects agricultural produce, checks color saturation, estimates moisture levels, and fetches fair market pricing.
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 9: PRODUCT IDENTIFIED                                             */}
        {/* ========================================================================= */}
        {currentStep === 'identified' && (
          <View>
            {/* Captured Produce Image */}
            <View style={styles.identifiedImageBox}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80' }}
                style={styles.identifiedImg}
                contentFit="cover"
              />
              <View style={styles.identifiedSuccessPill}>
                <Text style={styles.identifiedSuccessText}>✓ Crop Identified Successfully</Text>
              </View>
            </View>

            {/* Detected Name & Category */}
            <View style={styles.cropInfoCard}>
              <Text style={styles.detectedCropTitle}>Ceylon Cinnamon</Text>
              <Text style={styles.detectedScientific}>(Cinnamomum verum)</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Category:</Text>
                <Text style={styles.metaValue}>Pure Organic Spices</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Region Origin:</Text>
                <Text style={styles.metaValue}>Southern Province (Galle / Matara)</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Confidence:</Text>
                <Text style={[styles.metaValue, { color: '#15803D', fontWeight: '800' }]}>99.2% Match</Text>
              </View>

              <Text style={styles.detectedDescription}>
                Authentic Ceylon true cinnamon quills. Characterized by paper-thin multi-layered rolls, golden-brown hue, and sweet citrus aroma without coumarin toxicity.
              </Text>
            </View>

            {/* Grade Selection */}
            <View style={styles.sectionBlock}>
              <Text style={styles.subHeading}>Observed Quality Grade</Text>
              <View style={styles.gradeButtonsRow}>
                {(['Grade 1 (Alba)', 'Grade 2 (Continental)'] as const).map((grade) => (
                  <Pressable
                    key={grade}
                    style={[styles.gradeBtn, selectedGrade === grade && styles.gradeBtnActive]}
                    onPress={() => setSelectedGrade(grade)}>
                    <Text style={[styles.gradeBtnText, selectedGrade === grade && styles.gradeBtnTextActive]}>
                      {grade}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* CTA */}
            <Pressable
              style={styles.primaryActionButton}
              onPress={() => setCurrentStep('quality')}>
              <Text style={styles.primaryActionButtonText}>
                Proceed to Full Quality Audit →
              </Text>
            </Pressable>
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 10: QUALITY ESTIMATE                                              */}
        {/* ========================================================================= */}
        {currentStep === 'quality' && (
          <View>
            {/* Top Grade Banner */}
            <View style={styles.gradeBannerCard}>
              <View style={styles.gradeBadgeSquare}>
                <Text style={styles.gradeLetter}>A</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.gradeBannerTitle}>Grade A - Export Quality</Text>
                <Text style={styles.gradeBannerSub}>Ceylon Cinnamon Alba Standard</Text>
                <Text style={styles.gradeBannerScore}>Overall Quality Score: 98.4 / 100</Text>
              </View>
            </View>

            {/* Quality Score Breakdown Bars */}
            <View style={styles.auditCard}>
              <Text style={styles.auditHeading}>Spectral Quality Metrics</Text>

              {/* Metric 1 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Moisture Content (Target &lt; 12%)</Text>
                  <Text style={styles.metricPercent}>11.2% (Optimal)</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '92%' }]} />
                </View>
              </View>

              {/* Metric 2 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Purity & Quill Density</Text>
                  <Text style={styles.metricPercent}>99.4%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '99%' }]} />
                </View>
              </View>

              {/* Metric 3 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Color Consistency & Uniformity</Text>
                  <Text style={styles.metricPercent}>98.0%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '98%' }]} />
                </View>
              </View>

              {/* Metric 4 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Aroma Profile & Volatile Oil</Text>
                  <Text style={styles.metricPercent}>97.5%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '97%' }]} />
                </View>
              </View>
            </View>

            {/* Market Valuation Box */}
            <View style={styles.valuationCard}>
              <Text style={styles.valuationTitle}>Estimated Wholesale Valuation</Text>
              <Text style={styles.valuationPrice}>
                Rs. 1,450 <Text style={styles.valuationUnit}>/kg</Text>
              </Text>
              <Text style={styles.valuationNotes}>
                Estimated Shelf Life: 18 - 24 Months in sealed vacuum packaging
              </Text>
            </View>

            {/* Next buttons */}
            <Pressable
              style={styles.primaryActionButton}
              onPress={() => setCurrentStep('price-rec')}>
              <Text style={styles.primaryActionButtonText}>View Price Analysis →</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => onExploreMatchingFarmers?.('Ceylon Cinnamon')}>
              <Text style={styles.secondaryActionButtonText}>Find Verified Cinnamon Farmers</Text>
            </Pressable>
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 11: PRICE RECOMMENDATION                                          */}
        {/* ========================================================================= */}
        {currentStep === 'price-rec' && (
          <View>
            {/* Header info */}
            <View style={styles.priceOverviewCard}>
              <Text style={styles.priceCropTitle}>Ceylon Cinnamon — Grade A</Text>
              <Text style={styles.priceCropSub}>Real-Time Wholesale Benchmark</Text>

              <View style={styles.priceRangeBox}>
                <Text style={styles.rangeLabel}>Market Price Range</Text>
                <View style={styles.rangeRow}>
                  <Text style={styles.rangeMin}>Rs. 1,200</Text>
                  <View style={styles.rangeBarTrack}>
                    <View style={styles.rangeIndicatorDot} />
                  </View>
                  <Text style={styles.rangeMax}>Rs. 1,650</Text>
                </View>
              </View>

              {/* Suggested Price Highlight */}
              <View style={styles.suggestedBadgeCard}>
                <View>
                  <Text style={styles.suggestedBadgeLabel}>Suggested Farm Gate Price</Text>
                  <Text style={styles.suggestedPriceNum}>Rs. 1,450 /kg</Text>
                </View>
                <View style={styles.fairBadge}>
                  <Text style={styles.fairBadgeText}>Fair Value</Text>
                </View>
              </View>

              {/* Retail Comparison */}
              <View style={styles.retailCompareRow}>
                <Text style={styles.retailText}>Colombo Retail Index: Rs. 1,850/kg</Text>
                <Text style={styles.savingsTag}>Direct Savings: ~22%</Text>
              </View>
            </View>

            {/* 30-Day Historical Trend Graphic */}
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>30-Day Price Trend (Rs./kg)</Text>
              <View style={styles.chartArea}>
                <Svg width="100%" height="80" viewBox="0 0 320 80">
                  <Path
                    d="M 10 50 Q 80 40 140 55 T 240 25 T 310 30"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth={3}
                  />
                  <Path
                    d="M 10 50 Q 80 40 140 55 T 240 25 T 310 30 L 310 80 L 10 80 Z"
                    fill="rgba(34, 197, 94, 0.12)"
                  />
                </Svg>
                <View style={styles.chartDaysRow}>
                  <Text style={styles.chartDayText}>Day 1</Text>
                  <Text style={styles.chartDayText}>Day 10</Text>
                  <Text style={styles.chartDayText}>Day 20</Text>
                  <Text style={styles.chartDayText}>Day 30 (Today)</Text>
                </View>
              </View>
            </View>

            {/* Market Insights List */}
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>Market Intelligence</Text>
              <Text style={styles.insightBullet}>
                • High European export demand is keeping quills above Rs. 1,400.
              </Text>
              <Text style={styles.insightBullet}>
                • Monsoon harvest in Galle completed last week, ensuring steady inventory.
              </Text>
            </View>

            {/* Next button */}
            <Pressable
              style={styles.primaryActionButton}
              onPress={() => setCurrentStep('demand')}>
              <Text style={styles.primaryActionButtonText}>View Demand Forecast →</Text>
            </Pressable>
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 12: DEMAND FORECAST                                               */}
        {/* ========================================================================= */}
        {currentStep === 'demand' && (
          <View>
            {/* Range Toggle */}
            <View style={styles.rangeSelectorRow}>
              {(['7d', '30d', '90d'] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[styles.rangeBtn, selectedRange === r && styles.rangeBtnActive]}
                  onPress={() => setSelectedRange(r)}>
                  <Text style={[styles.rangeBtnText, selectedRange === r && styles.rangeBtnTextActive]}>
                    {r === '7d' && '7 Days'}
                    {r === '30d' && '30 Days'}
                    {r === '90d' && '90 Days'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Demand Chart Card */}
            <View style={styles.demandChartCard}>
              <View style={styles.forecastHeader}>
                <View>
                  <Text style={styles.forecastTitle}>Expected Demand Trend</Text>
                  <Text style={styles.forecastSub}>High demand expected in major wholesale hubs</Text>
                </View>
                <View style={styles.growthBadge}>
                  <Text style={styles.growthBadgeText}>+18.4%</Text>
                </View>
              </View>

              {/* Bar Chart Bars */}
              <View style={styles.barChartContainer}>
                {[
                  { label: 'Mon', h: 40 },
                  { label: 'Tue', h: 65 },
                  { label: 'Wed', h: 90 },
                  { label: 'Thu', h: 75 },
                  { label: 'Fri', h: 85 },
                  { label: 'Sat', h: 50 },
                  { label: 'Sun', h: 30 },
                ].map((bar, idx) => (
                  <View key={idx} style={styles.barCol}>
                    <View style={styles.barTrackVertical}>
                      <View style={[styles.barFillVertical, { height: `${bar.h}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Forecast Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Sourcing Timeline Advisory</Text>
              <Text style={styles.summaryText}>
                Buyer inquiries for Ceylon Cinnamon Alba are predicted to peak next Wednesday. We recommend locking in supply contracts with Southern Province farmers before prices rise.
              </Text>
            </View>

            {/* Final Action Button */}
            <Pressable
              style={styles.primaryActionButton}
              onPress={() => onExploreMatchingFarmers?.('Ceylon Cinnamon')}>
              <Text style={styles.primaryActionButtonText}>
                Connect With Matched Cinnamon Farmers →
              </Text>
            </Pressable>
          </View>
        )}
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
    padding: 16,
    paddingBottom: 40,
  },
  // Scanner Viewfinder (Screen 8)
  scannerWrapper: {
    alignItems: 'center',
  },
  viewfinderBox: {
    width: '100%',
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  reticleBox: {
    width: 220,
    height: 220,
    position: 'relative',
    justifyContent: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#22C55E',
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanLaser: {
    width: '100%',
    height: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  reticleHint: {
    position: 'absolute',
    bottom: 16,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  shutterSubBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainShutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  mainShutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#22C55E',
  },
  scannerHintCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
  },
  scannerHintEmoji: {
    fontSize: 22,
  },
  scannerHintText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    fontWeight: '500',
  },
  // Identified Styles (Screen 9)
  identifiedImageBox: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  identifiedImg: {
    width: '100%',
    height: '100%',
  },
  identifiedSuccessPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  identifiedSuccessText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cropInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detectedCropTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  detectedScientific: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#64748B',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  detectedDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  gradeButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gradeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  gradeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  gradeBtnTextActive: {
    color: '#15803D',
  },
  primaryActionButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryActionButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '700',
  },
  // Quality Estimate Styles (Screen 10)
  gradeBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  gradeBadgeSquare: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeLetter: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gradeBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  gradeBannerSub: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  gradeBannerScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginTop: 4,
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  auditHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  metricRow: {
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  metricPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  barTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  valuationCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  valuationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  valuationPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#B45309',
    marginTop: 2,
  },
  valuationUnit: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  valuationNotes: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 4,
  },
  // Price Recommendation (Screen 11)
  priceOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  priceCropTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceCropSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  priceRangeBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeMin: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  rangeMax: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  rangeBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  rangeIndicatorDot: {
    position: 'absolute',
    left: '55%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2E7D32',
  },
  suggestedBadgeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  suggestedBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  suggestedPriceNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
    marginTop: 2,
  },
  fairBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fairBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  retailCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retailText: {
    fontSize: 11,
    color: '#64748B',
  },
  savingsTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  chartArea: {
    height: 100,
  },
  chartDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chartDayText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  insightsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  insightBullet: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  // Demand Forecast (Screen 12)
  rangeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rangeBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  rangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  rangeBtnTextActive: {
    color: '#FFFFFF',
  },
  demandChartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  forecastTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  forecastSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  growthBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  growthBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    width: 32,
  },
  barTrackVertical: {
    width: 14,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillVertical: {
    width: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 18,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 18,
  },
});
