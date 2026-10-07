import { Schema, model, Document, Model } from 'mongoose';
import type { AccountType } from '../types/index.js';

// ─── Document Interface ───────────────────────────────────────────────────────
export interface IUser extends Document {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  googleId?: string;
  passwordHash?: string;
  accountType: AccountType;
  district?: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
  buyerType?: string;
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    regNumber?: string;
    contactPerson?: string;
    businessAddress?: string;
    monthlyVolume?: string;
    preferredCategories?: string[];
  };
  farmDetails?: {
    farmName?: string;
    farmCategory?: string;
    farmType?: string;
    totalArea?: string;
    farmingMethod?: string;
    primaryCrops?: string[];
    certifications?: string[];
    bio?: string;
    nicNumber?: string;
    preferredLanguage?: string;
    streetAddress?: string;
    city?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
    coverImage?: string;
    photos?: string[];
    videoUrl?: string;
    pickupAvailable?: boolean;
    directDeliveryAvailable?: boolean;
    deliveryRadius?: number;
    deliveryCharge?: number;
    freeDeliveryMin?: number;
    deliveryDays?: string[];
    bankName?: string;
    branch?: string;
    accountName?: string;
    accountNumber?: string;
    mobileWallet?: string;
    onboardingProgress?: number;
  };
  savedAddresses?: Array<{
    id: string;
    label: string;
    recipientName: string;
    mobileNumber: string;
    address: string;
    district: string;
    postalCode?: string;
    isDefault: boolean;
  }>;
  favouriteFarms?: string[];
  securitySettings?: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    activeDevices: Array<{ deviceName: string; location: string; lastActive: string }>;
  };
  pushToken?: string;
  pushTokenUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Static Methods Interface ─────────────────────────────────────────────────
export interface IUserModel extends Model<IUser> {
  findByMobile(mobile: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
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
    googleId: { type: String, sparse: true, index: true },
    passwordHash: { type: String },
    accountType: {
      type: String,
      required: true,
      enum: ['farmer', 'buyer', 'restaurant', 'supermarket', 'exporter'],
    },
    district: { type: String, trim: true },
    address: { type: String, trim: true },
    avatarUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    buyerType: { type: String },
    businessDetails: { type: Schema.Types.Mixed },
    farmDetails: { type: Schema.Types.Mixed },
    savedAddresses: { type: [Schema.Types.Mixed], default: [] },
    favouriteFarms: { type: [String], default: [] },
    securitySettings: {
      type: Schema.Types.Mixed,
      default: {
        twoFactorEnabled: false,
        biometricEnabled: true,
        activeDevices: [
          { deviceName: 'Samsung Galaxy A54 (Current)', location: 'Colombo, Sri Lanka', lastActive: 'Active Now' },
          { deviceName: 'Chrome on Windows 11', location: 'Kandy, Sri Lanka', lastActive: '2 days ago' },
        ],
      },
    },
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

userSchema.statics.findByGoogleId = function (googleId: string) {
  return this.findOne({ googleId });
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ accountType: 1 });

export const UserModel = model<IUser, IUserModel>('User', userSchema);
