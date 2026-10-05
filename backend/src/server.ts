import os from 'os';
import { app } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import { seedDatabase } from './models/seed.js';

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function bootstrap() {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Seed demo data on first run
  if (config.nodeEnv !== 'test') {
    await seedDatabase();
  }

  // 3. Start HTTP server
  const server = app.listen(config.port, () => {
    const localIp = getLocalIpAddress();
    console.log('\n======================================================');
    console.log('🌾 Famora Backend API is running!');
    console.log(`🚀 Local URL:        http://localhost:${config.port}`);
    console.log(`📱 LAN / Mobile URL: http://${localIp}:${config.port}`);
    console.log(`🩺 Health check:     http://localhost:${config.port}/api/health`);
    console.log(`📁 Uploads dir:      http://localhost:${config.port}/uploads`);
    console.log(`📦 Storage provider: ${config.upload.provider}`);
    console.log(`🍃 MongoDB:          ${config.mongo.dbName}`);
    console.log('======================================================\n');
  });

  // Graceful Shutdown
  const shutdown = () => {
    console.log('\nShutting down server gracefully...');
    server.close(() => {
      console.log('Famora API server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
