import type { Request, Response } from 'express';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/database.js';

export default async function handler(req: Request, res: Response) {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Vercel API] DB connection warning:', err instanceof Error ? err.message : err);
  }
  return app(req, res);
}
