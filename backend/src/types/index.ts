export type AccountType =
  | 'farmer'
  | 'buyer'
  | 'restaurant'
  | 'supermarket'
  | 'exporter';

export interface User {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  passwordHash: string;
  accountType: AccountType;
  district?: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProduceCategory =
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'spices'
  | 'organic'
  | 'tea'
  | 'other';

export type ProduceUnit = 'kg' | 'g' | 'bundle' | 'crate' | 'item';

export interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  farmerAvatar?: string;
  title: string;
  category: ProduceCategory;
  description: string;
  pricePerUnit: number;
  currency: string; // 'LKR'
  unit: ProduceUnit;
  availableQuantity: number;
  minimumOrderQuantity: number;
  harvestDate?: string;
  locationDistrict: string;
  locationCity: string;
  images: string[];
  isOrganic?: boolean;
  isFeatured?: boolean;
  farmingMethod?: 'organic' | 'conventional' | 'greenhouse';
  grade?: string;
  wholesaleTiers?: Array<{ minQty: number; price: number }>;
  packagingType?: string;
  shelfLifeDays?: number;
  isRescue?: boolean;
  rescueDiscount?: number;
  rescueReason?: 'near_expiry' | 'surplus' | 'cosmetic_blemish' | 'none';
  rescueExpiryHours?: number;
  viewsCount?: number;
  ordersCount?: number;
  totalKgSold?: number;
  revenueGenerated?: number;
  status: 'available' | 'sold_out' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  produceId: string;
  produce?: ProduceListing;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  category?: string;
  district?: string;
  resultCount: number;
  createdAt: string;
}

export interface UploadedFileResponse {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
  timestamp: string;
}
