import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OrderItem {
  id: string;
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
  paymentMethod: 'Cash on Delivery' | 'Commercial Bank Transfer' | 'Famora Escrow Pay';
  paymentStatus: 'Paid' | 'Pending' | 'Escrow Secured';
  status: OrderStatus;
  trackingNumber: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  orderDate: string;
  expectedDelivery: string;
  ratingSubmitted?: boolean;
}

const STORAGE_KEY = 'famora_orders_data_v1';

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
    paymentMethod: 'Famora Escrow Pay',
    paymentStatus: 'Escrow Secured',
    status: 'Pending Dispatch',
    trackingNumber: 'FAM-TRK-9821',
    driverName: 'Ranjith Kumara',
    driverPhone: '+94 76 555 1290',
    vehicleNumber: 'WP-DA-4891 (Isuzu 3T)',
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
        unitPrice: 240,
        totalPrice: 24000,
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
      },
    ],
    subtotal: 24000,
    deliveryFee: 2000,
    discount: 1000,
    totalAmount: 25000,
    paymentMethod: 'Commercial Bank Transfer',
    paymentStatus: 'Paid',
    status: 'Dispatched',
    trackingNumber: 'FAM-TRK-7712',
    driverName: 'Saman Jayatissa',
    driverPhone: '+94 77 444 8812',
    vehicleNumber: 'CP-LH-3321 (Refrigerated Truck)',
    orderDate: 'Yesterday, 02:15 PM',
    expectedDelivery: 'Today by 11:30 AM',
  },
  {
    id: 'ord-1039',
    orderNumber: '#ORD-1039',
    buyerId: 'buyer-sunil',
    buyerName: 'Sunil Dissanayake',
    buyerPhone: '+94 77 123 4567',
    buyerLocation: 'Pettah Wholesale Market, Colombo 11',
    farmerId: 'farmer-bandara',
    farmerName: 'Kamal Gunawardana',
    farmerFarm: 'Highland Pure Greens, Nuwara Eliya',
    farmerPhone: '+94 77 222 3344',
    farmerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    items: [
      {
        id: 'item-3',
        produceTitle: 'Fresh Green Beans',
        quantity: 40,
        unit: 'kg',
        unitPrice: 180,
        totalPrice: 7200,
        image: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?w=400',
      },
      {
        id: 'item-4',
        produceTitle: 'Crisp Iceberg Lettuce',
        quantity: 30,
        unit: 'kg',
        unitPrice: 210,
        totalPrice: 6300,
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400',
      },
    ],
    subtotal: 13500,
    deliveryFee: 1500,
    discount: 0,
    totalAmount: 15000,
    paymentMethod: 'Famora Escrow Pay',
    paymentStatus: 'Paid',
    status: 'Delivered',
    trackingNumber: 'FAM-TRK-5529',
    driverName: 'Mahinda Silva',
    driverPhone: '+94 70 123 9999',
    vehicleNumber: 'WP-GE-1190',
    orderDate: '3 days ago',
    expectedDelivery: 'Delivered successfully',
    ratingSubmitted: false,
  },
];

let ordersCache: FarmoraOrder[] = [...INITIAL_ORDERS];

export const OrderService = {
  async getOrders(): Promise<FarmoraOrder[]> {
    return [...ordersCache];
  },

  async getBuyerOrders(): Promise<FarmoraOrder[]> {
    return [...ordersCache];
  },

  async getFarmerOrders(): Promise<FarmoraOrder[]> {
    return [...ordersCache];
  },

  async getOrderById(orderId: string): Promise<FarmoraOrder | null> {
    const found = ordersCache.find((o) => o.id === orderId || o.orderNumber === orderId);
    return found || null;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<FarmoraOrder | null> {
    const index = ordersCache.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index !== -1) {
      ordersCache[index] = {
        ...ordersCache[index],
        status,
      };
      return ordersCache[index];
    }
    return null;
  },

  async markOrderRated(orderId: string): Promise<void> {
    const index = ordersCache.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index !== -1) {
      ordersCache[index] = {
        ...ordersCache[index],
        ratingSubmitted: true,
      };
    }
  },

  async createNewOrder(order: Omit<FarmoraOrder, 'id' | 'orderNumber' | 'orderDate' | 'trackingNumber'>): Promise<FarmoraOrder> {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const newOrd: FarmoraOrder = {
      ...order,
      id: `ord-${nextNum}`,
      orderNumber: `#ORD-${nextNum}`,
      orderDate: 'Just now',
      trackingNumber: `FAM-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    ordersCache = [newOrd, ...ordersCache];
    return newOrd;
  },
};
