import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();

router.get('/config', PaymentController.getConfig);
router.post('/create-intent', PaymentController.createPaymentIntent);
router.post('/confirm', PaymentController.confirmPayment);

export default router;
