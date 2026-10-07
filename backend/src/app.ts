import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { sendError, sendSuccess } from './utils/response.js';

export const app = express();

// Security Headers (Configured so uploaded images can be loaded from mobile & web apps)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request Logger
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import { connectDB } from './config/database.js';

// Ensure DB connection in Serverless environments (cold starts)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[DB Middleware] Connection warning:', err instanceof Error ? err.message : err);
  }
  next();
});

// Root Landing Endpoint (Confirms Vercel deployment status)
app.get('/', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    service: 'Famora API',
    status: 'online',
    version: '1.0.0',
    environment: config.nodeEnv,
    healthEndpoint: '/api/health',
    message: 'Famora Farm-to-Market Backend API is operating.',
  });
});

// Serve Uploaded Files Statically
const uploadsPath = path.resolve(process.cwd(), config.upload.uploadDir);
app.use('/uploads', express.static(uploadsPath));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'online',
    service: 'Famora API',
    version: '1.0.0',
    environment: config.nodeEnv,
    storageProvider: config.upload.provider,
    uploadsServedAt: `${config.baseUrl}/uploads`,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return sendError(res, message, 500);
});

export default app;
