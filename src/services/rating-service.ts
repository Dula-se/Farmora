/**
 * rating-service.ts
 *
 * Real persistent Rating & Review service for Farmers and Buyers using Firebase Firestore
 * with offline local storage caching and update/delete capabilities.
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebase';

export interface RatingReview {
  id: string;
  targetId: string;
  targetName?: string;
  targetRole: 'farmer' | 'buyer';
  authorId: string;
  authorName: string;
  authorRole: 'buyer' | 'farmer';
  authorAvatar?: string;
  overallRating: number;
  criteriaRatings?: {
    quality?: number;
    freshness?: number;
    packaging?: number;
    communication?: number;
    paymentPromptness?: number;
  };
  tags?: string[];
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
  helpfulCount?: number;
}

const LOCAL_REVIEWS_KEY = '@famora_local_reviews_v1';

// Seed reviews for demo/fallback realism
const SEED_REVIEWS: RatingReview[] = [
  {
    id: 'seed_r1',
    targetId: 'farmer-kusuma',
    targetName: 'Kusuma Bandara',
    targetRole: 'farmer',
    authorId: 'seed_author_1',
    authorName: 'Chinthaka Perera',
    authorRole: 'buyer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    overallRating: 5,
    criteriaRatings: { quality: 5, freshness: 5, packaging: 5, communication: 4 },
    tags: ['Crisp & Fresh', 'Accurate Grading', 'Well Packaged'],
    comment: 'Harvest was crisp and sweet. Arrived washed and sorted in ventilated wooden crates. Zero bruising.',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    helpfulCount: 14,
  },
  {
    id: 'seed_r2',
    targetId: 'farmer-kusuma',
    targetName: 'Kusuma Bandara',
    targetRole: 'farmer',
    authorId: 'seed_author_2',
    authorName: 'Dilshan Wickramasinghe',
    authorRole: 'buyer',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    overallRating: 5,
    criteriaRatings: { quality: 5, freshness: 5, packaging: 4, communication: 5 },
    tags: ['Fair Pricing', 'Responsive Farmer'],
    comment: 'Getting 200kg straight from Welimada plots at guaranteed direct farm gate rates is a game changer.',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    helpfulCount: 9,
  },
  {
    id: 'seed_r3',
    targetId: 'buyer-sunil',
    targetName: 'Sunil Dissanayake',
    targetRole: 'buyer',
    authorId: 'seed_farmer_1',
    authorName: 'Kamal Gunawardana',
    authorRole: 'farmer',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    overallRating: 5,
    criteriaRatings: { paymentPromptness: 5, communication: 5 },
    tags: ['Prompt Payment', 'Smooth Pickup'],
    comment: 'Payment was cleared immediately upon crate inspection. Very reliable commercial partner.',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    helpfulCount: 6,
  },
];

async function getStoredLocalReviews(): Promise<RatingReview[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveStoredLocalReviews(reviews: RatingReview[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
  } catch {}
}

export const RatingService = {
  /**
   * Fetch all reviews for a specific target (farmer or buyer).
   * Supports matching by ID aliases (e.g. mongo id, slug, custom id) as well as by farmer/buyer name.
   */
  async fetchReviewsForTarget(
    targetIdOrIds: string | string[],
    targetName?: string
  ): Promise<RatingReview[]> {
    const resultsMap = new Map<string, RatingReview>();

    const rawIds = Array.isArray(targetIdOrIds) ? targetIdOrIds : [targetIdOrIds];
    const targetIds = rawIds.filter(Boolean);
    const normTargetName = targetName?.trim().toLowerCase();

    let deletedIds: string[] = [];
    try {
      const rawDeleted = await AsyncStorage.getItem('@famora_deleted_reviews_v1');
      if (rawDeleted) deletedIds = JSON.parse(rawDeleted);
    } catch {}

    const matchesTarget = (r: RatingReview) => {
      if (deletedIds.includes(r.id)) return false;
      // 1. Direct ID match or case-insensitive slug match
      if (targetIds.some((tid) => tid === r.targetId || (r.targetId && tid.toLowerCase() === r.targetId.toLowerCase()))) {
        return true;
      }
      // 2. Name match (case-insensitive)
      if (normTargetName && r.targetName && r.targetName.trim().toLowerCase() === normTargetName) {
        return true;
      }
      return false;
    };

    // 1. Add matching seed reviews
    SEED_REVIEWS.filter(matchesTarget).forEach((r) => {
      resultsMap.set(r.id, r);
    });

    // 2. Add local storage reviews (offline instant cache)
    const local = await getStoredLocalReviews();
    local.filter(matchesTarget).forEach((r) => {
      resultsMap.set(r.id, r);
    });

    // 3. Fetch from Firestore reviews collection
    try {
      const reviewsCol = collection(db, 'reviews');
      const snap = await getDocs(reviewsCol);
      snap.forEach((d) => {
        if (deletedIds.includes(d.id)) return;
        const data = d.data();
        const createdAt =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt || new Date().toISOString();

        const revItem: RatingReview = {
          id: d.id,
          targetId: data.targetId,
          targetName: data.targetName,
          targetRole: data.targetRole || 'farmer',
          authorId: data.authorId,
          authorName: data.authorName || 'User',
          authorRole: data.authorRole || 'buyer',
          authorAvatar: data.authorAvatar || '',
          overallRating: data.overallRating || 5,
          criteriaRatings: data.criteriaRatings || {},
          tags: data.tags || [],
          comment: data.comment || '',
          images: data.images || [],
          createdAt,
          updatedAt: data.updatedAt,
          helpfulCount: data.helpfulCount || 0,
        };

        if (matchesTarget(revItem)) {
          resultsMap.set(d.id, revItem);
        }
      });
    } catch (e) {
      // Offline fallback
    }

    const arr = Array.from(resultsMap.values());
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return arr;
  },

  /**
   * Get user's own review for a target, if already rated.
   */
  async getMyReviewForTarget(
    authorId: string,
    targetId: string | string[],
    targetName?: string
  ): Promise<RatingReview | null> {
    if (!authorId) return null;
    const all = await this.fetchReviewsForTarget(targetId, targetName);
    return all.find((r) => r.authorId === authorId) || null;
  },

  /**
   * Submit a new rating & review.
   */
  async submitReview(review: Omit<RatingReview, 'id' | 'createdAt'>): Promise<RatingReview> {
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newRev: RatingReview = {
      ...review,
      id,
      createdAt: now,
      updatedAt: now,
      helpfulCount: 0,
    };

    // 1. Save locally for instant offline availability
    const local = await getStoredLocalReviews();
    const updatedLocal = [newRev, ...local.filter((r) => r.id !== id)];
    await saveStoredLocalReviews(updatedLocal);

    // 2. Persist to Firestore
    try {
      const docRef = doc(db, 'reviews', id);
      await setDoc(docRef, {
        ...newRev,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[RatingService] Firestore submit error (saved locally):', err);
    }

    return newRev;
  },

  /**
   * Update an existing rating & review.
   */
  async updateReview(
    reviewId: string,
    updates: Partial<Omit<RatingReview, 'id' | 'authorId' | 'targetId' | 'createdAt'>>
  ): Promise<RatingReview> {
    const now = new Date().toISOString();

    // 1. Update in local storage
    const local = await getStoredLocalReviews();
    let updatedItem: RatingReview | null = null;
    const nextLocal = local.map((r) => {
      if (r.id === reviewId) {
        updatedItem = { ...r, ...updates, updatedAt: now };
        return updatedItem;
      }
      return r;
    });

    if (updatedItem) {
      await saveStoredLocalReviews(nextLocal);
    }

    // 2. Update in Firestore
    try {
      const docRef = doc(db, 'reviews', reviewId);
      await setDoc(
        docRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[RatingService] Firestore update error:', err);
    }

    return (
      updatedItem || {
        id: reviewId,
        targetId: '',
        targetRole: 'farmer',
        authorId: '',
        authorName: '',
        authorRole: 'buyer',
        overallRating: 5,
        comment: '',
        createdAt: now,
        ...updates,
      }
    );
  },

  /**
   * Delete an existing rating & review.
   */
  async deleteReview(reviewId: string): Promise<void> {
    // 1. Remove from local storage
    const local = await getStoredLocalReviews();
    const filtered = local.filter((r) => r.id !== reviewId);
    await saveStoredLocalReviews(filtered);

    // Save into deleted keys set so deleted seed/server reviews do not resurface
    try {
      const rawDeleted = await AsyncStorage.getItem('@famora_deleted_reviews_v1');
      const deletedSet: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!deletedSet.includes(reviewId)) {
        deletedSet.push(reviewId);
        await AsyncStorage.setItem('@famora_deleted_reviews_v1', JSON.stringify(deletedSet));
      }
    } catch {}

    // 2. Remove from Firestore
    try {
      const docRef = doc(db, 'reviews', reviewId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[RatingService] Firestore delete error:', err);
    }
  },

  /**
   * Fetch all reviews written by a specific author.
   */
  async fetchReviewsByAuthor(authorId: string): Promise<RatingReview[]> {
    if (!authorId) return [];
    const resultsMap = new Map<string, RatingReview>();

    let deletedIds: string[] = [];
    try {
      const rawDeleted = await AsyncStorage.getItem('@famora_deleted_reviews_v1');
      if (rawDeleted) deletedIds = JSON.parse(rawDeleted);
    } catch {}

    // 1. Match seed reviews
    SEED_REVIEWS.filter((r) => r.authorId === authorId && !deletedIds.includes(r.id)).forEach((r) => {
      resultsMap.set(r.id, r);
    });

    // 2. Match local storage reviews
    const local = await getStoredLocalReviews();
    local.filter((r) => r.authorId === authorId && !deletedIds.includes(r.id)).forEach((r) => {
      resultsMap.set(r.id, r);
    });

    // 3. Firestore query
    try {
      const q = query(collection(db, 'reviews'), where('authorId', '==', authorId));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        if (deletedIds.includes(d.id)) return;
        const data = d.data();
        const createdAt =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt || new Date().toISOString();

        resultsMap.set(d.id, {
          id: d.id,
          targetId: data.targetId,
          targetName: data.targetName,
          targetRole: data.targetRole || 'farmer',
          authorId: data.authorId,
          authorName: data.authorName || 'User',
          authorRole: data.authorRole || 'buyer',
          authorAvatar: data.authorAvatar || '',
          overallRating: data.overallRating || 5,
          criteriaRatings: data.criteriaRatings || {},
          tags: data.tags || [],
          comment: data.comment || '',
          images: data.images || [],
          createdAt,
          updatedAt: data.updatedAt,
          helpfulCount: data.helpfulCount || 0,
        });
      });
    } catch (e) {
      // offline fallback
    }

    const arr = Array.from(resultsMap.values());
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return arr;
  },

  /**
   * Compute average score and count.
   */
  computeStats(reviews: RatingReview[]): { average: number; count: number } {
    if (reviews.length === 0) return { average: 5.0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (r.overallRating || 5), 0);
    return {
      average: Number((sum / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  },
};
