import { Router } from 'express';
import authRoutes from './auth.routes.js';
import uploadRoutes from './upload.routes.js';
import produceRoutes from './produce.routes.js';
import userRoutes from './user.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import searchRoutes from './search.routes.js';
import marketRoutes from './market.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/produce', produceRoutes);
router.use('/users', userRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/search', searchRoutes);
router.use('/market', marketRoutes);
router.use('/chat', chatRoutes);

export default router;
