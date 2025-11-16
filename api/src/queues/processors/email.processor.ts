import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailProcessor extends BaseQueueProcessor {
  constructor(redisService: RedisService) {
    super(redisService, 'email');
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const {
      to,
      subject,
      template,
      context,
      html,
      text,
      from,
      replyTo,
      attachments,
    } = job.data;

    // In a real implementation, you would use an email service like SendGrid, Mailgun, or AWS SES
    // For this example, we'll just log the email details
    this.logger.log(
      `Sending email to: ${Array.isArray(to) ? to.join(', ') : to}`,
    );
    this.logger.log(`Subject: ${subject}`);

    if (template) {
      this.logger.log(`Using template: ${template}`);
      if (context) {
        this.logger.log(`Template context: ${JSON.stringify(context)}`);
      }
    }

    if (html) {
      this.logger.log(`HTML content provided`);
    }

    if (text) {
      this.logger.log(`Text content provided`);
    }

    if (from) {
      this.logger.log(`From: ${from}`);
    }

    if (replyTo) {
      this.logger.log(`Reply to: ${replyTo}`);
    }

    if (attachments && attachments.length > 0) {
      this.logger.log(`Attachments: ${attachments.length}`);
    }

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real implementation, you would return the email service response
    return {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'sent',
      to,
      subject,
    };
  }
}
