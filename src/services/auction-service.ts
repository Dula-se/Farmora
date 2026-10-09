import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, getStoredUser } from './api';
import { sendLocalNotification } from './notifications';

export interface BidRecord {
  bidderId: string;
  bidderName: string;
  bidAmountPerKg: number;
  totalLotAmount: number;
  timestamp: string;
}

export type AuctionStatus = 'live' | 'upcoming' | 'ended' | 'paid';

export interface AuctionItem {
  id: string;
  _id?: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar: string;
  farmerFarm: string;
  cropName: string;
  variety: string;
  grade: string;
  lotSizeKg: number;
  unit: string;
  image: string;
  startingPricePerKg: number;
  reservePricePerKg: number;
  minBidIncrement: number;
  currentBidPerKg: number;
  highestBidderId?: string;
  highestBidderName?: string;
  bidsCount: number;
  bids: BidRecord[];
  startTime: string;
  endTime: string; // ISO string
  status: AuctionStatus;
  winnerId?: string;
  winnerName?: string;
  finalPricePerKg?: number;
  winningTotalAmount?: number;
  stripePaymentIntentId?: string;
  orderId?: string;
  locationDistrict: string;
  description: string;
  createdAt?: string;
}

const STORAGE_KEY = 'famora_auctions_data_v1';

// Future ISO timestamps for active live auctions
const now = Date.now();
const in30Min = new Date(now + 30 * 60 * 1000).toISOString();
const in4Hours = new Date(now + 4 * 60 * 60 * 1000).toISOString();
const in2Days = new Date(now + 48 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

const INITIAL_AUCTIONS: AuctionItem[] = [
  {
    id: 'auc-1',
    farmerId: 'farmer-1',
    farmerName: 'Kamal Gunawardana',
    farmerAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
    farmerFarm: 'Green Haven Organics',
    cropName: 'Grade-A Dambulla Red Onions (Rathu Lunu)',
    variety: 'Dambulla Special Bulb',
    grade: 'A+ Export Grade',
    lotSizeKg: 1000,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
    startingPricePerKg: 320,
    reservePricePerKg: 380,
    minBidIncrement: 5,
    currentBidPerKg: 395,
    highestBidderId: 'buyer-sunil',
    highestBidderName: 'Sunil Dissanayake',
    bidsCount: 14,
    bids: [
      {
        bidderId: 'buyer-1',
        bidderName: 'Lanka Wholesale Trade',
        bidAmountPerKg: 350,
        totalLotAmount: 350000,
        timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      },
      {
        bidderId: 'buyer-2',
        bidderName: 'Metro Food Hub',
        bidAmountPerKg: 375,
        totalLotAmount: 375000,
        timestamp: new Date(now - 6 * 60 * 1000).toISOString(),
      },
      {
        bidderId: 'buyer-sunil',
        bidderName: 'Sunil Dissanayake',
        bidAmountPerKg: 395,
        totalLotAmount: 395000,
        timestamp: new Date(now - 1 * 60 * 1000).toISOString(),
      },
    ],
    startTime: yesterday,
    endTime: in30Min,
    status: 'live',
    locationDistrict: 'Dambulla, Matale',
    description: 'Wholesale lot of 1,000 kg cured dry red onions. Harvested 4 days ago with zero spoilage.',
  },
  {
    id: 'auc-2',
    farmerId: 'farmer-2',
    farmerName: 'Sunil Bandara',
    farmerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop',
    farmerFarm: 'Highland Fresh Organics',
    cropName: 'Highland Crisp Cabbage Lot',
    variety: 'Green Coronet',
    grade: 'Super Grade A',
    lotSizeKg: 2000,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&fit=crop',
    startingPricePerKg: 140,
    reservePricePerKg: 170,
    minBidIncrement: 5,
    currentBidPerKg: 185,
    highestBidderId: 'buyer-supermarket',
    highestBidderName: 'Cargills Fresh Partner',
    bidsCount: 9,
    bids: [
      {
        bidderId: 'buyer-3',
        bidderName: 'Island Grocery Logistics',
        bidAmountPerKg: 160,
        totalLotAmount: 320000,
        timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
      },
      {
        bidderId: 'buyer-supermarket',
        bidderName: 'Cargills Fresh Partner',
        bidAmountPerKg: 185,
        totalLotAmount: 370000,
        timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      },
    ],
    startTime: yesterday,
    endTime: in4Hours,
    status: 'live',
    locationDistrict: 'Nuwara Eliya',
    description: 'Packed directly into standard ventilated crates. Immediate dispatch available upon auction close.',
  },
  {
    id: 'auc-3',
    farmerId: 'farmer-3',
    farmerName: 'Anura Perera',
    farmerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop',
    farmerFarm: 'Polonnaruwa Green Fields',
    cropName: 'Polonnaruwa Premium Keeri Samba (Paddy)',
    variety: 'Paddy Grain BG 360',
    grade: 'Paddy Board Certified',
    lotSizeKg: 5000,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&fit=crop',
    startingPricePerKg: 210,
    reservePricePerKg: 240,
    minBidIncrement: 5,
    currentBidPerKg: 210,
    bidsCount: 0,
    bids: [],
    startTime: in4Hours,
    endTime: in2Days,
    status: 'upcoming',
    locationDistrict: 'Polonnaruwa',
    description: 'Large scale dried harvest lot. Moisture level strictly below 13%. Ready for commercial millers.',
  },
];

let auctionsCache: AuctionItem[] = [...INITIAL_AUCTIONS];

function autoResolveExpiredAuctions(list: AuctionItem[]): AuctionItem[] {
  const nowMs = Date.now();
  let changed = false;
  const updated = list.map((item) => {
    const isTimeEnded = new Date(item.endTime).getTime() <= nowMs;
    if (item.status === 'live' && isTimeEnded) {
      changed = true;
      const winnerId = item.highestBidderId || item.winnerId;
      const winnerName = item.highestBidderName || item.winnerName;
      return {
        ...item,
        status: 'ended' as const,
        winnerId,
        winnerName,
        finalPricePerKg: item.currentBidPerKg,
        winningTotalAmount: item.currentBidPerKg * item.lotSizeKg,
      };
    }
    return item;
  });
  if (changed) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }
  return updated;
}

