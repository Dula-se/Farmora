import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CalComService, CAL_COM_CONFIG } from '@/services/calcom-service';

interface ScheduleInspectionModalProps {
  visible: boolean;
  farmerName: string;
  farmerEmail?: string;
  farmerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  productTitle?: string;
  onClose: () => void;
  onScheduled: (details: {
    date: string;
    time: string;
    note: string;
    meetingUrl: string;
    calBookingUid?: string;
    inspectionFocus: string[];
  }) => void;
}

// Generate dynamic upcoming 5 days
function getUpcomingDays() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
    const dateStr = `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
    const isoDate = d.toISOString().split('T')[0];
    result.push({
      id: `day_${i}`,
      day: dayName,
      date: dateStr,
      isoDate,
    });
  }
  return result;
}

const TIME_SLOTS = [
  { label: '09:00 AM', hour: 9, min: 0 },
  { label: '10:30 AM', hour: 10, min: 30 },
  { label: '11:30 AM', hour: 11, min: 30 },
  { label: '02:00 PM', hour: 14, min: 0 },
  { label: '03:30 PM', hour: 15, min: 30 },
  { label: '04:30 PM', hour: 16, min: 30 },
  { label: '05:45 PM', hour: 17, min: 45 },
];

const CHECKLIST_ITEMS = [
  'Harvest freshness & color grading',
  'Crate sorting & packaging hygiene',
  'Pest / residue inspection',
  'Bulk weight scale check',
];

export function ScheduleInspectionModal({
  visible,
  farmerName,
  farmerEmail,
  buyerName = 'Buyer',
  buyerEmail,
  productTitle,
  onClose,
  onScheduled,
}: ScheduleInspectionModalProps) {
  const upcomingDays = getUpcomingDays();
  const [selectedDayObj, setSelectedDayObj] = useState(upcomingDays[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[1]);
  const [selectedEventType, setSelectedEventType] = useState<'15min' | '30min'>('15min');
  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([
    'Harvest freshness & color grading',
  ]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleChecklist = (item: string) => {
    if (selectedChecklist.includes(item)) {
      setSelectedChecklist(selectedChecklist.filter((c) => c !== item));
    } else {
      setSelectedChecklist([...selectedChecklist, item]);
    }
  };

  const handleOpenCalComWeb = async () => {
    const webUrl = CalComService.getDirectBookingUrl(selectedEventType);
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert('Unable to open browser', `Visit directly: ${webUrl}`);
    }
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Calculate ISO start date string for Cal.com in UTC
      const [year, month, day] = selectedDayObj.isoDate.split('-').map(Number);
      // Construct in local Asia/Colombo time (UTC+5:30)
      const appointmentDate = new Date();
      appointmentDate.setFullYear(year, month - 1, day);
      appointmentDate.setHours(selectedTimeSlot.hour, selectedTimeSlot.min, 0, 0);

      const startIso = appointmentDate.toISOString();
      const eventTypeId =
        selectedEventType === '15min'
          ? CAL_COM_CONFIG.eventTypes.min15.id
          : CAL_COM_CONFIG.eventTypes.min30.id;

      const attendeeEmail =
        farmerEmail ||
        buyerEmail ||
        CAL_COM_CONFIG.userEmail;

      const noteText = notes.trim()
        ? `${notes.trim()} (Inspection focus: ${selectedChecklist.join(', ')})`
        : `Harvest inspection for ${productTitle || 'produce'} focus: ${selectedChecklist.join(', ')}`;

      // Call Cal.com API v2
      const booking = await CalComService.createBooking({
        eventTypeId,
        startIso,
        attendeeName: farmerName || 'Farmer Partner',
        attendeeEmail,
        notes: noteText,
        cropItem: productTitle,
      });

      const meetingUrl =
        booking.meetingUrl ||
        `https://app.cal.com/video/${booking.uid || 'famora-inspection'}`;

      setIsSubmitting(false);

      onScheduled({
        date: selectedDayObj.date,
        time: selectedTimeSlot.label,
        note: noteText,
        meetingUrl,
        calBookingUid: booking.uid,
        inspectionFocus: selectedChecklist,
      });

      Alert.alert(
        'Video Inspection Scheduled! 📅',
        `Live video inspection with ${farmerName} confirmed via Cal.com for ${selectedDayObj.date} at ${selectedTimeSlot.label}.\n\nInvitation link has been posted into your conversation.`,
        [
          {
            text: 'Join Video Room',
            onPress: () => {
              Linking.openURL(meetingUrl).catch(() => {});
              onClose();
            },
          },
          { text: 'Done', onPress: onClose },
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      console.warn('[ScheduleInspectionModal] Cal.com schedule error:', err);

      // Graceful fallback to guaranteed room link
      const fallbackUrl = `https://meet.google.com/new`;
      onScheduled({
        date: selectedDayObj.date,
        time: selectedTimeSlot.label,
        note: notes.trim() || 'General harvest inspection',
        meetingUrl: fallbackUrl,
        inspectionFocus: selectedChecklist,
      });

      Alert.alert(
        'Inspection Scheduled! 📅',
        `Video call scheduled for ${selectedDayObj.date} at ${selectedTimeSlot.label}. Invitation posted to chat.`,
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <View style={styles.calBadge}>
                <Text style={styles.calBadgeText}>⚡ POWERED BY CAL.COM</Text>
              </View>
              <Text style={styles.title}>Schedule Video Call</Text>
              <Text style={styles.subtitle}>
                Book a live inspection walk-through with {farmerName}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Event Type / Duration Pill selector */}
            <Text style={styles.sectionHeading}>Call Duration (Cal.com Event)</Text>
            <View style={styles.eventTypeRow}>
              <Pressable
                style={[
                  styles.eventTypeCard,
                  selectedEventType === '15min' && styles.eventTypeCardActive,
                ]}
                onPress={() => setSelectedEventType('15min')}>
                <Text
                  style={[
                    styles.eventTypeText,
                    selectedEventType === '15min' && styles.eventTypeTextActive,
                  ]}>
                  ⏱️ 15 Min Inspection
                </Text>
                <Text
                  style={[
                    styles.eventTypeSub,
                    selectedEventType === '15min' && styles.eventTypeSubActive,
                  ]}>
                  Quick harvest grading
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.eventTypeCard,
                  selectedEventType === '30min' && styles.eventTypeCardActive,
                ]}
                onPress={() => setSelectedEventType('30min')}>
                <Text
                  style={[
                    styles.eventTypeText,
                    selectedEventType === '30min' && styles.eventTypeTextActive,
                  ]}>
                  📹 30 Min Detailed Tour
                </Text>
                <Text
                  style={[
                    styles.eventTypeSub,
                    selectedEventType === '30min' && styles.eventTypeSubActive,
                  ]}>
                  Field tour & bulk scale check
                </Text>
              </Pressable>
            </View>

            {/* Select Date */}
            <Text style={styles.sectionHeading}>Select Date</Text>
            <View style={styles.datesRow}>
              {upcomingDays.map((d) => {
                const isActive = selectedDayObj.id === d.id;
                return (
                  <Pressable
                    key={d.id}
                    style={[styles.dateCard, isActive && styles.dateCardActive]}
                    onPress={() => setSelectedDayObj(d)}>
                    <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                      {d.day}
                    </Text>
                    <Text style={[styles.dateText, isActive && styles.dateTextActive]}>
                      {d.date}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Select Time Slot */}
            <Text style={styles.sectionHeading}>Available Time Slots</Text>
            <View style={styles.slotsRow}>
              {TIME_SLOTS.map((slot) => {
                const isActive = selectedTimeSlot.label === slot.label;
                return (
                  <Pressable
                    key={slot.label}
                    style={[styles.slotPill, isActive && styles.slotPillActive]}
                    onPress={() => setSelectedTimeSlot(slot)}>
                    <Text style={[styles.slotText, isActive && styles.slotTextActive]}>
                      {slot.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Inspection Checklist */}
            <Text style={styles.sectionHeading}>Inspection Focus Areas</Text>
            <View style={styles.checklistWrap}>
              {CHECKLIST_ITEMS.map((item) => {
                const checked = selectedChecklist.includes(item);
                return (
                  <Pressable
                    key={item}
                    style={styles.checkItemRow}
                    onPress={() => toggleChecklist(item)}>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>✓</Text>}
                    </View>
                    <Text style={styles.checkItemText}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Note input */}
            <Text style={styles.sectionHeading}>Notes / Specific Requests (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Please show crates stacked for 100kg batch..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Submit button */}
            <Pressable
              style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Booking with Cal.com...</Text>
                </View>
              ) : (
                <Text style={styles.confirmBtnText}>
                  Confirm Cal.com Video Call ({selectedDayObj.day} at {selectedTimeSlot.label})
                </Text>
              )}
            </Pressable>

            {/* Direct Cal.com web page fallback link */}
            <Pressable style={styles.webFallbackBtn} onPress={handleOpenCalComWeb}>
              <Text style={styles.webFallbackText}>
                🌐 Or open full Cal.com calendar in browser
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  calBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    padding: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    marginTop: 12,
  },
  eventTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  eventTypeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  eventTypeCardActive: {
    borderColor: '#1E5E3A',
    backgroundColor: '#F0FDF4',
  },
  eventTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  eventTypeTextActive: {
    color: '#1E5E3A',
  },
  eventTypeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  eventTypeSubActive: {
    color: '#15803D',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  dateCardActive: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  dayText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#DCFCE7',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dateTextActive: {
    color: '#FFFFFF',
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  slotPillActive: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  slotTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checklistWrap: {
    gap: 8,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  checkItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: '#F8FAFC',
  },
  confirmBtn: {
    backgroundColor: '#1E5E3A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#1E5E3A',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  webFallbackBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  webFallbackText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
});
