import { Router } from 'express';
import { MarketController } from '../controllers/market.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Market intelligence, pricing strategy & farmer trust scores
router.get('/compare', MarketController.getDistrictCompare);
router.get('/pricing-strategy', MarketController.getWholesaleVsRetail);
router.get('/trends', MarketController.getMarketTrends);
router.get('/trust-score/:farmerId?', optionalAuth, MarketController.getFarmerTrustScore);

export default router;
