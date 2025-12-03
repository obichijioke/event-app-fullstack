import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';
import { MailerService } from '../../common/mailer/mailer.service';

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
  constructor(
    redisService: RedisService,
    private mailerService: MailerService,
  ) {
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

    this.logger.log(
      `Processing email job - To: ${Array.isArray(to) ? to.join(', ') : to}, Subject: ${subject}`,
    );

    try {
      // Handle multiple recipients
      const recipients = Array.isArray(to) ? to : [to];
      const results: Array<{
        recipient: string;
        status: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const recipient of recipients) {
        try {
          let result;

          // Use template if provided
          if (template && context) {
            this.logger.log(
              `Sending templated email using template: ${template}`,
            );
            result = await this.mailerService.sendTemplatedMail({
              to: recipient,
              subject,
              template,
              context,
            });
          } else {
            // Send regular email
            this.logger.log(`Sending email with HTML/text content`);
            result = await this.mailerService.sendMail({
              to: recipient,
              subject,
              html,
              text,
            });
          }

          results.push({
            recipient,
            status: 'sent',
            success: true,
          });

          this.logger.log(`Email sent successfully to ${recipient}`);
        } catch (error) {
          this.logger.error(
            `Failed to send email to ${recipient}: ${error.message}`,
            error.stack,
          );

          results.push({
            recipient,
            status: 'failed',
            success: false,
            error: error.message,
          });
        }
      }

      // Return aggregated results
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        results,
        subject,
      };
    } catch (error) {
      this.logger.error(
        `Email job processing failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
