import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface AgroToolsScreenProps {
  onBack: () => void;
  initialTab?: 'weather' | 'calendar' | 'subsidies' | 'learn' | 'community' | 'carbon';
}

const CROPS_CALENDAR = [
  {
    name: 'Red Tomatoes',
    season: 'Maha Season',
    plantTime: 'Sept - Oct',
    harvestTime: 'Dec - Feb',
    status: 'Optimal Harvest Window',
    color: '#EF4444',
  },
  {
    name: 'Highland Carrots',
    season: 'Year-round Highland',
    plantTime: 'Every 3 months',
    harvestTime: '90-110 days',
    status: 'Growth Phase',
    color: '#F97316',
  },
  {
    name: 'Paddy / Rice (Samba)',
    season: 'Maha Season',
    plantTime: 'Oct - Nov',
    harvestTime: 'Feb - Mar',
    status: 'Land Preparation',
    color: '#EAB308',
  },
  {
    name: 'Green Chilies',
    season: 'Yala / Maha',
    plantTime: 'May - Jun / Oct',
    harvestTime: 'Continuous picking',
    status: 'Flowering & Fruiting',
    color: '#22C55E',
  },
];

const SUBSIDIES_DATA = [
  {
    id: 'sub-1',
    title: 'Organic Fertilizer Grant (Maha 2026)',
    agency: 'Department of Agrarian Development',
    amount: 'Rs. 25,000 / Acre',
    deadline: 'Closing in 12 days',
    category: 'Voucher Grant',
    description: 'Subsidized organic fertilizer and compost allocation for certified farmers and registered smallholders.',
    status: 'Open for Application',
  },
  {
    id: 'sub-2',
    title: 'Solar Agripump Concession Scheme',
    agency: 'Ministry of Agriculture & Renewable Energy',
    amount: 'Up to 60% Subsidy',
    deadline: 'Continuous 2026',
    category: 'Capital Equipment',
    description: 'Low-interest facility for solar-powered micro-irrigation installations in dry zone & intermediate belts.',
    status: 'Eligible',
  },
  {
    id: 'sub-3',
    title: 'Crop Weather Index Insurance',
    agency: 'Agricultural & Agrarian Insurance Board',
    amount: '100% Damage Cover',
    deadline: 'Per Season Enrollment',
    category: 'Risk Protection',
    description: 'Automatic payouts based on satellite rainfall metrics during flood and drought events.',
    status: 'Enrolled',
  },
];

const LEARN_VIDEOS = [
  {
    id: 'vid-1',
    title: 'SL-GAP Post-Harvest Sorting & Crate Packing',
    instructor: 'Dr. Priyantha Senarath • DOA Peradeniya',
    duration: '14:20 mins',
    views: '3.4k views',
    category: 'Quality Control',
  },
  {
    id: 'vid-2',
    title: 'Drip Irrigation & Fertilizer Fertigation in Highlands',
    instructor: 'Sunil Weerakkody • Agro Tech Lanka',
    duration: '22:15 mins',
    views: '8.1k views',
    category: 'Irrigation',
  },
  {
    id: 'vid-3',
    title: 'Biological Pest Management for Highland Tomato Blight',
    instructor: 'Anoma Jayasinghe • Organic Certifier',
    duration: '18:45 mins',
    views: '5.2k views',
    category: 'Organic Pest Control',
  },
];

const COMMUNITY_POSTS = [
  {
    id: 'post-1',
    author: 'Kusuma Bandara (Welimada)',
    title: 'Dealing with unseasonal heavy rains on tomato clusters?',
    content: 'Our plots had 45mm rain over 2 days. Any natural bio-fungicide recommendations to avoid bacterial spot before harvest next Tuesday?',
    upvotes: 24,
    replies: 9,
    time: '2h ago',
  },
  {
    id: 'post-2',
    author: 'Sunil Dissanayake (Colombo Buyer)',
    title: 'Looking for 2 tons of Bell Peppers for restaurant chain',
    content: 'Require weekly supplies of red and yellow capsicums with SL-GAP certificate. Direct farm collection available.',
    upvotes: 18,
    replies: 14,
    time: '5h ago',
  },
];

