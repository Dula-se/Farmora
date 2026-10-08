import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  produceId?: string;
  produceTitle: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  image: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerLocation: string;
  farmerId: string;
  farmerName: string;
  farmerFarm: string;
  farmerPhone: string;
  farmerAvatar: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  deliveryOption: 'standard' | 'express' | 'pickup';
  paymentMethod: 'stripe' | 'escrow' | 'bank' | 'cod';
  paymentStatus: 'paid' | 'pending' | 'escrow_secured';
  stripePaymentIntentId?: string;
  status: 'pending_dispatch' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';
  trackingNumber: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  qrCode?: string;
  securityPin: string;
  orderDate: string;
  expectedDelivery: string;
  ratingSubmitted?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    produceId: { type: String, default: '' },
    produceTitle: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, default: '' },
    buyerLocation: { type: String, required: true },
    farmerId: { type: String, required: true, index: true },
    farmerName: { type: String, required: true },
    farmerFarm: { type: String, default: 'Local Farm' },
    farmerPhone: { type: String, default: '' },
    farmerAvatar: { type: String, default: '' },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    deliveryOption: {
      type: String,
      enum: ['standard', 'express', 'pickup'],
      default: 'standard',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'escrow', 'bank', 'cod'],
      default: 'stripe',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'escrow_secured'],
      default: 'paid',
    },
    stripePaymentIntentId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending_dispatch', 'packed', 'dispatched', 'delivered', 'cancelled'],
      default: 'pending_dispatch',
    },
    trackingNumber: { type: String, required: true },
    driverName: { type: String, default: 'Ranjith Kumara' },
    driverPhone: { type: String, default: '+94 76 555 1290' },
    vehicleNumber: { type: String, default: 'WP-DA-4891 (Isuzu 3T)' },
    qrCode: { type: String, default: '' },
    securityPin: { type: String, default: '4821' },
    orderDate: { type: String, default: '' },
    expectedDelivery: { type: String, default: '' },
    ratingSubmitted: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
