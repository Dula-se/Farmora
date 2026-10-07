import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  loginSchema,
  googleAuthSchema,
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
router.post('/google', validateBody(googleAuthSchema), AuthController.googleAuth);

// OTP Verification (SMS & Google Email Code)
router.post('/request-otp', validateBody(requestOtpSchema), AuthController.requestOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), AuthController.verifyOtp);

// Password recovery
router.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword);

// Current session & Profile
router.get('/me', requireAuth, AuthController.getMe);
router.put('/profile', requireAuth, AuthController.updateProfile);
router.put('/farmer-onboarding', requireAuth, AuthController.updateFarmerOnboarding);
router.get('/farmer-profile/:id', AuthController.getPublicFarmerProfile);

// Addresses
router.get('/addresses', requireAuth, AuthController.getAddresses);
router.post('/addresses', requireAuth, AuthController.addAddress);
router.delete('/addresses/:id', requireAuth, AuthController.deleteAddress);

// Favourite Farms
router.get('/favourite-farms', requireAuth, AuthController.getFavouriteFarms);
router.post('/favourite-farms/toggle', requireAuth, AuthController.toggleFavouriteFarm);

export default router;
