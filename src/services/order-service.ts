import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, getStoredUser } from './api';

export interface OrderItem {
  id?: string;
  produceId?: string;
  produceTitle: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  image: string;
}

export type OrderStatus = 'Pending Dispatch' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface FarmoraOrder {
  id: string;
  _id?: string;
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
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  deliveryOption?: 'standard' | 'express' | 'pickup';
  paymentMethod: 'Cash on Delivery' | 'Commercial Bank Transfer' | 'Famora Escrow Pay' | 'Stripe Card Payment' | string;
  paymentStatus: 'Paid' | 'Pending' | 'Escrow Secured' | string;
  stripePaymentIntentId?: string;
  status: OrderStatus;
  trackingNumber: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  qrCode?: string;
  securityPin?: string;
  orderDate: string;
  expectedDelivery: string;
  ratingSubmitted?: boolean;
  notes?: string;
}

const STORAGE_KEY = 'famora_orders_data_v2';

const INITIAL_ORDERS: FarmoraOrder[] = [
  {
    id: 'ord-1042',
    orderNumber: '#ORD-1042',
    buyerId: 'buyer-sunil',
    buyerName: 'Sunil Dissanayake',
    buyerPhone: '+94 77 123 4567',
    buyerLocation: 'Pettah Wholesale Market, Colombo 11',
    farmerId: 'farmer-kusuma',
    farmerName: 'Kusuma Bandara',
    farmerFarm: 'Govigedara Highland Farm, Welimada',
    farmerPhone: '+94 71 890 1234',
    farmerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    items: [
      {
        id: 'item-1',
        produceTitle: 'Organic Red Tomatoes (Grade A)',
        quantity: 50,
        unit: 'kg',
        unitPrice: 240,
        totalPrice: 12000,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
      },
    ],
    subtotal: 12000,
    deliveryFee: 1500,
    discount: 500,
    totalAmount: 13000,
    paymentMethod: 'Stripe Card Payment',
    paymentStatus: 'Paid',
    status: 'Pending Dispatch',
    trackingNumber: 'FAM-TRK-9821',
    driverName: 'Ranjith Kumara',
    driverPhone: '+94 76 555 1290',
    vehicleNumber: 'WP-DA-4891 (Isuzu 3T)',
    securityPin: '4821',
    orderDate: 'Today, 08:30 AM',
    expectedDelivery: 'Today by 04:00 PM',
  },
  {
    id: 'ord-1041',
    orderNumber: '#ORD-1041',
    buyerId: 'buyer-greenleaf',
    buyerName: 'Green Leaf Supermarket',
    buyerPhone: '+94 11 234 5678',
    buyerLocation: 'No 45, Galle Road, Colombo 03',
    farmerId: 'farmer-kusuma',
    farmerName: 'Kusuma Bandara',
    farmerFarm: 'Govigedara Highland Farm, Welimada',
    farmerPhone: '+94 71 890 1234',
    farmerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    items: [
      {
        id: 'item-2',
        produceTitle: 'Highland Carrots (Welimada Supreme)',
        quantity: 100,
        unit: 'kg',
        unitPrice: 250,
        totalPrice: 25000,
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
      },
    ],
    subtotal: 25000,
    deliveryFee: 0,
    discount: 0,
    totalAmount: 25000,
    paymentMethod: 'Commercial Bank Transfer',
    paymentStatus: 'Paid',
    status: 'Dispatched',
    trackingNumber: 'FAM-TRK-7712',
    driverName: 'Saman Jayatissa',
    driverPhone: '+94 77 444 8812',
    vehicleNumber: 'CP-LH-3321 (Refrigerated Truck)',
    securityPin: '9312',
    orderDate: 'Yesterday, 02:15 PM',
    expectedDelivery: 'Today by 11:30 AM',
  },
];

let ordersCache: FarmoraOrder[] = [...INITIAL_ORDERS];

