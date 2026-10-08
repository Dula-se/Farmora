import { Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { ProduceModel } from '../models/Produce.js';
import { AuctionModel } from '../models/Auction.js';
import { HarvestModel } from '../models/Harvest.js';
import { OrderModel } from '../models/Order.js';
import { WishlistModel } from '../models/Wishlist.js';
import { NotificationModel } from '../models/Notification.js';
import { OtpModel } from '../models/Otp.js';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { StorageService } from '../services/storage.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
  pushToken: z.string().optional(),
});

function sanitizeUser(user: any) {
  if (typeof user.toJSON === 'function') {
    return user.toJSON();
  }
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function deleteUserAccountAndData(userId: string): Promise<boolean> {
  const user = await UserModel.findById(userId);
  if (!user) {
    return false;
  }

  const userPhone = user.mobileNumber;
  const userEmail = user.email;
  const identifiers = [userPhone, userEmail].filter(Boolean) as string[];

  await Promise.allSettled([
    ProduceModel.deleteMany({ farmerId: userId }),
    AuctionModel.deleteMany({ sellerId: userId }),
    AuctionModel.updateMany({ 'bids.bidderId': userId }, { $pull: { bids: { bidderId: userId } } }),
    HarvestModel.deleteMany({ farmerId: userId }),
    OrderModel.deleteMany({ $or: [{ buyerId: userId }, { farmerId: userId }] }),
    WishlistModel.deleteMany({ userId }),
    NotificationModel.deleteMany({ userId }),
    identifiers.length ? OtpModel.deleteMany({ identifier: { $in: identifiers } }) : Promise.resolve(),
    MessageModel.deleteMany({ senderId: userId }),
    ConversationModel.deleteMany({ participants: userId }),
  ]);

  await UserModel.findByIdAndDelete(userId);
  return true;
}

export class UserController {
  /**
   * Get public profile of a user (farmer or buyer)
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const user = await UserModel.findById(id);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, sanitizeUser(user));
    } catch (err) {
      console.error('Get user profile error:', err);
      return sendError(res, 'Failed to fetch user profile', 500);
    }
  }

  /**
   * Update profile information
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;

      const updated = await UserModel.findByIdAndUpdate(userId, req.body, { new: true });

      if (!updated) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, sanitizeUser(updated), 'Profile updated successfully');
    } catch (err) {
      console.error('Update profile error:', err);
      return sendError(res, 'Failed to update profile', 500);
    }
  }

  /**
   * Upload and update user avatar image
   */
  static async uploadAvatar(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;

      if (!req.file) {
        return sendError(res, 'No avatar image file was provided.', 400);
      }

      const fileData = await StorageService.processUploadedFile(req.file, 'avatars');

      // Update user avatar in DB
      const updated = await UserModel.findByIdAndUpdate(
        userId,
        { avatarUrl: fileData.url },
        { new: true }
      );

      return sendSuccess(
        res,
        {
          user: sanitizeUser(updated),
          avatar: fileData,
        },
        'Profile picture updated successfully!'
      );
    } catch (err) {
      console.error('Upload avatar error:', err);
      return sendError(res, 'Failed to upload profile picture', 500);
    }
  }

  /**
   * Delete authenticated user's profile and account
   */
  static async deleteProfile(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id?.toString() || user.id?.toString();

      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const deleted = await deleteUserAccountAndData(userId);
      if (!deleted) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, null, 'User profile and all associated data permanently deleted.');
    } catch (err) {
      console.error('Delete user profile error:', err);
      return sendError(res, 'Failed to delete user profile', 500);
    }
  }

  /**
   * Delete user by ID (authenticated user can delete self)
   */
  static async deleteById(req: Request, res: Response) {
    try {
      const user = req.user!;
      const authUserId = (user as any)._id?.toString() || user.id?.toString();
      const targetId = req.params.id as string;

      if (!authUserId || authUserId !== targetId) {
        return sendError(res, 'Forbidden: You can only delete your own profile', 403);
      }

      const deleted = await deleteUserAccountAndData(targetId);
      if (!deleted) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, null, 'User profile permanently deleted.');
    } catch (err) {
      console.error('Delete user by id error:', err);
      return sendError(res, 'Failed to delete user', 500);
    }
  }
}

