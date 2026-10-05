import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || '5001'}`,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:8081',
  mongo: {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB_NAME || 'farmora',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'famora_dev_secret_key_change_me_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    provider: (process.env.STORAGE_PROVIDER as 'local' | 'cloudinary' | 's3' | 'azure') || 'local',
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'famora-uploads',
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-southeast-1',
    bucket: process.env.AWS_S3_BUCKET || '',
    endpoint: process.env.AWS_S3_ENDPOINT || '',
  },
};

