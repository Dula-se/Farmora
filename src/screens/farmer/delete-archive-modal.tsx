import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { archiveProduce, deleteProduceListing, ApiProduceItem } from '../../services/api';

interface DeleteArchiveModalProps {
  visible: boolean;
  product: ApiProduceItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteArchiveModal: React.FC<DeleteArchiveModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
}) => {
  if (!visible || !product) return null;

  const [selectedAction, setSelectedAction] = useState<'archive' | 'delete'>('archive');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const prodId = product._id || product.id;

    try {
      if (selectedAction === 'archive') {
        await archiveProduce(prodId, true);
        Alert.alert('Listing Archived', `"${product.title}" has been moved to your archived drafts.`);
      } else {
        await deleteProduceListing(prodId);
        Alert.alert('Listing Deleted', `"${product.title}" was permanently removed.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Warning Icon Circle */}
          <View style={styles.iconCircle}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </Svg>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Delete or Archive?</Text>
          <Text style={styles.subtitle}>
            Choose how you would like to handle <Text style={styles.boldTitle}>"{product.title}"</Text>:
          </Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {/* Archive Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedAction === 'archive' && styles.optionCardSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedAction('archive')}>
              <View style={styles.radioCircle}>
                {selectedAction === 'archive' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Archive Product (Recommended)</Text>
                <Text style={styles.optionDesc}>
                  Hides from buyer search results but keeps your sales history, orders, and market analytics intact.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Permanent Delete Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedAction === 'delete' && styles.optionCardSelectedDelete,
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedAction('delete')}>
              <View style={styles.radioCircle}>
                {selectedAction === 'delete' && <View style={[styles.radioInner, { backgroundColor: '#DC2626' }]} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, selectedAction === 'delete' && { color: '#DC2626' }]}>
                  Delete Permanently
                </Text>
                <Text style={styles.optionDesc}>
                  Removes listing and all associated crop photos permanently. This action cannot be undone.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                selectedAction === 'delete' && styles.confirmBtnDelete,
                isSubmitting && { opacity: 0.6 },
              ]}
              onPress={handleConfirm}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  {selectedAction === 'archive' ? 'Archive' : 'Delete'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  boldTitle: {
    color: '#0F172A',
    fontWeight: '700',
  },
  optionsList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  optionCardSelectedDelete: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  optionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnDelete: {
    backgroundColor: '#DC2626',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
