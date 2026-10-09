import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string; // Recipient user ID (MongoDB _id or custom ID)
  title: string;
  description: string;
  type: 'order' | 'bid' | 'price' | 'message' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  actionLabel?: string;
  actionRoute?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['order', 'bid', 'price', 'message', 'system'],
      default: 'system',
    },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    actionLabel: { type: String, default: '' },
    actionRoute: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for fast query by recipient and time
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
