import fs from 'fs';
import path from 'path';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { config } from '../config/env.js';
import { UploadedFileResponse } from '../types/index.js';

let blobServiceClient: BlobServiceClient | null = null;

function getAzureBlobServiceClient(): BlobServiceClient | null {
  if (blobServiceClient) return blobServiceClient;

  if (config.azure.connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    return blobServiceClient;
  }

  if (config.azure.accountName && config.azure.accountKey) {
    const credential = new StorageSharedKeyCredential(
      config.azure.accountName,
      config.azure.accountKey
    );
    blobServiceClient = new BlobServiceClient(
      `https://${config.azure.accountName}.blob.core.windows.net`,
      credential
    );
    return blobServiceClient;
  }

  return null;
}

export class StorageService {
  /**
   * Builds the public URL for an uploaded file
   */
  static getPublicUrl(folder: string, filename: string): string {
    if (config.upload.provider === 'azure' && config.azure.accountName) {
      return `https://${config.azure.accountName}.blob.core.windows.net/${config.azure.containerName}/${folder}/${filename}`;
    }
    return `${config.baseUrl}/uploads/${folder}/${filename}`;
  }

  /**
   * Uploads a file to Azure Blob Storage
   */
  static async uploadToAzure(
    filePath: string,
    folder: string,
    filename: string,
    mimeType: string
  ): Promise<string> {
    const client = getAzureBlobServiceClient();
    if (!client) {
      throw new Error('Azure Storage is not configured. Missing AZURE_STORAGE_CONNECTION_STRING or account credentials.');
    }

    const containerClient = client.getContainerClient(config.azure.containerName);

    // Attempt container auto-creation if not already created
    try {
      await containerClient.createIfNotExists({ access: 'blob' });
    } catch {
      // Container may already exist or need portal configuration
    }

    const blobPath = `${folder}/${filename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
        blobCacheControl: 'public, max-age=31536000',
      },
    });

    return blockBlobClient.url;
  }

  /**
   * Processes an uploaded Multer file and uploads to Azure or local storage
   */
  static async processUploadedFile(
    file: Express.Multer.File,
    folder = 'produce'
  ): Promise<UploadedFileResponse> {
    const filename = file.filename;
    let url: string;
    let storagePath: string;

    if (config.upload.provider === 'azure') {
      try {
        url = await this.uploadToAzure(file.path, folder, filename, file.mimetype);
        storagePath = `${folder}/${filename}`;

        // Clean up temporary disk file
        if (fs.existsSync(file.path)) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      } catch (azureErr) {
        console.error('Failed to upload to Azure Blob Storage, falling back to local storage:', azureErr);
        url = this.getPublicUrl(folder, filename);
        storagePath = `uploads/${folder}/${filename}`;
      }
    } else {
      url = this.getPublicUrl(folder, filename);
      storagePath = `uploads/${folder}/${filename}`;
    }

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      path: storagePath,
    };
  }

  /**
   * Transforms an uploaded Multer file into an API response object synchronously
   */
  static formatUploadedFile(file: Express.Multer.File, folder = 'produce'): UploadedFileResponse {
    const filename = file.filename;
    const url = this.getPublicUrl(folder, filename);

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      path: `uploads/${folder}/${filename}`,
    };
  }

  /**
   * Deletes a file safely from Azure Blob Storage or local storage
   */
  static async deleteFile(folder: string, filename: string): Promise<boolean> {
    if (config.upload.provider === 'azure') {
      try {
        const client = getAzureBlobServiceClient();
        if (client) {
          const containerClient = client.getContainerClient(config.azure.containerName);
          const blockBlobClient = containerClient.getBlockBlobClient(`${folder}/${filename}`);
          const res = await blockBlobClient.deleteIfExists();
          return res.succeeded;
        }
      } catch (err) {
        console.error('Failed to delete blob from Azure:', err);
      }
    }

    return this.deleteLocalFile(`uploads/${folder}/${path.basename(filename)}`);
  }

  /**
   * Deletes a local file safely if it exists
   */
  static async deleteLocalFile(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.resolve(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete file:', relativePath, err);
      return false;
    }
  }
}

