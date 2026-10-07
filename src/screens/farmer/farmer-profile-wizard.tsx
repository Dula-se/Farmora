import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateFarmerOnboardingApi } from '@/services/api';
import { promptMediaSource } from '@/services/media-picker';

interface FarmerProfileWizardProps {
  initialStep?: 1 | 2 | 3 | 4 | 5 | 6 | 'checklist';
  onClose?: () => void;
  onFinish?: () => void;
  onPreviewPublicProfile?: () => void;
}

const LANGUAGES = ['Sinhala', 'English', 'Tamil'];
const FARM_CATEGORIES = ['Vegetables', 'Fruits', 'Paddy/Grains', 'Spices', 'Tea', 'Herbs'];
const FARM_TYPES = ['Organic', 'Conventional', 'Hydroponic', 'Greenhouse'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BANKS = ['Bank of Ceylon', 'People\'s Bank', 'Commercial Bank', 'Hatton National Bank', 'Sampath Bank'];

export function FarmerProfileWizard({
  initialStep = 1,
  onClose,
  onFinish,
  onPreviewPublicProfile,
}: FarmerProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 'checklist'>(initialStep);
  const [loading, setLoading] = useState(false);

  // Step 1: Personal Details
  const [nicNumber, setNicNumber] = useState('198523401234');
  const [mobileNumber, setMobileNumber] = useState('+94 77 987 6543');
  const [email, setEmail] = useState('kamal.g@famora.lk');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [bio, setBio] = useState('Over 15 years running my organic farm in Nuwara Eliya with natural spring water.');

  // Step 2: Farm Information
  const [farmName, setFarmName] = useState('Highland Organic Green Farm');
  const [farmCategory, setFarmCategory] = useState('Vegetables');
  const [farmType, setFarmType] = useState('Organic');
  const [landArea, setLandArea] = useState('3.5');
  const [experienceYears, setExperienceYears] = useState('15');

  // Step 3: Farm Address & GPS
  const [province, setProvince] = useState('Central Province');
  const [district, setDistrict] = useState('Nuwara Eliya');
  const [nearestTown, setNearestTown] = useState('Hakgala');
  const [fullAddress, setFullAddress] = useState('No. 42, Hakgala Mountain Rd, Nuwara Eliya');
  const [latitude, setLatitude] = useState('6.9497');
  const [longitude, setLongitude] = useState('80.7891');

  // Step 4: Farm Media
  const [coverPhoto, setCoverPhoto] = useState('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800');
  const [gallery, setGallery] = useState<string[]>([
    'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=500',
    'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500',
  ]);

  // Step 5: Delivery Preferences
  const [farmerPickup, setFarmerPickup] = useState(true);
  const [farmerDelivery, setFarmerDelivery] = useState(true);
  const [thirdPartyDelivery, setThirdPartyDelivery] = useState(false);
  const [deliveryRadius, setDeliveryRadius] = useState('25');
  const [deliveryChargePerKm, setDeliveryChargePerKm] = useState('150');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri', 'Sat']);

  // Step 6: Payment Details
  const [bankName, setBankName] = useState('Commercial Bank');
  const [branch, setBranch] = useState('Nuwara Eliya Branch');
  const [accountName, setAccountName] = useState('K. G. Gunawardana');
  const [accountNumber, setAccountNumber] = useState('80023491823');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('+94 77 987 6543');

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveStep = async (nextStep: 1 | 2 | 3 | 4 | 5 | 6 | 'checklist') => {
    setLoading(true);
    try {
      await updateFarmerOnboardingApi({
        step: currentStep,
        personalDetails: { nicNumber, mobileNumber, email, selectedLanguage, bio },
        farmDetails: {
          farmName,
          category: farmCategory,
          farmType,
          landArea: Number(landArea) || 1,
          experienceYears: Number(experienceYears) || 1,
          province,
          district,
          nearestTown,
          address: fullAddress,
          gpsLocation: {
            latitude: Number(latitude) || 6.9497,
            longitude: Number(longitude) || 80.7891,
          },
          coverPhoto,
          gallery,
        },
        deliveryPreferences: {
          farmerPickup,
          farmerDelivery,
          thirdPartyDelivery,
          deliveryRadius: Number(deliveryRadius) || 20,
          deliveryChargePerKm: Number(deliveryChargePerKm) || 100,
          deliveryDays: selectedDays,
        },
        paymentDetails: {
          bankName,
          branch,
          accountName,
          accountNumber,
          mobileWalletNumber,
        },
      });
      setCurrentStep(nextStep);
    } catch {
      // Proceed even on network hiccup to prevent blocking
      setCurrentStep(nextStep);
    } finally {
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECKLIST SCREEN (Screen 5 in Image 2)
  // ═════════════════════════════════════════════════════════════════════════════
  if (currentStep === 'checklist') {
    const checklistItems = [
      { id: 1, title: 'Personal Information', completed: true, stepTarget: 1 },
      { id: 2, title: 'Farm Information', completed: true, stepTarget: 2 },
      { id: 3, title: 'Farm Location & GPS', completed: true, stepTarget: 3 },
      { id: 4, title: 'Farm Media & Gallery', completed: true, stepTarget: 4 },
      { id: 5, title: 'Delivery Preferences', completed: false, stepTarget: 5 },
      { id: 6, title: 'Payment Details', completed: false, stepTarget: 6 },
    ];

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.iconBackBtn}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>Onboarding Status</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.checklistContent} showsVerticalScrollIndicator={false}>
          {/* Circular Progress Gauge */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeCircle}>
              <Text style={styles.gaugePercent}>70%</Text>
              <Text style={styles.gaugeSub}>Complete</Text>
            </View>
            <View style={styles.gaugeTextWrapper}>
              <Text style={styles.gaugeTitle}>Profile 70% Complete</Text>
              <Text style={styles.gaugeSubtitle}>
                Finish remaining sections to get your verified farmer badge and increase sales by 4x.
              </Text>
            </View>
          </View>

          {/* Checklist rows */}
          <View style={styles.checklistCard}>
            {checklistItems.map((item) => (
              <View key={item.id} style={styles.checklistRow}>
                <View style={styles.checklistLeft}>
                  <View
                    style={[
                      styles.checklistStatusDot,
                      item.completed ? styles.statusDotGreen : styles.statusDotOrange,
                    ]}>
                    <Text style={styles.statusDotIcon}>{item.completed ? '✓' : '!'}</Text>
                  </View>
                  <View>
                    <Text style={styles.checkItemTitle}>{item.title}</Text>
                    <Text
                      style={[
                        styles.checkItemStatus,
                        item.completed ? styles.textGreen : styles.textOrange,
                      ]}>
                      {item.completed ? 'Completed' : 'Pending Action'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.checkItemActionBtn}
                  onPress={() => setCurrentStep(item.stepTarget as any)}>
                  <Text style={styles.checkItemActionText}>
                    {item.completed ? 'Edit' : 'Finish →'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.checklistActions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={() => setCurrentStep(5)}>
              <Text style={styles.primaryBtnText}>Complete Remaining Sections</Text>
            </Pressable>

            {onPreviewPublicProfile && (
              <Pressable style={styles.outlineBtn} onPress={onPreviewPublicProfile}>
                <Text style={styles.outlineBtnText}>View Public Profile Preview</Text>
              </Pressable>
            )}

            <Pressable style={styles.finishLink} onPress={onFinish || onClose}>
              <Text style={styles.finishLinkText}>Return to Dashboard</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // WIZARD STEPS 1 to 6
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Top Bar with step indicator */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (currentStep === 1) onClose?.();
            else setCurrentStep((prev: any) => (prev - 1) as any);
          }}
          hitSlop={12}
          style={styles.iconBackBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.brandCenter}>
          <Text style={styles.brandName}>Farmora</Text>
        </View>

        <Pressable onPress={() => setCurrentStep('checklist')} hitSlop={12}>
          <Text style={styles.checklistShortcut}>Status</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Wizard step bar */}
          <View style={styles.stepProgressBar}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepBarSegment,
                  currentStep >= s && styles.stepBarSegmentActive,
                ]}
              />
            ))}
          </View>

          {/* ═══════════ STEP 1: PERSONAL DETAILS ═══════════ */}
          {currentStep === 1 && (
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.stepIndicator}>Step 1 of 5</Text>
                <Text style={styles.title}>Personal Details</Text>
                <Text style={styles.subtitle}>
                  Provide your government identification to become a verified supplier.
                </Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>National Identity Card (NIC) *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 198523401234 or 852340123V"
                      value={nicNumber}
                      onChangeText={setNicNumber}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="+94 77 123 4567"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="farmer@famora.lk"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Language</Text>
                  <View style={styles.chipsRow}>
                    {LANGUAGES.map((lang) => (
                      <Pressable
                        key={lang}
                        style={[
                          styles.chip,
                          selectedLanguage === lang && styles.chipActive,
                        ]}
                        onPress={() => setSelectedLanguage(lang)}>
                        <Text
                          style={[
                            styles.chipText,
                            selectedLanguage === lang && styles.chipTextActive,
                          ]}>
                          {lang}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>About You & Farming Background</Text>
                  <View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start' }]}>
                    <TextInput
                      style={[styles.textInput, { paddingTop: 10 }]}
                      placeholder="Briefly describe your farming experience..."
                      multiline
                      value={bio}
                      onChangeText={setBio}
                    />
                  </View>
                </View>

                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleSaveStep(2)}>
                  <Text style={styles.primaryBtnText}>Save & Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ═══════════ STEP 2: FARM INFORMATION ═══════════ */}
          {currentStep === 2 && (
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.stepIndicator}>Step 2 of 5</Text>
                <Text style={styles.title}>Farm Information</Text>
                <Text style={styles.subtitle}>
                  Tell buyers about your agricultural methods and land area.
                </Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Farm Name *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Highland Valley Organic Farm"
                      value={farmName}
                      onChangeText={setFarmName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Primary Produce Category</Text>
                  <View style={styles.chipsRow}>
                    {FARM_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        style={[
                          styles.chip,
                          farmCategory === cat && styles.chipActive,
                        ]}
                        onPress={() => setFarmCategory(cat)}>
                        <Text
                          style={[
                            styles.chipText,
                            farmCategory === cat && styles.chipTextActive,
                          ]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Farming Method</Text>
                  <View style={styles.chipsRow}>
                    {FARM_TYPES.map((type) => (
                      <Pressable
                        key={type}
                        style={[
                          styles.chip,
                          farmType === type && styles.chipActive,
                        ]}
                        onPress={() => setFarmType(type)}>
                        <Text
                          style={[
                            styles.chipText,
                            farmType === type && styles.chipTextActive,
                          ]}>
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Land Area (Acres)</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="3.5"
                        keyboardType="decimal-pad"
                        value={landArea}
                        onChangeText={setLandArea}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Years of Experience</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="15"
                        keyboardType="number-pad"
                        value={experienceYears}
                        onChangeText={setExperienceYears}
                      />
                    </View>
                  </View>
                </View>

                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleSaveStep(3)}>
                  <Text style={styles.primaryBtnText}>Save & Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ═══════════ STEP 3: FARM ADDRESS & GPS ═══════════ */}
          {currentStep === 3 && (
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.stepIndicator}>Step 3 of 5</Text>
                <Text style={styles.title}>Farm Address & GPS</Text>
                <Text style={styles.subtitle}>
                  Pinpoint your farm location for accurate buyer proximity and logistics calculation.
                </Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.twoCol}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Province</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        value={province}
                        onChangeText={setProvince}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>District</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        value={district}
                        onChangeText={setDistrict}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nearest Town / Landmark</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Hakgala Botanical Garden"
                      value={nearestTown}
                      onChangeText={setNearestTown}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Farm Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={fullAddress}
                      onChangeText={setFullAddress}
                    />
                  </View>
                </View>

                {/* GPS Map Coordinate Preview */}
                <View style={styles.gpsMapCard}>
                  <View style={styles.mapGraphic}>
                    <Text style={styles.mapPin}>📍</Text>
                    <Text style={styles.mapCoordText}>
                      Lat: {latitude} • Long: {longitude}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.pinLocationBtn}
                    onPress={() => Alert.alert('GPS Location Set', `Confirmed pin at ${latitude}, ${longitude}`)}>
                    <Text style={styles.pinLocationBtnText}>Confirm GPS Pin on Map</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleSaveStep(4)}>
                  <Text style={styles.primaryBtnText}>Save & Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ═══════════ STEP 4: FARM MEDIA ═══════════ */}
          {currentStep === 4 && (
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.stepIndicator}>Step 4 of 5</Text>
                <Text style={styles.title}>Farm Media</Text>
                <Text style={styles.subtitle}>
                  High-quality photos build trust with commercial buyers and supermarkets.
                </Text>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Cover Photo</Text>
                <Pressable
                  style={styles.coverUploadBox}
                  onPress={() => {
                    promptMediaSource({
                      title: 'Farm Cover Photo',
                      message: 'Take a photo or choose from your gallery:',
                      allowsEditing: true,
                      aspect: [16, 9],
                      onSelected: (res) => setCoverPhoto(res.dataUrl),
                    });
                  }}>
                  <Image source={{ uri: coverPhoto }} style={styles.coverPreviewImage} />
                  <View style={styles.coverUploadBadge}>
                    <Text style={styles.coverUploadBadgeText}>📷 Change Cover</Text>
                  </View>
                </Pressable>

                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Farm Gallery (Up to 6 photos)</Text>
                <View style={styles.galleryGrid}>
                  {gallery.map((uri, idx) => (
                    <View key={idx} style={styles.galleryItem}>
                      <Image source={{ uri }} style={styles.galleryImage} />
                      <Pressable
                        style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}
                        onPress={() => setGallery(gallery.filter((_, i) => i !== idx))}>
                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                  {gallery.length < 6 && (
                    <Pressable
                      style={styles.galleryAddBox}
                      onPress={() => {
                        promptMediaSource({
                          title: 'Add Farm Gallery Photo',
                          message: 'Capture a farm photo or select from gallery:',
                          onSelected: (res) => setGallery([...gallery, res.dataUrl]),
                        });
                      }}>
                      <Text style={styles.galleryAddPlus}>+</Text>
                      <Text style={styles.galleryAddText}>Add Photo</Text>
                    </Pressable>
                  )}
                </View>

                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleSaveStep(5)}>
                  <Text style={styles.primaryBtnText}>Save & Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ═══════════ STEP 5: DELIVERY PREFERENCES ═══════════ */}
          {currentStep === 5 && (
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.stepIndicator}>Step 5 of 5</Text>
                <Text style={styles.title}>Delivery Preferences</Text>
                <Text style={styles.subtitle}>
                  Specify your fulfillment options, delivery radius, and available dispatch days.
                </Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchTitle}>Farm Pickup</Text>
                    <Text style={styles.switchSubtitle}>Buyers can collect produce directly at farm gate</Text>
                  </View>
                  <Switch
                    value={farmerPickup}
                    onValueChange={setFarmerPickup}
                    trackColor={{ true: '#386641', false: '#E2E8F0' }}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchTitle}>Farmer Direct Delivery</Text>
                    <Text style={styles.switchSubtitle}>You provide own vehicle delivery to buyers</Text>
                  </View>
                  <Switch
                    value={farmerDelivery}
                    onValueChange={setFarmerDelivery}
                    trackColor={{ true: '#386641', false: '#E2E8F0' }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Delivery Radius: {deliveryRadius} km</Text>
                  <View style={styles.chipsRow}>
                    {['10', '25', '50', '100'].map((km) => (
                      <Pressable
                        key={km}
                        style={[
                          styles.chip,
                          deliveryRadius === km && styles.chipActive,
                        ]}
                        onPress={() => setDeliveryRadius(km)}>
                        <Text
                          style={[
                            styles.chipText,
                            deliveryRadius === km && styles.chipTextActive,
                          ]}>
                          {km} km
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Delivery Charge (Rs. / km)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={deliveryChargePerKm}
                      onChangeText={setDeliveryChargePerKm}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Available Dispatch Days</Text>
                  <View style={styles.chipsRow}>
                    {DAYS.map((day) => {
                      const isSel = selectedDays.includes(day);
                      return (
                        <Pressable
                          key={day}
                          style={[styles.chip, isSel && styles.chipActive]}
                          onPress={() => toggleDay(day)}>
                          <Text
                            style={[
                              styles.chipText,
                              isSel && styles.chipTextActive,
                            ]}>
                            {day}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleSaveStep(6)}>
                  <Text style={styles.primaryBtnText}>Proceed to Payment Setup →</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ═══════════ STEP 6: PAYMENT DETAILS ═══════════ */}
          {currentStep === 6 && (
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.stepIndicator}>Payment Information</Text>
                <Text style={styles.title}>Payment Details</Text>
                <Text style={styles.subtitle}>
                  Receive bank transfers for wholesale orders safely via Famora Escrow guarantee.
                </Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <View style={styles.chipsRow}>
                    {BANKS.map((b) => (
                      <Pressable
                        key={b}
                        style={[styles.chip, bankName === b && styles.chipActive]}
                        onPress={() => setBankName(b)}>
                        <Text
                          style={[
                            styles.chipText,
                            bankName === b && styles.chipTextActive,
                          ]}>
                          {b}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Branch</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={branch}
                      onChangeText={setBranch}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Holder Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={accountName}
                      onChangeText={setAccountName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Wallet Option (eZ Cash / mCash)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={mobileWalletNumber}
                      onChangeText={setMobileWalletNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleSaveStep('checklist')}>
                  <Text style={styles.primaryBtnText}>Save Payment Details</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#1E293B',
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2E20',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  checklistShortcut: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  stepProgressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  stepBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  stepBarSegmentActive: {
    backgroundColor: '#386641',
  },
  titleSection: {
    marginBottom: 16,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#386641',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  formCard: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#386641',
    borderColor: '#386641',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gpsMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  mapGraphic: {
    height: 100,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapPin: {
    fontSize: 28,
  },
  mapCoordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  pinLocationBtn: {
    backgroundColor: '#EDF4EC',
    borderWidth: 1,
    borderColor: '#D4E2D3',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinLocationBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  coverUploadBox: {
    position: 'relative',
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  coverPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverUploadBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coverUploadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryAddBox: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryAddPlus: {
    fontSize: 22,
    color: '#64748B',
    fontWeight: '700',
  },
  galleryAddText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: '#386641',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnPressed: {
    backgroundColor: '#2F5436',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Checklist Styles
  checklistContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 16,
    marginBottom: 20,
  },
  gaugeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: '#386641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#386641',
  },
  gaugeSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  gaugeTextWrapper: {
    flex: 1,
  },
  gaugeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  gaugeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checklistStatusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotGreen: {
    backgroundColor: '#DCFCE7',
  },
  statusDotOrange: {
    backgroundColor: '#FEF3C7',
  },
  statusDotIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  checkItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  checkItemStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  textGreen: {
    color: '#16A34A',
  },
  textOrange: {
    color: '#D97706',
  },
  checkItemActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  checkItemActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#386641',
  },
  checklistActions: {
    gap: 12,
  },
  outlineBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#386641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: '#386641',
    fontSize: 14,
    fontWeight: '700',
  },
  finishLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  finishLinkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
