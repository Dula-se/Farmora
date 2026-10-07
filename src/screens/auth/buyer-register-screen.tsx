import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { registerWithApi, googleAuthApi } from '@/services/api';
import { GoogleAuthModal } from '@/services/google-auth-modal';
import { promptMediaSource } from '@/services/media-picker';

interface BuyerRegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (user?: any) => void;
}

const BUYER_TYPES = [
  'Individual',
  'Restaurant',
  'Supermarket',
  'Exporter',
  'Food Processor',
  'Wholesaler',
];

const BUSINESS_TYPES = [
  'Retail Store',
  'Restaurant / Hotel',
  'Wholesale Trader',
  'Export Company',
  'Food Processing Facility',
  'Catering Service',
];

const MONTHLY_VOLUMES = [
  'Less than 100 kg',
  '100 kg - 500 kg',
  '500 kg - 2,000 kg',
  '2,000 kg - 10,000 kg',
  '10,000+ kg',
];

const PREFERRED_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Paddy/Grains',
  'Spices',
  'Tea',
  'Herbs',
];

export function BuyerRegisterScreen({
  onBackToLogin,
  onRegisterSuccess,
}: BuyerRegisterScreenProps) {
  // Wizard steps: 1 = Create Buyer Account, 2 = Business Details, 3 = Buyer Account Created!
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form Data
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedBuyerType, setSelectedBuyerType] = useState('Individual');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Step 2 Form Data
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Restaurant / Hotel');
  const [businessRegNo, setBusinessRegNo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('100 kg - 500 kg');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([
    'Vegetables',
    'Fruits',
  ]);

  const [loading, setLoading] = useState(false);
  const [brDocUri, setBrDocUri] = useState<string | null>(null);
  const [brDocName, setBrDocName] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const toggleCategory = (cat: string) => {
    if (preferredCategories.includes(cat)) {
      setPreferredCategories(preferredCategories.filter((c) => c !== cat));
    } else {
      setPreferredCategories([...preferredCategories, cat]);
    }
  };

  const handleStep1Submit = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Field', 'Please enter your full name.');
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert('Missing Field', 'Please enter your mobile number.');
      return;
    }
    if (!password) {
      Alert.alert('Missing Field', 'Please create a password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (!agreedTerms) {
      Alert.alert('Terms Agreement', 'Please agree to the Terms and Conditions.');
      return;
    }

    // If individual buyer, can complete directly or proceed to business details
    if (selectedBuyerType === 'Individual') {
      submitRegistration(false);
    } else {
      setStep(2);
    }
  };

  const submitRegistration = async (includeBusinessDetails: boolean) => {
    setLoading(true);
    try {
      const payload: any = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim() || undefined,
        password,
        accountType: 'buyer',
        buyerType: selectedBuyerType,
        address: businessAddress || undefined,
      };

      if (includeBusinessDetails) {
        payload.businessDetails = {
          businessName: businessName.trim(),
          businessType,
          registrationNumber: businessRegNo.trim(),
          contactPerson: contactPerson.trim() || fullName.trim(),
          monthlyPurchasingVolume: monthlyVolume,
          preferredCategories,
          registrationDoc: brDocUri || undefined,
        };
      }

      const res = await registerWithApi(payload);
      setCreatedUser(res.user);
      setStep(3); // Success Screen
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not register account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelect = async (account: any) => {
    setLoading(true);
    try {
      const res = await googleAuthApi({
        email: account.email,
        fullName: account.name,
        avatarUrl: account.avatar,
        accountType: 'buyer',
        buyerType: selectedBuyerType,
      });
      setCreatedUser(res.user);
      setStep(3);
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Could not authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  // ── Render Step 3: Success Screen ──────────────────────────────────────────
  if (step === 3) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successCheckmark}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Buyer Account Created!</Text>
          <Text style={styles.successSubtitle}>
            Your buyer account has been successfully created. Explore hundreds of verified
            farmers and order fresh produce directly with transparent pricing.
          </Text>

          <View style={styles.successButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={() => onRegisterSuccess(createdUser)}>
              <Text style={styles.primaryBtnText}>Complete Buyer Profile</Text>
            </Pressable>

            <Pressable
              style={styles.skipBtn}
              onPress={() => onRegisterSuccess(createdUser)}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render Step 1 & Step 2 Forms ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step === 2) setStep(1);
            else onBackToLogin();
          }}
          hitSlop={12}
          style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.brandContainer}>
          <View style={styles.logoSquare}>
            <View style={styles.sproutMini}>
              <View style={styles.sproutMiniLeafOrange} />
              <View style={styles.sproutMiniLeafWhite} />
              <View style={styles.sproutMiniStem} />
            </View>
          </View>
          <Text style={styles.brandName}>Farmora</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {step === 1 ? 'Step 1 of 2: Basic Account' : 'Step 2 of 2: Business Profile'}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: step === 1 ? '50%' : '100%' },
                ]}
              />
            </View>
          </View>

          {step === 1 ? (
            /* ═══════════ STEP 1: CREATE BUYER ACCOUNT ═══════════ */
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Create Buyer Account</Text>
                <Text style={styles.subtitle}>
                  Source fresh agricultural produce directly from verified farmers across Sri Lanka.
                </Text>
              </View>

              {/* Google Fast Registration Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.googleButtonPressed,
                ]}
                onPress={() => setShowGoogleModal(true)}>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Register with Google</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or register with details</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your full name or business contact"
                      placeholderTextColor="#94A3B8"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                {/* Mobile Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>📞</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="+94 77 123 4567"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="roshan@company.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Create secure password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-enter password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>

                {/* Buyer Type Chips */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Buyer Type</Text>
                  <View style={styles.chipsContainer}>
                    {BUYER_TYPES.map((type) => {
                      const isSelected = selectedBuyerType === type;
                      return (
                        <Pressable
                          key={type}
                          style={[
                            styles.chip,
                            isSelected ? styles.chipSelected : styles.chipUnselected,
                          ]}
                          onPress={() => setSelectedBuyerType(type)}>
                          <Text
                            style={[
                              styles.chipText,
                              isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                            ]}>
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Terms Agreement Checkbox */}
                <Pressable
                  style={styles.termsRow}
                  onPress={() => setAgreedTerms(!agreedTerms)}>
                  <View
                    style={[
                      styles.checkbox,
                      agreedTerms && styles.checkboxActive,
                    ]}>
                    {agreedTerms && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the Farmora Terms of Service and Privacy Policy.
                  </Text>
                </Pressable>

                {/* Step 1 Submit Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                    loading && { opacity: 0.8 },
                  ]}
                  disabled={loading}
                  onPress={handleStep1Submit}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {selectedBuyerType === 'Individual'
                        ? 'Create Buyer Account'
                        : 'Next: Business Details →'}
                    </Text>
                  )}
                </Pressable>

                <View style={styles.loginLinkRow}>
                  <Text style={styles.loginLinkLabel}>Already have an account? </Text>
                  <Pressable onPress={onBackToLogin}>
                    <Text style={styles.loginLinkHighlight}>Login</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            /* ═══════════ STEP 2: BUSINESS DETAILS ═══════════ */
            <View>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Business Details</Text>
                <Text style={styles.subtitle}>
                  Provide your business credentials for bulk procurement discounts and VAT invoices.
                </Text>
              </View>

              <View style={styles.formContainer}>
                {/* Business Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Name *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Ceylon Fresh Foods Ltd"
                      placeholderTextColor="#94A3B8"
                      value={businessName}
                      onChangeText={setBusinessName}
                    />
                  </View>
                </View>

                {/* Business Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Category</Text>
                  <View style={styles.chipsContainer}>
                    {BUSINESS_TYPES.map((type) => {
                      const isSelected = businessType === type;
                      return (
                        <Pressable
                          key={type}
                          style={[
                            styles.chip,
                            isSelected ? styles.chipSelected : styles.chipUnselected,
                          ]}
                          onPress={() => setBusinessType(type)}>
                          <Text
                            style={[
                              styles.chipText,
                              isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                            ]}>
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Business Registration No */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Registration Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. PV-123456"
                      placeholderTextColor="#94A3B8"
                      value={businessRegNo}
                      onChangeText={setBusinessRegNo}
                    />
                  </View>
                </View>

                {/* Business Registration / VAT Document (Optional) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BR / VAT Document (Optional)</Text>
                  <Pressable
                    style={{
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: brDocUri ? '#1E5E3A' : '#CBD5E1',
                      borderRadius: 12,
                      padding: 14,
                      alignItems: 'center',
                      backgroundColor: brDocUri ? '#F0FDF4' : '#F8FAFC',
                    }}
                    onPress={() => {
                      promptMediaSource({
                        title: 'Attach Business Document',
                        message: 'Take a photo or attach PDF of your registration document:',
                        includeDocument: true,
                        onSelected: (res) => {
                          setBrDocUri(res.dataUrl);
                          setBrDocName(res.name);
                        },
                      });
                    }}>
                    <Text style={{ fontSize: 20 }}>{brDocUri ? '✓' : '📄'}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: brDocUri ? '#1E5E3A' : '#475569', marginTop: 4 }}>
                      {brDocUri ? brDocName || 'Document Attached (Base64)' : 'Tap to attach document or photo'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>PDF, JPG, PNG • Max 10MB</Text>
                  </Pressable>
                </View>

                {/* Contact Person */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Primary Contact Person</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Full name of contact person"
                      placeholderTextColor="#94A3B8"
                      value={contactPerson}
                      onChangeText={setContactPerson}
                    />
                  </View>
                </View>

                {/* Business Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Address / Delivery Hub</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Street, City, District"
                      placeholderTextColor="#94A3B8"
                      value={businessAddress}
                      onChangeText={setBusinessAddress}
                    />
                  </View>
                </View>

                {/* Estimated Monthly Volume */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Estimated Monthly Purchasing Quantity</Text>
                  <View style={styles.chipsContainer}>
                    {MONTHLY_VOLUMES.map((vol) => {
                      const isSelected = monthlyVolume === vol;
                      return (
                        <Pressable
                          key={vol}
                          style={[
                            styles.chip,
                            isSelected ? styles.chipSelected : styles.chipUnselected,
                          ]}
                          onPress={() => setMonthlyVolume(vol)}>
                          <Text
                            style={[
                              styles.chipText,
                              isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                            ]}>
                            {vol}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Preferred Produce Categories */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Produce Categories</Text>
                  <View style={styles.chipsContainer}>
                    {PREFERRED_CATEGORIES.map((cat) => {
                      const isSelected = preferredCategories.includes(cat);
                      return (
                        <Pressable
                          key={cat}
                          style={[
                            styles.chip,
                            isSelected ? styles.chipSelected : styles.chipUnselected,
                          ]}
                          onPress={() => toggleCategory(cat)}>
                          <Text
                            style={[
                              styles.chipText,
                              isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                            ]}>
                            {cat} {isSelected ? '✓' : '+'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Save & Complete Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                    loading && { opacity: 0.8 },
                  ]}
                  disabled={loading}
                  onPress={() => submitRegistration(true)}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Save & Continue</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        visible={showGoogleModal}
        accountType="buyer"
        buyerType={selectedBuyerType}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(user) => {
          setShowGoogleModal(false);
          setCreatedUser(user);
          setStep(3);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#1E293B',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#386641',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sproutMini: {
    width: 14,
    height: 14,
    position: 'relative',
    alignItems: 'center',
  },
  sproutMiniLeafOrange: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 5,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E58A54',
    transform: [{ rotate: '-35deg' }],
  },
  sproutMiniLeafWhite: {
    position: 'absolute',
    top: 2,
    right: 1,
    width: 5.5,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '35deg' }],
  },
  sproutMiniStem: {
    position: 'absolute',
    top: 4,
    width: 1.5,
    height: 7,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2E20',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#386641',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#386641',
    borderRadius: 2,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    height: 52,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  googleButtonPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  formContainer: {
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: '#386641',
    borderColor: '#386641',
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipTextUnselected: {
    color: '#475569',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#386641',
    borderColor: '#386641',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: '#386641',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnPressed: {
    backgroundColor: '#2F5436',
    transform: [{ scale: 0.99 }],
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  loginLinkLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLinkHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#386641',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  successCheckmark: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 36,
  },
  successButtons: {
    width: '100%',
    gap: 14,
  },
  skipBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
