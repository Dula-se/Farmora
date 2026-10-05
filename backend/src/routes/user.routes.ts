import { Router } from 'express';
import {
  UserController,
  updateProfileSchema,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { upload, handleUploadErrors } from '../middleware/upload.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

// Public user profile
router.get('/:id', UserController.getById);

// Update profile details
router.patch('/profile', requireAuth, validateBody(updateProfileSchema), UserController.updateProfile);

// Upload profile avatar
router.post(
  '/profile/avatar',
  requireAuth,
  upload.single('avatar'),
  handleUploadErrors,
  UserController.uploadAvatar
);

export default router;
