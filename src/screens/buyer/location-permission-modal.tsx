import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface LocationPermissionModalProps {
  visible: boolean;
  onAllowLocation: () => void;
  onManualLocation: () => void;
  onClose: () => void;
}

export function LocationPermissionModal({
  visible,
  onAllowLocation,
  onManualLocation,
  onClose,
}: LocationPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Radar Circles with Location Pin (Matching Figma Screen 2) */}
          <View style={styles.radarContainer}>
            <View style={styles.radarOuterRing}>
              <View style={styles.radarMiddleRing}>
                <View style={styles.radarInnerCircle}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <Path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  </Svg>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.title}>Enable Location Services</Text>

          <Text style={styles.description}>
            Famora uses your location to discover nearby farms in your district, calculate exact delivery distances, and connect you directly with local growers.
          </Text>

          {/* Primary CTA */}
          <Pressable style={styles.primaryBtn} onPress={onAllowLocation}>
            <Text style={styles.primaryBtnText}>Allow Location Access</Text>
          </Pressable>

          {/* Secondary CTA */}
          <Pressable style={styles.secondaryBtn} onPress={onManualLocation}>
            <Text style={styles.secondaryBtnText}>Enter Location Manually</Text>
          </Pressable>

          {/* Dismiss Link */}
          <Pressable style={styles.dismissLink} hitSlop={12} onPress={onClose}>
            <Text style={styles.dismissLinkText}>Not Now — Later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

interface NoFarmsFoundModalProps {
  visible: boolean;
  searchRadiusKm?: number;
  onIncreaseRadius: () => void;
  onChangeLocation: () => void;
  onExploreAll: () => void;
  onClose: () => void;
}

export function NoFarmsFoundModal({
  visible,
  searchRadiusKm = 25,
  onIncreaseRadius,
  onChangeLocation,
  onExploreAll,
  onClose,
}: NoFarmsFoundModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Empty Pin Illustration (Matching Figma Screen 3) */}
          <View style={styles.radarContainer}>
            <View style={[styles.radarOuterRing, { borderColor: '#FEE2E2' }]}>
              <View style={[styles.radarMiddleRing, { borderColor: '#FECACA' }]}>
                <View style={[styles.radarInnerCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <Path d="M3 3l18 18" />
                  </Svg>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.title}>No Farms Found Nearby</Text>

          <Text style={styles.description}>
            There are currently no farms registered within {searchRadiusKm} km of your selected region matching your criteria.
          </Text>

          {/* Action 1: Increase Radius */}
          <Pressable style={styles.primaryBtn} onPress={onIncreaseRadius}>
            <Text style={styles.primaryBtnText}>Increase Search Radius (+50km)</Text>
          </Pressable>

          {/* Action 2: Change Location */}
          <Pressable style={styles.secondaryBtn} onPress={onChangeLocation}>
            <Text style={styles.secondaryBtnText}>Change Delivery Location</Text>
          </Pressable>

          {/* Action 3: Explore All */}
          <Pressable style={styles.exploreAllBtn} onPress={onExploreAll}>
            <Text style={styles.exploreAllText}>Explore All Islandwide Regions</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  radarContainer: {
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 252, 231, 0.25)',
  },
  radarMiddleRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(187, 247, 208, 0.4)',
  },
  radarInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: '#2E7D32',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
  },
  dismissLink: {
    paddingVertical: 8,
  },
  dismissLinkText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  exploreAllBtn: {
    backgroundColor: '#F0FDF4',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  exploreAllText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
});
