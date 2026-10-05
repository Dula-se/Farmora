import { Router } from 'express';
import authRoutes from './auth.routes.js';
import uploadRoutes from './upload.routes.js';
import produceRoutes from './produce.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/produce', produceRoutes);
router.use('/users', userRoutes);

export default router;