function mapDbOrder(dbOrder: any): FarmoraOrder {
  const statusMap: Record<string, OrderStatus> = {
    pending_dispatch: 'Pending Dispatch',
    packed: 'Packed',
    dispatched: 'Dispatched',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return {
    id: dbOrder._id || dbOrder.id,
    _id: dbOrder._id,
    orderNumber: dbOrder.orderNumber,
    buyerId: dbOrder.buyerId,
    buyerName: dbOrder.buyerName,
    buyerPhone: dbOrder.buyerPhone,
    buyerLocation: dbOrder.buyerLocation,
    farmerId: dbOrder.farmerId,
    farmerName: dbOrder.farmerName,
    farmerFarm: dbOrder.farmerFarm,
    farmerPhone: dbOrder.farmerPhone,
    farmerAvatar: dbOrder.farmerAvatar,
    items: dbOrder.items || [],
    subtotal: dbOrder.subtotal,
    deliveryFee: dbOrder.deliveryFee,
    discount: dbOrder.discount,
    totalAmount: dbOrder.totalAmount,
    deliveryOption: dbOrder.deliveryOption,
    paymentMethod:
      dbOrder.paymentMethod === 'stripe'
        ? 'Stripe Card Payment'
        : dbOrder.paymentMethod === 'escrow'
        ? 'Famora Escrow Pay'
        : dbOrder.paymentMethod === 'bank'
        ? 'Commercial Bank Transfer'
        : 'Cash on Delivery',
    paymentStatus:
      dbOrder.paymentStatus === 'paid'
        ? 'Paid'
        : dbOrder.paymentStatus === 'escrow_secured'
        ? 'Escrow Secured'
        : 'Pending',
    stripePaymentIntentId: dbOrder.stripePaymentIntentId,
    status: statusMap[dbOrder.status] || dbOrder.status || 'Pending Dispatch',
    trackingNumber: dbOrder.trackingNumber,
    driverName: dbOrder.driverName,
    driverPhone: dbOrder.driverPhone,
    vehicleNumber: dbOrder.vehicleNumber,
    qrCode: dbOrder.qrCode,
    securityPin: dbOrder.securityPin,
    orderDate: dbOrder.orderDate || 'Today',
    expectedDelivery: dbOrder.expectedDelivery || 'Tomorrow',
    ratingSubmitted: dbOrder.ratingSubmitted || false,
    notes: dbOrder.notes,
  };
}

export const OrderService = {
  async getOrders(): Promise<FarmoraOrder[]> {
    return OrderService.getBuyerOrders();
  },

  async getBuyerOrders(): Promise<FarmoraOrder[]> {
    try {
      const user = await getStoredUser();
      const buyerId = user?.id || user?._id || '';

      const res = await apiFetch<any[]>(`/orders/buyer?buyerId=${buyerId}`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapDbOrder);
        ordersCache = mapped;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)).catch(() => {});
        return mapped;
      }
    } catch {}

    return [...ordersCache];
  },

  async getFarmerOrders(): Promise<FarmoraOrder[]> {
    try {
      const user = await getStoredUser();
      const farmerId = user?.id || user?._id || '';

      const res = await apiFetch<any[]>(`/orders/farmer?farmerId=${farmerId}`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(mapDbOrder);
      }
    } catch {}

    return [...ordersCache];
  },

  async getOrderById(orderId: string): Promise<FarmoraOrder | null> {
    try {
      const res = await apiFetch<any>(`/orders/${orderId}`);
      if (res.data) {
        return mapDbOrder(res.data);
      }
    } catch {}

    const found = ordersCache.find((o) => o.id === orderId || o.orderNumber === orderId);
    return found || null;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<FarmoraOrder | null> {
    const dbStatusMap: Record<OrderStatus, string> = {
      'Pending Dispatch': 'pending_dispatch',
      Packed: 'packed',
      Dispatched: 'dispatched',
      Delivered: 'delivered',
      Cancelled: 'cancelled',
    };

    try {
      const res = await apiFetch<any>(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: dbStatusMap[status] || status }),
      });
      if (res.data) {
        return mapDbOrder(res.data);
      }
    } catch {}

    const index = ordersCache.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index !== -1) {
      ordersCache[index] = { ...ordersCache[index], status };
      return ordersCache[index];
    }
    return null;
  },

  async verifyDeliveryQr(orderId: string, pin: string): Promise<FarmoraOrder | null> {
    try {
      const res = await apiFetch<any>(`/orders/${orderId}/verify-delivery`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      if (res.data) {
        return mapDbOrder(res.data);
      }
    } catch {}

    return OrderService.updateOrderStatus(orderId, 'Delivered');
  },

  async markOrderRated(orderId: string): Promise<void> {
    const index = ordersCache.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index !== -1) {
      ordersCache[index] = { ...ordersCache[index], ratingSubmitted: true };
    }
  },

  async createNewOrder(orderData: Partial<FarmoraOrder>): Promise<FarmoraOrder> {
    try {
      const res = await apiFetch<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      if (res.data) {
        const created = mapDbOrder(res.data);
        ordersCache = [created, ...ordersCache];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ordersCache)).catch(() => {});
        return created;
      }
    } catch (e) {
      console.warn('[OrderService] createNewOrder network error, falling back locally:', e);
    }

    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const newOrd: FarmoraOrder = {
      id: `ord-${nextNum}`,
      orderNumber: `#ORD-${nextNum}`,
      buyerId: orderData.buyerId || 'buyer-1',
      buyerName: orderData.buyerName || 'Buyer',
      buyerPhone: orderData.buyerPhone || '+94 77 123 4567',
      buyerLocation: orderData.buyerLocation || 'Colombo, Sri Lanka',
      farmerId: orderData.farmerId || 'farmer-1',
      farmerName: orderData.farmerName || 'Farmer',
      farmerFarm: orderData.farmerFarm || 'Local Farm',
      farmerPhone: orderData.farmerPhone || '+94 71 890 1234',
      farmerAvatar: orderData.farmerAvatar || '',
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      deliveryFee: orderData.deliveryFee ?? 1500,
      discount: orderData.discount || 0,
      totalAmount: orderData.totalAmount || 0,
      deliveryOption: orderData.deliveryOption || 'standard',
      paymentMethod: orderData.paymentMethod || 'Stripe Card Payment',
      paymentStatus: orderData.paymentStatus || 'Paid',
      stripePaymentIntentId: orderData.stripePaymentIntentId,
      status: 'Pending Dispatch',
      trackingNumber: `FAM-TRK-${nextNum}`,
      driverName: 'Ranjith Kumara',
      driverPhone: '+94 76 555 1290',
      vehicleNumber: 'WP-DA-4891 (Isuzu 3T)',
      securityPin: '4821',
      orderDate: 'Just now',
      expectedDelivery: 'Tomorrow by 04:00 PM',
    };

    ordersCache = [newOrd, ...ordersCache];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ordersCache)).catch(() => {});
    return newOrd;
  },
};
