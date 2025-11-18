import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
  key: string;
  url: string;
  bucket?: string;
  provider: 's3' | 'local';
}

export interface StorageConfig {
  provider: 's3' | 'local';
  s3?: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client?: S3Client;
  private config: StorageConfig;

  constructor(private configService: ConfigService) {
    this.config = this.buildConfig();
    this.initializeClients();
  }

  private buildConfig(): StorageConfig {
    const provider = this.configService.get<string>(
      'STORAGE_PROVIDER',
      'local',
    );

    if (provider === 's3') {
      return {
        provider: 's3',
        s3: {
          region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
          bucket: this.configService.get<string>('AWS_S3_BUCKET', ''),
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get<string>(
            'AWS_SECRET_ACCESS_KEY',
            '',
          ),
        },
      };
    } else {
      return {
        provider: 'local',
        local: {
          uploadDir: this.configService.get<string>('UPLOAD_DIR', './uploads'),
          baseUrl: this.configService.get<string>(
            'UPLOAD_BASE_URL',
            'http://localhost:3000/uploads',
          ),
        },
      };
    }
  }

  private initializeClients() {
    if (this.config.provider === 's3' && this.config.s3) {
      this.s3Client = new S3Client({
        region: this.config.s3.region,
        credentials: {
          accessKeyId: this.config.s3.accessKeyId,
          secretAccessKey: this.config.s3.secretAccessKey,
        },
      });
    }
  }

  /**
   * Upload a file buffer to storage
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    const key = `${folder}/${Date.now()}-${filename}`;

    if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
      return this.uploadToS3(buffer, key, mimeType);
    } else {
      return this.uploadToLocal(buffer, key, filename);
    }
  }

  /**
   * Upload to AWS S3
   */
  private async uploadToS3(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 client not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'private', // Documents should be private
      });

      await this.s3Client.send(command);

      // Generate a signed URL for access
      const getCommand = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 3600,
      }); // 1 hour

      this.logger.log(`File uploaded to S3: ${key}`);

      return {
        key,
        url: signedUrl,
        bucket: this.config.s3.bucket,
        provider: 's3',
      };
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${key}`, error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Upload to local filesystem
   */
  private async uploadToLocal(
    buffer: Buffer,
    key: string,
    filename: string,
  ): Promise<UploadResult> {
    if (!this.config.local) {
      throw new Error('Local storage not configured');
    }

    try {
      const filePath = path.join(this.config.local.uploadDir, key);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write file
      await fs.writeFile(filePath, buffer);

      const url = `${this.config.local.baseUrl}/${key}`;

      this.logger.log(
        `File uploaded locally: ${filePath} (original filename: ${filename || 'n/a'})`,
      );

      return {
        key,
        url,
        provider: 'local',
      };
    } catch (error) {
      this.logger.error(`Failed to upload locally: ${key}`, error);
      throw new Error('Failed to upload file locally');
    }
  }

  /**
   * Get a signed URL for accessing a file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
      const command = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: key,
      });

      return getSignedUrl(this.s3Client, command, { expiresIn });
    } else if (this.config.local) {
      // For local files, return the direct URL
      return `${this.config.local.baseUrl}/${key}`;
    } else {
      throw new Error('Storage provider not configured');
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.config.s3.bucket,
          Key: key,
        });

        await this.s3Client.send(command);
        this.logger.log(`File deleted from S3: ${key}`);
      } catch (error) {
        this.logger.error(`Failed to delete from S3: ${key}`, error);
        throw new Error('Failed to delete file from S3');
      }
    } else if (this.config.local) {
      try {
        const filePath = path.join(this.config.local.uploadDir, key);
        await fs.unlink(filePath);
        this.logger.log(`File deleted locally: ${filePath}`);
      } catch (error) {
        this.logger.error(`Failed to delete locally: ${key}`, error);
        throw new Error('Failed to delete file locally');
      }
    } else {
      throw new Error('Storage provider not configured');
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.config.s3.bucket,
          Key: key,
        });

        await this.s3Client.send(command);
        return true;
      } catch (error: any) {
        if (error.name === 'NoSuchKey') {
          return false;
        }
        throw error;
      }
    } else if (this.config.local) {
      try {
        const filePath = path.join(this.config.local.uploadDir, key);
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    } else {
      throw new Error('Storage provider not configured');
    }
  }
}
