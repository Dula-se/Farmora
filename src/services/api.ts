import { Platform } from 'react-native';

// For Android emulator, localhost is 10.0.2.2; for iOS simulator, it is localhost.
// For physical devices, set to your computer's LAN IP (e.g. 'http://192.168.1.50:5001/api')
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Platform.select({
    android: 'http://10.0.2.2:5001/api',
    ios: 'http://localhost:5001/api',
    default: 'http://localhost:5001/api',
  });

export const UPLOADS_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5001/uploads',
  ios: 'http://localhost:5001/uploads',
  default: 'http://localhost:5001/uploads',
});

export interface ApiUser {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  accountType: 'farmer' | 'buyer' | 'restaurant' | 'supermarket' | 'exporter';
  district?: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface ApiProduceItem {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  farmerAvatar?: string;
  title: string;
  category: string;
  description: string;
  pricePerUnit: number;
  currency: string;
  unit: string;
  availableQuantity: number;
  minimumOrderQuantity: number;
  harvestDate?: string;
  locationDistrict: string;
  locationCity: string;
  images: string[];
  isOrganic?: boolean;
}

/**
 * Upload single image to Famora backend
 */
export async function uploadImage(
  imageUri: string,
  folder: 'produce' | 'avatars' | 'documents' = 'produce'
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'upload.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/upload/single?folder=${folder}`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Image upload failed');
  }

  return json.data;
}

/**
 * Fetch marketplace produce listings
 */
export async function fetchProduceListings(params?: {
  category?: string;
  district?: string;
  search?: string;
}): Promise<ApiProduceItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.district) query.append('district', params.district);
  if (params?.search) query.append('search', params.search);

  const response = await fetch(`${API_BASE_URL}/produce?${query.toString()}`);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Failed to fetch produce');
  }
  return json.data;
}
