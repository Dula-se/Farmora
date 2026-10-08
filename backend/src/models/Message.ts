import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'farmer' | 'buyer';
  text: string;
  timestamp: string;
  isRead: boolean;
  imageUri?: string;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  voiceUrl?: string;
  voiceBase64?: string;
  offer?: any;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['farmer', 'buyer'], required: true },
    text: { type: String, default: '' },
    timestamp: { type: String, default: () => new Date().toISOString() },
    isRead: { type: Boolean, default: false },
    imageUri: { type: String },
    isVoiceNote: { type: Boolean, default: false },
    voiceDuration: { type: String },
    voiceUrl: { type: String },
    voiceBase64: { type: String },
    offer: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
