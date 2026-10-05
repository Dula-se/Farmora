import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Determine backend IP dynamically:
// - Physical device with Expo Go gets Metro bundler host IP (e.g. 192.168.8.107)
// - Emulator / Simulator gets localhost or 10.0.2.2
function getBackendHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost') {
      return ip;
    }
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const host = getBackendHost();

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || `http://${host}:5001/api`;

export const UPLOADS_BASE_URL =
  process.env.EXPO_PUBLIC_UPLOADS_BASE_URL || `http://${host}:5001/uploads`;

console.log(`[Famora API] Connected to MongoDB backend at: ${API_BASE_URL}`);

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  _id?: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  accountType: 'farmer' | 'buyer' | 'restaurant' | 'supermarket' | 'exporter';
  district?: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
  pushToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiProduceItem {
  id: string;
  _id?: string;
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
  isFeatured?: boolean;
  status?: 'available' | 'sold_out' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
  otpPreview?: string;
}

// ─── Local Token & User Storage ──────────────────────────────────────────────
const TOKEN_KEY = '@famora_auth_token';
const USER_KEY = '@famora_current_user';

export async function saveAuthSession(token: string, user: ApiUser): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<ApiUser | null> {
  const json = await AsyncStorage.getItem(USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

// ─── Authenticated Fetch Helper ──────────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  const json = await response.json();

  if (!response.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed with status ${response.status}`);
  }

  return json;
}

// ─── Real MongoDB Auth API ───────────────────────────────────────────────────
export async function loginWithApi(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const result = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: identifier.trim(), password }),
  });
  if (result.data.token && result.data.user) {
    await saveAuthSession(result.data.token, result.data.user);
  }
  return result.data;
}

export async function registerWithApi(payload: {
  fullName: string;
  mobileNumber: string;
  email?: string;
  password: string;
  accountType: 'farmer' | 'buyer';
  district?: string;
  address?: string;
}): Promise<AuthResponse> {
  const result = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (result.data.token && result.data.user) {
    await saveAuthSession(result.data.token, result.data.user);
  }
  return result.data;
}

export async function requestOtpApi(mobileNumber: string): Promise<{ otpCode?: string }> {
  const result = await apiFetch<{ mobileNumber: string; otpCode?: string }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber }),
  });
  return result.data;
}

export async function verifyOtpApi(mobileNumber: string, code: string): Promise<boolean> {
  const result = await apiFetch<{ verified: boolean }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber, code }),
  });
  return Boolean(result.data?.verified);
}

export async function resetPasswordApi(
  mobileNumber: string,
  code: string,
  newPassword: string
): Promise<string> {
  const result = await apiFetch<null>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber, code, newPassword }),
  });
  return result.message || 'Password reset successfully';
}

export async function fetchMe(): Promise<ApiUser> {
  const result = await apiFetch<ApiUser>('/auth/me');
  return result.data;
}

// ─── Real MongoDB Produce API ────────────────────────────────────────────────
export async function fetchProduceListings(params?: {
  category?: string;
  district?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  farmerId?: string;
}): Promise<ApiProduceItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.district) query.append('district', params.district);
  if (params?.search) query.append('search', params.search);
  if (params?.minPrice !== undefined) query.append('minPrice', String(params.minPrice));
  if (params?.maxPrice !== undefined) query.append('maxPrice', String(params.maxPrice));
  if (params?.farmerId) query.append('farmerId', params.farmerId);

  const result = await apiFetch<ApiProduceItem[]>(`/produce?${query.toString()}`);
  return result.data || [];
}

export async function fetchProduceById(id: string): Promise<ApiProduceItem> {
  const result = await apiFetch<ApiProduceItem>(`/produce/${id}`);
  return result.data;
}

export async function createProduceListing(
  data: Omit<ApiProduceItem, 'id' | '_id' | 'farmerId' | 'farmerName' | 'farmerMobile'>
): Promise<ApiProduceItem> {
  const result = await apiFetch<ApiProduceItem>('/produce', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function fetchMyListings(): Promise<ApiProduceItem[]> {
  const result = await apiFetch<ApiProduceItem[]>('/produce/my/listings');
  return result.data || [];
}

// ─── Real Image Upload API ───────────────────────────────────────────────────
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

  const result = await apiFetch<{ url: string; filename: string }>(
    `/upload/single?folder=${folder}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  return result.data;
}
