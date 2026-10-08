/**
 * wishlist-service.ts
 *
 * Unified, persistent Wishlist service with 0ms AsyncStorage caching,
 * real-time cross-screen synchronization, and backend API integration.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWishlist, toggleWishlist as apiToggleWishlist, ApiProduceItem } from './api';

export interface WishlistItem {
  id: string;
  produceId: string;
  title: string;
  pricePerUnit: number;
  unit: string;
  farmerName: string;
  locationCity?: string;
  image: string;
  inStock: boolean;
  category?: string;
  organic?: boolean;
  addedAt?: string;
}

const STORAGE_KEY = '@famora_wishlist_items_v3';

type WishlistListener = (items: WishlistItem[]) => void;
const listeners = new Set<WishlistListener>();

function notifyListeners(items: WishlistItem[]) {
  listeners.forEach((listener) => {
    try {
      listener(items);
    } catch (e) {
      console.warn('[WishlistService] listener error:', e);
    }
  });
}

async function getStoredWishlist(): Promise<WishlistItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveStoredWishlist(items: WishlistItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    notifyListeners(items);
  } catch (e) {
    console.warn('[WishlistService] failed to save to storage:', e);
  }
}

export const WishlistService = {
  /**
   * Subscribe to wishlist changes across screens.
   */
  subscribe(listener: WishlistListener): () => void {
    listeners.add(listener);
    // Immediately emit current state
    getStoredWishlist().then(listener).catch(() => {});
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Get all wishlist items (local storage first, then background backend sync).
   */
  async getWishlist(): Promise<WishlistItem[]> {
    const local = await getStoredWishlist();

    // Background sync with backend
    fetchWishlist()
      .then((liveItems) => {
        if (Array.isArray(liveItems)) {
          const remoteMapped: WishlistItem[] = liveItems.map((wi: any) => {
            const p = wi.produce || {};
            const pId = String(wi.produceId || p.id || p._id || wi.id);
            return {
              id: String(wi.id || pId),
              produceId: pId,
              title: p.title || 'Fresh Crop',
              pricePerUnit: p.pricePerUnit || 250,
              unit: p.unit || 'kg',
              farmerName: p.farmerName || 'Local Farmer',
              locationCity: p.locationCity || 'Central Province',
              image:
                p.images?.[0] ||
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80',
              inStock: (p.availableQuantity || 0) > 0,
              category: p.category || 'vegetables',
              organic: Boolean(p.isOrganic),
              addedAt: wi.createdAt || new Date().toISOString(),
            };
          });

          // If backend has items, merge them with local items
          if (remoteMapped.length > 0) {
            const map = new Map<string, WishlistItem>();
            remoteMapped.forEach((item) => map.set(item.produceId, item));
            local.forEach((item) => map.set(item.produceId, item));
            const merged = Array.from(map.values());
            saveStoredWishlist(merged);
          }
        }
      })
      .catch(() => {
        // Offline / unauthenticated fallback: local storage remains authority
      });

    return local;
  },

  /**
   * Check if a specific produce item is in the wishlist.
   */
  async isWishlisted(produceId: string): Promise<boolean> {
    if (!produceId) return false;
    const items = await getStoredWishlist();
    const target = String(produceId).trim();
    return items.some(
      (item) => item.produceId === target || item.id === target
    );
  },

  /**
   * Toggle an item in the wishlist.
   */
  async toggleWishlist(
    product: ApiProduceItem | WishlistItem | any
  ): Promise<{ isWishlisted: boolean; items: WishlistItem[] }> {
    const pId = String(product.produceId || product.id || product._id || '').trim();
    if (!pId) {
      const current = await getStoredWishlist();
      return { isWishlisted: false, items: current };
    }

    const currentItems = await getStoredWishlist();
    const existingIndex = currentItems.findIndex(
      (it) => it.produceId === pId || it.id === pId
    );

    let updated: WishlistItem[];
    let isWishlisted: boolean;

    if (existingIndex >= 0) {
      // Remove from wishlist
      updated = currentItems.filter((_, idx) => idx !== existingIndex);
      isWishlisted = false;
    } else {
      // Add to wishlist
      const newItem: WishlistItem = {
        id: pId,
        produceId: pId,
        title: product.title || 'Fresh Crop',
        pricePerUnit: product.pricePerUnit || 200,
        unit: product.unit || 'kg',
        farmerName: product.farmerName || 'Verified Farmer',
        locationCity: product.locationCity || product.locationDistrict || 'Local Farm',
        image:
          (product.images && product.images[0]) ||
          product.image ||
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80',
        inStock: product.availableQuantity !== undefined ? product.availableQuantity > 0 : true,
        category: product.category || 'vegetables',
        organic: Boolean(product.isOrganic),
        addedAt: new Date().toISOString(),
      };
      updated = [newItem, ...currentItems];
      isWishlisted = true;
    }

    await saveStoredWishlist(updated);

    // Sync with backend asynchronously
    try {
      apiToggleWishlist(pId).catch(() => {});
    } catch {}

    return { isWishlisted, items: updated };
  },

  /**
   * Remove an item from the wishlist by ID.
   */
  async removeFromWishlist(produceId: string): Promise<WishlistItem[]> {
    const target = String(produceId).trim();
    const current = await getStoredWishlist();
    const updated = current.filter(
      (item) => item.produceId !== target && item.id !== target
    );
    await saveStoredWishlist(updated);

    try {
      apiToggleWishlist(target).catch(() => {});
    } catch {}

    return updated;
  },

  /**
   * Clear all wishlist items.
   */
  async clearWishlist(): Promise<void> {
    await saveStoredWishlist([]);
  },
};
