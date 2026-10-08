import React, { useState } from 'react';
import {
  Alert,
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
import { ChatService } from '@/services/chat-service';
import { promptMediaSource } from '@/services/media-picker';

interface RateExperienceScreenProps {
  farmerId?: string;
  farmerName?: string;
  farmerAvatar?: string;
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

const TAG_OPTIONS = [
  'Crisp & Fresh',
  'Accurate Grading',
  'On Time Dispatch',
  'Well Packaged',
  'Fair Pricing',
  'Responsive Farmer',
];

export function RateExperienceScreen({
  farmerId = 'farmer-kusuma',
  farmerName = 'Kusuma Bandara',
  farmerAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
  onBack,
  onSubmitSuccess,
}: RateExperienceScreenProps) {
  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [freshnessRating, setFreshnessRating] = useState(5);
  const [packagingRating, setPackagingRating] = useState(4);
  const [commRating, setCommRating] = useState(5);

  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Crisp & Fresh',
    'Accurate Grading',
  ]);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddPhoto = () => {
    if (photos.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload up to 3 produce photos.');
      return;
    }
    promptMediaSource({
      title: 'Add Produce Photo',
      message: 'Take a photo or choose from gallery:',
      onSelected: (res) => {
        setPhotos((prev) => [...prev, res.dataUrl]);
      },
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ChatService.submitReview({
        targetId: farmerId,
        authorName: 'Verified Commercial Buyer',
        authorRole: 'buyer',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        overallRating,
        criteriaRatings: {
          quality: qualityRating,
          freshness: freshnessRating,
          packaging: packagingRating,
          communication: commRating,
        },
        tags: selectedTags,
        comment: comment.trim() || 'Produce was received in excellent condition.',
        images: photos,
      });

      Alert.alert(
        'Review Submitted! ⭐',
        'Thank you for rating your farm produce experience. Your feedback builds Sri Lanka\'s direct agricultural trust network.',
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
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, onSelect: (r: number) => void, size = 26) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onSelect(star)} hitSlop={6}>
          <Text style={[styles.starChar, { fontSize: size, color: star <= rating ? '#EAB308' : '#CBD5E1' }]}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );

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
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Farmer Card */}
        <View style={styles.farmerCard}>
          <Image source={{ uri: farmerAvatar }} style={styles.farmerAvatar} contentFit="cover" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.farmerName}>{farmerName}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            </View>
            <Text style={styles.farmSub}>Highland Valley Plots • Welimada</Text>
          </View>
        </View>

        {/* Overall Star Rating */}
        <View style={styles.sectionCard}>
          <Text style={styles.overallTitle}>Overall Experience</Text>
          <Text style={styles.overallSub}>How would you rate your total procurement?</Text>
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            {renderStars(overallRating, setOverallRating, 36)}
            <Text style={styles.ratingNumberText}>{overallRating}.0 / 5.0</Text>
          </View>
        </View>

        {/* Detailed Criteria */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Detailed Quality Ratings</Text>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Produce Quality</Text>
            {renderStars(qualityRating, setQualityRating, 22)}
          </View>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Harvest Freshness</Text>
            {renderStars(freshnessRating, setFreshnessRating, 22)}
          </View>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Packaging & Sorting</Text>
            {renderStars(packagingRating, setPackagingRating, 22)}
          </View>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Communication</Text>
            {renderStars(commRating, setCommRating, 22)}
          </View>
        </View>

        {/* Feedback Tags */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Highlight Badges</Text>
          <View style={styles.tagsContainer}>
            {TAG_OPTIONS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.tagPill, active && styles.tagPillActive]}
                  onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {active ? '✓ ' : '+ '}
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Written Review */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Write a Review</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={4}
            placeholder="Share details about harvest quality, weight accuracy, and dispatch timing..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* Upload Photos (Base64) */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Add Produce Photos ({photos.length}/3)</Text>
          <View style={styles.photosRow}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                <Pressable
                  style={styles.removePhotoBtn}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== idx))}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < 3 && (
              <Pressable style={styles.addPhotoBtn} onPress={handleAddPhoto}>
                <Text style={{ fontSize: 22 }}>📷</Text>
                <Text style={styles.addPhotoText}>+ Photo</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Submit Review */}
        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting...' : 'Submit Review'}
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
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  farmerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedBadge: {
    backgroundColor: '#1E5E3A',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  farmSub: {
    fontSize: 12,
    color: '#64748B',
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
  overallTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  overallSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starChar: {
    paddingHorizontal: 2,
  },
  ratingNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E5E3A',
    marginTop: 6,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  criteriaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  tagPillActive: {
    backgroundColor: '#1E5E3A',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  commentInput: {
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
    backgroundColor: '#1E5E3A',
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
