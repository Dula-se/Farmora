import { Schema, model, Document, Model } from 'mongoose';
import type { AccountType } from '../types/index.js';

// ─── Document Interface ───────────────────────────────────────────────────────
export interface IUser extends Document {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  passwordHash?: string;
  accountType: AccountType;
  district?: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
  pushToken?: string;
  pushTokenUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Static Methods Interface ─────────────────────────────────────────────────
export interface IUserModel extends Model<IUser> {
  findByMobile(mobile: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser, IUserModel>(
  {
    fullName: { type: String, required: true, trim: true },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    accountType: {
      type: String,
      required: true,
      enum: ['farmer', 'buyer', 'restaurant', 'supermarket', 'exporter'],
    },
    district: { type: String, trim: true },
    address: { type: String, trim: true },
    avatarUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    pushToken: { type: String },
    pushTokenUpdatedAt: { type: Date },
  },
  {
    timestamps: true,          // auto createdAt / updatedAt
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

// ─── Static Methods ───────────────────────────────────────────────────────────
userSchema.statics.findByMobile = function (mobile: string) {
  return this.findOne({ mobileNumber: mobile.replace(/\s+/g, '') });
};

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ accountType: 1 });

export const UserModel = model<IUser, IUserModel>('User', userSchema);
