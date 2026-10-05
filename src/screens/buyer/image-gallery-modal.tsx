import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

interface ImageGalleryModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageGalleryModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageGalleryModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const displayImages =
    images && images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B131E" />

        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable onPress={onClose} hitSlop={14} style={styles.iconBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>

          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {activeIndex + 1} / {displayImages.length}
            </Text>
          </View>

          <Pressable hitSlop={14} style={styles.iconBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <Path d="M16 6l-4-4-4 4" />
              <Path d="M12 2v13" />
            </Svg>
          </Pressable>
        </View>

        {/* Main Image Stage */}
        <View style={styles.stageContainer}>
          <Image
            source={{ uri: displayImages[activeIndex] }}
            style={styles.mainImage}
            contentFit="contain"
            transition={200}
          />

          {/* Left Arrow */}
          {displayImages.length > 1 && (
            <Pressable style={[styles.arrowBtn, styles.arrowLeft]} onPress={handlePrev}>
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
          )}

          {/* Right Arrow */}
          {displayImages.length > 1 && (
            <Pressable style={[styles.arrowBtn, styles.arrowRight]} onPress={handleNext}>
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          )}
        </View>

        {/* Bottom Thumbnail Strip */}
        <View style={styles.bottomThumbnailsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsScroll}>
            {displayImages.map((imgUri, index) => {
              const isActive = index === activeIndex;
              return (
                <Pressable
                  key={index}
                  style={[styles.thumbItem, isActive && styles.thumbItemActive]}
                  onPress={() => setActiveIndex(index)}>
                  <Image source={{ uri: imgUri }} style={styles.thumbImage} contentFit="cover" />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B131E',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  counterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  arrowBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  arrowLeft: {
    left: 16,
  },
  arrowRight: {
    right: 16,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  bottomThumbnailsContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  thumbnailsScroll: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  thumbItem: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  thumbItemActive: {
    borderColor: '#386641',
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
