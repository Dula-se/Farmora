import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { UserModel } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ChatController {
  /**
   * Get all conversations for a user (by userId, mobile, or email).
   * Robust multi-device recovery: queries conversations, auto-discovers orphaned messages,
   * and enriches participant names & avatars from real User profiles.
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

      // Build broad matching criteria (participants array OR conversationId substring)
      const orConditions: any[] = [{ participants: { $in: queryIds } }];
      queryIds.forEach((qid) => {
        orConditions.push({ conversationId: new RegExp(qid, 'i') });
      });

      let conversations = await ConversationModel.find({ $or: orConditions }).sort({ updatedAt: -1 });

      // Auto-repair: check if any messages exist in MessageModel that don't have a ConversationModel doc yet
      try {
        const msgOrConditions: any[] = [{ senderId: { $in: queryIds } }];
        queryIds.forEach((qid) => {
          msgOrConditions.push({ conversationId: new RegExp(qid, 'i') });
        });
        const orphanedMsgConvs = await MessageModel.distinct('conversationId', { $or: msgOrConditions });
        const existingConvIds = new Set(conversations.map((c) => c.conversationId));

        for (const orphanId of orphanedMsgConvs) {
          if (!existingConvIds.has(orphanId)) {
            const lastMsg: any = await MessageModel.findOne({ conversationId: orphanId }).sort({ createdAt: -1 });
            const parts = orphanId.includes('_') ? orphanId.split('_') : [orphanId];
            const created = await ConversationModel.create({
              conversationId: orphanId,
              participants: parts,
              participantNames: {},
              participantAvatars: {},
              participantRoles: {},
              lastMessage: lastMsg?.text || (lastMsg?.isVoiceNote ? '🎤 Voice note' : 'Chat opened'),
              lastMessageTime: lastMsg?.createdAt ? new Date(lastMsg.createdAt).toISOString() : new Date().toISOString(),
              unreadCounts: {},
            });
            conversations.push(created);
            existingConvIds.add(orphanId);
          }
        }
      } catch (orphanErr) {
        console.warn('[ChatController] Orphan repair notice:', orphanErr);
      }

      // Collect all participant IDs that might need name/avatar enrichment from UserModel
      const participantIdSet = new Set<string>();
      conversations.forEach((c) => {
        c.participants.forEach((p) => participantIdSet.add(p));
      });

      const validObjIds = Array.from(participantIdSet).filter((id) => mongoose.Types.ObjectId.isValid(id));
      const dbUsers = await UserModel.find({
        $or: [
          { _id: { $in: validObjIds } },
          { mobileNumber: { $in: Array.from(participantIdSet) } },
          { email: { $in: Array.from(participantIdSet) } },
        ],
      }).select('fullName avatarUrl accountType mobileNumber email');

      const userLookup = new Map<string, any>();
      dbUsers.forEach((u) => {
        userLookup.set(u._id.toString(), u);
        if (u.mobileNumber) userLookup.set(u.mobileNumber, u);
        if (u.email) userLookup.set(u.email.toLowerCase(), u);
      });

      const mapped = conversations.map((c) => {
        const names = Object.fromEntries(c.participantNames || new Map());
        const avatars = Object.fromEntries(c.participantAvatars || new Map());
        const roles = Object.fromEntries(c.participantRoles || new Map());
        const unread = Object.fromEntries(c.unreadCounts || new Map());

        // Fill missing participant metadata from real database users
        c.participants.forEach((p) => {
          const matchedUser = userLookup.get(p);
          if (matchedUser) {
            if (!names[p] || names[p] === 'User') names[p] = matchedUser.fullName;
            if (!avatars[p] && matchedUser.avatarUrl) avatars[p] = matchedUser.avatarUrl;
            if (!roles[p] && matchedUser.accountType) roles[p] = matchedUser.accountType;
          }
        });

        return {
          id: c.conversationId,
          participants: c.participants,
          participantNames: names,
          participantAvatars: avatars,
          participantRoles: roles,
          productTitle: c.productTitle || '',
          productImage: c.productImage || '',
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageTime || '',
          unreadCounts: unread,
          createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
        };
      });

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
   * Get or create a conversation with automatic enrichment and upsert
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
        if (participantRoles) {
          Object.entries(participantRoles).forEach(([k, v]) => {
            conv!.participantRoles.set(k, String(v));
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
   * Mark a conversation as read for a specific user
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const conversationId = String(req.params.conversationId || '');
      const { userId } = req.body;
      if (!conversationId || !userId) {
        return sendError(res, 'conversationId and userId are required.', 400);
      }

      const conv = await ConversationModel.findOne({ conversationId });
      if (conv) {
        conv.unreadCounts.set(String(userId), 0);
        await conv.save();
      }

      await MessageModel.updateMany(
        { conversationId, senderId: { $ne: String(userId) } },
        { $set: { isRead: true } }
      );

      return sendSuccess(res, { success: true }, 'Marked as read.');
    } catch (err: any) {
      console.error('[ChatController] markAsRead error:', err);
      return sendError(res, err.message || 'Could not mark conversation as read.', 500);
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
        callInvitation: m.callInvitation,
        createdAt: m.createdAt.toISOString(),
      }));

      return sendSuccess(res, mapped, 'Messages loaded successfully.');
    } catch (err: any) {
      console.error('[ChatController] getMessages error:', err);
      return sendError(res, err.message || 'Could not load messages.', 500);
    }
  }

  /**
   * Post a new message to a conversation.
   * Auto-upserts the parent conversation document so it NEVER gets lost on new devices.
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
        callInvitation,
        participants,
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
        callInvitation,
      });

      // Update conversation lastMessage & auto-upsert conversation doc
      let lastText = text || '';
      if (callInvitation) lastText = callInvitation.type === 'scheduled' ? `📅 Video Inspection Scheduled` : '📹 Video Call Invitation';
      else if (offer) lastText = `Offer: ${offer.quantity} ${offer.unit} at Rs. ${offer.pricePerUnit}`;
      else if (isVoiceNote) lastText = '🎤 Voice note';
      else if (imageUri) lastText = '📷 Photo';

      const parts = Array.isArray(participants) && participants.length > 0
        ? participants
        : conversationId.includes('_') ? conversationId.split('_') : [senderId];

      let conv = await ConversationModel.findOne({ conversationId });
      if (!conv) {
        conv = await ConversationModel.create({
          conversationId,
          participants: parts,
          participantNames: { [senderId]: senderName || 'User' },
          participantAvatars: {},
          participantRoles: { [senderId]: senderRole },
          lastMessage: lastText,
          lastMessageTime: now,
          unreadCounts: {},
        });
      } else {
        conv.lastMessage = lastText;
        conv.lastMessageTime = now;
        if (senderName && !conv.participantNames.has(senderId)) {
          conv.participantNames.set(senderId, senderName);
        }
        if (senderRole && !conv.participantRoles.has(senderId)) {
          conv.participantRoles.set(senderId, senderRole);
        }
        // Increment unread counts for recipient(s)
        conv.participants.forEach((p) => {
          if (p !== senderId) {
            const cur = conv!.unreadCounts.get(p) || 0;
            conv!.unreadCounts.set(p, cur + 1);
          }
        });
        await conv.save();
      }

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

