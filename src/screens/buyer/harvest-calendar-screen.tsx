import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { HarvestService, HarvestItem } from '@/services/harvest-service';

interface HarvestCalendarScreenProps {
  onBack: () => void;
  onSelectHarvest: (harvest: HarvestItem) => void;
  onFarmerSchedulePress?: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HarvestCalendarScreen({
  onBack,
  onSelectHarvest,
  onFarmerSchedulePress,
}: HarvestCalendarScreenProps) {
  const insets = useSafeAreaInsets();
  const [harvests, setHarvests] = useState<HarvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(25);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  // Month navigation: October 2026
  const currentMonthYear = 'October 2026';
  const daysInMonth = 31;
  const firstDayOffset = 4; // Thursday

  useEffect(() => {
    loadHarvests();
  }, [selectedDistrict]);

  const loadHarvests = async () => {
    setLoading(true);
    try {
      const data = await HarvestService.getHarvests(
        selectedDistrict !== 'All' ? { district: selectedDistrict } : undefined
      );
      setHarvests(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // Harvest dates map: check if date has harvest
  const harvestDates = new Set(
    harvests.map((h) => {
      const d = parseInt(h.expectedHarvestDate.split('-')[2], 10);
      return d;
    })
  );

  const districts = ['All', 'Dambulla', 'Nuwara Eliya', 'Polonnaruwa', 'Matale'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.navBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.navTitleCenter}>
          <Text style={styles.navTitle}>Harvest Schedule</Text>
          <Text style={styles.navSub}>Book crops before harvest & save 20%</Text>
        </View>

        {onFarmerSchedulePress ? (
          <Pressable onPress={onFarmerSchedulePress} style={styles.schedulePlusBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5}>
              <Path d="M12 5v14M5 12h14" />
            </Svg>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthTitle}>{currentMonthYear}</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Harvest Day</Text>
            </View>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysWeekRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={styles.dayOfWeekText}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Blank leading days */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calendarCell} />
            ))}

            {/* Days 1 to 31 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasHarvest = harvestDates.has(day);
              const isSelected = selectedDay === day;

              return (
                <Pressable
                  key={`day-${day}`}
                  style={[
                    styles.calendarCell,
                    isSelected && styles.cellSelected,
                    hasHarvest && !isSelected && styles.cellWithHarvest,
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.cellText,
                      isSelected && styles.cellTextSelected,
                      hasHarvest && !isSelected && styles.cellTextHarvest,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasHarvest && (
                    <View
                      style={[
                        styles.indicatorDot,
                        isSelected && { backgroundColor: '#FFFFFF' },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* District Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
          {districts.map((dist) => (
            <Pressable
              key={dist}
              style={[styles.filterChip, selectedDistrict === dist && styles.filterChipActive]}
              onPress={() => setSelectedDistrict(dist)}
            >
              <Text style={[styles.filterChipText, selectedDistrict === dist && styles.filterChipTextActive]}>
                {dist}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Harvest List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listSectionTitle}>
            Upcoming Harvests ({harvests.length})
          </Text>
          <Text style={styles.listSectionSub}>Deposit secures your batch</Text>
        </View>

        {/* Harvest Cards */}
        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 30 }} />
        ) : (
          harvests.map((item) => {
            const bookedPct = Math.round((item.reservedYieldKg / item.estimatedYieldKg) * 100);
            const remainingKg = Math.max(0, item.estimatedYieldKg - item.reservedYieldKg);

            return (
              <Pressable
                key={item.id}
                style={styles.harvestCard}
                onPress={() => onSelectHarvest(item)}
              >
                <View style={styles.harvestHeroRow}>
                  <Image source={{ uri: item.image }} style={styles.harvestImage} contentFit="cover" />
                  <View style={styles.harvestMetaCol}>
                    <View style={styles.badgeRow}>
                      <View style={styles.tagHarvestDate}>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={2.5}>
                          <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                          <Path d="M16 2v4M8 2v4M3 10h18" />
                        </Svg>
                        <Text style={styles.tagHarvestDateText}>
                          {item.expectedHarvestDate}
                        </Text>
                      </View>
                      <View style={styles.depositBadge}>
                        <Text style={styles.depositBadgeText}>{item.depositPercent}% Deposit</Text>
                      </View>
                    </View>

                    <Text style={styles.cropTitle} numberOfLines={1}>{item.cropName}</Text>
                    <Text style={styles.varietyText}>{item.variety} • {item.locationDistrict}</Text>

                    <View style={styles.farmerSnippet}>
                      <Image source={{ uri: item.farmerAvatar }} style={styles.farmerThumb} />
                      <Text style={styles.farmerNameSnippet} numberOfLines={1}>
                        {item.farmerName} ({item.farmerFarm})
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Allocation Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLeftLabel}>
                      Reserved: <Text style={styles.progressBold}>{item.reservedYieldKg.toLocaleString()} kg</Text> / {item.estimatedYieldKg.toLocaleString()} kg
                    </Text>
                    <Text style={styles.progressPctLabel}>{bookedPct}% Booked</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(100, bookedPct)}%` }]} />
                  </View>
                </View>

                {/* Card Footer: Pricing & Action */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.preOrderPrice}>
                      Rs. {item.preOrderPricePerKg}
                      <Text style={styles.perKgText}> / kg</Text>
                    </Text>
                    <Text style={styles.marketPriceCrossed}>
                      Market: Rs. {item.marketPricePerKg}/kg
                    </Text>
                  </View>

                  <Pressable
                    style={styles.bookPreOrderBtn}
                    onPress={() => onSelectHarvest(item)}
                  >
                    <Text style={styles.bookPreOrderBtnText}>Pre-Order Now</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitleCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  schedulePlusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  daysWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'relative',
    marginVertical: 2,
  },
  cellSelected: {
    backgroundColor: '#2E7D32',
  },
  cellWithHarvest: {
    backgroundColor: '#DCFCE7',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cellTextHarvest: {
    color: '#15803D',
    fontWeight: '800',
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2E7D32',
    position: 'absolute',
    bottom: 4,
  },
  filterBar: {
    marginVertical: 10,
  },
  filterBarContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listHeaderRow: {
    marginVertical: 10,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  listSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  harvestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  harvestHeroRow: {
    flexDirection: 'row',
  },
  harvestImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  harvestMetaCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tagHarvestDate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tagHarvestDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  depositBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  depositBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  varietyText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  farmerSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  farmerThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  farmerNameSnippet: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  progressSection: {
    marginTop: 12,
    marginBottom: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLeftLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  progressPctLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  preOrderPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2E7D32',
  },
  perKgText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  marketPriceCrossed: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  bookPreOrderBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookPreOrderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
