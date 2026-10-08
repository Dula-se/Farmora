import React, { useState } from 'react';
import {
  Alert,
  Linking,
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

interface HelpSupportScreenProps {
  onBack: () => void;
  onOpenLiveChat?: () => void;
}

const FAQS = [
  {
    q: 'How does Famora Direct Escrow work?',
    a: 'Buyers pay into a secure escrow account upon placing an order. Funds are held safely and only released directly to the farmer once the produce arrives and grading is approved.',
  },
  {
    q: 'How is transport and cold logistics arranged?',
    a: 'Farmers can choose direct farm gate pickup or dispatch via Famora verified refrigerated logistics partners across provincial routes.',
  },
  {
    q: 'What if produce quality does not match the photos?',
    a: 'You can immediately raise a Dispute in the chat or order screen. Our agricultural arbitration team will review the batch photos and issue a refund or discount adjustment.',
  },
  {
    q: 'How do farmers obtain the Green Verified badge?',
    a: 'Submit your National Identity Card (NIC) and either a Land Deed, Business Registration, or Grama Niladhari letter in the Get Verified tab.',
  },
];

export function HelpSupportScreen({ onBack, onOpenLiveChat }: HelpSupportScreenProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCallHotline = () => {
    Linking.openURL('tel:0112345678').catch(() => {
      Alert.alert('Customer Care', 'Please call our 24/7 hotline at 011 234 5678.');
    });
  };

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert('Required Fields', 'Please enter a subject and description for your ticket.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setTicketSubject('');
      setTicketMessage('');
      Alert.alert(
        'Ticket Submitted #FAM-9402',
        'Our Colombo support center has received your request. An agent will respond via chat or SMS within 2 hours.'
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Hotline Cards */}
        <View style={styles.contactCardsRow}>
          <Pressable style={styles.contactCard} onPress={handleCallHotline}>
            <Text style={{ fontSize: 26, marginBottom: 6 }}>📞</Text>
            <Text style={styles.contactCardTitle}>24/7 Hotline</Text>
            <Text style={styles.contactCardSub}>011 234 5678</Text>
          </Pressable>

          <Pressable
            style={styles.contactCard}
            onPress={() => {
              if (onOpenLiveChat) onOpenLiveChat();
              else Alert.alert('Live Chat', 'Connecting with Famora Agronomist Support...');
            }}>
            <Text style={{ fontSize: 26, marginBottom: 6 }}>💬</Text>
            <Text style={styles.contactCardTitle}>Live Chat</Text>
            <Text style={styles.contactCardSub}>Instant Support</Text>
          </Pressable>
        </View>

        {/* FAQs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <Pressable
                key={idx}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(isExpanded ? null : idx)}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.faqChevron}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
                {isExpanded && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Submit Ticket Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Send Support Message</Text>
          <Text style={styles.formSub}>Need assistance with payment, delivery, or dispute?</Text>

          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Issue with crate delivery #1042"
            placeholderTextColor="#94A3B8"
            value={ticketSubject}
            onChangeText={setTicketSubject}
          />

          <Text style={styles.inputLabel}>Message Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Describe your inquiry in detail..."
            placeholderTextColor="#94A3B8"
            value={ticketMessage}
            onChangeText={setTicketMessage}
          />

          <Pressable
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={handleSubmitTicket}>
            <Text style={styles.submitBtnText}>
              {submitting ? 'Submitting...' : 'Submit Support Ticket'}
            </Text>
          </Pressable>
        </View>
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
  contactCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactCardSub: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
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
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  faqChevron: {
    fontSize: 10,
    color: '#94A3B8',
  },
  faqAnswer: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  formSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#1E5E3A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
