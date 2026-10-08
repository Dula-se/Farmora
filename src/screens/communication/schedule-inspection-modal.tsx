import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface ScheduleInspectionModalProps {
  visible: boolean;
  farmerName: string;
  onClose: () => void;
  onScheduled: (details: { date: string; time: string; note: string }) => void;
}

const DATES = [
  { id: 'd1', day: 'Today', date: 'Oct 08' },
  { id: 'd2', day: 'Tomorrow', date: 'Oct 09' },
  { id: 'd3', day: 'Friday', date: 'Oct 10' },
  { id: 'd4', day: 'Saturday', date: 'Oct 11' },
];

const TIME_SLOTS = [
  '09:00 AM',
  '11:30 AM',
  '02:00 PM',
  '04:30 PM',
  '05:45 PM',
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
  onClose,
  onScheduled,
}: ScheduleInspectionModalProps) {
  const [selectedDate, setSelectedDate] = useState('Oct 08');
  const [selectedTime, setSelectedTime] = useState('11:30 AM');
  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([
    'Harvest freshness & color grading',
  ]);
  const [notes, setNotes] = useState('');

  const toggleChecklist = (item: string) => {
    if (selectedChecklist.includes(item)) {
      setSelectedChecklist(selectedChecklist.filter((c) => c !== item));
    } else {
      setSelectedChecklist([...selectedChecklist, item]);
    }
  };

  const handleConfirm = () => {
    onScheduled({
      date: selectedDate,
      time: selectedTime,
      note: notes.trim() || 'General harvest inspection',
    });
    Alert.alert(
      'Inspection Scheduled! 📅',
      `Live video inspection with ${farmerName} confirmed for ${selectedDate} at ${selectedTime}.`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Schedule Video Call</Text>
              <Text style={styles.subtitle}>
                Request a live walk-through with {farmerName}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Select Date */}
            <Text style={styles.sectionHeading}>Select Date</Text>
            <View style={styles.datesRow}>
              {DATES.map((d) => (
                <Pressable
                  key={d.id}
                  style={[styles.dateCard, selectedDate === d.date && styles.dateCardActive]}
                  onPress={() => setSelectedDate(d.date)}>
                  <Text style={[styles.dayText, selectedDate === d.date && styles.dayTextActive]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateText, selectedDate === d.date && styles.dateTextActive]}>
                    {d.date}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Select Time Slot */}
            <Text style={styles.sectionHeading}>Available Time Slots</Text>
            <View style={styles.slotsRow}>
              {TIME_SLOTS.map((time) => (
                <Pressable
                  key={time}
                  style={[styles.slotPill, selectedTime === time && styles.slotPillActive]}
                  onPress={() => setSelectedTime(time)}>
                  <Text style={[styles.slotText, selectedTime === time && styles.slotTextActive]}>
                    {time}
                  </Text>
                </Pressable>
              ))}
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
            <Text style={styles.sectionHeading}>Notes for Farmer (Optional)</Text>
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
            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm Inspection Request</Text>
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
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    fontSize: 14,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  slotPillActive: {
    backgroundColor: '#1E5E3A',
    borderColor: '#1E5E3A',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  confirmBtn: {
    backgroundColor: '#1E5E3A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
