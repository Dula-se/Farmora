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
import { ChatService } from '@/services/chat-service';

interface RateBuyerScreenProps {
  buyerId?: string;
  buyerName?: string;
  buyerAvatar?: string;
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

const BUYER_TAGS = [
  'Prompt Payment',
  'Smooth Pickup',
  'Clear Requirements',
  'Respectful',
  'Regular Orderer',
];

export function RateBuyerScreen({
  buyerId = 'buyer-sunil',
  buyerName = 'Sunil Dissanayake',
  buyerAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  onBack,
  onSubmitSuccess,
}: RateBuyerScreenProps) {
  const [overallRating, setOverallRating] = useState(5);
  const [paymentRating, setPaymentRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [pickupRating, setPickupRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Prompt Payment',
    'Smooth Pickup',
  ]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ChatService.submitReview({
        targetId: buyerId,
        authorName: 'Verified Highland Farmer',
        authorRole: 'farmer',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        overallRating,
        criteriaRatings: {
          paymentPromptness: paymentRating,
          communication: commRating,
        },
        tags: selectedTags,
        comment: comment.trim() || 'Payment was cleared promptly upon crate dispatch.',
      });

      Alert.alert(
        'Buyer Rated! ⭐',
        `Thank you for evaluating ${buyerName}. Your feedback helps maintain a trusted marketplace for all farmers.`,
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
      Alert.alert('Error', err?.message || 'Could not submit rating.');
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
        <Text style={styles.headerTitle}>Rate Buyer</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Buyer Summary Card */}
        <View style={styles.buyerCard}>
          <Image source={{ uri: buyerAvatar }} style={styles.buyerAvatar} contentFit="cover" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.buyerName}>{buyerName}</Text>
            <Text style={styles.buyerRole}>Wholesale Commercial Buyer • Colombo</Text>
          </View>
        </View>

        {/* Overall Star Rating */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Overall Buyer Experience</Text>
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            {renderStars(overallRating, setOverallRating, 36)}
            <Text style={styles.ratingNumberText}>{overallRating}.0 / 5.0</Text>
          </View>
        </View>

        {/* Detailed Criteria */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Buyer Evaluation Criteria</Text>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Payment Promptness</Text>
            {renderStars(paymentRating, setPaymentRating, 22)}
          </View>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Communication Clarity</Text>
            {renderStars(commRating, setCommRating, 22)}
          </View>

          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Pickup & Logistics Cooperation</Text>
            {renderStars(pickupRating, setPickupRating, 22)}
          </View>
        </View>

        {/* Feedback Badges */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Buyer Highlights</Text>
          <View style={styles.tagsContainer}>
            {BUYER_TAGS.map((tag) => {
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

        {/* Note */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Farmer Note (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={3}
            placeholder="Add comments on payment timing, crate handling, or future orders..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting...' : 'Submit Buyer Rating'}
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
  buyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  buyerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  buyerRole: {
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
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
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
