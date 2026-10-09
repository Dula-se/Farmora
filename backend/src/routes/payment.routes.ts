import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();

router.get('/config', PaymentController.getConfig);
router.put('/config', PaymentController.updateConfig);
router.post('/create-intent', PaymentController.createPaymentIntent);
router.post('/confirm', PaymentController.confirmPayment);
router.post('/process-card', PaymentController.processCardPayment);

export default router;
