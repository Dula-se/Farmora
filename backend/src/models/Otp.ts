import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
  identifier: string;
  code: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    identifier: { type: String, required: true, index: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // Expire after 5 minutes
  },
  { versionKey: false }
);

export const OtpModel = model<IOtp>('Otp', otpSchema);
