import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Search history and suggestions
router.get('/popular', SearchController.getPopularSearches);
router.post('/record', optionalAuth, SearchController.recordSearch);
router.get('/history', requireAuth, SearchController.getHistory);
router.delete('/history', requireAuth, SearchController.clearHistory);

export default router;
