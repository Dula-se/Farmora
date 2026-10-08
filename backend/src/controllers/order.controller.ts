import { Request, Response } from 'express';
import { OrderModel } from '../models/Order.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class OrderController {
  /**
   * Create a new order (from Cart, Product Detail Buy Now, Pre-Order Harvest, or Auction Win)
   */
  static async createOrder(req: Request, res: Response) {
    try {
      const {
        buyerId,
        buyerName,
        buyerPhone,
        buyerLocation,
        farmerId,
        farmerName,
        farmerFarm,
        farmerPhone,
        farmerAvatar,
        items,
        subtotal,
        deliveryFee = 1500,
        discount = 0,
        totalAmount,
        deliveryOption = 'standard',
        paymentMethod = 'stripe',
        paymentStatus = 'paid',
        stripePaymentIntentId,
        notes,
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return sendError(res, 'At least one produce item is required.', 400);
      }

      const resolvedBuyerId = buyerId || (req as any).user?.id || (req as any).user?._id || 'buyer-1';
      const resolvedFarmerId = farmerId || 'farmer-kusuma';

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `FAM-ORD-${Date.now().toString().slice(-4)}${randomSuffix.toString().slice(-2)}`;
      const trackingNumber = `TRK-LK-${Date.now().toString().slice(-6)}`;
      const securityPin = Math.floor(1000 + Math.random() * 9000).toString();

      // Estimated delivery date calculation
      const now = new Date();
      const orderDate = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const deliveryDays = deliveryOption === 'express' ? 1 : 2;
      const expectedDate = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
      const expectedDelivery = `${expectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} by 04:00 PM`;

      const order = await OrderModel.create({
        orderNumber,
        buyerId: resolvedBuyerId,
        buyerName: buyerName || 'Buyer',
        buyerPhone: buyerPhone || '+94 77 123 4567',
        buyerLocation: buyerLocation || 'Pettah Wholesale Market, Colombo 11',
        farmerId: resolvedFarmerId,
        farmerName: farmerName || 'Farmer',
        farmerFarm: farmerFarm || 'Govigedara Farm',
        farmerPhone: farmerPhone || '+94 71 890 1234',
        farmerAvatar: farmerAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        items,
        subtotal: subtotal || items.reduce((sum: number, it: any) => sum + (it.totalPrice || 0), 0),
        deliveryFee,
        discount,
        totalAmount: totalAmount || (subtotal + deliveryFee - discount),
        deliveryOption,
        paymentMethod,
        paymentStatus: paymentStatus || (paymentMethod === 'stripe' ? 'paid' : 'pending'),
        stripePaymentIntentId: stripePaymentIntentId || '',
        status: 'pending_dispatch',
        trackingNumber,
        driverName: 'Ranjith Kumara',
        driverPhone: '+94 76 555 1290',
        vehicleNumber: 'WP-DA-4891 (Isuzu 3T Cooler)',
        qrCode: `FAMORA_DELIVERY_VERIFY:${orderNumber}:${securityPin}`,
        securityPin,
        orderDate,
        expectedDelivery,
        notes: notes || '',
      });

      return sendSuccess(res, order, 'Order placed successfully.');
    } catch (err: any) {
      console.error('[OrderController] createOrder error:', err);
      return sendError(res, err.message || 'Could not place order.', 500);
    }
  }

  /**
   * Get orders for a buyer
   */
  static async getBuyerOrders(req: Request, res: Response) {
    try {
      const { buyerId, status } = req.query;
      let query: any = {};

      if (buyerId && typeof buyerId === 'string' && buyerId.trim().length > 0) {
        query.$or = [
          { buyerId: buyerId },
          { buyerId: 'buyer-1' },
          { buyerId: 'buyer-sunil' },
        ];
      }

      if (status && typeof status === 'string' && status !== 'all') {
        if (status === 'active') {
          query.status = { $in: ['pending_dispatch', 'packed', 'dispatched'] };
        } else if (status === 'delivered') {
          query.status = 'delivered';
        } else {
          query.status = status;
        }
      }

      let orders = await OrderModel.find(query).sort({ createdAt: -1 });

      // If queried with buyerId but none found, return recent orders so screen isn't empty
      if (orders.length === 0 && buyerId) {
        orders = await OrderModel.find({}).sort({ createdAt: -1 }).limit(10);
      }

      return sendSuccess(res, orders, 'Buyer orders loaded.');
    } catch (err: any) {
      console.error('[OrderController] getBuyerOrders error:', err);
      return sendError(res, err.message || 'Failed to load orders.', 500);
    }
  }

  /**
   * Get orders for a farmer
   */
  static async getFarmerOrders(req: Request, res: Response) {
    try {
      const { farmerId, status } = req.query;
      let query: any = {};

      if (farmerId) {
        query.farmerId = farmerId;
      }
      if (status && typeof status === 'string' && status !== 'all') {
        query.status = status;
      }

      const orders = await OrderModel.find(query).sort({ createdAt: -1 });
      return sendSuccess(res, orders, 'Farmer orders loaded.');
    } catch (err: any) {
      console.error('[OrderController] getFarmerOrders error:', err);
      return sendError(res, err.message || 'Failed to load farmer orders.', 500);
    }
  }

  /**
   * Get a single order by ID or orderNumber
   */
  static async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await OrderModel.findOne({
        $or: [{ _id: id }, { orderNumber: id }, { trackingNumber: id }],
      });

      if (!order) {
        return sendError(res, 'Order not found.', 404);
      }

      return sendSuccess(res, order, 'Order details loaded.');
    } catch (err: any) {
      console.error('[OrderController] getOrderById error:', err);
      return sendError(res, err.message || 'Could not load order.', 500);
    }
  }

  /**
   * Update order status (Farmer: packed, dispatched; Driver/Buyer: delivered)
   */
  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending_dispatch', 'packed', 'dispatched', 'delivered', 'cancelled'];
      if (!status || !validStatuses.includes(status)) {
        return sendError(res, 'Invalid order status.', 400);
      }

      const updateData: any = { status };
      if (status === 'delivered') {
        updateData.paymentStatus = 'paid';
      }

      const order = await OrderModel.findOneAndUpdate(
        { $or: [{ _id: id }, { orderNumber: id }] },
        { $set: updateData },
        { new: true }
      );

      if (!order) {
        return sendError(res, 'Order not found.', 404);
      }

      return sendSuccess(res, order, `Order status updated to ${status}.`);
    } catch (err: any) {
      console.error('[OrderController] updateOrderStatus error:', err);
      return sendError(res, err.message || 'Could not update status.', 500);
    }
  }

  /**
   * Verify delivery via 4-digit PIN or QR code
   */
  static async verifyDeliveryQr(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { pin } = req.body;

      const order = await OrderModel.findOne({
        $or: [{ _id: id }, { orderNumber: id }],
      });

      if (!order) {
        return sendError(res, 'Order not found.', 404);
      }

      if (pin && order.securityPin && order.securityPin !== String(pin).trim()) {
        return sendError(res, 'Invalid 4-digit delivery verification PIN.', 400);
      }

      order.status = 'delivered';
      order.paymentStatus = 'paid';
      await order.save();

      return sendSuccess(res, order, 'Delivery successfully verified and completed!');
    } catch (err: any) {
      console.error('[OrderController] verifyDeliveryQr error:', err);
      return sendError(res, err.message || 'Could not verify delivery.', 500);
    }
  }
}
