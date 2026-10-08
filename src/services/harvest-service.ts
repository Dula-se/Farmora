import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, getStoredUser } from './api';

export interface HarvestPreOrder {
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  quantityKg: number;
  depositAmount: number;
  totalAmount: number;
  orderId?: string;
  stripePaymentIntentId?: string;
  bookedAt: string;
}

export type HarvestStatus = 'growing' | 'ready_for_harvest' | 'harvested' | 'dispatched';

export interface HarvestItem {
  id: string;
  _id?: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar: string;
  farmerFarm: string;
  cropName: string;
  variety: string;
  category: string;
  image: string;
  expectedHarvestDate: string; // YYYY-MM-DD
  estimatedYieldKg: number;
  reservedYieldKg: number;
  minPreOrderQty: number;
  preOrderPricePerKg: number;
  marketPricePerKg: number;
  depositPercent: number; // e.g. 20
  locationDistrict: string;
  farmAddress: string;
  fieldNotes: string;
  allowPreOrders: boolean;
  status: HarvestStatus;
  preOrders?: HarvestPreOrder[];
  createdAt?: string;
}

const STORAGE_KEY = 'famora_harvests_data_v1';

const INITIAL_HARVESTS: HarvestItem[] = [
  {
    id: 'harv-1',
    farmerId: 'farmer-1',
    farmerName: 'Kamal Gunawardana',
    farmerAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
    farmerFarm: 'Green Haven Organics',
    cropName: 'Red Onion (Rathu Lunu)',
    variety: 'Dambulla Special',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
    expectedHarvestDate: '2026-10-25',
    estimatedYieldKg: 2500,
    reservedYieldKg: 1450,
    minPreOrderQty: 50,
    preOrderPricePerKg: 380,
    marketPricePerKg: 450,
    depositPercent: 20,
    locationDistrict: 'Dambulla, Matale',
    farmAddress: 'Pannampitiya Farm Road, Dambulla',
    fieldNotes: 'Grade-A organic certified bulb onions, grown with drip irrigation.',
    allowPreOrders: true,
    status: 'growing',
    preOrders: [
      {
        buyerId: 'buyer-sunil',
        buyerName: 'Sunil Dissanayake',
        buyerPhone: '+94 77 123 4567',
        quantityKg: 250,
        depositAmount: 19000,
        totalAmount: 95000,
        bookedAt: '2026-10-02T10:00:00Z',
      },
    ],
  },
  {
    id: 'harv-2',
    farmerId: 'farmer-2',
    farmerName: 'Sunil Bandara',
    farmerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop',
    farmerFarm: 'Highland Fresh Organics',
    cropName: 'Nuwara Eliya Carrots',
    variety: 'Kuroda Premium',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&fit=crop',
    expectedHarvestDate: '2026-10-28',
    estimatedYieldKg: 1800,
    reservedYieldKg: 900,
    minPreOrderQty: 25,
    preOrderPricePerKg: 290,
    marketPricePerKg: 360,
    depositPercent: 25,
    locationDistrict: 'Nuwara Eliya',
    farmAddress: 'Kandapola Valley Estate, Nuwara Eliya',
    fieldNotes: 'Crisp high-altitude sweet carrots, chemical pesticide free.',
    allowPreOrders: true,
    status: 'growing',
    preOrders: [],
  },
  {
    id: 'harv-3',
    farmerId: 'farmer-3',
    farmerName: 'Anura Perera',
    farmerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop',
    farmerFarm: 'Polonnaruwa Green Fields',
    cropName: 'Keeri Samba Rice (Paddy)',
    variety: 'BG 360',
    category: 'Grains',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop',
    expectedHarvestDate: '2026-11-05',
    estimatedYieldKg: 8000,
    reservedYieldKg: 5200,
    minPreOrderQty: 100,
    preOrderPricePerKg: 240,
    marketPricePerKg: 290,
    depositPercent: 20,
    locationDistrict: 'Polonnaruwa',
    farmAddress: 'Minneriya Scheme, Polonnaruwa',
    fieldNotes: 'Aromatic fine rice harvested from canal-fed paddy fields.',
    allowPreOrders: true,
    status: 'growing',
    preOrders: [],
  },
  {
    id: 'harv-4',
    farmerId: 'farmer-1',
    farmerName: 'Kamal Gunawardana',
    farmerAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
    farmerFarm: 'Green Haven Organics',
    cropName: 'Green Chillies (Amu Miris)',
    variety: 'MI-2 Hot',
    category: 'Spices',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&fit=crop',
    expectedHarvestDate: '2026-10-18',
    estimatedYieldKg: 650,
    reservedYieldKg: 600,
    minPreOrderQty: 10,
    preOrderPricePerKg: 720,
    marketPricePerKg: 850,
    depositPercent: 30,
    locationDistrict: 'Matale',
    farmAddress: 'Dambulla Bypass, Matale',
    fieldNotes: 'Spicy green chillies picking ready in 10 days.',
    allowPreOrders: true,
    status: 'ready_for_harvest',
    preOrders: [],
  },
];

