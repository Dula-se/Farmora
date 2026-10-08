import mongoose, { Schema, Document } from 'mongoose';

export interface IBid {
  bidderId: string;
  bidderName: string;
  bidAmountPerKg: number;
  totalLotAmount: number;
  timestamp: string;
}

export interface IAuction extends Document {
  farmerId: string;
  farmerName: string;
  farmerAvatar: string;
  farmerFarm: string;
  cropName: string;
  variety: string;
  grade: string;
  lotSizeKg: number;
  unit: string;
  image: string;
  startingPricePerKg: number;
  reservePricePerKg: number;
  minBidIncrement: number;
  currentBidPerKg: number;
  highestBidderId?: string;
  highestBidderName?: string;
  bidsCount: number;
  bids: IBid[];
  startTime: string;
  endTime: string;
  status: 'live' | 'upcoming' | 'ended' | 'paid';
  winnerId?: string;
  winnerName?: string;
  finalPricePerKg?: number;
  winningTotalAmount?: number;
  stripePaymentIntentId?: string;
  orderId?: string;
  locationDistrict: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBid>(
  {
    bidderId: { type: String, required: true },
    bidderName: { type: String, required: true },
    bidAmountPerKg: { type: Number, required: true },
    totalLotAmount: { type: Number, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const AuctionSchema = new Schema<IAuction>(
  {
    farmerId: { type: String, required: true, index: true },
    farmerName: { type: String, required: true },
    farmerAvatar: { type: String, default: '' },
    farmerFarm: { type: String, default: 'Local Farm' },
    cropName: { type: String, required: true },
    variety: { type: String, default: 'Prime' },
    grade: { type: String, default: 'Grade A' },
    lotSizeKg: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    image: { type: String, required: true },
    startingPricePerKg: { type: Number, required: true },
    reservePricePerKg: { type: Number, required: true },
    minBidIncrement: { type: Number, default: 5 },
    currentBidPerKg: { type: Number, required: true },
    highestBidderId: { type: String, default: '' },
    highestBidderName: { type: String, default: '' },
    bidsCount: { type: Number, default: 0 },
    bids: { type: [BidSchema], default: [] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['live', 'upcoming', 'ended', 'paid'],
      default: 'live',
      index: true,
    },
    winnerId: { type: String, default: '' },
    winnerName: { type: String, default: '' },
    finalPricePerKg: { type: Number },
    winningTotalAmount: { type: Number },
    stripePaymentIntentId: { type: String, default: '' },
    orderId: { type: String, default: '' },
    locationDistrict: { type: String, default: 'Nuwara Eliya' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AuctionModel = mongoose.model<IAuction>('Auction', AuctionSchema);
