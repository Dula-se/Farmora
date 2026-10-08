import React, { useState } from 'react';
import {
  Alert,
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
import { promptMediaSource } from '@/services/media-picker';

interface ReportUserScreenProps {
  targetName?: string;
  targetAvatar?: string;
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

const REPORT_REASONS = [
  'Misrepresented produce grading or quality',
  'Late or unfulfilled delivery dispatch',
  'Price gouging or refusal to honor agreed offer',
  'Payment dispute or non-clearance',
  'Inappropriate communication or harassment',
  'Suspicious fraudulent activity',
];

export function ReportUserScreen({
  targetName = 'Kusuma Bandara',
  targetAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
  onBack,
  onSubmitSuccess,
}: ReportUserScreenProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddEvidence = () => {
    if (evidencePhotos.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload up to 3 evidence screenshots or photos.');
      return;
    }
    promptMediaSource({
      title: 'Attach Evidence Photo',
      message: 'Take a photo or choose screenshot from gallery:',
      onSelected: (res) => {
        setEvidencePhotos((prev) => [...prev, res.dataUrl]);
      },
    });
  };

  const handleSubmit = () => {
    if (!details.trim()) {
      Alert.alert('Required Field', 'Please provide a brief explanation of the incident.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Report Filed 🛡️',
        `Your dispute report regarding ${targetName} has been received by Famora Trust & Safety. Our agricultural arbitration team will review the chat logs and evidence within 24 hours.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSubmitSuccess) onSubmitSuccess();
              else onBack();
            },
          },
        ]
      );
    }, 600);
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
        <Text style={styles.headerTitle}>Report / Dispute</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.targetCard}>
          <Image source={{ uri: targetAvatar }} style={styles.targetAvatar} contentFit="cover" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.targetName}>{targetName}</Text>
            <Text style={styles.targetSub}>Reporting this user will trigger account review</Text>
          </View>
        </View>

        {/* Reasons */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Select Reason</Text>
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <Pressable
                key={reason}
                style={styles.reasonRow}
                onPress={() => setSelectedReason(reason)}>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                  {reason}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Incident Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Incident Description</Text>
          <TextInput
            style={styles.detailsInput}
            multiline
            numberOfLines={4}
            placeholder="Please detail what happened (e.g. Produce received was rotten, agreed price was altered...)"
            placeholderTextColor="#94A3B8"
            value={details}
            onChangeText={setDetails}
          />
        </View>

        {/* Evidence Photos */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Attach Photo / Screenshot Evidence</Text>
          <View style={styles.photosRow}>
            {evidencePhotos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                <Pressable
                  style={styles.removePhotoBtn}
                  onPress={() => setEvidencePhotos(evidencePhotos.filter((_, i) => i !== idx))}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </Pressable>
              </View>
            ))}
            {evidencePhotos.length < 3 && (
              <Pressable style={styles.addPhotoBtn} onPress={handleAddEvidence}>
                <Text style={{ fontSize: 22 }}>📷</Text>
                <Text style={styles.addPhotoText}>+ Evidence</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting Report...' : 'Submit Report for Arbitration'}
          </Text>
        </Pressable>
      </ScrollView>
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
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  targetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  targetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  targetSub: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  detailsInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoThumbWrap: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  addPhotoBtn: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
