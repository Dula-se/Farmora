import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
import { getStoredUser, updateProfileApi, ApiUser } from '@/services/api';
import { promptMediaSource } from '@/services/media-picker';

interface EditProfileScreenProps {
  onBack?: () => void;
  onSaved?: () => void;
}

const BUYER_TYPES = ['Individual', 'Restaurant', 'Supermarket', 'Exporter', 'Food Processor', 'Wholesaler'];
const LANGUAGES = ['English', 'Sinhala', 'Tamil'];
const CATEGORIES = ['Vegetables', 'Fruits', 'Paddy/Grains', 'Spices', 'Tea', 'Herbs', 'Dairy'];

export function EditProfileScreen({ onBack, onSaved }: EditProfileScreenProps) {
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [buyerType, setBuyerType] = useState('Individual');
  const [language, setLanguage] = useState('English');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Vegetables', 'Fruits']);

  useEffect(() => {
    getStoredUser().then((user) => {
      if (user) {
        setFullName(user.fullName || '');
        setMobileNumber(user.mobileNumber || '');
        setEmail(user.email || '');
        setBuyerType(user.buyerType || 'Individual');
        if (user.avatarUrl) {
          setAvatarUri(user.avatarUrl);
        }
      }
    });
  }, []);

  const handleChangeAvatar = () => {
    promptMediaSource({
      title: 'Profile Picture',
      message: 'Take a new photo with camera or choose from your gallery:',
      allowsEditing: true,
      aspect: [1, 1],
      onSelected: (result) => {
        setAvatarUri(result.dataUrl);
      },
    });
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      await updateProfileApi({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        buyerType,
        avatarUrl: avatarUri || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => (onSaved ? onSaved() : onBack?.()) },
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile.');
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Avatar edit badge */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    avatarUri ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                }}
                style={styles.avatarImage}
              />
              <Pressable
                style={styles.cameraBadge}
                onPress={handleChangeAvatar}>
                <Text style={styles.cameraIcon}>📷</Text>
              </Pressable>
            </View>
            <Pressable onPress={handleChangeAvatar}>
              <Text style={styles.changePhotoText}>
                {avatarUri ? 'Change Profile Photo' : 'Upload Profile Photo'}
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <TextInput
                  style={[styles.textInput, { color: '#64748B' }]}
                  value={mobileNumber}
                  editable={false}
                />
                <Text style={styles.verifiedTag}>Verified ✓</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@domain.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Buyer Type</Text>
              <View style={styles.chipsRow}>
                {BUYER_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.chip,
                      buyerType === type && styles.chipActive,
                    ]}
                    onPress={() => setBuyerType(type)}>
                    <Text
                      style={[
                        styles.chipText,
                        buyerType === type && styles.chipTextActive,
                      ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Language</Text>
              <View style={styles.chipsRow}>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang}
                    style={[
                      styles.chip,
                      language === lang && styles.chipActive,
                    ]}
                    onPress={() => setLanguage(lang)}>
                    <Text
                      style={[
                        styles.chipText,
                        language === lang && styles.chipTextActive,
                      ]}>
                      {lang}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Produce Categories</Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((cat) => {
                  const isSel = selectedCategories.includes(cat);
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.chip, isSel && styles.chipActive]}
                      onPress={() => toggleCategory(cat)}>
                      <Text
                        style={[
                          styles.chipText,
                          isSel && styles.chipTextActive,
                        ]}>
                        {cat} {isSel ? '✓' : '+'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

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
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#386641',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#386641',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 12,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#386641',
  },
  formContainer: {
    gap: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  verifiedTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
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
  saveBtn: {
    backgroundColor: '#386641',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
