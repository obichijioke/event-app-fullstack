import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async processWebhookEvent(webhookEventId: string) {
    // Get webhook event with endpoint details
    const webhookEvent = await this.prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
      include: {
        attempts: {
          include: {
            endpoint: true,
          },
        },
      },
    });

    if (!webhookEvent) {
      this.logger.error(`Webhook event not found: ${webhookEventId}`);
      return;
    }

    // Get the most recent attempt
    const latestAttempt = webhookEvent.attempts[0];
    if (!latestAttempt) {
      this.logger.error(
        `No attempts found for webhook event: ${webhookEventId}`,
      );
      return;
    }

    const { endpoint } = latestAttempt;

    // Check if endpoint is active
    if (!endpoint.active) {
      this.logger.log(`Webhook endpoint is not active: ${endpoint.id}`);
      return;
    }

    // Prepare payload
    const payload = {
      id: webhookEvent.id,
      topic: webhookEvent.topic,
      payload: webhookEvent.payload,
      timestamp: webhookEvent.createdAt,
    };

    // Generate signature
    const signature = this.generateSignature(payload, endpoint.secret);

    try {
      // Send webhook
      const response = await axios.post(endpoint.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'User-Agent': 'EventApp-Webhooks/1.0',
        },
        timeout: 30000, // 30 seconds default timeout
      });

      // Update attempt status
      await this.prisma.webhookAttempt.update({
        where: { id: latestAttempt.id },
        data: {
          statusCode: response.status,
          success: true,
        },
      });

      this.logger.log(`Webhook delivered successfully: ${webhookEventId}`);
    } catch (error) {
      // Handle delivery failure
      await this.handleWebhookFailure(latestAttempt.id, error);
    }
  }

  async retryWebhookEvent(webhookEventId: string) {
    // Get webhook event
    const webhookEvent = await this.prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
      include: {
        attempts: {
          include: {
            endpoint: true,
          },
        },
      },
    });

    if (!webhookEvent) {
      this.logger.error(`Webhook event not found: ${webhookEventId}`);
      return;
    }

    // Get the most recent attempt
    const latestAttempt = webhookEvent.attempts[0];
    if (!latestAttempt) {
      this.logger.error(
        `No attempts found for webhook event: ${webhookEventId}`,
      );
      return;
    }

    // Check if we've exceeded retry limit (default 3 retries)
    if (latestAttempt.retryCount >= 3) {
      await this.prisma.webhookAttempt.update({
        where: { id: latestAttempt.id },
        data: {
          success: false,
          errorMessage: 'Max retry attempts exceeded',
        },
      });

      this.logger.error(
        `Webhook failed after ${latestAttempt.retryCount} attempts: ${webhookEventId}`,
      );
      return;
    }

    // Update retry count
    await this.prisma.webhookAttempt.update({
      where: { id: latestAttempt.id },
      data: {
        retryCount: latestAttempt.retryCount + 1,
        attemptedAt: new Date(),
        success: false,
      },
    });

    // Calculate exponential backoff delay
    const delay = this.calculateRetryDelay(latestAttempt.retryCount);

    // Schedule retry
    await this.scheduleRetry(webhookEventId, delay);
  }

  private async handleWebhookFailure(attemptId: string, error: any) {
    // Update attempt with error details
    await this.prisma.webhookAttempt.update({
      where: { id: attemptId },
      data: {
        statusCode: error.response?.status || null,
        success: false,
        errorMessage: error.message,
      },
    });

    // Get attempt details to check if we should retry
    const attempt = await this.prisma.webhookAttempt.findUnique({
      where: { id: attemptId },
      include: {
        webhookEvent: true,
      },
    });

    if (!attempt) {
      return;
    }

    // Check if we should retry
    if (attempt.retryCount < 3) {
      // Calculate exponential backoff delay
      const delay = this.calculateRetryDelay(attempt.retryCount);

      // Schedule retry
      await this.scheduleRetry(attempt.webhookEventId, delay);
    } else {
      // Mark as permanently failed
      await this.prisma.webhookAttempt.update({
        where: { id: attemptId },
        data: {
          success: false,
          errorMessage: 'Max retry attempts exceeded',
        },
      });

      this.logger.error(
        `Webhook failed permanently: ${attempt.webhookEventId}`,
      );
    }
  }

  private generateSignature(payload: any, secret?: string): string {
    if (!secret) {
      return '';
    }

    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString, 'utf8')
      .digest('hex');
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(2, retryCount),
      maxDelay,
    );

    // Add jitter (±25% of delay)
    const jitterFactor = 0.75 + Math.random() * 0.5;
    return Math.floor(exponentialDelay * jitterFactor);
  }

  private async scheduleRetry(webhookEventId: string, delayMs: number) {
    // Store retry in Redis with expiration
    const retryKey = `webhook:retry:${webhookEventId}`;
    await this.redisService.set(
      retryKey,
      webhookEventId,
      Math.ceil(delayMs / 1000),
    );

    this.logger.log(
      `Scheduled webhook retry in ${delayMs}ms: ${webhookEventId}`,
    );
  }

  async triggerWebhook(endpointId: string, topic: string, payload: any) {
    // Get webhook endpoint
    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      this.logger.error(`Webhook endpoint not found: ${endpointId}`);
      return;
    }

    // Check if endpoint is active and subscribed to this event type
    if (!endpoint.active || !endpoint.eventFilters.includes(topic)) {
      return;
    }

    // Create webhook event
    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        topic,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      },
    });

    // Create webhook attempt
    await this.prisma.webhookAttempt.create({
      data: {
        webhookEventId: webhookEvent.id,
        endpointId: endpoint.id,
        retryCount: 0,
      },
    });

    // Process webhook event
    await this.processWebhookEvent(webhookEvent.id);

    return webhookEvent;
  }
}
