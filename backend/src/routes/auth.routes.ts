import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Registration & Authentication
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);

// Mobile OTP verification
router.post('/request-otp', validateBody(requestOtpSchema), AuthController.requestOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), AuthController.verifyOtp);

// Password recovery
router.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword);

// Current session
router.get('/me', requireAuth, AuthController.getMe);

export default router;