function mapDbAuction(raw: any): AuctionItem {
  const db = raw?.auction || raw || {};
  const isEnded = db.status === 'ended' || db.status === 'paid' || (db.endTime && new Date(db.endTime).getTime() <= Date.now());
  const effectiveStatus = db.status === 'paid' ? 'paid' : isEnded ? 'ended' : (db.status || 'live');

  return {
    id: db._id?.toString() || db.id || `auc-${Math.random()}`,
    _id: db._id?.toString() || db.id,
    farmerId: db.farmerId || 'farmer-1',
    farmerName: db.farmerName || 'Farmer',
    farmerAvatar: db.farmerAvatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
    farmerFarm: db.farmerFarm || 'Local Farm',
    cropName: db.cropName || 'Produce Lot',
    variety: db.variety || 'Standard',
    grade: db.grade || 'Grade A',
    lotSizeKg: db.lotSizeKg || 500,
    unit: db.unit || 'kg',
    image: db.image || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
    startingPricePerKg: db.startingPricePerKg || 100,
    reservePricePerKg: db.reservePricePerKg || 120,
    minBidIncrement: db.minBidIncrement || 5,
    currentBidPerKg: db.currentBidPerKg || db.startingPricePerKg || 100,
    highestBidderId: db.highestBidderId,
    highestBidderName: db.highestBidderName,
    bidsCount: db.bidsCount || (db.bids ? db.bids.length : 0),
    bids: db.bids || [],
    startTime: db.startTime || new Date().toISOString(),
    endTime: db.endTime || new Date(Date.now() + 3600000).toISOString(),
    status: effectiveStatus,
    winnerId: db.winnerId || (isEnded ? db.highestBidderId : undefined),
    winnerName: db.winnerName || (isEnded ? db.highestBidderName : undefined),
    finalPricePerKg: db.finalPricePerKg || (isEnded ? db.currentBidPerKg : undefined),
    winningTotalAmount: db.winningTotalAmount || (isEnded ? db.currentBidPerKg * (db.lotSizeKg || 500) : undefined),
    stripePaymentIntentId: db.stripePaymentIntentId,
    orderId: db.orderId,
    locationDistrict: db.locationDistrict || 'Sri Lanka',
    description: db.description || '',
    createdAt: db.createdAt,
  };
}

