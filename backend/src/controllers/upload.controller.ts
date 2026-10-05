import { Request, Response } from 'express';
import path from 'path';
import { StorageService } from '../services/storage.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UploadController {
  /**
   * Upload a single image (Produce photo, Avatar, or Document)
   */
  static async uploadSingle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, 'No image file was provided in the request.', 400);
      }

      const folder = (req.query.folder as string) || (req.body?.folder as string) || 'produce';
      const fileData = await StorageService.processUploadedFile(req.file, folder);

      return sendSuccess(
        res,
        fileData,
        'Image uploaded successfully!',
        201
      );
    } catch (err) {
      console.error('Upload single image error:', err);
      return sendError(res, 'Failed to process image upload.', 500);
    }
  }

  /**
   * Upload multiple images (e.g. Produce gallery - up to 5 images)
   */
  static async uploadMultiple(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return sendError(res, 'No image files were provided in the request.', 400);
      }

      const folder = (req.query.folder as string) || (req.body?.folder as string) || 'produce';
      const uploadedFiles = await Promise.all(
        files.map((file) => StorageService.processUploadedFile(file, folder))
      );

      return sendSuccess(
        res,
        {
          count: uploadedFiles.length,
          files: uploadedFiles,
          urls: uploadedFiles.map((f) => f.url),
        },
        `${uploadedFiles.length} images uploaded successfully!`,
        201
      );
    } catch (err) {
      console.error('Upload multiple images error:', err);
      return sendError(res, 'Failed to process image uploads.', 500);
    }
  }

  /**
   * Delete an uploaded image
   */
  static async deleteFile(req: Request, res: Response) {
    try {
      const folder = req.params.folder as string;
      const filename = req.params.filename as string;
      const allowedFolders = ['avatars', 'produce', 'documents'];

      if (!allowedFolders.includes(folder)) {
        return sendError(res, 'Invalid folder specified.', 400);
      }

      const deleted = await StorageService.deleteFile(folder, filename);

      if (!deleted) {
        return sendError(res, 'File not found or could not be deleted.', 404);
      }

      return sendSuccess(res, null, 'File deleted successfully.');
    } catch (err) {
      console.error('Delete image error:', err);
      return sendError(res, 'Failed to delete file.', 500);
    }
  }
}
