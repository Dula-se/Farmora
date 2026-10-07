import mongoose from 'mongoose';
import { config } from './env.js';

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const isVercel = !!process.env.VERCEL;
  const isProd = config.nodeEnv === 'production';
  const uri = config.mongo.uri || (isVercel || isProd ? '' : 'mongodb://127.0.0.1:27017/farmora');

  if (!uri) {
    console.warn('[MongoDB] ⚠️ MONGODB_URI is not configured in environment variables.');
    return;
  }

  if (cachedPromise) {
    try {
      await cachedPromise;
      return;
    } catch {
      cachedPromise = null;
    }
  }

  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`[MongoDB] Connecting to: ${maskedUri} ...`);

  cachedPromise = mongoose.connect(uri, {
    dbName: config.mongo.dbName,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    await cachedPromise;
    console.log(`[MongoDB] ✅ Connected to database: "${config.mongo.dbName}"`);
  } catch (err) {
    cachedPromise = null;
    const message = err instanceof Error ? err.message : String(err);
    console.error('[MongoDB] ❌ Connection error:', message);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  cachedPromise = null;
  console.log('[MongoDB] Disconnected.');
}

export { mongoose };