export const AuctionService = {
  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        auctionsCache = autoResolveExpiredAuctions(JSON.parse(stored));
      }
    } catch {}
  },

  async getAuctions(params?: {
    status?: string;
    farmerId?: string;
    tab?: string;
    userId?: string;
  }): Promise<AuctionItem[]> {
    try {
      let url = '/auctions';
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.tab) q.append('tab', params.tab);
      if (params?.userId) q.append('userId', params.userId);
      if (params?.farmerId) q.append('farmerId', params.farmerId);
      if (q.toString()) url += `?${q.toString()}`;

      const res = await apiFetch<any[]>(url);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = autoResolveExpiredAuctions(res.data.map(mapDbAuction));
        auctionsCache = mapped;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)).catch(() => {});
        return mapped;
      }
    } catch (e) {
      console.warn('[AuctionService] getAuctions network error:', e);
    }

    auctionsCache = autoResolveExpiredAuctions(auctionsCache);
    let filtered = [...auctionsCache];
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    if (params?.farmerId) {
      filtered = filtered.filter((a) => a.farmerId === params.farmerId);
    }
    return filtered;
  },

  async getAuctionById(id: string): Promise<AuctionItem | null> {
    try {
      const res = await apiFetch<any>(`/auctions/${id}`);
      if (res.data) {
        return mapDbAuction(res.data);
      }
    } catch {}

    const found = auctionsCache.find((a) => a.id === id || a._id === id);
    return found || null;
  },

  async placeBid(auctionId: string, bidAmountPerKg: number): Promise<AuctionItem> {
    const user = await getStoredUser();
    const bidderId = user?.id || user?._id || 'buyer-sunil';
    const bidderName = user?.fullName || (user as any)?.name || 'Sunil Dissanayake';

    const targetIdx = auctionsCache.findIndex((a) => a.id === auctionId || a._id === auctionId);
    const target = targetIdx !== -1 ? auctionsCache[targetIdx] : null;
    const apiId = target?._id || target?.id || auctionId;

    try {
      const res = await apiFetch<any>(`/auctions/${apiId}/bid`, {
        method: 'POST',
        body: JSON.stringify({
          bidderId,
          bidderName,
          bidAmountPerKg,
        }),
      });

      if (res.data) {
        const updated = mapDbAuction(res.data);
        const idx = auctionsCache.findIndex((a) => a.id === auctionId || a._id === auctionId || a.id === updated.id);
        if (idx !== -1) {
          auctionsCache[idx] = updated;
        } else {
          auctionsCache.unshift(updated);
        }
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auctionsCache)).catch(() => {});
        sendLocalNotification(
          '🔨 Bid Placed Successfully',
          `Your bid of Rs. ${bidAmountPerKg}/kg on ${updated.cropName} was placed!`,
          { auctionId, bidAmountPerKg }
        ).catch(() => {});
        return updated;
      }
    } catch (e: any) {
      console.warn('[AuctionService] placeBid network error, executing locally:', e);
    }

    const idx = auctionsCache.findIndex((a) => a.id === auctionId || a._id === auctionId);
    if (idx !== -1) {
      const current = auctionsCache[idx];
      if (bidAmountPerKg <= current.currentBidPerKg) {
        throw new Error(`Bid must be higher than current bid (Rs. ${current.currentBidPerKg})`);
      }

      const totalLotAmount = bidAmountPerKg * current.lotSizeKg;
      const newBid: BidRecord = {
        bidderId,
        bidderName,
        bidAmountPerKg,
        totalLotAmount,
        timestamp: new Date().toISOString(),
      };

      // Anti-sniping: extend timer if less than 2 mins remaining
      const endTimestamp = new Date(current.endTime).getTime();
      const timeLeft = endTimestamp - Date.now();
      let updatedEndTime = current.endTime;
      if (timeLeft > 0 && timeLeft < 2 * 60 * 1000) {
        updatedEndTime = new Date(endTimestamp + 3 * 60 * 1000).toISOString();
      }

      current.currentBidPerKg = bidAmountPerKg;
      current.highestBidderId = bidderId;
      current.highestBidderName = bidderName;
      current.bidsCount = (current.bidsCount || 0) + 1;
      current.bids = [newBid, ...(current.bids || [])];
      current.endTime = updatedEndTime;

      auctionsCache[idx] = { ...current };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auctionsCache)).catch(() => {});
      return auctionsCache[idx];
    }

    throw new Error('Auction not found');
  },

  async finalizeWonAuction(auctionId: string, stripePaymentIntentId: string): Promise<AuctionItem> {
    const targetIdx = auctionsCache.findIndex((a) => a.id === auctionId || a._id === auctionId);
    const target = targetIdx !== -1 ? auctionsCache[targetIdx] : null;
    const apiId = target?._id || target?.id || auctionId;

    try {
      const res = await apiFetch<any>(`/auctions/${apiId}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ stripePaymentIntentId }),
      });
      if (res.data) {
        const updated = mapDbAuction(res.data);
        const idx = auctionsCache.findIndex((a) => a.id === auctionId || a._id === auctionId || a.id === updated.id);
        if (idx !== -1) auctionsCache[idx] = updated;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auctionsCache)).catch(() => {});
        return updated;
      }
    } catch {}

    const idx = auctionsCache.findIndex((a) => a.id === auctionId || a._id === auctionId);
    if (idx !== -1) {
      auctionsCache[idx].status = 'paid';
      auctionsCache[idx].stripePaymentIntentId = stripePaymentIntentId;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auctionsCache)).catch(() => {});
      return auctionsCache[idx];
    }

    throw new Error('Auction not found');
  },

  async createAuction(data: Partial<AuctionItem>): Promise<AuctionItem> {
    const user = await getStoredUser();
    const payload = {
      ...data,
      farmerId: data.farmerId || user?.id || user?._id || 'farmer-1',
      farmerName: data.farmerName || user?.fullName || (user as any)?.name || 'Kamal Gunawardana',
      farmerAvatar: data.farmerAvatar || user?.avatarUrl || (user as any)?.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
      farmerFarm: data.farmerFarm || (user as any)?.farmName || 'Green Haven Organics',
    };

    try {
      const res = await apiFetch<any>('/auctions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.data) {
        const created = mapDbAuction(res.data);
        auctionsCache = [created, ...auctionsCache];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auctionsCache)).catch(() => {});
        return created;
      }
    } catch (e) {
      console.warn('[AuctionService] createAuction network error, saving locally:', e);
    }

    const localItem: AuctionItem = {
      id: `auc-${Date.now()}`,
      farmerId: payload.farmerId,
      farmerName: payload.farmerName,
      farmerAvatar: payload.farmerAvatar,
      farmerFarm: payload.farmerFarm,
      cropName: payload.cropName || 'Fresh Produce Lot',
      variety: payload.variety || 'Special',
      grade: payload.grade || 'Grade A',
      lotSizeKg: payload.lotSizeKg || 500,
      unit: payload.unit || 'kg',
      image: payload.image || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&fit=crop',
      startingPricePerKg: payload.startingPricePerKg || 100,
      reservePricePerKg: payload.reservePricePerKg || 120,
      minBidIncrement: payload.minBidIncrement || 5,
      currentBidPerKg: payload.startingPricePerKg || 100,
      bidsCount: 0,
      bids: [],
      startTime: new Date().toISOString(),
      endTime: payload.endTime || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'live',
      locationDistrict: payload.locationDistrict || 'Dambulla',
      description: payload.description || '',
    };

    auctionsCache = [localItem, ...auctionsCache];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auctionsCache)).catch(() => {});
    return localItem;
  },
};
