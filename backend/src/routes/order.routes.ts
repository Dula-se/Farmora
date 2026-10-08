import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';

const router = Router();

router.post('/', OrderController.createOrder);
router.get('/buyer', OrderController.getBuyerOrders);
router.get('/farmer', OrderController.getFarmerOrders);
router.get('/:id', OrderController.getOrderById);
router.patch('/:id/status', OrderController.updateOrderStatus);
router.post('/:id/verify-delivery', OrderController.verifyDeliveryQr);

export default router;
