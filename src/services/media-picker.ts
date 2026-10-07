import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import * as FileSystem from 'expo-file-system';

export interface PickedMediaResult {
  uri: string;
  dataUrl: string; // Ready-to-use base64 data URI (data:image/jpeg;base64,...)
  base64?: string;
  name: string;
  mimeType: string;
  size?: number;
}

/**
 * Converts any local file URI into a base64 Data URL (e.g. data:application/pdf;base64,...)
 */
export async function uriToDataUrl(uri: string, mimeTypeFallback: string = 'image/jpeg'): Promise<string> {
  try {
    // Primary: use expo-file-system which handles android content:// and file:// reliably
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mimeTypeFallback};base64,${base64}`;
  } catch (_fsErr) {
    // Secondary fallback: fetch and FileReader
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve(uri);
          }
        };
        reader.onerror = () => resolve(uri);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('[MediaPicker] uriToDataUrl fallback error:', err);
      return uri;
    }
  }
}

/**
 * Pick an image from photo library as a base64 Data URL
 */
export async function pickImageFromGallery(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<PickedMediaResult | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo gallery to upload photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: options?.quality ?? 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const dataUrl = asset.base64
      ? `data:${mimeType};base64,${asset.base64}`
      : await uriToDataUrl(asset.uri, mimeType);

    const name = asset.fileName || `photo_${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      dataUrl,
      base64: asset.base64 ?? undefined,
      name,
      mimeType,
      size: asset.fileSize,
    };
  } catch (err: any) {
    console.error('[MediaPicker] Gallery pick error:', err);
    Alert.alert('Error', err?.message || 'Could not pick image.');
    return null;
  }
}

/**
 * Capture a photo using device camera as a base64 Data URL
 */
export async function capturePhotoFromCamera(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<PickedMediaResult | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow Farmora to access your camera to take photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: options?.quality ?? 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const dataUrl = asset.base64
      ? `data:${mimeType};base64,${asset.base64}`
      : await uriToDataUrl(asset.uri, mimeType);

    const name = asset.fileName || `capture_${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      dataUrl,
      base64: asset.base64 ?? undefined,
      name,
      mimeType,
      size: asset.fileSize,
    };
  } catch (err: any) {
    console.error('[MediaPicker] Camera capture error:', err);
    Alert.alert('Error', err?.message || 'Could not capture photo.');
    return null;
  }
}

/**
 * Pick a document (PDF, DOC, Images) and convert to base64 Data URL
 */
export async function pickDocumentAsBase64(options?: {
  type?: string[];
}): Promise<PickedMediaResult | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: options?.type || ['application/pdf', 'image/*', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'application/pdf';
    const dataUrl = await uriToDataUrl(asset.uri, mimeType);

    return {
      uri: asset.uri,
      dataUrl,
      name: asset.name || `doc_${Date.now()}`,
      mimeType,
      size: asset.size,
    };
  } catch (err: any) {
    console.error('[MediaPicker] Document pick error:', err);
    Alert.alert('Error', err?.message || 'Could not pick document.');
    return null;
  }
}

/**
 * Displays a prompt to pick from Camera, Gallery, or Document
 */
export function promptMediaSource(
  options: {
    title?: string;
    message?: string;
    includeDocument?: boolean;
    allowsEditing?: boolean;
    aspect?: [number, number];
    onSelected: (result: PickedMediaResult) => void;
  }
): void {
  const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }> = [
    {
      text: '📷 Take Photo',
      onPress: async () => {
        const res = await capturePhotoFromCamera({
          allowsEditing: options.allowsEditing,
          aspect: options.aspect,
        });
        if (res) options.onSelected(res);
      },
    },
    {
      text: '🖼️ Choose from Gallery',
      onPress: async () => {
        const res = await pickImageFromGallery({
          allowsEditing: options.allowsEditing,
          aspect: options.aspect,
        });
        if (res) options.onSelected(res);
      },
    },
  ];

  if (options.includeDocument) {
    buttons.push({
      text: '📄 Choose Document / PDF',
      onPress: async () => {
        const res = await pickDocumentAsBase64();
        if (res) options.onSelected(res);
      },
    });
  }

  buttons.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert(
    options.title || 'Upload File',
    options.message || 'Choose how you would like to select your photo or document:',
    buttons
  );
}
