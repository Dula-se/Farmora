import { Request, Response } from 'express';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ChatController {
  /**
   * Get all conversations for a user (by userId, mobile, or email)
   */
  static async getConversations(req: Request, res: Response) {
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

      const conversations = await ConversationModel.find({
        participants: { $in: queryIds },
      }).sort({ updatedAt: -1 });

      const mapped = conversations.map((c) => ({
        id: c.conversationId,
        participants: c.participants,
        participantNames: Object.fromEntries(c.participantNames || new Map()),
        participantAvatars: Object.fromEntries(c.participantAvatars || new Map()),
        participantRoles: Object.fromEntries(c.participantRoles || new Map()),
        productTitle: c.productTitle || '',
        productImage: c.productImage || '',
        lastMessage: c.lastMessage || '',
        lastMessageTime: c.lastMessageTime || '',
        unreadCounts: Object.fromEntries(c.unreadCounts || new Map()),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));

      return sendSuccess(res, mapped, 'Conversations loaded successfully.');
    } catch (err: any) {
      console.error('[ChatController] getConversations error:', err);
      return sendError(res, err.message || 'Could not load conversations.', 500);
    }
  }

  /**
   * Get a single conversation by conversationId
   */
  static async getConversationById(req: Request, res: Response) {
    try {
      const conversationId = String(req.params.conversationId || '');
      if (!conversationId) {
        return sendError(res, 'conversationId parameter is required.', 400);
      }

      const c = await ConversationModel.findOne({ conversationId });
      if (!c) {
        return sendError(res, 'Conversation not found.', 404);
      }

      const mapped = {
        id: c.conversationId,
        participants: c.participants,
        participantNames: Object.fromEntries(c.participantNames || new Map()),
        participantAvatars: Object.fromEntries(c.participantAvatars || new Map()),
        participantRoles: Object.fromEntries(c.participantRoles || new Map()),
        productTitle: c.productTitle || '',
        productImage: c.productImage || '',
        lastMessage: c.lastMessage || '',
        lastMessageTime: c.lastMessageTime || '',
        unreadCounts: Object.fromEntries(c.unreadCounts || new Map()),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };

      return sendSuccess(res, mapped, 'Conversation loaded successfully.');
    } catch (err: any) {
      console.error('[ChatController] getConversationById error:', err);
      return sendError(res, err.message || 'Could not load conversation.', 500);
    }
  }

  /**
   * Get or create a conversation
   */
  static async getOrCreateConversation(req: Request, res: Response) {
    try {
      const {
        conversationId,
        participants,
        participantNames,
        participantAvatars,
        participantRoles,
        productTitle,
        productImage,
      } = req.body;

      if (!conversationId || !participants || !Array.isArray(participants)) {
        return sendError(res, 'conversationId and participants array are required.', 400);
      }

      let conv = await ConversationModel.findOne({ conversationId });

      if (!conv) {
        conv = await ConversationModel.create({
          conversationId,
          participants,
          participantNames: participantNames || {},
          participantAvatars: participantAvatars || {},
          participantRoles: participantRoles || {},
          productTitle: productTitle || '',
          productImage: productImage || '',
          lastMessage: 'Chat opened',
          lastMessageTime: new Date().toISOString(),
          unreadCounts: {},
        });
      } else {
        if (productTitle) conv.productTitle = productTitle;
        if (productImage) conv.productImage = productImage;
        if (participantNames) {
          Object.entries(participantNames).forEach(([k, v]) => {
            conv!.participantNames.set(k, String(v));
          });
        }
        if (participantAvatars) {
          Object.entries(participantAvatars).forEach(([k, v]) => {
            conv!.participantAvatars.set(k, String(v));
          });
        }
        await conv.save();
      }

      return sendSuccess(res, { id: conv.conversationId }, 'Conversation ready.');
    } catch (err: any) {
      console.error('[ChatController] getOrCreateConversation error:', err);
      return sendError(res, err.message || 'Could not create conversation.', 500);
    }
  }

  /**
   * Get messages for a specific conversation
   */
  static async getMessages(req: Request, res: Response) {
    try {
      const conversationId = String(req.params.conversationId || '');
      if (!conversationId) {
        return sendError(res, 'conversationId parameter is required.', 400);
      }

      const messages = await MessageModel.find({ conversationId }).sort({ createdAt: 1 });

      const mapped = messages.map((m: any) => ({
        id: m._id.toString(),
        senderId: m.senderId,
        senderName: m.senderName,
        senderRole: m.senderRole,
        text: m.text,
        timestamp: m.timestamp,
        isRead: m.isRead,
        imageUri: m.imageUri,
        isVoiceNote: m.isVoiceNote,
        voiceDuration: m.voiceDuration,
        voiceUrl: m.voiceUrl,
        voiceBase64: m.voiceBase64,
        offer: m.offer,
        createdAt: m.createdAt.toISOString(),
      }));

      return sendSuccess(res, mapped, 'Messages loaded successfully.');
    } catch (err: any) {
      console.error('[ChatController] getMessages error:', err);
      return sendError(res, err.message || 'Could not load messages.', 500);
    }
  }

  /**
   * Post a new message to a conversation
   */
  static async sendMessage(req: Request, res: Response) {
    try {
      const conversationId = String(req.params.conversationId || '');
      const {
        senderId,
        senderName,
        senderRole,
        text,
        imageUri,
        isVoiceNote,
        voiceDuration,
        voiceUrl,
        voiceBase64,
        offer,
      } = req.body;

      if (!conversationId || !senderId || !senderRole) {
        return sendError(res, 'conversationId, senderId, and senderRole are required.', 400);
      }

      const now = new Date().toISOString();

      const newMsg: any = await MessageModel.create({
        conversationId,
        senderId,
        senderName: senderName || 'User',
        senderRole,
        text: text || '',
        timestamp: now,
        isRead: false,
        imageUri,
        isVoiceNote: !!isVoiceNote,
        voiceDuration,
        voiceUrl,
        voiceBase64,
        offer,
      });

      // Update conversation lastMessage
      let lastText = text || '';
      if (offer) lastText = `Offer: ${offer.quantity} ${offer.unit} at Rs. ${offer.pricePerUnit}`;
      else if (isVoiceNote) lastText = '🎤 Voice note';
      else if (imageUri) lastText = '📷 Photo';

      await ConversationModel.updateOne(
        { conversationId },
        {
          $set: {
            lastMessage: lastText,
            lastMessageTime: now,
          },
        }
      );

      return sendSuccess(
        res,
        {
          id: newMsg._id.toString(),
          senderId: newMsg.senderId,
          senderName: newMsg.senderName,
          senderRole: newMsg.senderRole,
          text: newMsg.text,
          timestamp: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTimestamp: now,
          isRead: false,
          imageUri: newMsg.imageUri,
          isVoiceNote: newMsg.isVoiceNote,
          voiceDuration: newMsg.voiceDuration,
          voiceUrl: newMsg.voiceUrl,
          voiceBase64: newMsg.voiceBase64,
          offer: newMsg.offer,
          createdAt: now,
        },
        'Message sent successfully.'
      );
    } catch (err: any) {
      console.error('[ChatController] sendMessage error:', err);
      return sendError(res, err.message || 'Could not send message.', 500);
    }
  }
}
