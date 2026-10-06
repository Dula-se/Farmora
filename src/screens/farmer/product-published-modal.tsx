import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ProductPublishedModalProps {
  visible: boolean;
  productTitle?: string;
  onViewProduct: () => void;
  onAddAnother: () => void;
  onClose: () => void;
}

export const ProductPublishedModal: React.FC<ProductPublishedModalProps> = ({
  visible,
  productTitle = 'Organic Red Tomatoes',
  onViewProduct,
  onAddAnother,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBF9" />
        <View style={styles.cardContainer}>
          {/* Green Success Circle with Checkmark */}
          <View style={styles.outerGlow}>
            <View style={styles.middleCircle}>
              <View style={styles.innerCircle}>
                <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 6L9 17l-5-5" />
                </Svg>
              </View>
            </View>
          </View>

          {/* Heading and details */}
          <Text style={styles.title}>Product Published!</Text>
          <Text style={styles.subtitle}>
            Your <Text style={styles.boldText}>{productTitle}</Text> is now live and visible to buyers across Sri Lanka on the Farmora Marketplace.
          </Text>

          {/* Live notification callout */}
          <View style={styles.infoPill}>
            <Text style={styles.infoPillIcon}>⚡</Text>
            <Text style={styles.infoPillText}>
              Subscribed buyers in your district have been notified
            </Text>
          </View>

          {/* Primary View Action */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={onViewProduct}>
            <Text style={styles.primaryButtonText}>View Product</Text>
          </TouchableOpacity>

          {/* Secondary Add Another Action */}
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={onAddAnother}>
            <Text style={styles.secondaryButtonText}>Add Another Product</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  outerGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  middleCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  boldText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 26,
    width: '100%',
  },
  infoPillIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '700',
  },
});
