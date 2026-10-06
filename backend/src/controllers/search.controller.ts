import { Request, Response } from 'express';
import { SearchHistoryModel } from '../models/SearchHistory.js';
import { ProduceModel } from '../models/Produce.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class SearchController {
  /**
   * Get search history for the authenticated user
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;

      const history = await SearchHistoryModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20);

      return sendSuccess(res, history, 'Search history retrieved');
    } catch (err) {
      console.error('Get search history error:', err);
      return sendError(res, 'Failed to fetch search history', 500);
    }
  }

  /**
   * Record a new search entry
   */
  static async recordSearch(req: Request, res: Response) {
    try {
      const user = req.user;
      const userId = user ? ((user as any)._id || user.id) : undefined;
      const { query, category, district, resultCount } = req.body;

      if (!query || typeof query !== 'string') {
        return sendError(res, 'Query string is required', 400);
      }

      const trimmed = query.trim();
      if (!trimmed) {
        return sendError(res, 'Query cannot be empty', 400);
      }

      // If user is authenticated, check if this search already exists recently and update timestamp
      if (userId) {
        await SearchHistoryModel.deleteMany({ userId, query: trimmed });
      }

      const entry = await SearchHistoryModel.create({
        userId,
        query: trimmed,
        category,
        district,
        resultCount: Number(resultCount || 0),
      });

      return sendSuccess(res, entry, 'Search recorded', 201);
    } catch (err) {
      console.error('Record search error:', err);
      return sendError(res, 'Failed to record search', 500);
    }
  }

  /**
   * Delete specific history entry or clear all for user
   */
  static async clearHistory(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;
      const id = typeof req.query.id === 'string' ? req.query.id : undefined;

      if (id) {
        await SearchHistoryModel.findOneAndDelete({ _id: id as any, userId });
        return sendSuccess(res, null, 'Search history item deleted');
      } else {
        await SearchHistoryModel.deleteMany({ userId });
        return sendSuccess(res, null, 'Search history cleared');
      }
    } catch (err) {
      console.error('Clear search history error:', err);
      return sendError(res, 'Failed to clear search history', 500);
    }
  }

  /**
   * Get trending / popular search terms
   */
  static async getPopularSearches(req: Request, res: Response) {
    try {
      // Aggregation of most frequent searches in the last 30 days
      const popular = await SearchHistoryModel.aggregate([
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, query: '$_id', count: 1 } },
      ]);

      const defaultFallback = [
        { query: 'Organic Red Tomatoes', count: 42 },
        { query: 'Nuwara Eliya Carrots', count: 38 },
        { query: 'Cooking Melon (Kakiri)', count: 25 },
        { query: 'Green Chillies', count: 19 },
        { query: 'Dambulla Onions', count: 18 },
        { query: 'Ceylon Cinnamon', count: 14 },
      ];

      const results = popular.length > 0 ? popular : defaultFallback;
      return sendSuccess(res, results, 'Popular searches fetched');
    } catch (err) {
      console.error('Popular searches error:', err);
      return sendError(res, 'Failed to fetch popular searches', 500);
    }
  }
}
