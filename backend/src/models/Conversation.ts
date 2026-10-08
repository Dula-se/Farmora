import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  conversationId: string;
  participants: string[];
  participantNames: Map<string, string>;
  participantAvatars: Map<string, string>;
  participantRoles: Map<string, string>;
  productTitle?: string;
  productImage?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    participants: [{ type: String, required: true, index: true }],
    participantNames: { type: Map, of: String, default: {} },
    participantAvatars: { type: Map, of: String, default: {} },
    participantRoles: { type: Map, of: String, default: {} },
    productTitle: { type: String, default: '' },
    productImage: { type: String, default: '' },
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: String, default: '' },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

export const ConversationModel = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);
