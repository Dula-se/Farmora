import { Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { StorageService } from '../services/storage.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  pushToken: z.string().optional(),
});

function sanitizeUser(user: any) {
  if (typeof user.toJSON === 'function') {
    return user.toJSON();
  }
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
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
}
