import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { updateProduceStock, ApiProduceItem } from '../../services/api';

interface UpdateStockModalProps {
  visible: boolean;
  product: ApiProduceItem | null;
  onClose: () => void;
  onSuccess: (updatedProduct: ApiProduceItem) => void;
}

export const UpdateStockModal: React.FC<UpdateStockModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
}) => {
  if (!visible || !product) return null;

  const currentStock = product.availableQuantity || 0;
  const [adjustment, setAdjustment] = useState<number>(25);
  const [mode, setMode] = useState<'add' | 'reduce'>('add');
  const [notifyBuyers, setNotifyBuyers] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const calculatedNewStock =
    mode === 'add'
      ? currentStock + adjustment
      : Math.max(0, currentStock - adjustment);

  const handleStep = (delta: number) => {
    setAdjustment((prev) => Math.max(1, prev + delta));
  };

  const handleSaveStock = async () => {
    setIsSubmitting(true);
    try {
      const prodId = product._id || product.id;
      const res = await updateProduceStock(prodId, calculatedNewStock, notifyBuyers);
      Alert.alert('Stock Updated', `Available stock is now ${calculatedNewStock} ${product.unit}.`);
      onSuccess(res.produce);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={10}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Update Stock</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Product Summary Card */}
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.title}</Text>
              <Text style={styles.productPrice}>
                Rs. {product.pricePerUnit} / {product.unit}
              </Text>
            </View>
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeLabel}>Current Stock</Text>
              <Text style={styles.currentBadgeValue}>
                {currentStock} {product.unit}
              </Text>
            </View>
          </View>

          {/* Action Tabs: Add Stock vs Reduce Stock */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'add' && styles.tabBtnActive]}
              onPress={() => setMode('add')}>
              <Text style={[styles.tabBtnText, mode === 'add' && styles.tabBtnTextActive]}>
                + Add Stock
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'reduce' && styles.tabBtnActive]}
              onPress={() => setMode('reduce')}>
              <Text style={[styles.tabBtnText, mode === 'reduce' && styles.tabBtnTextActive]}>
                - Reduce Stock
              </Text>
            </TouchableOpacity>
          </View>

          {/* Adjustment Amount Stepper */}
          <View style={styles.stepperContainer}>
            <Text style={styles.stepperLabel}>
              {mode === 'add' ? 'Amount to Add' : 'Amount to Deduct'}
            </Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepCircleBtn}
                onPress={() => handleStep(-5)}>
                <Text style={styles.stepCircleText}>-</Text>
              </TouchableOpacity>

              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperValueText}>
                  {adjustment} {product.unit}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.stepCircleBtn}
                onPress={() => handleStep(5)}>
                <Text style={styles.stepCircleText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* New Stock Preview */}
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>New Stock Total:</Text>
            <Text style={styles.previewValue}>
              {calculatedNewStock} {product.unit}
            </Text>
          </View>

          {/* Notify Buyers Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Notify Interested Buyers</Text>
              <Text style={styles.toggleSub}>
                Send SMS & Push alerts to buyers who wishlisted this crop
              </Text>
            </View>
            <Switch
              value={notifyBuyers}
              onValueChange={setNotifyBuyers}
              trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
              thumbColor={notifyBuyers ? '#2E7D32' : '#94A3B8'}
            />
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            disabled={isSubmitting}
            activeOpacity={0.85}
            onPress={handleSaveStock}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Confirm Stock Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  currentBadgeLabel: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
  },
  currentBadgeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#2E7D32',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperValueBox: {
    minWidth: 100,
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E7D32',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 20,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
