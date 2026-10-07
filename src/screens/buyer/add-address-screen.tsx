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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addSavedAddress } from '@/services/api';

interface AddAddressScreenProps {
  onBack?: () => void;
  onAddressAdded?: () => void;
}

const TAG_OPTIONS = ['Home', 'Work / Office', 'Restaurant / Cafe', 'Warehouse', 'Other'];

export function AddAddressScreen({ onBack, onAddressAdded }: AddAddressScreenProps) {
  const [recipientName, setRecipientName] = useState('Priyantha Perera');
  const [mobileNumber, setMobileNumber] = useState('+94 77 123 4567');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [postalCode, setPostalCode] = useState('00700');
  const [tag, setTag] = useState('Home');
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pinConfirmed, setPinConfirmed] = useState(false);

  const handleSave = async () => {
    if (!recipientName.trim() || !mobileNumber.trim() || !addressLine.trim()) {
      Alert.alert('Required Fields', 'Please complete the recipient name, mobile number, and address line.');
      return;
    }

    setLoading(true);
    try {
      await addSavedAddress({
        recipientName: recipientName.trim(),
        mobileNumber: mobileNumber.trim(),
        addressLine: addressLine.trim(),
        landmark: landmark.trim() || undefined,
        district: district.trim(),
        postalCode: postalCode.trim() || undefined,
        tag,
        isDefault,
        coordinates: {
          latitude: 6.9271,
          longitude: 79.8612,
        },
      });

      Alert.alert('Address Saved', 'New delivery address added successfully!', [
        { text: 'OK', onPress: () => (onAddressAdded ? onAddressAdded() : onBack?.()) },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Add New Address</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
            {/* Tag Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address Label</Text>
              <View style={styles.chipsRow}>
                {TAG_OPTIONS.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.chip, tag === item && styles.chipActive]}
                    onPress={() => setTag(item)}>
                    <Text
                      style={[
                        styles.chipText,
                        tag === item && styles.chipTextActive,
                      ]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recipient Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Name *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full name of contact"
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
              </View>
            </View>

            {/* Mobile Number */}
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

            {/* Address Line */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address / Building *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. No. 45, Flower Road"
                  value={addressLine}
                  onChangeText={setAddressLine}
                />
              </View>
            </View>

            {/* Landmark */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Landmark (Optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Near Green Path roundabout"
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>District / City *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* Map Pin Box */}
            <View style={styles.mapCard}>
              <View style={styles.mapGraphic}>
                <Text style={styles.mapPin}>📍</Text>
                <Text style={styles.mapText}>
                  {pinConfirmed ? 'GPS Coordinates Locked (6.9271° N, 79.8612° E)' : 'Pin delivery point on GPS Map'}
                </Text>
              </View>
              <Pressable
                style={[styles.pinBtn, pinConfirmed && styles.pinBtnConfirmed]}
                onPress={() => {
                  setPinConfirmed(true);
                  Alert.alert('GPS Confirmed', 'Delivery pin set at selected location');
                }}>
                <Text style={[styles.pinBtnText, pinConfirmed && styles.pinBtnTextConfirmed]}>
                  {pinConfirmed ? '✓ Location Confirmed' : 'Pin Location on Map'}
                </Text>
              </Pressable>
            </View>

            {/* Set as Default Address Switch */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Set as Default Delivery Address</Text>
                <Text style={styles.switchSubtitle}>Use this address automatically for all checkout orders</Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ true: '#386641', false: '#E2E8F0' }}
              />
            </View>

            {/* Save Address Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.saveBtnPressed,
                loading && { opacity: 0.8 },
              ]}
              disabled={loading}
              onPress={handleSave}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Address</Text>
              )}
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10,
  },
  mapGraphic: {
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mapPin: {
    fontSize: 24,
  },
  mapText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  pinBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EDF4EC',
    borderWidth: 1,
    borderColor: '#D4E2D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBtnConfirmed: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  pinBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  pinBtnTextConfirmed: {
    color: '#15803D',
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
  saveBtn: {
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
  saveBtnPressed: {
    backgroundColor: '#2F5436',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
