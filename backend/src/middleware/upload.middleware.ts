import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

// Allowed image MIME types (includes HEIC/HEIF common in modern mobile phone photos)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
];

// Ensure upload folders exist
const getDestinationFolder = (folderName: string): string => {
  const allowedFolders = ['avatars', 'produce', 'documents'];
  const sanitized = allowedFolders.includes(folderName) ? folderName : 'produce';
  const targetDir = path.resolve(process.cwd(), config.upload.uploadDir, sanitized);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

// Disk Storage engine
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Check query param, body param, or default to 'produce'
    const folder = (req.query.folder as string) || (req.body?.folder as string) || 'produce';
    cb(null, getDestinationFolder(folder));
  },
  filename: (_req, file, cb) => {
    // Generate safe, unique filename: <timestamp>-<random-hex><extension>
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 30);
    cb(null, `${safeBaseName || 'upload'}-${uniqueSuffix}${ext}`);
  },
});

// File validation filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type (${file.mimetype}). Only JPG, PNG, WEBP, and HEIC images are allowed.`
      )
    );
  }
};

// Multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSizeMb * 1024 * 1024, // e.g. 5MB
    files: 10,
  },
  fileFilter,
});

/**
 * Express error wrapper for Multer upload errors
 */
export function handleUploadErrors(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(
        res,
        `Image is too large! Maximum allowed size is ${config.upload.maxSizeMb}MB.`,
        413
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, `Unexpected field name for uploaded file.`, 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  }

  if (err instanceof Error) {
    return sendError(res, err.message, 400);
  }

  next(err);
}
