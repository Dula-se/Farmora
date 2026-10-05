import { Router, Request, Response, NextFunction } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { upload, handleUploadErrors } from '../middleware/upload.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Middleware to accept either 'image' or 'file' field for single upload
const singleImageUpload = (req: Request, res: Response, next: NextFunction) => {
  const handler = upload.single('image');
  handler(req, res, (err) => {
    if (err) return handleUploadErrors(err, req, res, next);
    if (!req.file) {
      // Fallback: check if uploaded as 'file'
      const fallback = upload.single('file');
      return fallback(req, res, (fallbackErr) => {
        if (fallbackErr) return handleUploadErrors(fallbackErr, req, res, next);
        next();
      });
    }
    next();
  });
};

// Middleware to accept either 'images' or 'files' field for multi-upload
const multiImageUpload = (req: Request, res: Response, next: NextFunction) => {
  const handler = upload.array('images', 8);
  handler(req, res, (err) => {
    if (err) return handleUploadErrors(err, req, res, next);
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      // Fallback: check if uploaded as 'files'
      const fallback = upload.array('files', 8);
      return fallback(req, res, (fallbackErr) => {
        if (fallbackErr) return handleUploadErrors(fallbackErr, req, res, next);
        next();
      });
    }
    next();
  });
};

/**
 * Upload single image
 * Query or body parameter: folder ('produce' | 'avatars' | 'documents')
 * Content-Type: multipart/form-data
 */
router.post('/single', singleImageUpload, UploadController.uploadSingle);

/**
 * Upload multiple images (up to 8 files)
 * Query or body parameter: folder ('produce' | 'avatars' | 'documents')
 * Content-Type: multipart/form-data
 */
router.post('/multiple', multiImageUpload, UploadController.uploadMultiple);

/**
 * Delete uploaded image file
 */
router.delete('/:folder/:filename', requireAuth, UploadController.deleteFile);

export default router;
