import { Schema, model, Document } from 'mongoose';

export interface IAppConfig extends Document {
  key: string;
  value: Record<string, any>;
  description?: string;
  category: 'payment' | 'auth' | 'storage' | 'general';
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appConfigSchema = new Schema<IAppConfig>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['payment', 'auth', 'storage', 'general'],
      default: 'general',
    },
    isSecret: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const AppConfigModel = model<IAppConfig>('AppConfig', appConfigSchema);
