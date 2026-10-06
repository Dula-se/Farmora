import { Request, Response } from 'express';
import { WishlistModel } from '../models/Wishlist.js';
import { ProduceModel } from '../models/Produce.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class WishlistController {
  /**
   * Get all wishlist items for current authenticated user
   */
  static async getWishlist(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;

      const items = await WishlistModel.find({ userId })
        .populate('produceId')
        .sort({ createdAt: -1 });

      const formatted = items
        .filter((item) => item.produceId != null)
        .map((item) => {
          const produceDoc = item.produceId as any;
          return {
            id: item.id,
            produceId: produceDoc._id || produceDoc.id,
            produce: produceDoc,
            createdAt: item.createdAt,
          };
        });

      return sendSuccess(res, formatted, 'Wishlist items retrieved successfully', 200, {
        total: formatted.length,
      });
    } catch (err) {
      console.error('Get wishlist error:', err);
      return sendError(res, 'Failed to fetch wishlist', 500);
    }
  }

  /**
   * Toggle item in wishlist (Add if not exists, Remove if exists)
   */
  static async toggle(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;
      const { produceId } = req.body;

      if (!produceId) {
        return sendError(res, 'produceId is required', 400);
      }

      const produce = await ProduceModel.findById(produceId);
      if (!produce) {
        return sendError(res, 'Produce item not found', 404);
      }

      const existing = await WishlistModel.findOne({ userId, produceId });

      if (existing) {
        await WishlistModel.findByIdAndDelete(existing._id);
        return sendSuccess(res, { isWishlisted: false }, 'Removed from wishlist');
      } else {
        await WishlistModel.create({ userId, produceId });
        return sendSuccess(res, { isWishlisted: true }, 'Added to wishlist', 201);
      }
    } catch (err) {
      console.error('Toggle wishlist error:', err);
      return sendError(res, 'Failed to update wishlist', 500);
    }
  }

  /**
   * Check if a specific produce item is wishlisted by the user
   */
  static async checkStatus(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;
      const { produceId } = req.params;

      const existing = await WishlistModel.findOne({ userId, produceId });
      return sendSuccess(res, { isWishlisted: Boolean(existing) });
    } catch (err) {
      console.error('Check wishlist status error:', err);
      return sendError(res, 'Failed to check wishlist status', 500);
    }
  }

  /**
   * Remove item from wishlist by produceId
   */
  static async remove(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;
      const { produceId } = req.params;

      await WishlistModel.findOneAndDelete({ userId, produceId });
      return sendSuccess(res, { isWishlisted: false }, 'Item removed from wishlist');
    } catch (err) {
      console.error('Remove wishlist error:', err);
      return sendError(res, 'Failed to remove from wishlist', 500);
    }
  }
}
