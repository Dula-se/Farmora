import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('[MongoDB] Already connected.');
    return;
  }

  const uri = config.mongo.uri || 'mongodb://127.0.0.1:27017/farmora';
  console.log(`[MongoDB] Connecting to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')} ...`);

  try {
    await mongoose.connect(uri, {
      dbName: config.mongo.dbName,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`[MongoDB] ✅ Connected to database: "${config.mongo.dbName}"`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[MongoDB] ⚠️  Disconnected.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] ❌ Connection error:', err.message);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[MongoDB] ❌ Failed to connect:', message);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected.');
}

export { mongoose };
