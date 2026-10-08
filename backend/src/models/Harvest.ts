import mongoose, { Schema, Document } from 'mongoose';

export interface IHarvestPreOrder {
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  quantityKg: number;
  depositAmount: number;
  totalAmount: number;
  orderId?: string;
  stripePaymentIntentId?: string;
  bookedAt: string;
}

export interface IHarvest extends Document {
  farmerId: string;
  farmerName: string;
  farmerAvatar: string;
  farmerFarm: string;
  cropName: string;
  variety: string;
  category: string;
  image: string;
  expectedHarvestDate: string; // YYYY-MM-DD
  estimatedYieldKg: number;
  reservedYieldKg: number;
  minPreOrderQty: number;
  preOrderPricePerKg: number;
  marketPricePerKg: number;
  depositPercent: number;
  locationDistrict: string;
  farmAddress: string;
  fieldNotes: string;
  allowPreOrders: boolean;
  status: 'growing' | 'ready_for_harvest' | 'harvested' | 'dispatched';
  preOrders: IHarvestPreOrder[];
  createdAt: Date;
  updatedAt: Date;
}

const HarvestPreOrderSchema = new Schema<IHarvestPreOrder>(
  {
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, default: '' },
    quantityKg: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    orderId: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    bookedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const HarvestSchema = new Schema<IHarvest>(
  {
    farmerId: { type: String, required: true, index: true },
    farmerName: { type: String, required: true },
    farmerAvatar: { type: String, default: '' },
    farmerFarm: { type: String, default: 'Highland Farm' },
    cropName: { type: String, required: true },
    variety: { type: String, default: 'Standard' },
    category: { type: String, default: 'Vegetables' },
    image: { type: String, required: true },
    expectedHarvestDate: { type: String, required: true, index: true },
    estimatedYieldKg: { type: Number, required: true },
    reservedYieldKg: { type: Number, default: 0 },
    minPreOrderQty: { type: Number, default: 20 },
    preOrderPricePerKg: { type: Number, required: true },
    marketPricePerKg: { type: Number, required: true },
    depositPercent: { type: Number, default: 20 },
    locationDistrict: { type: String, default: 'Badulla' },
    farmAddress: { type: String, default: 'Govigedara, Welimada' },
    fieldNotes: { type: String, default: '' },
    allowPreOrders: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['growing', 'ready_for_harvest', 'harvested', 'dispatched'],
      default: 'growing',
    },
    preOrders: { type: [HarvestPreOrderSchema], default: [] },
  },
  { timestamps: true }
);

export const HarvestModel = mongoose.model<IHarvest>('Harvest', HarvestSchema);
