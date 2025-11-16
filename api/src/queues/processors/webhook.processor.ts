import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';
import { WebhookProcessorService } from '../../webhooks/services/webhook-processor.service';

export interface WebhookJobData {
  webhookEventId: string;
  retryCount?: number;
}

@Injectable()
export class WebhookProcessor extends BaseQueueProcessor {
  constructor(
    redisService: RedisService,
    private readonly webhookProcessorService: WebhookProcessorService,
  ) {
    super(redisService, 'webhook');
  }

  async process(job: Job<WebhookJobData>): Promise<any> {
    const { webhookEventId, retryCount = 0 } = job.data;

    this.logger.log(
      `Processing webhook event: ${webhookEventId}, retry count: ${retryCount}`,
    );

    try {
      // Process the webhook event
      await this.webhookProcessorService.processWebhookEvent(webhookEventId);

      return {
        success: true,
        webhookEventId,
        retryCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process webhook event: ${webhookEventId}`,
        error,
      );

      // If we haven't reached the max retry count, throw the error to trigger a retry
      if (retryCount < 3) {
        throw error;
      }

      // If we've reached the max retry count, mark as failed
      return {
        success: false,
        webhookEventId,
        retryCount,
        error: error.message,
      };
    }
  }
}
