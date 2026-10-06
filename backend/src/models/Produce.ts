import { Schema, model, Document, Model, Types } from 'mongoose';
import type { ProduceCategory, ProduceUnit } from '../types/index.js';

// ─── Document Interface ───────────────────────────────────────────────────────
export interface IProduceListing extends Document {
  id: string;
  farmerId: Types.ObjectId | string;
  farmerName: string;
  farmerMobile: string;
  farmerAvatar?: string;
  title: string;
  category: ProduceCategory;
  description: string;
  pricePerUnit: number;
  currency: string;
  unit: ProduceUnit;
  availableQuantity: number;
  minimumOrderQuantity: number;
  harvestDate?: string;
  locationDistrict: string;
  locationCity: string;
  images: string[];
  isOrganic: boolean;
  isFeatured: boolean;
  farmingMethod?: 'organic' | 'conventional' | 'greenhouse';
  grade?: string;
  wholesaleTiers?: Array<{ minQty: number; price: number }>;
  packagingType?: string;
  shelfLifeDays?: number;
  isRescue?: boolean;
  rescueDiscount?: number;
  rescueReason?: 'near_expiry' | 'surplus' | 'cosmetic_blemish' | 'none';
  rescueExpiryHours?: number;
  viewsCount?: number;
  ordersCount?: number;
  totalKgSold?: number;
  revenueGenerated?: number;
  status: 'available' | 'sold_out' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const produceSchema = new Schema<IProduceListing>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farmerName: { type: String, required: true },
    farmerMobile: { type: String, required: true },
    farmerAvatar: { type: String },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['vegetables', 'fruits', 'grains', 'spices', 'organic', 'tea', 'other'],
      index: true,
    },
    description: { type: String, required: true, trim: true },
    pricePerUnit: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'LKR' },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'bundle', 'crate', 'item'],
    },
    availableQuantity: { type: Number, required: true, min: 0 },
    minimumOrderQuantity: { type: Number, required: true, min: 1 },
    harvestDate: { type: String },
    locationDistrict: { type: String, required: true, index: true },
    locationCity: { type: String, required: true },
    images: [{ type: String }],
    isOrganic: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    farmingMethod: {
      type: String,
      enum: ['organic', 'conventional', 'greenhouse'],
      default: 'organic',
    },
    grade: { type: String, default: 'Grade A+' },
    wholesaleTiers: [
      {
        minQty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    packagingType: { type: String, default: 'Standard Crate' },
    shelfLifeDays: { type: Number, default: 7 },
    isRescue: { type: Boolean, default: false, index: true },
    rescueDiscount: { type: Number, default: 0 },
    rescueReason: {
      type: String,
      enum: ['near_expiry', 'surplus', 'cosmetic_blemish', 'none'],
      default: 'none',
    },
    rescueExpiryHours: { type: Number, default: 24 },
    viewsCount: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    totalKgSold: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['available', 'sold_out', 'archived'],
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
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

// ─── Full-text Search Index ───────────────────────────────────────────────────
produceSchema.index({ title: 'text', description: 'text', locationCity: 'text' });
// Compound index for common listing queries
produceSchema.index({ status: 1, category: 1, locationDistrict: 1 });
produceSchema.index({ isFeatured: 1, status: 1 });

export const ProduceModel = model<IProduceListing>('ProduceListing', produceSchema);
