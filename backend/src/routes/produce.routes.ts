import { Router } from 'express';
import {
  ProduceController,
  createProduceSchema,
  updateProduceSchema,
} from '../controllers/produce.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

// Public Produce Browse & Search
router.get('/', ProduceController.getAll);
router.get('/item/:id', ProduceController.getById);

// Farmer Specific routes
router.get(
  '/farmer/my-listings',
  requireAuth,
  requireRoles('farmer'),
  ProduceController.getMyListings
);

router.post(
  '/',
  requireAuth,
  requireRoles('farmer'),
  validateBody(createProduceSchema),
  ProduceController.create
);

router.put(
  '/:id',
  requireAuth,
  requireRoles('farmer'),
  validateBody(updateProduceSchema),
  ProduceController.update
);

router.delete(
  '/:id',
  requireAuth,
  requireRoles('farmer'),
  ProduceController.delete
);

export default router;
