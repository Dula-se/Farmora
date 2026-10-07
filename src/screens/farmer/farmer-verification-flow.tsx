import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import Svg, { Path, Rect } from 'react-native-svg';

export type VerificationStep =
  | 'landing'
  | 'upload-nic'
  | 'farm-certifications'
  | 'ownership-evidence'
  | 'review-submit'
  | 'under-review'
  | 'verified-success';

interface FarmerVerificationFlowProps {
  initialStep?: VerificationStep;
  onBack: () => void;
  onViewPublicProfile?: () => void;
  onGoToDashboard?: () => void;
}

export function FarmerVerificationFlow({
  initialStep = 'landing',
  onBack,
  onViewPublicProfile,
  onGoToDashboard,
}: FarmerVerificationFlowProps) {
  const [step, setStep] = useState<VerificationStep>(initialStep);

  // Form states
  const [nicFrontUploaded, setNicFrontUploaded] = useState(true);
  const [nicBackUploaded, setNicBackUploaded] = useState(true);

  const [certType, setCertType] = useState('Organic Certification');
  const [certNumber, setCertNumber] = useState('ORG-2024-9051');
  const [issuingAuthority, setIssuingAuthority] = useState('Department of Agriculture');
  const [issueDate, setIssueDate] = useState('2023-04-12');
  const [expiryDate, setExpiryDate] = useState('2027-04-12');
  const [certDocUploaded, setCertDocUploaded] = useState(true);
  const [showCertDropdown, setShowCertDropdown] = useState(false);

  const [ownershipDocType, setOwnershipDocType] = useState<
    'deed' | 'br' | 'grama'
  >('deed');
  const [deedDocUploaded, setDeedDocUploaded] = useState(true);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [declarationChecked, setDeclarationChecked] = useState(true);

  // Helper navigate back based on step
  const handleBack = () => {
    switch (step) {
      case 'landing':
        onBack();
        break;
      case 'upload-nic':
        setStep('landing');
        break;
      case 'farm-certifications':
        setStep('upload-nic');
        break;
      case 'ownership-evidence':
        setStep('farm-certifications');
        break;
      case 'review-submit':
        setStep('ownership-evidence');
        break;
      case 'under-review':
        onBack();
        break;
      case 'verified-success':
        onBack();
        break;
    }
  };

  // Certificate Types list
  const certOptions = [
    'Organic Certification',
    'Good Agricultural Practices (SL-GAP)',
    'Fair Trade Agriculture',
    'SLS Agriculture Certified',
    'Rainforest Alliance Certified',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={handleBack}
          hitSlop={8}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke="#0F172A"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <Text style={styles.headerTitle}>
          {step === 'landing' && 'Get Verified'}
          {step === 'upload-nic' && 'Upload NIC'}
          {step === 'farm-certifications' && 'Farm Certifications'}
          {step === 'ownership-evidence' && 'Ownership Evidence'}
          {step === 'review-submit' && 'Review & Submit'}
          {step === 'under-review' && 'Get Verified'}
          {step === 'verified-success' && 'Get Verified'}
        </Text>

        <View style={styles.headerRightBadge}>
          <Text style={styles.headerRightText}>Get Verified</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ==============================================================
            SCREEN 2: LANDING ("Grow Your Trust & Sales")
        ============================================================== */}
        {step === 'landing' && (
          <View style={styles.stepContainer}>
            {/* Hero Green Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconCircle}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    fill="#2E7D32"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <Path
                    d="M9 12l2 2 4-4"
                    stroke="#FFFFFF"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.heroTitle}>Grow Your Trust & Sales</Text>
              <Text style={styles.heroSubtitle}>
                Complete quick verification steps to unlock premium benefits on Farmora
              </Text>
            </View>

            {/* WHY GET VERIFIED */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>WHY GET VERIFIED?</Text>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIconWrap}>
                  <Text style={{ fontSize: 18 }}>🤝</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Build Buyer Trust</Text>
                  <Text style={styles.benefitDesc}>
                    Verified farmers receive up to 3x more orders
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIconWrap}>
                  <Text style={{ fontSize: 18 }}>🛡️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Verification Badge</Text>
                  <Text style={styles.benefitDesc}>
                    Stand out with a trusted seller badge on your profile
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIconWrap}>
                  <Text style={{ fontSize: 18 }}>📈</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Improved Discovery</Text>
                  <Text style={styles.benefitDesc}>
                    Appear significantly higher in buyer search results
                  </Text>
                </View>
              </View>
            </View>

            {/* REQUIRED DOCUMENTS */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>REQUIRED DOCUMENTS</Text>

              <View style={styles.docCheckList}>
                <View style={styles.docCheckItem}>
                  <View style={styles.docBadgeNum}>
                    <Text style={styles.docBadgeNumText}>1</Text>
                  </View>
                  <Text style={styles.docCheckText}>National Identity Card (NIC)</Text>
                </View>

                <View style={styles.docCheckItem}>
                  <View style={styles.docBadgeNum}>
                    <Text style={styles.docBadgeNumText}>2</Text>
                  </View>
                  <Text style={styles.docCheckText}>Farm Certifications (if any)</Text>
                </View>

                <View style={styles.docCheckItem}>
                  <View style={styles.docBadgeNum}>
                    <Text style={styles.docBadgeNumText}>3</Text>
                  </View>
                  <Text style={styles.docCheckText}>
                    Farm Ownership or Business Evidence
                  </Text>
                </View>
              </View>
            </View>

            {/* VERIFICATION STEPS TIMELINE */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>VERIFICATION STEPS</Text>

              <View style={styles.stepsTimeline}>
                <View style={styles.timelineRow}>
                  <View style={styles.timelineIconCircle}>
                    <Text style={{ fontSize: 13 }}>📤</Text>
                  </View>
                  <Text style={styles.timelineTitle}>Upload Documents</Text>
                </View>

                <View style={styles.timelineLine} />

                <View style={styles.timelineRow}>
                  <View style={styles.timelineIconCircle}>
                    <Text style={{ fontSize: 13 }}>⏳</Text>
                  </View>
                  <Text style={styles.timelineTitle}>Review (1-3 business days)</Text>
                </View>

                <View style={styles.timelineLine} />

                <View style={styles.timelineRow}>
                  <View style={styles.timelineIconCircle}>
                    <Text style={{ fontSize: 13 }}>✓</Text>
                  </View>
                  <Text style={styles.timelineTitle}>Get Verified</Text>
                </View>
              </View>
            </View>

            {/* Security Guarantee Box */}
            <View style={styles.securityBox}>
              <View style={styles.lockIconCircle}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    stroke="#1E5E3A"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.securityText}>
                Your documents are encrypted and stored securely. We only use them for
                verification purposes and never share with third parties.
              </Text>
            </View>

            {/* CTA Button */}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={() => setStep('upload-nic')}>
              <Text style={styles.primaryBtnText}>Start Verification</Text>
            </Pressable>
          </View>
        )}

        {/* ==============================================================
            SCREEN 3: STEP 1 - UPLOAD NIC
        ============================================================== */}
        {step === 'upload-nic' && (
          <View style={styles.stepContainer}>
            <Text style={styles.pageSubtitle}>
              Upload clear photos of your National Identity Card
            </Text>

            {/* NIC Front */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>NIC Front</Text>
              <Pressable
                style={styles.uploadDashedBox}
                onPress={() => {
                  setNicFrontUploaded(true);
                  Alert.alert('NIC Front', 'Front photo of NIC selected.');
                }}>
                <View style={styles.uploadCameraIconCircle}>
                  <Text style={{ fontSize: 20 }}>📷</Text>
                </View>
                <Text style={styles.uploadTapText}>
                  {nicFrontUploaded ? '✓ Front photo selected' : 'Tap to upload front photo'}
                </Text>
                <Text style={styles.uploadFormatText}>JPG, PNG • Max 5MB</Text>
              </Pressable>

              <View style={styles.cameraGalleryRow}>
                <Pressable
                  style={styles.secondaryOptionBtn}
                  onPress={() => {
                    setNicFrontUploaded(true);
                    Alert.alert('Camera', 'Photo captured with camera.');
                  }}>
                  <Text style={styles.secondaryOptionText}>📷 Camera</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryOptionBtn}
                  onPress={() => {
                    setNicFrontUploaded(true);
                    Alert.alert('Gallery', 'Photo chosen from gallery.');
                  }}>
                  <Text style={styles.secondaryOptionText}>🖼 Gallery</Text>
                </Pressable>
              </View>
            </View>

            {/* NIC Back */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>NIC Back</Text>
              <Pressable
                style={styles.uploadDashedBox}
                onPress={() => {
                  setNicBackUploaded(true);
                  Alert.alert('NIC Back', 'Back photo of NIC selected.');
                }}>
                <View style={styles.uploadCameraIconCircle}>
                  <Text style={{ fontSize: 20 }}>📷</Text>
                </View>
                <Text style={styles.uploadTapText}>
                  {nicBackUploaded ? '✓ Back photo selected' : 'Tap to upload back photo'}
                </Text>
                <Text style={styles.uploadFormatText}>JPG, PNG • Max 5MB</Text>
              </Pressable>

              <View style={styles.cameraGalleryRow}>
                <Pressable
                  style={styles.secondaryOptionBtn}
                  onPress={() => {
                    setNicBackUploaded(true);
                    Alert.alert('Camera', 'Photo captured with camera.');
                  }}>
                  <Text style={styles.secondaryOptionText}>📷 Camera</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryOptionBtn}
                  onPress={() => {
                    setNicBackUploaded(true);
                    Alert.alert('Gallery', 'Photo chosen from gallery.');
                  }}>
                  <Text style={styles.secondaryOptionText}>🖼 Gallery</Text>
                </Pressable>
              </View>
            </View>

            {/* Tips for a good photo */}
            <View style={styles.tipsBox}>
              <View style={styles.tipsHeaderRow}>
                <Text style={{ fontSize: 16 }}>💡</Text>
                <Text style={styles.tipsTitle}>Tips for a good photo</Text>
              </View>
              <Text style={styles.tipItem}>• Ensure all text is clearly readable</Text>
              <Text style={styles.tipItem}>• Avoid glare and shadows</Text>
              <Text style={styles.tipItem}>• Include all four corners</Text>
              <Text style={styles.tipItem}>• Place on a flat, well-lit surface</Text>
            </View>

            <Pressable
              style={styles.retakeLink}
              onPress={() => {
                setNicFrontUploaded(false);
                setNicBackUploaded(false);
                Alert.alert('Reset', 'You can now select new photos.');
              }}>
              <Text style={styles.retakeLinkText}>Retake Photos</Text>
            </Pressable>

            {/* Continue Button */}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={() => setStep('farm-certifications')}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {/* ==============================================================
            SCREEN 4: STEP 2 - FARM CERTIFICATIONS
        ============================================================== */}
        {step === 'farm-certifications' && (
          <View style={styles.stepContainer}>
            <Text style={styles.pageSubtitle}>
              Add your farming certifications (Optional)
            </Text>

            {/* Certificate Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Certificate Type</Text>
              <Pressable
                style={styles.dropdownBtn}
                onPress={() => setShowCertDropdown(!showCertDropdown)}>
                <Text style={styles.dropdownValue}>{certType}</Text>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 9l6 6 6-6"
                    stroke="#64748B"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>

              {showCertDropdown && (
                <View style={styles.dropdownMenu}>
                  {certOptions.map((opt) => (
                    <Pressable
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCertType(opt);
                        setShowCertDropdown(false);
                      }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          certType === opt && styles.dropdownItemSelected,
                        ]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Certificate Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Certificate Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. ORG-2024-9051"
                placeholderTextColor="#94A3B8"
                value={certNumber}
                onChangeText={setCertNumber}
              />
            </View>

            {/* Issuing Authority */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Issuing Authority</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Department of Agriculture"
                placeholderTextColor="#94A3B8"
                value={issuingAuthority}
                onChangeText={setIssuingAuthority}
              />
            </View>

            {/* Date Inputs Row */}
            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Issue Date</Text>
                <View style={styles.dateInputWrap}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="2023-04-12"
                    placeholderTextColor="#94A3B8"
                    value={issueDate}
                    onChangeText={setIssueDate}
                  />
                  <Text style={{ fontSize: 16 }}>📅</Text>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={styles.dateInputWrap}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="2027-04-12"
                    placeholderTextColor="#94A3B8"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                  />
                  <Text style={{ fontSize: 16 }}>📅</Text>
                </View>
              </View>
            </View>

            {/* Upload Certificate Document */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>Upload Certificate Document</Text>
              <Pressable
                style={styles.uploadDashedBox}
                onPress={() => {
                  setCertDocUploaded(true);
                  Alert.alert('Upload Document', 'Certificate document attached.');
                }}>
                <View style={styles.uploadDocIconCircle}>
                  <Text style={{ fontSize: 20 }}>📄</Text>
                </View>
                <Text style={styles.uploadTapText}>
                  {certDocUploaded ? '✓ Certificate document attached' : 'Tap to upload document'}
                </Text>
                <Text style={styles.uploadFormatText}>PDF, JPG or PNG • Max 10MB</Text>
              </Pressable>
            </View>

            {/* Add Another Certificate */}
            <Pressable
              style={styles.addAnotherBtn}
              onPress={() =>
                Alert.alert(
                  'Add Certificate',
                  'You can add up to 3 official agricultural certifications.'
                )
              }>
              <Text style={styles.addAnotherBtnText}>+ Add Another Certificate</Text>
            </Pressable>

            {/* Skip Link */}
            <Pressable
              style={styles.skipLink}
              onPress={() => setStep('ownership-evidence')}>
              <Text style={styles.skipLinkText}>
                I don't have any certificates — Skip this step
              </Text>
            </Pressable>

            {/* Continue Button */}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={() => setStep('ownership-evidence')}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {/* ==============================================================
            SCREEN 5: STEP 3 - OWNERSHIP EVIDENCE
        ============================================================== */}
        {step === 'ownership-evidence' && (
          <View style={styles.stepContainer}>
            <Text style={styles.pageSubtitle}>
              Provide proof of farm ownership or business registration
            </Text>

            {/* Radio Choice 1: Land Deed */}
            <Pressable
              style={[
                styles.radioCard,
                ownershipDocType === 'deed' && styles.radioCardSelected,
              ]}
              onPress={() => setOwnershipDocType('deed')}>
              <View style={styles.radioIconCircle}>
                <Text style={{ fontSize: 18 }}>📜</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioCardTitle}>Land Deed / Title Document</Text>
                <Text style={styles.radioCardDesc}>Official proof of land ownership</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  ownershipDocType === 'deed' && styles.radioButtonSelected,
                ]}>
                {ownershipDocType === 'deed' && <View style={styles.radioDot} />}
              </View>
            </Pressable>

            {/* Radio Choice 2: Business Registration */}
            <Pressable
              style={[
                styles.radioCard,
                ownershipDocType === 'br' && styles.radioCardSelected,
              ]}
              onPress={() => setOwnershipDocType('br')}>
              <View style={styles.radioIconCircle}>
                <Text style={{ fontSize: 18 }}>🏢</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioCardTitle}>Business Registration Certificate</Text>
                <Text style={styles.radioCardDesc}>For registered agribusinesses</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  ownershipDocType === 'br' && styles.radioButtonSelected,
                ]}>
                {ownershipDocType === 'br' && <View style={styles.radioDot} />}
              </View>
            </Pressable>

            {/* Radio Choice 3: Grama Niladhari Letter */}
            <Pressable
              style={[
                styles.radioCard,
                ownershipDocType === 'grama' && styles.radioCardSelected,
              ]}
              onPress={() => setOwnershipDocType('grama')}>
              <View style={styles.radioIconCircle}>
                <Text style={{ fontSize: 18 }}>🏛️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioCardTitle}>Grama Niladhari Letter</Text>
                <Text style={styles.radioCardDesc}>
                  Official neighborhood confirmation letter
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  ownershipDocType === 'grama' && styles.radioButtonSelected,
                ]}>
                {ownershipDocType === 'grama' && <View style={styles.radioDot} />}
              </View>
            </Pressable>

            {/* Upload Deed Document */}
            <View style={styles.uploadSection}>
              <Pressable
                style={styles.uploadDashedBox}
                onPress={() => {
                  setDeedDocUploaded(true);
                  Alert.alert('Ownership Document', 'Land deed document selected.');
                }}>
                <View style={styles.uploadDocIconCircle}>
                  <Text style={{ fontSize: 20 }}>📑</Text>
                </View>
                <Text style={styles.uploadTapText}>
                  {deedDocUploaded
                    ? '✓ Land deed document attached'
                    : 'Tap to upload deed document'}
                </Text>
                <Text style={styles.uploadFormatText}>PDF, JPG or PNG • Max 10MB</Text>
              </Pressable>
            </View>

            {/* Additional Information */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Information</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Add any extra details about your land deeds or property boundaries here..."
                placeholderTextColor="#94A3B8"
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
              />
            </View>

            {/* Continue Button */}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={() => setStep('review-submit')}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {/* ==============================================================
            SCREEN 6: STEP 4 - REVIEW & SUBMIT
        ============================================================== */}
        {step === 'review-submit' && (
          <View style={styles.stepContainer}>
            <Text style={styles.pageSubtitle}>
              Double-check your information before submitting for approval
            </Text>

            {/* Summary Cards */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewCheckCircle}>
                <Text style={{ color: '#166534', fontWeight: '800' }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewCardTitle}>Personal Details</Text>
                <Text style={styles.reviewCardValue}>Anura Bandara • +94 77 123 4567</Text>
              </View>
              <Pressable onPress={() => setStep('upload-nic')}>
                <Text style={styles.reviewEditLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewCheckCircle}>
                <Text style={{ color: '#166534', fontWeight: '800' }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewCardTitle}>Farm Details</Text>
                <Text style={styles.reviewCardValue}>
                  Green Valley Farm • Tea & Vegetables
                </Text>
              </View>
              <Pressable onPress={() => setStep('ownership-evidence')}>
                <Text style={styles.reviewEditLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewCheckCircle}>
                <Text style={{ color: '#166534', fontWeight: '800' }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewCardTitle}>Location</Text>
                <Text style={styles.reviewCardValue}>Nuwara Eliya, Central Province</Text>
              </View>
              <Pressable onPress={() => setStep('ownership-evidence')}>
                <Text style={styles.reviewEditLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewCheckCircle}>
                <Text style={{ color: '#166534', fontWeight: '800' }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewCardTitle}>NIC Documents</Text>
                <View style={styles.nicMiniPreviews}>
                  <View style={styles.nicMiniTile}>
                    <Text style={styles.nicMiniText}>NIC Front</Text>
                  </View>
                  <View style={styles.nicMiniTile}>
                    <Text style={styles.nicMiniText}>NIC Back</Text>
                  </View>
                </View>
              </View>
              <Pressable onPress={() => setStep('upload-nic')}>
                <Text style={styles.reviewEditLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewCheckCircle}>
                <Text style={{ color: '#166534', fontWeight: '800' }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewCardTitle}>Certifications</Text>
                <Text style={styles.reviewCardValue}>
                  {certType} • {certNumber}
                </Text>
              </View>
              <Pressable onPress={() => setStep('farm-certifications')}>
                <Text style={styles.reviewEditLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewCheckCircle}>
                <Text style={{ color: '#166534', fontWeight: '800' }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewCardTitle}>Ownership Evidence</Text>
                <Text style={styles.reviewCardValue}>Land Deed / Title Document</Text>
              </View>
              <Pressable onPress={() => setStep('ownership-evidence')}>
                <Text style={styles.reviewEditLink}>Edit</Text>
              </Pressable>
            </View>

            {/* Declaration Checkbox */}
            <Pressable
              style={styles.declarationRow}
              onPress={() => setDeclarationChecked(!declarationChecked)}>
              <View
                style={[
                  styles.checkboxBox,
                  declarationChecked && styles.checkboxBoxChecked,
                ]}>
                {declarationChecked && (
                  <Text style={styles.checkboxCheckmark}>✓</Text>
                )}
              </View>
              <Text style={styles.declarationText}>
                I hereby declare that all provided documents and registration details
                are genuine, accurate, and represent my physical farming operation.
              </Text>
            </Pressable>

            {/* Submit Verification Button */}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={() => setStep('under-review')}>
              <Text style={styles.primaryBtnText}>Submit Verification</Text>
            </Pressable>
          </View>
        )}

        {/* ==============================================================
            SCREEN 7: APPLICATION STATUS - UNDER REVIEW
        ============================================================== */}
        {step === 'under-review' && (
          <View style={styles.stepContainer}>
            {/* Status Card (Amber/Orange) */}
            <View style={styles.underReviewCard}>
              <View style={styles.underReviewIconCircle}>
                <Text style={{ fontSize: 24 }}>⏳</Text>
              </View>
              <Text style={styles.underReviewTitle}>Under Review</Text>
              <Text style={styles.underReviewDate}>Submitted on April 12, 2024</Text>
              <Text style={styles.underReviewEta}>
                Estimated response time: 1-3 business days.
              </Text>
            </View>

            {/* APPLICATION STEPS TRACKER */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>APPLICATION STEPS</Text>

              <View style={styles.trackerContainer}>
                {/* Step 1: Documents Submitted */}
                <View style={styles.trackerRow}>
                  <View style={styles.trackerCircleCompleted}>
                    <Text style={styles.trackerCheckText}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackerStepTitle}>Documents Submitted</Text>
                    <Text style={styles.trackerStepSub}>
                      Completed on Apr 12, 2024 • 10:30 AM
                    </Text>
                  </View>
                </View>
                <View style={styles.trackerVerticalLineCompleted} />

                {/* Step 2: Under Review */}
                <View style={styles.trackerRow}>
                  <View style={styles.trackerCircleActive}>
                    <Text style={styles.trackerActiveText}>●</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.trackerStepTitle, { color: '#B45309' }]}>
                      Under Review
                    </Text>
                    <Text style={styles.trackerStepSub}>
                      Estimated response time: 1-3 business days
                    </Text>
                  </View>
                </View>
                <View style={styles.trackerVerticalLinePending} />

                {/* Step 3: Admin Decision */}
                <View style={styles.trackerRow}>
                  <View style={styles.trackerCirclePending}>
                    <Text style={styles.trackerPendingText}>○</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackerStepTitleDisabled}>Admin Decision</Text>
                    <Text style={styles.trackerStepSub}>Awaiting system validation</Text>
                  </View>
                </View>
                <View style={styles.trackerVerticalLinePending} />

                {/* Step 4: Verification Complete */}
                <View style={styles.trackerRow}>
                  <View style={styles.trackerCirclePending}>
                    <Text style={styles.trackerPendingText}>○</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackerStepTitleDisabled}>
                      Verification Complete
                    </Text>
                    <Text style={styles.trackerStepSub}>
                      Stand out with a verified profile badge
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* VERIFICATION NOTES */}
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Awaiting Final Document Checks</Text>
              <Text style={styles.notesBody}>
                Your details look mostly complete! Our agents are currently reviewing
                the uploaded land deed document. Please keep an eye out for any further
                updates here.
              </Text>
            </View>

            {/* Upload Additional Information Button */}
            <Pressable
              style={styles.secondaryActionBtn}
              onPress={() =>
                Alert.alert(
                  'Upload Additional Info',
                  'You can attach extra documents or update your contact details if requested by the validation team.'
                )
              }>
              <Text style={styles.secondaryActionBtnText}>
                Upload Additional Information
              </Text>
            </Pressable>

            {/* Instant Demo Switch to Congratulations */}
            <Pressable
              style={styles.previewApprovedBtn}
              onPress={() => setStep('verified-success')}>
              <Text style={styles.previewApprovedBtnText}>
                ✨ Preview Approved / Verified State
              </Text>
            </Pressable>

            {/* Ref ID */}
            <Text style={styles.refIdText}>REF ID: FM-VER-2024-9214</Text>
          </View>
        )}

        {/* ==============================================================
            SCREEN 8: VERIFICATION COMPLETE - CONGRATULATIONS!
        ============================================================== */}
        {step === 'verified-success' && (
          <View style={styles.successContainer}>
            {/* Big Green Success Badge */}
            <View style={styles.successBadgeOuter}>
              <View style={styles.successBadgeInner}>
                <Text style={styles.successBadgeCheckmark}>✓</Text>
              </View>
            </View>

            <Text style={styles.successTitle}>Congratulations!</Text>
            <Text style={styles.successSubtitle}>
              Your farm has been successfully verified
            </Text>

            {/* BENEFITS UNLOCKED CARD */}
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsCardHeading}>BENEFITS UNLOCKED</Text>

              <View style={styles.unlockedBenefitRow}>
                <View style={styles.unlockedIconCircle}>
                  <Text style={styles.unlockedCheck}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unlockedTitle}>Verified Badge</Text>
                  <Text style={styles.unlockedSub}>
                    Stand out as a trusted seller in the marketplace
                  </Text>
                </View>
              </View>

              <View style={styles.unlockedBenefitRow}>
                <View style={styles.unlockedIconCircle}>
                  <Text style={styles.unlockedCheck}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unlockedTitle}>Priority Listing</Text>
                  <Text style={styles.unlockedSub}>
                    Appear significantly higher in buyer search results
                  </Text>
                </View>
              </View>

              <View style={styles.unlockedBenefitRow}>
                <View style={styles.unlockedIconCircle}>
                  <Text style={styles.unlockedCheck}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unlockedTitle}>Direct Orders</Text>
                  <Text style={styles.unlockedSub}>
                    Receive instant wholesale and retail orders from buyers
                  </Text>
                </View>
              </View>

              <View style={styles.unlockedBenefitRow}>
                <View style={styles.unlockedIconCircle}>
                  <Text style={styles.unlockedCheck}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unlockedTitle}>Video Inspection</Text>
                  <Text style={styles.unlockedSub}>
                    Access remote quality verification to back your produce
                  </Text>
                </View>
              </View>
            </View>

            {/* View Public Profile */}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={onViewPublicProfile || onBack}>
              <Text style={styles.primaryBtnText}>View Public Profile</Text>
            </Pressable>

            {/* Go to Dashboard */}
            <Pressable
              style={styles.secondaryActionBtn}
              onPress={onGoToDashboard || onBack}>
              <Text style={styles.secondaryActionBtnText}>Go to Dashboard</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#EDF4EC',
  },
  headerRightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5E3A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 16,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    lineHeight: 18,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#EDF4EC',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8DEC7',
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Section Block */
  sectionBlock: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },

  /* Benefits */
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  benefitIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Required Documents Checklist */
  docCheckList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  docCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docBadgeNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDF4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docBadgeNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E5E3A',
  },
  docCheckText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  /* Steps Timeline */
  stepsTimeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  timelineLine: {
    width: 2,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginLeft: 13,
    marginVertical: 4,
  },

  /* Security Guarantee Box */
  securityBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 12,
    alignItems: 'center',
  },
  lockIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },

  /* Upload Elements */
  uploadSection: {
    gap: 8,
  },
  uploadLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadDashedBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadCameraIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadDocIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadTapText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5E3A',
  },
  uploadFormatText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cameraGalleryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryOptionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  /* Tips for a good photo */
  tipsBox: {
    backgroundColor: '#FEFCE8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: 4,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
  },
  tipItem: {
    fontSize: 12,
    color: '#A16207',
    lineHeight: 18,
  },
  retakeLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  retakeLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5E3A',
    textDecorationLine: 'underline',
  },

  /* Inputs & Form */
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 80,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  dropdownBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownItemSelected: {
    color: '#1E5E3A',
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrap: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  addAnotherBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E5E3A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  addAnotherBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5E3A',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },

  /* Radio Choices */
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  radioCardSelected: {
    borderColor: '#1E5E3A',
    backgroundColor: '#F7FAF7',
  },
  radioIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  radioCardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1E5E3A',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E5E3A',
  },

  /* Review Screen Cards */
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  reviewCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCardTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  reviewCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  reviewEditLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5E3A',
    textDecorationLine: 'underline',
  },
  nicMiniPreviews: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  nicMiniTile: {
    backgroundColor: '#EDF4EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nicMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E5E3A',
  },

  /* Declaration */
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 6,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  declarationText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },

  /* Under Review Screen */
  underReviewCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  underReviewIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  underReviewTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#92400E',
  },
  underReviewDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  underReviewEta: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 4,
    textAlign: 'center',
  },

  /* Tracker Stepper */
  trackerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  trackerCircleCompleted: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E5E3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackerCheckText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  trackerCircleActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackerActiveText: {
    color: '#D97706',
    fontSize: 12,
  },
  trackerCirclePending: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackerPendingText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  trackerStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  trackerStepTitleDisabled: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  trackerStepSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  trackerVerticalLineCompleted: {
    width: 2,
    height: 20,
    backgroundColor: '#1E5E3A',
    marginLeft: 12,
    marginVertical: 4,
  },
  trackerVerticalLinePending: {
    width: 2,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginLeft: 12,
    marginVertical: 4,
  },

  /* Verification Notes */
  notesCard: {
    backgroundColor: '#FEFCE8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: 4,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#854D0E',
  },
  notesBody: {
    fontSize: 12,
    color: '#A16207',
    lineHeight: 18,
  },
  refIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  previewApprovedBtn: {
    backgroundColor: '#EDF4EC',
    borderWidth: 1,
    borderColor: '#C8DEC7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewApprovedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5E3A',
  },

  /* Success Congratulations Screen */
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 16,
  },
  successBadgeOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 8,
  },
  successBadgeInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBadgeCheckmark: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: -8,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  benefitsCardHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },
  unlockedBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unlockedIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedCheck: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  unlockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  unlockedSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Buttons */
  primaryBtn: {
    height: 50,
    backgroundColor: '#1E5E3A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E5E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
  },
  primaryBtnPressed: {
    backgroundColor: '#16482C',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
});
