import { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification.js';
import { UserModel } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Send remote Expo push notification if user has registered a pushToken
async function sendExpoPushNotification(token: string, title: string, body: string, data?: any) {
  if (!token) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }),
    });
  } catch (err) {
    console.warn('[Push] Push notification send error:', err);
  }
}

export class NotificationController {
  /**
   * Internal helper to create a notification and send remote push notification
   */
  static async createNotification(params: {
    userId: string;
    title: string;
    description: string;
    type?: 'order' | 'bid' | 'price' | 'message' | 'system';
    data?: Record<string, any>;
    actionLabel?: string;
    actionRoute?: string;
  }) {
    try {
      const notif = await NotificationModel.create({
        userId: String(params.userId),
        title: params.title,
        description: params.description,
        type: params.type || 'system',
        data: params.data || {},
        actionLabel: params.actionLabel || '',
        actionRoute: params.actionRoute || '',
        isRead: false,
      });

      // Look up user to check for pushToken
      const user = await UserModel.findById(params.userId).select('pushToken');
      if (user?.pushToken) {
        sendExpoPushNotification(user.pushToken, params.title, params.description, params.data);
      }

      return notif;
    } catch (err) {
      console.error('[NotificationController] createNotification error:', err);
      return null;
    }
  }

  /**
   * Internal helper to notify all registered buyers (e.g. for new auction bids)
   */
  static async notifyAllBuyers(params: {
    title: string;
    description: string;
    excludeUserId?: string;
    data?: Record<string, any>;
    actionLabel?: string;
    actionRoute?: string;
  }) {
    try {
      const buyers = await UserModel.find({
        accountType: 'buyer',
        ...(params.excludeUserId ? { _id: { $ne: params.excludeUserId } } : {}),
      }).select('_id pushToken');

      const notifsToInsert = buyers.map((b) => ({
        userId: b._id.toString(),
        title: params.title,
        description: params.description,
        type: 'bid' as const,
        data: params.data || {},
        actionLabel: params.actionLabel || 'View Auction',
        actionRoute: params.actionRoute || 'auction',
        isRead: false,
      }));

      if (notifsToInsert.length > 0) {
        await NotificationModel.insertMany(notifsToInsert);
      }

      // Fire push notifications concurrently to buyers with push tokens
      buyers.forEach((b) => {
        if (b.pushToken) {
          sendExpoPushNotification(b.pushToken, params.title, params.description, params.data);
        }
      });
    } catch (err) {
      console.error('[NotificationController] notifyAllBuyers error:', err);
    }
  }

  /**
   * Get notifications for a user (by userId or comma-separated userIds)
   */
  static async getNotifications(req: Request, res: Response) {
    try {
      const { userId, userIds } = req.query;
      let queryIds: string[] = [];

      if (userIds && typeof userIds === 'string') {
        queryIds = userIds.split(',').map((id) => id.trim()).filter(Boolean);
      } else if (userId && typeof userId === 'string') {
        queryIds = [userId.trim()];
      }

      if (queryIds.length === 0) {
        return sendError(res, 'userId or userIds parameter is required.', 400);
      }

      const notifs = await NotificationModel.find({
        userId: { $in: queryIds },
      }).sort({ createdAt: -1 }).limit(50);

      const mapped = notifs.map((n) => ({
        id: n._id.toString(),
        userId: n.userId,
        type: n.type,
        title: n.title,
        description: n.description,
        timestamp: NotificationController.formatTimestamp(n.createdAt),
        createdAt: n.createdAt.toISOString(),
        isRead: n.isRead,
        actionLabel: n.actionLabel,
        actionRoute: n.actionRoute,
        data: n.data,
      }));

      return sendSuccess(res, mapped, 'Notifications loaded successfully.');
    } catch (err: any) {
      console.error('[NotificationController] getNotifications error:', err);
      return sendError(res, err.message || 'Could not load notifications.', 500);
    }
  }

  /**
   * Get unread notifications count for a user
   */
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== 'string') {
        return sendError(res, 'userId parameter is required.', 400);
      }

      const count = await NotificationModel.countDocuments({
        userId: userId.trim(),
        isRead: false,
      });

      return sendSuccess(res, { count }, 'Unread count fetched.');
    } catch (err: any) {
      console.error('[NotificationController] getUnreadCount error:', err);
      return sendError(res, err.message || 'Could not fetch unread count.', 500);
    }
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const notif = await NotificationModel.findByIdAndUpdate(
        id,
        { $set: { isRead: true } },
        { new: true }
      );

      if (!notif) {
        return sendError(res, 'Notification not found.', 404);
      }

      return sendSuccess(res, { id: notif._id }, 'Notification marked as read.');
    } catch (err: any) {
      console.error('[NotificationController] markAsRead error:', err);
      return sendError(res, err.message || 'Could not mark notification as read.', 500);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllRead(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return sendError(res, 'userId is required.', 400);
      }

      await NotificationModel.updateMany(
        { userId: String(userId), isRead: false },
        { $set: { isRead: true } }
      );

      return sendSuccess(res, { success: true }, 'All notifications marked as read.');
    } catch (err: any) {
      console.error('[NotificationController] markAllRead error:', err);
      return sendError(res, err.message || 'Could not mark all notifications as read.', 500);
    }
  }

  /**
   * Create notification endpoint for direct frontend or testing dispatch
   */
  static async sendNotification(req: Request, res: Response) {
    try {
      const { userId, title, description, type, data, actionLabel, actionRoute } = req.body;

      if (!userId || !title || !description) {
        return sendError(res, 'userId, title, and description are required.', 400);
      }

      const notif = await NotificationController.createNotification({
        userId,
        title,
        description,
        type,
        data,
        actionLabel,
        actionRoute,
      });

      return sendSuccess(res, notif, 'Notification created successfully.');
    } catch (err: any) {
      console.error('[NotificationController] sendNotification error:', err);
      return sendError(res, err.message || 'Could not send notification.', 500);
    }
  }

  /**
   * Helper to format relative human-readable timestamp
   */
  private static formatTimestamp(date: Date): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