let harvestsCache: HarvestItem[] = [...INITIAL_HARVESTS];

function mapDbHarvest(db: any): HarvestItem {
  return {
    id: db._id?.toString() || db.id || `harv-${Math.random()}`,
    _id: db._id?.toString() || db.id,
    farmerId: db.farmerId || 'farmer-1',
    farmerName: db.farmerName || 'Farmer',
    farmerAvatar: db.farmerAvatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
    farmerFarm: db.farmerFarm || 'Local Farm',
    cropName: db.cropName || 'Crop',
    variety: db.variety || 'Standard',
    category: db.category || 'Vegetables',
    image: db.image || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
    expectedHarvestDate: db.expectedHarvestDate || new Date().toISOString().split('T')[0],
    estimatedYieldKg: db.estimatedYieldKg || 1000,
    reservedYieldKg: db.reservedYieldKg || 0,
    minPreOrderQty: db.minPreOrderQty || 10,
    preOrderPricePerKg: db.preOrderPricePerKg || 100,
    marketPricePerKg: db.marketPricePerKg || 120,
    depositPercent: db.depositPercent || 20,
    locationDistrict: db.locationDistrict || 'Sri Lanka',
    farmAddress: db.farmAddress || '',
    fieldNotes: db.fieldNotes || '',
    allowPreOrders: db.allowPreOrders !== false,
    status: db.status || 'growing',
    preOrders: db.preOrders || [],
    createdAt: db.createdAt,
  };
}