export function AgroToolsScreen({ onBack, initialTab = 'weather' }: AgroToolsScreenProps) {
  const [activeTab, setActiveTab] = useState<'weather' | 'calendar' | 'subsidies' | 'learn' | 'community' | 'carbon'>(initialTab);

  // Carbon calculator state
  const [farmAcres, setFarmAcres] = useState('3.5');
  const [farmingType, setFarmingType] = useState<'organic' | 'conventional'>('organic');
  const [localDistanceKm, setLocalDistanceKm] = useState('45');

  // Community discussion state
  const [posts, setPosts] = useState(COMMUNITY_POSTS);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Video watch modal
  const [activeVideo, setActiveVideo] = useState<typeof LEARN_VIDEOS[0] | null>(null);

  // Subsidies application modal
  const [applyingSubsidy, setApplyingSubsidy] = useState<typeof SUBSIDIES_DATA[0] | null>(null);

  // Computed carbon calculation
  const acres = parseFloat(farmAcres) || 1;
  const dist = parseFloat(localDistanceKm) || 45;
  const carbonSavedTonnes = (acres * (farmingType === 'organic' ? 0.8 : 0.3) + dist * 0.015).toFixed(1);
  const ecoScore = Math.min(98, Math.round(70 + acres * 2 + (farmingType === 'organic' ? 18 : 0)));

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Incomplete', 'Please provide a topic and question details.');
      return;
    }
    const created = {
      id: `post-${Date.now()}`,
      author: 'You (Farmer)',
      title: newPostTitle,
      content: newPostContent,
      upvotes: 1,
      replies: 0,
      time: 'Just now',
    };
    setPosts([created, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPostModal(false);
    Alert.alert('Posted!', 'Your question was shared with the Famora Agro Community.');
  };

  const handleUpvote = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p))
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Agro Advisory & Tools</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Scrollable Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'weather' && styles.tabBtnActive]}
          onPress={() => setActiveTab('weather')}>
          <Text style={[styles.tabText, activeTab === 'weather' && styles.tabTextActive]}>🌤️ Weather</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'calendar' && styles.tabBtnActive]}
          onPress={() => setActiveTab('calendar')}>
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>📅 Calendar</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'subsidies' && styles.tabBtnActive]}
          onPress={() => setActiveTab('subsidies')}>
          <Text style={[styles.tabText, activeTab === 'subsidies' && styles.tabTextActive]}>🏛️ Subsidies</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'learn' && styles.tabBtnActive]}
          onPress={() => setActiveTab('learn')}>
          <Text style={[styles.tabText, activeTab === 'learn' && styles.tabTextActive]}>📚 Learn</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'community' && styles.tabBtnActive]}
          onPress={() => setActiveTab('community')}>
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>👥 Community</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'carbon' && styles.tabBtnActive]}
          onPress={() => setActiveTab('carbon')}>
          <Text style={[styles.tabText, activeTab === 'carbon' && styles.tabTextActive]}>🌱 Eco Carbon</Text>
        </Pressable>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ==============================================================
            TAB 1: WEATHER FORECAST & HARVEST ADVISORY
        ============================================================== */}
        {activeTab === 'weather' && (
          <View>
            <View style={styles.weatherCard}>
              <View style={styles.weatherHeaderRow}>
                <View>
                  <Text style={styles.weatherLocation}>Nuwara Eliya / Welimada</Text>
                  <Text style={styles.weatherCond}>Partly Cloudy • Gentle Breeze</Text>
                </View>
                <Text style={styles.weatherEmoji}>⛅</Text>
              </View>

              <View style={styles.tempMainRow}>
                <Text style={styles.bigTemp}>24°C</Text>
                <View style={{ marginLeft: 16 }}>
                  <Text style={styles.humidityText}>💧 Humidity: 76%</Text>
                  <Text style={styles.humidityText}>💨 Wind: 12 km/h NE</Text>
                  <Text style={styles.humidityText}>🌧️ Rain Risk: 20% today</Text>
                </View>
              </View>

              {/* 5-Day Outlook */}
              <View style={styles.forecastRow}>
                <View style={styles.forecastDay}>
                  <Text style={styles.dayText}>Thu</Text>
                  <Text style={styles.dayEmoji}>☀️</Text>
                  <Text style={styles.dayTemp}>25°</Text>
                </View>
                <View style={styles.forecastDay}>
                  <Text style={styles.dayText}>Fri</Text>
                  <Text style={styles.dayEmoji}>⛅</Text>
                  <Text style={styles.dayTemp}>24°</Text>
                </View>
                <View style={styles.forecastDay}>
                  <Text style={styles.dayText}>Sat</Text>
                  <Text style={styles.dayEmoji}>🌧️</Text>
                  <Text style={styles.dayTemp}>21°</Text>
                </View>
                <View style={styles.forecastDay}>
                  <Text style={styles.dayText}>Sun</Text>
                  <Text style={styles.dayEmoji}>🌦️</Text>
                  <Text style={styles.dayTemp}>22°</Text>
                </View>
                <View style={styles.forecastDay}>
                  <Text style={styles.dayText}>Mon</Text>
                  <Text style={styles.dayEmoji}>☀️</Text>
                  <Text style={styles.dayTemp}>26°</Text>
                </View>
              </View>
            </View>

            {/* Agronomic Recommendations */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeading}>🌾 Agronomic Harvest Advisory</Text>
              <View style={styles.advisoryItem}>
                <Text style={styles.advisoryIcon}>✅</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.advisoryTitle}>Prime Tomato & Carrot Harvesting</Text>
                  <Text style={styles.advisoryDesc}>
                    Ideal morning dry window on Thursday & Friday. Complete field packing before Saturday afternoon rains.
                  </Text>
                </View>
              </View>

              <View style={styles.advisoryItem}>
                <Text style={styles.advisoryIcon}>⚠️</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.advisoryTitle}>Drainage Precaution for Saturday</Text>
                  <Text style={styles.advisoryDesc}>
                    Clear raised bed furrows in Welimada valleys to prevent root waterlogging for bell pepper nurseries.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ==============================================================
            TAB 2: CROP CALENDAR
        ============================================================== */}
        {activeTab === 'calendar' && (
          <View>
            <View style={styles.seasonHeaderCard}>
              <Text style={styles.seasonBadge}>CURRENT SEASON: MAHA 2025/2026</Text>
              <Text style={styles.seasonTitle}>North-East Monsoon Cultivation</Text>
              <Text style={styles.seasonDesc}>
                High rainfall period across the dry & intermediate zone. Upcountry vegetable plots enter main harvesting phase.
              </Text>
            </View>

            {CROPS_CALENDAR.map((crop, i) => (
              <View key={i} style={styles.cropCard}>
                <View style={[styles.cropColorStrip, { backgroundColor: crop.color }]} />
                <View style={{ flex: 1, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cropName}>{crop.name}</Text>
                    <Text style={styles.cropSeason}>{crop.season}</Text>
                  </View>

                  <View style={styles.timelinesRow}>
                    <View style={styles.timelineBox}>
                      <Text style={styles.timelineLabel}>Planting / Seeding:</Text>
                      <Text style={styles.timelineVal}>{crop.plantTime}</Text>
                    </View>
                    <View style={styles.timelineBox}>
                      <Text style={styles.timelineLabel}>Peak Harvest:</Text>
                      <Text style={styles.timelineVal}>{crop.harvestTime}</Text>
                    </View>
                  </View>

                  <View style={styles.cropStatusRow}>
                    <Text style={styles.cropStatusDot}>●</Text>
                    <Text style={styles.cropStatusText}>{crop.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==============================================================
            TAB 3: GOVERNMENT SUBSIDIES & GRANTS
        ============================================================== */}
        {activeTab === 'subsidies' && (
          <View>
            <View style={styles.subsidiesHeaderCard}>
              <Text style={styles.subsidiesHeaderBadge}>OFFICIAL SCHEMES</Text>
              <Text style={styles.subsidiesHeaderTitle}>Government Agricultural Subsidies</Text>
              <Text style={styles.subsidiesHeaderDesc}>
                Direct government grants, subsidized fertilizer vouchers, and concessionary equipment financing for verified growers.
              </Text>
            </View>

            {SUBSIDIES_DATA.map((sub) => (
              <View key={sub.id} style={styles.subsidyCard}>
                <View style={styles.subsidyHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subsidyTitle}>{sub.title}</Text>
                    <Text style={styles.subsidyAgency}>🏛️ {sub.agency}</Text>
                  </View>
                  <View style={styles.subsidyAmountChip}>
                    <Text style={styles.subsidyAmountText}>{sub.amount}</Text>
                  </View>
                </View>

                <Text style={styles.subsidyDesc}>{sub.description}</Text>

                <View style={styles.subsidyFooter}>
                  <Text style={styles.subsidyDeadline}>⏳ {sub.deadline}</Text>
                  <Pressable
                    style={styles.applyBtn}
                    onPress={() => setApplyingSubsidy(sub)}>
                    <Text style={styles.applyBtnText}>Check & Apply ↗</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==============================================================
            TAB 4: AGRO LEARN MASTERCLASSES
        ============================================================== */}
        {activeTab === 'learn' && (
          <View>
            <View style={styles.learnHeaderCard}>
              <Text style={styles.learnHeaderBadge}>FARMING MASTERCLASSES</Text>
              <Text style={styles.learnHeaderTitle}>Agro Training & Good Practices</Text>
              <Text style={styles.learnHeaderDesc}>
                Curated video tutorials by Sri Lankan agricultural officers and agronomy researchers.
              </Text>
            </View>

            {LEARN_VIDEOS.map((vid) => (
              <View key={vid.id} style={styles.videoCard}>
                <View style={styles.videoThumbnailSimulation}>
                  <Text style={{ fontSize: 36 }}>📹</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{vid.duration}</Text>
                  </View>
                </View>

                <View style={styles.videoBody}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{vid.category}</Text>
                  </View>
                  <Text style={styles.videoTitle}>{vid.title}</Text>
                  <Text style={styles.instructorText}>{vid.instructor}</Text>
                  <View style={styles.videoFooter}>
                    <Text style={styles.viewsText}>👁️ {vid.views}</Text>
                    <Pressable
                      style={styles.watchBtn}
                      onPress={() => setActiveVideo(vid)}>
                      <Text style={styles.watchBtnText}>▶ Watch Class</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==============================================================
            TAB 5: AGRO COMMUNITY FORUM
        ============================================================== */}
        {activeTab === 'community' && (
          <View>
            <View style={styles.communityTopActionRow}>
              <View>
                <Text style={styles.communityHeading}>Famora Grower Forum</Text>
                <Text style={styles.communitySub}>Peer advice, market pricing & agronomy discussions</Text>
              </View>
              <Pressable
                style={styles.askQuestionBtn}
                onPress={() => setShowNewPostModal(true)}>
                <Text style={styles.askQuestionBtnText}>+ Ask Question</Text>
              </Pressable>
            </View>

            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAuthorAvatar}>
                    <Text style={{ fontSize: 14 }}>🧑‍🌾</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.postAuthorName}>{post.author}</Text>
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postContent}>{post.content}</Text>

                <View style={styles.postFooter}>
                  <Pressable
                    style={styles.upvoteBtn}
                    onPress={() => handleUpvote(post.id)}>
                    <Text style={styles.upvoteText}>▲ Helpful ({post.upvotes})</Text>
                  </Pressable>
                  <View style={styles.replyChip}>
                    <Text style={styles.replyChipText}>💬 {post.replies} replies</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==============================================================
            TAB 6: CARBON FOOTPRINT & SUSTAINABILITY
        ============================================================== */}
        {activeTab === 'carbon' && (
          <View>
            {/* Eco Score Header */}
            <View style={styles.ecoScoreCard}>
              <View style={styles.ecoScoreCircle}>
                <Text style={styles.ecoScoreNum}>{ecoScore}</Text>
                <Text style={styles.ecoScoreDenom}>/100</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.ecoScoreTitle}>Eco Sustainability Score</Text>
                <Text style={styles.ecoScoreBadge}>🌿 Tier 1 Green Farm</Text>
                <Text style={styles.ecoScoreDesc}>
                  Direct farmer-to-buyer logistics removes 4 intermediary wholesale hops.
                </Text>
              </View>
            </View>

            {/* Inputs */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeading}>Carbon Savings Calculator</Text>

              <Text style={styles.inputLabel}>Farm Land Area (Acres)</Text>
              <TextInput
                style={styles.calcInput}
                keyboardType="numeric"
                value={farmAcres}
                onChangeText={setFarmAcres}
              />

              <Text style={styles.inputLabel}>Farming Method</Text>
              <View style={styles.toggleMethodRow}>
                <Pressable
                  style={[styles.methodBtn, farmingType === 'organic' && styles.methodBtnActive]}
                  onPress={() => setFarmingType('organic')}>
                  <Text style={[styles.methodBtnText, farmingType === 'organic' && styles.methodBtnTextActive]}>
                    100% Organic / SL-GAP
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.methodBtn, farmingType === 'conventional' && styles.methodBtnActive]}
                  onPress={() => setFarmingType('conventional')}>
                  <Text style={[styles.methodBtnText, farmingType === 'conventional' && styles.methodBtnTextActive]}>
                    Conventional
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Direct Delivery Radius (km)</Text>
              <TextInput
                style={styles.calcInput}
                keyboardType="numeric"
                value={localDistanceKm}
                onChangeText={setLocalDistanceKm}
              />

              {/* Result Card */}
              <View style={styles.carbonResultCard}>
                <Text style={styles.carbonResultLabel}>Estimated Annual Emissions Avoided:</Text>
                <Text style={styles.carbonResultValue}>{carbonSavedTonnes} tonnes CO₂e / year</Text>
                <Text style={styles.carbonResultSub}>
                  Equivalent to planting {Math.round(parseFloat(carbonSavedTonnes) * 45)} trees in Sri Lanka.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Video Watch Simulation Modal */}
      <Modal
        visible={!!activeVideo}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActiveVideo(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.videoPlayerCard}>
            <View style={styles.videoScreenSim}>
              <Text style={{ fontSize: 44 }}>🎬</Text>
              <Text style={styles.videoSimPlayingText}>Playing: {activeVideo?.title}</Text>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.modalVideoTitle}>{activeVideo?.title}</Text>
              <Text style={styles.modalVideoInstructor}>{activeVideo?.instructor}</Text>
              <Text style={styles.modalVideoDesc}>
                Demonstrating proper sorting, weight classification, and packing into ventilated crates to prevent 18% transit losses.
              </Text>
              <Pressable
                style={styles.closeVideoBtn}
                onPress={() => setActiveVideo(null)}>
                <Text style={styles.closeVideoBtnText}>Close Lesson</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subsidy Application Modal */}
      <Modal
        visible={!!applyingSubsidy}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setApplyingSubsidy(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.subsidyModalCard}>
            <Text style={styles.subsidyModalHeader}>Grant Eligibility Check</Text>
            <Text style={styles.subsidyModalScheme}>{applyingSubsidy?.title}</Text>
            <View style={styles.criteriaListBox}>
              <Text style={styles.criteriaItem}>✓ Famora Verified Farmer: Eligible</Text>
              <Text style={styles.criteriaItem}>✓ Land Title Document on file: Verified</Text>
              <Text style={styles.criteriaItem}>✓ Farm Acreage: Verified (3.5 Acres)</Text>
            </View>
            <Text style={styles.subsidyGrantAward}>Grant Entitlement: {applyingSubsidy?.amount}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={styles.cancelModalBtn}
                onPress={() => setApplyingSubsidy(null)}>
                <Text style={styles.cancelModalBtnText}>Close</Text>
              </Pressable>
              <Pressable
                style={styles.confirmSubsidyBtn}
                onPress={() => {
                  setApplyingSubsidy(null);
                  Alert.alert('Application Submitted! 📜', 'Your subsidy voucher was forwarded to the Agrarian Services Department. Ref: #SL-AGRI-9201.');
                }}>
                <Text style={styles.confirmSubsidyBtnText}>Submit Application</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ask Question Modal */}
      <Modal
        visible={showNewPostModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewPostModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.askModalCard}>
            <Text style={styles.askModalTitle}>Ask the Farming Community</Text>
            <TextInput
              style={styles.askInput}
              placeholder="Question summary (e.g. Tomato blight control)..."
              placeholderTextColor="#94A3B8"
              value={newPostTitle}
              onChangeText={setNewPostTitle}
            />
            <TextInput
              style={[styles.askInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Describe what you observed, your crop stage, soil type..."
              placeholderTextColor="#94A3B8"
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                style={styles.cancelModalBtn}
                onPress={() => setShowNewPostModal(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.confirmSubsidyBtn}
                onPress={handleCreatePost}>
                <Text style={styles.confirmSubsidyBtnText}>Publish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#1E5E3A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  weatherCard: {
    backgroundColor: '#1E5E3A',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1E5E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  weatherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weatherLocation: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  weatherCond: {
    fontSize: 13,
    color: '#A7F3D0',
    marginTop: 2,
  },
  weatherEmoji: {
    fontSize: 32,
  },
  tempMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  bigTemp: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  humidityText: {
    fontSize: 12,
    color: '#D1FAE5',
    marginBottom: 3,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 14,
  },
  forecastDay: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  dayEmoji: {
    fontSize: 18,
    marginVertical: 4,
  },
  dayTemp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  advisoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  advisoryIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  advisoryDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  seasonHeaderCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  seasonBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  seasonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginVertical: 4,
  },
  seasonDesc: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 16,
  },
  cropCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cropColorStrip: {
    width: 6,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cropSeason: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  timelinesRow: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 12,
  },
  timelineBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  timelineLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  timelineVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  cropStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropStatusDot: {
    fontSize: 8,
    color: '#16A34A',
  },
  cropStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  subsidiesHeaderCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  subsidiesHeaderBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  subsidiesHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginVertical: 4,
  },
  subsidiesHeaderDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  subsidyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  subsidyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subsidyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subsidyAgency: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  subsidyAmountChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subsidyAmountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  subsidyDesc: {
    fontSize: 12,
    color: '#475569',
    marginVertical: 10,
    lineHeight: 16,
  },
  subsidyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  subsidyDeadline: {
    fontSize: 11,
    color: '#64748B',
  },
  applyBtn: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  learnHeaderCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 12,
  },
  learnHeaderBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  learnHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B21B6',
    marginVertical: 4,
  },
  learnHeaderDesc: {
    fontSize: 12,
    color: '#6D28D9',
    lineHeight: 16,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
  },
  videoThumbnailSimulation: {
    height: 120,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  videoBody: {
    padding: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  instructorText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  videoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  viewsText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  watchBtn: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  watchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  communityTopActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  communityHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  communitySub: {
    fontSize: 11,
    color: '#64748B',
  },
  askQuestionBtn: {
    backgroundColor: '#1E5E3A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  askQuestionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  postTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  postTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  postContent: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  upvoteBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upvoteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  replyChip: {
    paddingHorizontal: 6,
  },
  replyChipText: {
    fontSize: 11,
    color: '#64748B',
  },
  ecoScoreCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ecoScoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecoScoreNum: {
    fontSize: 24,
    fontWeight: '900',
    color: '#15803D',
  },
  ecoScoreDenom: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '700',
  },
  ecoScoreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ecoScoreBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginVertical: 2,
  },
  ecoScoreDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  calcInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  toggleMethodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  methodBtnActive: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  methodBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  carbonResultCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  carbonResultLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  carbonResultValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803D',
    marginVertical: 4,
  },
  carbonResultSub: {
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  videoPlayerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  videoScreenSim: {
    height: 180,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSimPlayingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
  },
  modalVideoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalVideoInstructor: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalVideoDesc: {
    fontSize: 12,
    color: '#334155',
    marginVertical: 10,
    lineHeight: 16,
  },
  closeVideoBtn: {
    backgroundColor: '#1E5E3A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeVideoBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  subsidyModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },
  subsidyModalHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subsidyModalScheme: {
    fontSize: 13,
    color: '#1E5E3A',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 12,
  },
  criteriaListBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  criteriaItem: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  subsidyGrantAward: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  confirmSubsidyBtn: {
    flex: 2,
    backgroundColor: '#1E5E3A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmSubsidyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  askModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },
  askModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  askInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
  },
});
