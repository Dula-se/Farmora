import React, { useState } from 'react';
import {
  Linking,
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
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { ApiProduceItem } from '@/services/api';

export type MatchingStep = 'recommended' | 'form' | 'results' | 'why-farmer';

export interface MatchedFarmer {
  id: string;
  name: string;
  farmerName: string;
  location: string;
  distanceKm: number;
  pricePerUnit: number;
  unit: string;
  rating: number;
  reviewsCount: number;
  matchScore: number;
  image: string;
  avatar: string;
  phone: string;
  isVerified: boolean;
  isOrganic: boolean;
  scoreBreakdown: {
    priceCompetitiveness: number;
    distanceLogistics: number;
    qualityOrganic: number;
    orderFulfillment: number;
  };
  explanation: string;
  cropsGrown: string[];
}

const MOCK_MATCHED_FARMERS: MatchedFarmer[] = [
  {
    id: 'mf-1',
    name: 'Perera Organic Farm',
    farmerName: 'K. Perera',
    location: 'Katugastota, Kandy',
    distanceKm: 18.4,
    pricePerUnit: 220,
    unit: 'kg',
    rating: 4.9,
    reviewsCount: 124,
    matchScore: 96,
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&auto=format&fit=crop&q=60',
    avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=200&auto=format&fit=crop&q=80',
    phone: '+94 77 123 4567',
    isVerified: true,
    isOrganic: true,
    scoreBreakdown: {
      priceCompetitiveness: 98,
      distanceLogistics: 92,
      qualityOrganic: 99,
      orderFulfillment: 95,
    },
    explanation:
      'Selected because their farm gate price is 22% lower than the Manning wholesale benchmark, with guaranteed same-day dispatch and 100% certified organic soil standards.',
    cropsGrown: ['Tomatoes', 'Green Beans', 'Beetroot'],
  },
  {
    id: 'mf-2',
    name: 'Highland Fresh Fields',
    farmerName: 'Sunil Bandara',
    location: 'Blackpool, Nuwara Eliya',
    distanceKm: 42.1,
    pricePerUnit: 235,
    unit: 'kg',
    rating: 4.7,
    reviewsCount: 88,
    matchScore: 91,
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=60',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    phone: '+94 71 987 6543',
    isVerified: true,
    isOrganic: false,
    scoreBreakdown: {
      priceCompetitiveness: 89,
      distanceLogistics: 88,
      qualityOrganic: 94,
      orderFulfillment: 93,
    },
    explanation:
      'Highland climate ensures superior crispness and longer 7+ days shelf life. Located near the main A5 expressway for reliable delivery.',
    cropsGrown: ['Carrots', 'Leeks', 'Potatoes'],
  },
];

interface FarmerMatchingFlowProps {
  initialStep?: MatchingStep;
  onBack: () => void;
  onSelectProduct?: (product: Partial<ApiProduceItem>) => void;
  onOrderFarmer?: (farmer: MatchedFarmer) => void;
  onChatFarmer?: (farmerId: string) => void;
}

export function FarmerMatchingFlow({
  initialStep = 'recommended',
  onBack,
  onSelectProduct,
  onOrderFarmer,
  onChatFarmer,
}: FarmerMatchingFlowProps) {
  const [step, setStep] = useState<MatchingStep>(initialStep);
  const [selectedFarmer, setSelectedFarmer] = useState<MatchedFarmer>(MOCK_MATCHED_FARMERS[0]);

  // Form states (Screen 5)
  const [cropVariety, setCropVariety] = useState('Carrots (Nuwara Eliya)');
  const [requiredQty, setRequiredQty] = useState('750');
  const [maxPrice, setMaxPrice] = useState('240');
  const [locationPref, setLocationPref] = useState('Western / Central Province');
  const [selectedCert, setSelectedCert] = useState('100% Organic');

  // Filter in Results (Screen 6)
  const [resultFilter, setResultFilter] = useState<'best' | 'nearest' | 'cheapest'>('best');

  const handleBack = () => {
    if (step === 'why-farmer') {
      setStep('results');
    } else if (step === 'results') {
      setStep('form');
    } else if (step === 'form') {
      setStep('recommended');
    } else {
      onBack();
    }
  };

  const callFarmer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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
          {step === 'recommended' && 'Recommended For You'}
          {step === 'form' && 'Find Best Farmers'}
          {step === 'results' && 'Matched Farmers'}
          {step === 'why-farmer' && 'Why This Farmer?'}
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* SCREEN 4: RECOMMENDED FOR YOU                                             */}
        {/* ========================================================================= */}
        {step === 'recommended' && (
          <View>
            {/* Top Insight Banner */}
            <View style={styles.insightBanner}>
              <View style={styles.insightIconCircle}>
                <Text style={{ fontSize: 16 }}>🎯</Text>
              </View>
              <Text style={styles.insightBannerText}>
                Recommendations tailored to your order history and regional wholesale demand trends.
              </Text>
            </View>

            {/* Smart Wizard CTA card */}
            <Pressable
              style={styles.wizardCtaCard}
              onPress={() => setStep('form')}>
              <View style={styles.wizardCtaHeader}>
                <View style={styles.wizardBadge}>
                  <Text style={styles.wizardBadgeText}>AI MATCH ENGINE</Text>
                </View>
                <Text style={styles.wizardArrow}>→</Text>
              </View>
              <Text style={styles.wizardTitle}>Find Custom Farm Supplier</Text>
              <Text style={styles.wizardSub}>
                Input your crop volume, target price, and delivery requirements to get matched.
              </Text>
            </Pressable>

            {/* Section: Personalized Crop Matches */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Personalized Crop Matches</Text>
              <Pressable onPress={() => setStep('form')}>
                <Text style={styles.sectionLink}>Filter ›</Text>
              </Pressable>
            </View>

            <View style={styles.recommendGrid}>
              <Pressable
                style={styles.recommendCard}
                onPress={() =>
                  onSelectProduct?.({
                    title: 'Premium Orange Carrots',
                    pricePerUnit: 270,
                    unit: 'kg',
                  })
                }>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=60' }}
                  style={styles.recommendImg}
                  contentFit="cover"
                />
                <View style={styles.recommendInfo}>
                  <Text style={styles.recommendTitle} numberOfLines={1}>Premium Orange Carrots</Text>
                  <Text style={styles.recommendPrice}>
                    Rs. 270<Text style={styles.recommendUnit}>/kg</Text>
                  </Text>
                  <Text style={styles.recommendOrigin}>Nuwara Eliya • 98% Match</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.recommendCard}
                onPress={() =>
                  onSelectProduct?.({
                    title: 'King Coconut 6pk',
                    pricePerUnit: 840,
                    unit: 'pack',
                  })
                }>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=60' }}
                  style={styles.recommendImg}
                  contentFit="cover"
                />
                <View style={styles.recommendInfo}>
                  <Text style={styles.recommendTitle} numberOfLines={1}>King Coconut 6pk</Text>
                  <Text style={styles.recommendPrice}>
                    Rs. 840<Text style={styles.recommendUnit}>/pack</Text>
                  </Text>
                  <Text style={styles.recommendOrigin}>Kurunegala • 95% Match</Text>
                </View>
              </Pressable>
            </View>

            {/* Section: Verified Matching Farms */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <Text style={styles.sectionHeading}>Verified Matching Farms</Text>
              <Pressable onPress={() => setStep('results')}>
                <Text style={styles.sectionLink}>View All ({MOCK_MATCHED_FARMERS.length}) ›</Text>
              </Pressable>
            </View>

            {MOCK_MATCHED_FARMERS.map((farmer) => (
              <Pressable
                key={farmer.id}
                style={styles.farmerCard}
                onPress={() => {
                  setSelectedFarmer(farmer);
                  setStep('why-farmer');
                }}>
                <Image
                  source={{ uri: farmer.image }}
                  style={styles.farmerCardImg}
                  contentFit="cover"
                />
                <View style={styles.farmerCardBody}>
                  <View style={styles.farmerScoreBadge}>
                    <Text style={styles.farmerScoreText}>{farmer.matchScore}% Match</Text>
                  </View>
                  <Text style={styles.farmerCardName}>{farmer.name}</Text>
                  <Text style={styles.farmerCardLoc}>
                    📍 {farmer.location} • {farmer.distanceKm} km away
                  </Text>
                  <Text style={styles.farmerCardRating}>
                    ★ {farmer.rating} ({farmer.reviewsCount} reviews) • Rs. {farmer.pricePerUnit}/{farmer.unit}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: FIND BEST FARMERS FORM                                          */}
        {/* ========================================================================= */}
        {step === 'form' && (
          <View style={styles.formContainer}>
            <Text style={styles.formSub}>
              Tell us your sourcing requirements and our engine will calculate the top farm matches in Sri Lanka.
            </Text>

            {/* Field 1: Crop & Variety */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>What crop and variety are you looking for?</Text>
              <TextInput
                style={styles.textInput}
                value={cropVariety}
                onChangeText={setCropVariety}
                placeholder="e.g. Carrots, Tomatoes, Cinnamon..."
              />
            </View>

            {/* Field 2: Required Quantity */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Required Quantity (kg / units)</Text>
              <TextInput
                style={styles.textInput}
                value={requiredQty}
                onChangeText={setRequiredQty}
                keyboardType="numeric"
                placeholder="e.g. 500"
              />
            </View>

            {/* Field 3: Target Max Price */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldHeaderBetween}>
                <Text style={styles.fieldLabel}>Acceptable Target Price</Text>
                <Text style={styles.priceHighlight}>Rs. {maxPrice} /kg</Text>
              </View>
              <View style={styles.pricePillsRow}>
                {['180', '220', '250', '300'].map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.pricePill, maxPrice === p && styles.pricePillActive]}
                    onPress={() => setMaxPrice(p)}>
                    <Text style={[styles.pricePillText, maxPrice === p && styles.pricePillTextActive]}>
                      &lt; Rs. {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Field 4: Preferred Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Preferred Farm Location</Text>
              <TextInput
                style={styles.textInput}
                value={locationPref}
                onChangeText={setLocationPref}
              />
            </View>

            {/* Field 5: Certification Preference */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Quality & Certification</Text>
              <View style={styles.certRow}>
                {['100% Organic', 'GAP Certified', 'Fair Trade', 'Standard'].map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.certChip, selectedCert === c && styles.certChipActive]}
                    onPress={() => setSelectedCert(c)}>
                    <Text style={[styles.certChipText, selectedCert === c && styles.certChipTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={styles.findFarmersBtn}
              onPress={() => setStep('results')}>
              <Text style={styles.findFarmersBtnText}>
                Find Best Farmers (14 Matches) →
              </Text>
            </Pressable>
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 6: MATCHED FARMERS RESULTS                                         */}
        {/* ========================================================================= */}
        {step === 'results' && (
          <View>
            {/* Filter Chips */}
            <View style={styles.filterTabsRow}>
              {(['best', 'nearest', 'cheapest'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  style={[styles.filterTab, resultFilter === tab && styles.filterTabActive]}
                  onPress={() => setResultFilter(tab)}>
                  <Text style={[styles.filterTabText, resultFilter === tab && styles.filterTabTextActive]}>
                    {tab === 'best' && '★ Best Match'}
                    {tab === 'nearest' && '📍 Nearest First'}
                    {tab === 'cheapest' && '🏷️ Lowest Price'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Farmer Result Cards */}
            {MOCK_MATCHED_FARMERS.map((farmer) => (
              <View key={farmer.id} style={styles.resultCard}>
                <View style={styles.resultCardTop}>
                  <View style={styles.matchScoreBadgeLarge}>
                    <Text style={styles.matchScoreTextLarge}>{farmer.matchScore}% Match</Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setSelectedFarmer(farmer);
                      setStep('why-farmer');
                    }}>
                    <Text style={styles.whyFarmerLink}>Why This Farmer? ›</Text>
                  </Pressable>
                </View>

                <View style={styles.resultFarmerDetails}>
                  <Image
                    source={{ uri: farmer.avatar }}
                    style={styles.resultAvatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.resultName}>{farmer.name}</Text>
                    <Text style={styles.resultLocation}>📍 {farmer.location} • {farmer.distanceKm} km</Text>
                    <Text style={styles.resultPriceRow}>
                      <Text style={styles.resultPrice}>Rs. {farmer.pricePerUnit}</Text> /{farmer.unit} • ★ {farmer.rating} ({farmer.reviewsCount})
                    </Text>
                  </View>
                </View>

                {/* Crops tags */}
                <View style={styles.resultCropsRow}>
                  {farmer.cropsGrown.map((c) => (
                    <View key={c} style={styles.cropTag}>
                      <Text style={styles.cropTagText}>{c}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Buttons: Call | View Farm | Order */}
                <View style={styles.resultActionsRow}>
                  <Pressable
                    style={styles.actionBtnSmall}
                    onPress={() => callFarmer(farmer.phone)}>
                    <Text style={styles.actionBtnSmallText}>📞 Call</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnSmall}
                    onPress={() => {
                      setSelectedFarmer(farmer);
                      setStep('why-farmer');
                    }}>
                    <Text style={styles.actionBtnSmallText}>View Breakdown</Text>
                  </Pressable>

                  <Pressable
                    style={styles.orderFarmerBtn}
                    onPress={() => onOrderFarmer?.(farmer)}>
                    <Text style={styles.orderFarmerBtnText}>Direct Order</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 7: WHY THIS FARMER? (SCORE BREAKDOWN & EXPLANATION)               */}
        {/* ========================================================================= */}
        {step === 'why-farmer' && (
          <View>
            {/* Top Score Circular Gauge Card */}
            <View style={styles.whyScoreCard}>
              <View style={styles.gaugeCircle}>
                <Text style={styles.gaugeScoreText}>{selectedFarmer.matchScore}%</Text>
                <Text style={styles.gaugeSubText}>BEST MATCH</Text>
              </View>
              <Text style={styles.whyFarmerName}>{selectedFarmer.name}</Text>
              <Text style={styles.whyFarmerMeta}>
                ★ {selectedFarmer.rating} ({selectedFarmer.reviewsCount} reviews) • {selectedFarmer.location}
              </Text>
            </View>

            {/* Score Breakdown Bars */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownHeading}>Algorithm Score Breakdown</Text>

              {/* Metric 1 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Price Competitiveness</Text>
                  <Text style={styles.metricPercent}>{selectedFarmer.scoreBreakdown.priceCompetitiveness}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${selectedFarmer.scoreBreakdown.priceCompetitiveness}%` }]} />
                </View>
              </View>

              {/* Metric 2 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Distance & Logistics Efficiency</Text>
                  <Text style={styles.metricPercent}>{selectedFarmer.scoreBreakdown.distanceLogistics}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${selectedFarmer.scoreBreakdown.distanceLogistics}%` }]} />
                </View>
              </View>

              {/* Metric 3 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Quality & Organic Soil Standards</Text>
                  <Text style={styles.metricPercent}>{selectedFarmer.scoreBreakdown.qualityOrganic}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${selectedFarmer.scoreBreakdown.qualityOrganic}%` }]} />
                </View>
              </View>

              {/* Metric 4 */}
              <View style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Order Fulfillment Reliability</Text>
                  <Text style={styles.metricPercent}>{selectedFarmer.scoreBreakdown.orderFulfillment}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${selectedFarmer.scoreBreakdown.orderFulfillment}%` }]} />
                </View>
              </View>
            </View>

            {/* Detailed Explanation */}
            <View style={styles.explanationCard}>
              <Text style={styles.explanationHeading}>Detailed AI Assessment</Text>
              <Text style={styles.explanationBody}>{selectedFarmer.explanation}</Text>
            </View>

            {/* Quality Guarantee Callout */}
            <View style={styles.guaranteeCallout}>
              <Text style={styles.guaranteeEmoji}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>Famora Direct Guarantee</Text>
                <Text style={styles.guaranteeSub}>
                  Orders placed through verified match recommendations are covered by our 100% quality inspection pledge.
                </Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.whyBottomActions}>
              <Pressable
                style={styles.whyPrimaryBtn}
                onPress={() => onOrderFarmer?.(selectedFarmer)}>
                <Text style={styles.whyPrimaryBtnText}>Place Order From This Farm</Text>
              </Pressable>

              <Pressable
                style={styles.whySecondaryBtn}
                onPress={() => onChatFarmer?.(selectedFarmer.id)}>
                <Text style={styles.whySecondaryBtnText}>Chat With Farmer</Text>
              </Pressable>
            </View>
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
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  insightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '600',
  },
  wizardCtaCard: {
    backgroundColor: '#1B4332',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  wizardCtaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wizardBadge: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  wizardBadgeText: {
    color: '#D8F3DC',
    fontSize: 10,
    fontWeight: '800',
  },
  wizardArrow: {
    color: '#D8F3DC',
    fontSize: 18,
    fontWeight: '800',
  },
  wizardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  wizardSub: {
    fontSize: 12,
    color: '#D8F3DC',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  recommendGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  recommendImg: {
    width: '100%',
    height: 100,
    backgroundColor: '#F1F5F9',
  },
  recommendInfo: {
    padding: 10,
  },
  recommendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 2,
  },
  recommendUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  recommendOrigin: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  farmerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  farmerCardImg: {
    width: 90,
    height: 90,
    backgroundColor: '#E2E8F0',
  },
  farmerCardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  farmerScoreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  farmerScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  farmerCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerCardLoc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  farmerCardRating: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 4,
  },
  // Form Styles (Screen 5)
  formContainer: {
    paddingTop: 8,
  },
  formSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  priceHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  pricePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pricePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pricePillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  pricePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  pricePillTextActive: {
    color: '#15803D',
  },
  certRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  certChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  certChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  certChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  findFarmersBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  findFarmersBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Result Styles (Screen 6)
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  resultCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchScoreBadgeLarge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchScoreTextLarge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  whyFarmerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  resultFarmerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  resultPriceRow: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  resultCropsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  cropTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cropTagText: {
    fontSize: 11,
    color: '#475569',
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnSmall: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  orderFarmerBtn: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderFarmerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Why Farmer Styles (Screen 7)
  whyScoreCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  gaugeCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  gaugeScoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
  },
  gaugeSubText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  whyFarmerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  whyFarmerMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  breakdownHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
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
  explanationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  explanationHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  explanationBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  guaranteeCallout: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
    marginBottom: 20,
  },
  guaranteeEmoji: {
    fontSize: 20,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  guaranteeSub: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
  },
  whyBottomActions: {
    gap: 10,
  },
  whyPrimaryBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  whyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  whySecondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  whySecondaryBtnText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '700',
  },
});