export const HarvestService = {
  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        harvestsCache = JSON.parse(stored);
      }
    } catch {}
  },

  async getHarvests(params?: { district?: string; month?: string; farmerId?: string }): Promise<HarvestItem[]> {
    try {
      let url = '/harvests';
      const q = new URLSearchParams();
      if (params?.district) q.append('district', params.district);
      if (params?.month) q.append('month', params.month);
      if (params?.farmerId) q.append('farmerId', params.farmerId);
      if (q.toString()) url += `?${q.toString()}`;

      const res = await apiFetch<any[]>(url);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapDbHarvest);
        harvestsCache = mapped;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)).catch(() => {});
        return mapped;
      }
    } catch (e) {
      console.warn('[HarvestService] getHarvests network error:', e);
    }

    let filtered = [...harvestsCache];
    if (params?.district) {
      filtered = filtered.filter((h) => h.locationDistrict.toLowerCase().includes(params.district!.toLowerCase()));
    }
    if (params?.farmerId) {
      filtered = filtered.filter((h) => h.farmerId === params.farmerId);
    }
    return filtered;
  },

  async getHarvestById(id: string): Promise<HarvestItem | null> {
    try {
      const res = await apiFetch<any>(`/harvests/${id}`);
      if (res.data) {
        return mapDbHarvest(res.data);
      }
    } catch {}

    const found = harvestsCache.find((h) => h.id === id || h._id === id);
    return found || null;
  },

  async preOrderHarvest(
    harvestId: string,
    booking: {
      quantityKg: number;
      depositAmount: number;
      totalAmount: number;
      stripePaymentIntentId?: string;
    }
  ): Promise<HarvestItem> {
    const user = await getStoredUser();
    const buyerId = user?.id || user?._id || 'buyer-user';
    const buyerName = user?.fullName || (user as any)?.name || 'Authorized Buyer';
    const buyerPhone = user?.mobileNumber || (user as any)?.phone || '+94 77 123 4567';

    try {
      const res = await apiFetch<any>(`/harvests/${harvestId}/pre-order`, {
        method: 'POST',
        body: JSON.stringify({
          buyerId,
          buyerName,
          buyerPhone,
          ...booking,
        }),
      });

      if (res.data) {
        const updated = mapDbHarvest(res.data);
        const idx = harvestsCache.findIndex((h) => h.id === harvestId || h._id === harvestId);
        if (idx !== -1) harvestsCache[idx] = updated;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(harvestsCache)).catch(() => {});
        return updated;
      }
    } catch (e) {
      console.warn('[HarvestService] preOrderHarvest fallback locally:', e);
    }

    const idx = harvestsCache.findIndex((h) => h.id === harvestId || h._id === harvestId);
    if (idx !== -1) {
      const target = harvestsCache[idx];
      const newPreOrder: HarvestPreOrder = {
        buyerId,
        buyerName,
        buyerPhone,
        quantityKg: booking.quantityKg,
        depositAmount: booking.depositAmount,
        totalAmount: booking.totalAmount,
        stripePaymentIntentId: booking.stripePaymentIntentId,
        bookedAt: new Date().toISOString(),
      };
      target.reservedYieldKg = Math.min(target.estimatedYieldKg, target.reservedYieldKg + booking.quantityKg);
      target.preOrders = [...(target.preOrders || []), newPreOrder];
      harvestsCache[idx] = { ...target };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(harvestsCache)).catch(() => {});
      return harvestsCache[idx];
    }

    throw new Error('Harvest not found');
  },

  async createHarvest(data: Partial<HarvestItem>): Promise<HarvestItem> {
    const user = await getStoredUser();
    const payload = {
      ...data,
      farmerId: data.farmerId || user?.id || user?._id || 'farmer-1',
      farmerName: data.farmerName || user?.fullName || (user as any)?.name || 'Kamal Gunawardana',
      farmerAvatar: data.farmerAvatar || user?.avatarUrl || (user as any)?.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
      farmerFarm: data.farmerFarm || (user as any)?.farmName || 'Green Fields',
    };

    try {
      const res = await apiFetch<any>('/harvests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.data) {
        const created = mapDbHarvest(res.data);
        harvestsCache = [created, ...harvestsCache];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(harvestsCache)).catch(() => {});
        return created;
      }
    } catch (e) {
      console.warn('[HarvestService] createHarvest network error, saving locally:', e);
    }

    const localItem: HarvestItem = {
      id: `harv-${Date.now()}`,
      farmerId: payload.farmerId,
      farmerName: payload.farmerName,
      farmerAvatar: payload.farmerAvatar,
      farmerFarm: payload.farmerFarm,
      cropName: payload.cropName || 'Fresh Produce',
      variety: payload.variety || 'Local Grade A',
      category: payload.category || 'Vegetables',
      image: payload.image || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
      expectedHarvestDate: payload.expectedHarvestDate || new Date().toISOString().split('T')[0],
      estimatedYieldKg: payload.estimatedYieldKg || 1000,
      reservedYieldKg: 0,
      minPreOrderQty: payload.minPreOrderQty || 10,
      preOrderPricePerKg: payload.preOrderPricePerKg || 250,
      marketPricePerKg: payload.marketPricePerKg || 300,
      depositPercent: payload.depositPercent || 20,
      locationDistrict: payload.locationDistrict || 'Anuradhapura',
      farmAddress: payload.farmAddress || 'Farm Sector 4',
      fieldNotes: payload.fieldNotes || '',
      allowPreOrders: true,
      status: 'growing',
      preOrders: [],
    };

    harvestsCache = [localItem, ...harvestsCache];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(harvestsCache)).catch(() => {});
    return localItem;
  },

  async updateHarvestStatus(harvestId: string, status: HarvestStatus): Promise<HarvestItem | null> {
    try {
      const res = await apiFetch<any>(`/harvests/${harvestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.data) {
        const updated = mapDbHarvest(res.data);
        const idx = harvestsCache.findIndex((h) => h.id === harvestId || h._id === harvestId);
        if (idx !== -1) harvestsCache[idx] = updated;
        return updated;
      }
    } catch {}

    const idx = harvestsCache.findIndex((h) => h.id === harvestId || h._id === harvestId);
    if (idx !== -1) {
      harvestsCache[idx].status = status;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(harvestsCache)).catch(() => {});
      return harvestsCache[idx];
    }
    return null;
  },
};
