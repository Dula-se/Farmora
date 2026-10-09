import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';

const router = Router();

router.get('/conversations', ChatController.getConversations);
router.post('/conversations', ChatController.getOrCreateConversation);
router.get('/conversations/:conversationId', ChatController.getConversationById);
router.patch('/conversations/:conversationId/read', ChatController.markAsRead);
router.get('/conversations/:conversationId/messages', ChatController.getMessages);
router.post('/conversations/:conversationId/messages', ChatController.sendMessage);
router.patch('/conversations/:conversationId/messages/:messageId', ChatController.editMessage);
router.delete('/conversations/:conversationId/messages/:messageId', ChatController.deleteMessage);

export default router;

