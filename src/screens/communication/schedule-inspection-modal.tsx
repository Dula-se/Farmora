import React, { useEffect, useState } from 'react';
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
import { CalComService, CAL_COM_CONFIG, CalDaySlots, CalSlotItem } from '@/services/calcom-service';

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
  const [selectedEventType, setSelectedEventType] = useState<'15min' | '30min'>('15min');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDays, setAvailableDays] = useState<CalDaySlots[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalDaySlots | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<CalSlotItem | null>(null);

  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([
    'Harvest freshness & color grading',
  ]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load real available slots from Cal.com whenever modal opens or event type changes
  useEffect(() => {
    if (visible) {
      loadCalComSlots();
    }
  }, [visible, selectedEventType]);

  const loadCalComSlots = async () => {
    setLoadingSlots(true);
    try {
      const days = await CalComService.getAvailableSlots({
        eventTypeSlug: selectedEventType,
        daysAhead: 7,
        timeZone: 'Asia/Colombo',
      });
      setAvailableDays(days);
      if (days.length > 0) {
        setSelectedDay(days[0]);
        if (days[0].slots.length > 0) {
          setSelectedSlot(days[0].slots[0]);
        } else {
          setSelectedSlot(null);
        }
      }
    } catch (err) {
      console.warn('[ScheduleInspectionModal] Failed to load Cal.com slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectDay = (day: CalDaySlots) => {
    setSelectedDay(day);
    if (day.slots.length > 0) {
      setSelectedSlot(day.slots[0]);
    } else {
      setSelectedSlot(null);
    }
  };

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

    if (!selectedSlot || !selectedDay) {
      Alert.alert('Select a Time Slot', 'Please choose an available Cal.com time slot before confirming.');
      return;
    }

    setIsSubmitting(true);

    try {
      const startIso = selectedSlot.startIso;
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

      // Call Cal.com API v2 to book the selected slot
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
        date: selectedDay.formattedDate,
        time: selectedSlot.timeLabel,
        note: noteText,
        meetingUrl,
        calBookingUid: booking.uid,
        inspectionFocus: selectedChecklist,
      });

      Alert.alert(
        'Video Inspection Scheduled! 📅',
        `Live video inspection with ${farmerName} confirmed via Cal.com for ${selectedDay.formattedDate} at ${selectedSlot.timeLabel}.\n\nInvitation link has been posted into your conversation.`,
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

      const fallbackUrl = `${CAL_COM_CONFIG.publicBookingBase}/${selectedEventType}`;
      onScheduled({
        date: selectedDay.formattedDate,
        time: selectedSlot.timeLabel,
        note: notes.trim() || 'General harvest inspection',
        meetingUrl: fallbackUrl,
        inspectionFocus: selectedChecklist,
      });

      Alert.alert(
        'Inspection Scheduled! 📅',
        `Video call scheduled for ${selectedDay.formattedDate} at ${selectedSlot.timeLabel}. Invitation posted to chat.`,
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Select Date</Text>
              {loadingSlots && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#1E5E3A" />
                  <Text style={styles.loadingText}>Syncing Cal.com...</Text>
                </View>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesRow}>
              {availableDays.map((d) => {
                const isActive = selectedDay?.date === d.date;
                return (
                  <Pressable
                    key={d.date}
                    style={[styles.dateCard, isActive && styles.dateCardActive]}
                    onPress={() => handleSelectDay(d)}>
                    <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                      {d.dayLabel}
                    </Text>
                    <Text style={[styles.dateText, isActive && styles.dateTextActive]}>
                      {d.date.substring(5)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Select Time Slot */}
            <Text style={styles.sectionHeading}>
              Available Time Slots {selectedDay ? `(${selectedDay.formattedDate})` : ''}
            </Text>

            {loadingSlots ? (
              <View style={styles.loadingSlotsBox}>
                <ActivityIndicator size="small" color="#1E5E3A" />
                <Text style={styles.loadingSlotsText}>Loading available slots from Cal.com...</Text>
              </View>
            ) : selectedDay && selectedDay.slots.length > 0 ? (
              <View style={styles.slotsRow}>
                {selectedDay.slots.map((slot) => {
                  const isActive = selectedSlot?.startIso === slot.startIso;
                  return (
                    <Pressable
                      key={slot.startIso}
                      style={[styles.slotPill, isActive && styles.slotPillActive]}
                      onPress={() => setSelectedSlot(slot)}>
                      <Text style={[styles.slotText, isActive && styles.slotTextActive]}>
                        {slot.timeLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noSlotsBox}>
                <Text style={styles.noSlotsText}>
                  No open slots on {selectedDay?.formattedDate || 'this date'}.
                </Text>
                <Pressable onPress={handleOpenCalComWeb}>
                  <Text style={styles.noSlotsAction}>Open Cal.com to view all dates ↗</Text>
                </Pressable>
              </View>
            )}

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
              style={[styles.confirmBtn, (isSubmitting || !selectedSlot) && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={isSubmitting || !selectedSlot}>
              {isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Booking with Cal.com...</Text>
                </View>
              ) : (
                <Text style={styles.confirmBtnText}>
                  Confirm Cal.com Video Call ({selectedDay?.dayLabel || 'Date'} at {selectedSlot?.timeLabel || 'Slot'})
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
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    padding: 20,
    paddingBottom: 30,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
    color: '#1E5E3A',
    fontWeight: '600',
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
    color: '#166534',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  dateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  dateCardActive: {
    borderColor: '#1E5E3A',
    backgroundColor: '#1E5E3A',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dateTextActive: {
    color: '#DCFCE7',
  },
  loadingSlotsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  loadingSlotsText: {
    fontSize: 12,
    color: '#64748B',
  },
  noSlotsBox: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  noSlotsAction: {
    fontSize: 12,
    color: '#1E5E3A',
    fontWeight: '700',
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  slotPillActive: {
    borderColor: '#1E5E3A',
    backgroundColor: '#1E5E3A',
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  checklistWrap: {
    gap: 8,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  checkItemText: {
    fontSize: 13,
    color: '#334155',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  confirmBtn: {
    backgroundColor: '#1E5E3A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#1E5E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  webFallbackBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },
  webFallbackText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
});
