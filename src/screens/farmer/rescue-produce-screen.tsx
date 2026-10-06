import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fetchRescueProduce, createRescueProduce } from '../../services/api';

interface RescueProduceScreenProps {
  onBack: () => void;
  onAddNewRescue?: () => void;
}

export const RescueProduceScreen: React.FC<RescueProduceScreenProps> = ({
  onBack,
  onAddNewRescue,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'near_expiry' | 'surplus' | 'cosmetic_blemish'>('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRescueItems();
  }, [activeTab]);

  const loadRescueItems = async () => {
    setLoading(true);
    try {
      const data = await fetchRescueProduce(activeTab);
      setItems(data);
    } catch {
      // Fallback sample items
      setItems([
        {
          id: 'res_001',
          title: 'Ripe Organic Red Tomatoes (Urgent Clearance)',
          farmerName: 'Sunil Bandara',
          category: 'vegetables',
          originalPrice: 350,
          pricePerUnit: 180,
          rescueDiscount: 48,
          unit: 'kg',
          availableQuantity: 80,
          rescueReason: 'near_expiry',
          rescueExpiryHours: 24,
          locationCity: 'Nuwara Eliya',
          images: [
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80',
          ],
        },
        {
          id: 'res_002',
          title: 'Surplus Cooking Melon (Bumper Harvest)',
          farmerName: 'Sunil Bandara',
          category: 'vegetables',
          originalPrice: 180,
          pricePerUnit: 110,
          rescueDiscount: 38,
          unit: 'kg',
          availableQuantity: 140,
          rescueReason: 'surplus',
          rescueExpiryHours: 48,
          locationCity: 'Nuwara Eliya',
          images: [
            'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&auto=format&fit=crop&q=80',
          ],
        },
        {
          id: 'res_003',
          title: 'Odd-Shaped Nuwara Eliya Carrots (Grade B Delicious)',
          farmerName: 'Kamal Perera',
          category: 'vegetables',
          originalPrice: 220,
          pricePerUnit: 130,
          rescueDiscount: 40,
          unit: 'kg',
          availableQuantity: 95,
          rescueReason: 'cosmetic_blemish',
          rescueExpiryHours: 72,
          locationCity: 'Welimada',
          images: [
            'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=80',
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Items' },
    { id: 'near_expiry', label: 'Near Expiry' },
    { id: 'surplus', label: 'Surplus Harvest' },
    { id: 'cosmetic_blemish', label: 'Grade B / Blemish' },
  ];

  const handleRescueAction = (item: any) => {
    Alert.alert(
      'Rescue Batch Listed',
      `"${item.title}" is flagged with flash priority! Supermarkets & bulk buyers have been notified.`
    );
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
        <Text style={styles.headerTitle}>Rescue Produce</Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Add Rescue Batch',
              'Select a crop from your inventory to convert into an urgent discount rescue batch.'
            );
          }}
          hitSlop={12}
          style={styles.headerAddBtn}>
          <Text style={styles.headerAddBtnText}>+ List Batch</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBannerLeft}>
            <Text style={styles.heroBannerTitle}>Reduce Food Waste, Earn More!</Text>
            <Text style={styles.heroBannerSub}>
              List near-expiry or surplus harvests at discounted clearance rates. Supermarkets and processors buy in bulk within hours!
            </Text>
          </View>
          <View style={styles.heroEmojiCircle}>
            <Text style={styles.heroEmoji}>🌱</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.id as any)}>
              <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Listing Cards */}
        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {items.map((item, idx) => (
              <View key={item.id || idx} style={styles.rescueCard}>
                <Image
                  source={{
                    uri:
                      item.images?.[0] ||
                      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80',
                  }}
                  style={styles.cropImg}
                />
                <View style={styles.cardBadgeOverlay}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      {item.rescueDiscount || 40}% OFF
                    </Text>
                  </View>
                  <View style={styles.timerBadge}>
                    <Text style={styles.timerBadgeText}>
                      ⏱️ {item.rescueExpiryHours || 24}h left
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.farmerSub}>
                    By {item.farmerName} • {item.locationCity}
                  </Text>

                  {/* Pricing row */}
                  <View style={styles.pricingRow}>
                    <View style={styles.priceCol}>
                      <Text style={styles.discountedPrice}>
                        Rs. {item.pricePerUnit} / {item.unit}
                      </Text>
                      {item.originalPrice && (
                        <Text style={styles.originalPrice}>
                          Rs. {item.originalPrice} / {item.unit}
                        </Text>
                      )}
                    </View>
                    <View style={styles.stockQtyPill}>
                      <Text style={styles.stockQtyText}>
                        {item.availableQuantity} {item.unit} available
                      </Text>
                    </View>
                  </View>

                  {/* Rescue Reason Tag */}
                  <View style={styles.reasonRow}>
                    <Text style={styles.reasonTag}>
                      🏷️ {item.rescueReason === 'near_expiry'
                        ? 'Near Expiry (Immediate Pickup)'
                        : item.rescueReason === 'surplus'
                        ? 'Surplus Bumper Crop'
                        : 'Grade B / Minor Cosmetic Blemish'}
                    </Text>
                  </View>

                  {/* Action CTA */}
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    activeOpacity={0.85}
                    onPress={() => handleRescueAction(item)}>
                    <Text style={styles.cardActionBtnText}>Quick Sell to Commercial Buyers</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info callout at bottom */}
        <View style={styles.bottomInfoCard}>
          <Text style={styles.bottomInfoTitle}>💡 Why Rescue Produce Works</Text>
          <Text style={styles.bottomInfoText}>
            • 0% marketplace commission on clearance surplus{'\n'}
            • Supermarkets & food processing factories monitor this feed 24/7{'\n'}
            • Same-day bulk pickup arranged directly at your farmgate
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
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
  headerAddBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#14532D',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroBannerSub: {
    fontSize: 12,
    color: '#BBF7D0',
    lineHeight: 18,
  },
  heroEmojiCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 26,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabChipActive: {
    backgroundColor: '#2E7D32',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 16,
  },
  rescueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cropImg: {
    width: '100%',
    height: 150,
    backgroundColor: '#F1F5F9',
  },
  cardBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discountBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  timerBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  farmerSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
  },
  originalPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  stockQtyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockQtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  reasonRow: {
    marginBottom: 14,
  },
  reasonTag: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cardActionBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomInfoCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 20,
  },
  bottomInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6,
  },
  bottomInfoText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 20,
  },
});
