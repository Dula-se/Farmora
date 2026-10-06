import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Wishlist endpoints
router.get('/', requireAuth, WishlistController.getWishlist);
router.post('/toggle', requireAuth, WishlistController.toggle);
router.get('/check/:produceId', requireAuth, WishlistController.checkStatus);
router.delete('/:produceId', requireAuth, WishlistController.remove);

export default router;
