import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../models/mockDb.js';
import { StorageService } from '../services/storage.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export class UserController {
  /**
   * Get public profile of a user (farmer or buyer)
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const user = await db.findUserById(id);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      const { passwordHash: _, ...publicProfile } = user;
      return sendSuccess(res, publicProfile);
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
      const updated = await db.updateUser(user.id, req.body);

      if (!updated) {
        return sendError(res, 'User not found', 404);
      }

      const { passwordHash: _, ...safeUser } = updated;
      return sendSuccess(res, safeUser, 'Profile updated successfully');
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

      if (!req.file) {
        return sendError(res, 'No avatar image file was provided.', 400);
      }

      const fileData = await StorageService.processUploadedFile(req.file, 'avatars');

      // Update user avatar in DB
      const updated = await db.updateUser(user.id, {
        avatarUrl: fileData.url,
      });


      const { passwordHash: _, ...safeUser } = updated!;
      return sendSuccess(
        res,
        {
          user: safeUser,
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
