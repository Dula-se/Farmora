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

export async function updateProduceListing(
  id: string,
  data: Partial<ApiProduceItem>
): Promise<ApiProduceItem> {
  const result = await apiFetch<ApiProduceItem>(`/produce/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function deleteProduceListing(id: string): Promise<void> {
  await apiFetch(`/produce/${id}`, {
    method: 'DELETE',
  });
}

export async function updateProduceStock(
  id: string,
  quantity: number,
  notifyBuyers: boolean = false
): Promise<{ produce: ApiProduceItem; notifiedBuyers: boolean }> {
  const result = await apiFetch<{ produce: ApiProduceItem; notifiedBuyers: boolean }>(
    `/produce/${id}/stock`,
    {
      method: 'PATCH',
      body: JSON.stringify({ quantity, notifyBuyers }),
    }
  );
  return result.data;
}

export async function archiveProduce(
  id: string,
  archive: boolean = true
): Promise<ApiProduceItem> {
  const result = await apiFetch<ApiProduceItem>(`/produce/${id}/archive`, {
    method: 'PATCH',
    body: JSON.stringify({ archive }),
  });
  return result.data;
}

export async function fetchProducePerformance(id: string): Promise<any> {
  const result = await apiFetch<any>(`/produce/${id}/performance`);
  return result.data;
}

// ─── Real Rescue Produce API ──────────────────────────────────────────────────
export async function fetchRescueProduce(reason?: string): Promise<any[]> {
  const endpoint = reason && reason !== 'all' ? `/produce/rescue?reason=${reason}` : '/produce/rescue';
  const result = await apiFetch<any[]>(endpoint);
  return result.data || [];
}

export async function createRescueProduce(data: any): Promise<any> {
  const result = await apiFetch<any>('/produce/rescue', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data;
}

// ─── Real Wishlist API ────────────────────────────────────────────────────────
export async function fetchWishlist(): Promise<any[]> {
  const result = await apiFetch<any[]>('/wishlist');
  return result.data || [];
}

export async function toggleWishlist(produceId: string): Promise<{ isWishlisted: boolean }> {
  const result = await apiFetch<{ isWishlisted: boolean }>('/wishlist/toggle', {
    method: 'POST',
    body: JSON.stringify({ produceId }),
  });
  return result.data;
}

export async function checkWishlistStatus(produceId: string): Promise<{ isWishlisted: boolean }> {
  const result = await apiFetch<{ isWishlisted: boolean }>(`/wishlist/check/${produceId}`);
  return result.data;
}

// ─── Real Search & Search History API ─────────────────────────────────────────
export async function fetchSearchHistory(): Promise<any[]> {
  const result = await apiFetch<any[]>('/search/history');
  return result.data || [];
}

export async function saveSearchHistory(
  query: string,
  category?: string,
  district?: string,
  resultCount?: number
): Promise<any> {
  const result = await apiFetch<any>('/search/record', {
    method: 'POST',
    body: JSON.stringify({ query, category, district, resultCount }),
  });
  return result.data;
}

export async function clearSearchHistory(id?: string): Promise<void> {
  const endpoint = id ? `/search/history?id=${id}` : '/search/history';
  await apiFetch(endpoint, {
    method: 'DELETE',
  });
}

export async function fetchPopularSearches(): Promise<any[]> {
  const result = await apiFetch<any[]>('/search/popular');
  return result.data || [];
}

// ─── Real Market Intelligence & Trust Score API ──────────────────────────────
export async function fetchDistrictPriceCompare(crop?: string, district?: string): Promise<any> {
  const query = new URLSearchParams();
  if (crop) query.append('crop', crop);
  if (district) query.append('district', district);
  const result = await apiFetch<any>(`/market/compare?${query.toString()}`);
  return result.data;
}

export async function fetchWholesaleVsRetail(crop?: string): Promise<any> {
  const query = new URLSearchParams();
  if (crop) query.append('crop', crop);
  const result = await apiFetch<any>(`/market/pricing-strategy?${query.toString()}`);
  return result.data;
}

export async function fetchMarketTrends(crop?: string, district?: string): Promise<any> {
  const query = new URLSearchParams();
  if (crop) query.append('crop', crop);
  if (district) query.append('district', district);
  const result = await apiFetch<any>(`/market/trends?${query.toString()}`);
  return result.data;
}

export async function fetchFarmerTrustScore(farmerId?: string): Promise<any> {
  const endpoint = farmerId ? `/market/trust-score/${farmerId}` : '/market/trust-score';
  const result = await apiFetch<any>(endpoint);
  return result.data;
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

