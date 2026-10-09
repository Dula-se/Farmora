import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';

const router = Router();

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/mark-all-read', NotificationController.markAllRead);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/', NotificationController.sendNotification);

export default router;
