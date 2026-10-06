import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { updateProduceListing, ApiProduceItem } from '../../services/api';

interface EditProductScreenProps {
  product: ApiProduceItem;
  onBack: () => void;
  onSaved: (updated: ApiProduceItem) => void;
}

export const EditProductScreen: React.FC<EditProductScreenProps> = ({
  product,
  onBack,
  onSaved,
}) => {
  const [title, setTitle] = useState(product.title);
  const [category, setCategory] = useState(product.category || 'vegetables');
  const [description, setDescription] = useState(product.description || '');
  const [farmingMethod, setFarmingMethod] = useState<'organic' | 'conventional' | 'greenhouse'>('organic');
  const [availableQuantity, setAvailableQuantity] = useState(String(product.availableQuantity || '150'));
  const [pricePerUnit, setPricePerUnit] = useState(String(product.pricePerUnit || '350'));
  const [minOrderQty, setMinOrderQty] = useState(String(product.minimumOrderQuantity || '10'));
  const [harvestDate, setHarvestDate] = useState(product.harvestDate || '2026-10-08');
  const [qualityGrade, setQualityGrade] = useState('Grade A+');
  const [images, setImages] = useState<string[]>(
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80']
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['vegetables', 'fruits', 'grains', 'spices', 'organic', 'tea'];
  const grades = ['Grade A+', 'Grade A', 'Grade B'];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a product title.');
      return;
    }
    const qty = parseFloat(availableQuantity);
    const price = parseFloat(pricePerUnit);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid stock quantity.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price per unit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const prodId = product._id || product.id;
      const updated = await updateProduceListing(prodId, {
        title: title.trim(),
        category,
        description: description.trim(),
        availableQuantity: qty,
        pricePerUnit: price,
        minimumOrderQuantity: parseFloat(minOrderQty) || 1,
        harvestDate,
        images,
      });

      Alert.alert('Success', 'Listing updated successfully!');
      onSaved(updated);
      onBack();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update produce listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.headerBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          hitSlop={12}
          style={styles.saveBtn}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#2E7D32" />
          ) : (
            <Text style={styles.saveBtnText}>✓ Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Photos Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Product Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
            {images.map((imgUri, idx) => (
              <View key={idx} style={styles.photoThumbContainer}>
                <Image source={{ uri: imgUri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => setImages(images.filter((_, i) => i !== idx))}>
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addPhotoBox}
              onPress={() => {
                setImages((prev) => [
                  ...prev,
                  'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&auto=format&fit=crop&q=80',
                ]);
              }}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 5v14M5 12h14" />
              </Svg>
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Basic Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.inputLabel}>Product Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Organic Red Tomatoes"
          />

          <Text style={styles.inputLabel}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}>
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe freshness, harvest time, grade..."
            multiline
            numberOfLines={4}
          />

          <Text style={styles.inputLabel}>Farming Method</Text>
          <View style={styles.methodPillsRow}>
            {(['organic', 'conventional', 'greenhouse'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodPill, farmingMethod === m && styles.methodPillActive]}
                onPress={() => setFarmingMethod(m)}>
                <Text style={[styles.methodPillText, farmingMethod === m && styles.methodPillTextActive]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price & Quantity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Price & Quantity</Text>

          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Available Qty ({product.unit}) *</Text>
              <TextInput
                style={styles.input}
                value={availableQuantity}
                onChangeText={setAvailableQuantity}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Price / {product.unit} (Rs.) *</Text>
              <TextInput
                style={styles.input}
                value={pricePerUnit}
                onChangeText={setPricePerUnit}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Minimum Order Quantity ({product.unit})</Text>
          <TextInput
            style={styles.input}
            value={minOrderQty}
            onChangeText={setMinOrderQty}
            keyboardType="numeric"
          />
        </View>

        {/* Harvest & Quality */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Harvest & Quality</Text>

          <Text style={styles.inputLabel}>Harvest Date</Text>
          <TextInput
            style={styles.input}
            value={harvestDate}
            onChangeText={setHarvestDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.inputLabel}>Quality Grade</Text>
          <View style={styles.gradesRow}>
            {grades.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.gradeBtn, qualityGrade === g && styles.gradeBtnActive]}
                onPress={() => setQualityGrade(g)}>
                <Text style={[styles.gradeBtnText, qualityGrade === g && styles.gradeBtnTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveSubmitBtn, isSubmitting && { opacity: 0.6 }]}
          disabled={isSubmitting}
          activeOpacity={0.85}
          onPress={handleSave}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveSubmitBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBF9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoThumbContainer: {
    position: 'relative',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  addPhotoBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 85,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#2E7D32',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  methodPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  methodPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  methodPillActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  methodPillTextActive: {
    color: '#15803D',
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  gradesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  gradeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  gradeBtnActive: {
    backgroundColor: '#2E7D32',
  },
  gradeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  gradeBtnTextActive: {
    color: '#FFFFFF',
  },
  saveSubmitBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
