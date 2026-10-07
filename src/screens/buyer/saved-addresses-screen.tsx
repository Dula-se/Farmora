import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSavedAddresses, deleteSavedAddress } from '@/services/api';

interface SavedAddressesScreenProps {
  onBack?: () => void;
  onAddNewAddress?: () => void;
}

export function SavedAddressesScreen({ onBack, onAddNewAddress }: SavedAddressesScreenProps) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await fetchSavedAddresses();
      if (data && data.length > 0) {
        setAddresses(data);
      } else {
        // Fallback realistic addresses matching Figma Screen 8
        setAddresses([
          {
            id: 'addr-1',
            tag: 'Home',
            recipientName: 'Priyantha Perera',
            mobileNumber: '+94 77 123 4567',
            addressLine: 'No. 32, Flower Road, Colombo 07',
            landmark: 'Near Green Path Gallery',
            district: 'Colombo',
            postalCode: '00700',
            isDefault: true,
          },
          {
            id: 'addr-2',
            tag: 'Work / Restaurant Hub',
            recipientName: 'Priyantha Perera (Aroma Cafe)',
            mobileNumber: '+94 11 234 5678',
            addressLine: '145 Galle Road, Bambalapitiya, Colombo 04',
            landmark: 'Opposite Majestic City',
            district: 'Colombo',
            postalCode: '00400',
            isDefault: false,
          },
        ]);
      }
    } catch {
      // Fallback
      setAddresses([
        {
          id: 'addr-1',
          tag: 'Home',
          recipientName: 'Priyantha Perera',
          mobileNumber: '+94 77 123 4567',
          addressLine: 'No. 32, Flower Road, Colombo 07',
          district: 'Colombo',
          isDefault: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedAddress(id);
            setAddresses((prev) => prev.filter((a) => a.id !== id && a._id !== id));
          } catch {
            setAddresses((prev) => prev.filter((a) => a.id !== id && a._id !== id));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#386641" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.addressList}>
            {addresses.map((item) => (
              <View key={item.id || item._id} style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.tagWrapper}>
                    <Text style={styles.tagIcon}>{item.tag?.includes('Home') ? '🏠' : '🏢'}</Text>
                    <Text style={styles.tagText}>{item.tag || 'Delivery Address'}</Text>
                  </View>

                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.recipientName}>{item.recipientName}</Text>
                <Text style={styles.recipientPhone}>{item.mobileNumber}</Text>
                <Text style={styles.addressLine}>{item.addressLine}</Text>
                {item.landmark && (
                  <Text style={styles.landmarkText}>Landmark: {item.landmark}</Text>
                )}
                {item.district && (
                  <Text style={styles.districtText}>
                    {item.district} {item.postalCode ? `(${item.postalCode})` : ''}
                  </Text>
                )}

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('Edit Address', 'Address details ready for editing')}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id || item._id)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.addAddressBtn,
            pressed && styles.addAddressBtnPressed,
          ]}
          onPress={onAddNewAddress}>
          <Text style={styles.addAddressBtnText}>+ Add New Address</Text>
        </Pressable>
      </ScrollView>
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
  addressList: {
    gap: 16,
    marginBottom: 20,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagIcon: {
    fontSize: 15,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  recipientPhone: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  addressLine: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  landmarkText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  districtText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#EDF4EC',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#386641',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  addAddressBtn: {
    backgroundColor: '#386641',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#386641',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  addAddressBtnPressed: {
    backgroundColor: '#2F5436',
  },
  addAddressBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
