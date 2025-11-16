import { Injectable, Inject, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueuesService, QueueName } from '../queues.service';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { NotificationsGateway } from '../../websockets/notifications.gateway';

export interface NotificationJobData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  emailData?: {
    template?: string;
    context?: Record<string, any>;
  };
}

@Injectable()
export class NotificationProcessor extends BaseQueueProcessor {
  constructor(
    redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly queuesService: QueuesService,
    @Optional() private readonly notificationsGateway?: NotificationsGateway,
  ) {
    super(redisService, 'notification');
  }

  async process(job: Job<NotificationJobData>): Promise<any> {
    const startTime = Date.now();
    const {
      userId,
      type,
      title,
      message,
      data,
      channels = ['in_app'],
      emailData,
    } = job.data;

    this.logger.log(
      `Processing notification job ${job.id} for user: ${userId}, type: ${type}, channels: ${channels.join(',')}`,
    );

    try {
      // Normalize message/body (admin enqueues 'body' in some places)
      const resolvedMessage =
        message ??
        (typeof data === 'object' && data !== null && 'body' in data
          ? String((data as Record<string, unknown>)['body'])
          : '');

      // Create in-app notification
      if (channels.includes('in_app')) {
        const notification = await this.prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message: resolvedMessage,
            data,
            channels,
            readAt: null,
          },
        });
        this.logger.log(`Created in-app notification for user ${userId}`);

        // Emit WebSocket event for real-time notification
        if (this.notificationsGateway) {
          try {
            this.notificationsGateway.sendToUser(
              userId,
              'notification:new',
              notification,
            );
            this.logger.log(
              `Emitted WebSocket event for notification ${notification.id}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to emit WebSocket event: ${error.message}`,
            );
          }
        }
      }

      // Send email notification — enqueue to email queue so EmailProcessor handles delivery
      if (channels.includes('email') && emailData) {
        try {
          // Resolve recipient email via Prisma (best-effort)
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });
          const to = user?.email || userId;
          this.logger.log(`Enqueuing email notification to ${to} via queue`);
          await this.queuesService.addJob(
            QueueName.EMAIL,
            'send-email',
            {
              to,
              subject: title,
              template: emailData.template,
              context: {
                ...(emailData.context || {}),
                message: resolvedMessage,
                recipientName: user?.name,
              },
            },
            { attempts: 3 },
          );
        } catch (err) {
          this.logger.error(
            `Failed to enqueue email for user ${userId}: ${String(err)}`,
          );
        }
      }

      // Send push notification
      if (channels.includes('push')) {
        // In a real implementation, you would use a push notification service
        this.logger.log(`Sending push notification to user: ${userId}`);
        // await this.pushService.sendPushNotification({
        //   userId,
        //   title,
        //   message,
        //   data,
        // });
      }

      // Send SMS notification
      if (channels.includes('sms')) {
        // In a real implementation, you would use an SMS service
        this.logger.log(`Sending SMS notification to user: ${userId}`);
        // await this.smsService.sendSMS({
        //   to: user.phone,
        //   message,
        // });
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Notification job ${job.id} completed in ${duration}ms`);

      return {
        success: true,
        userId,
        type: type as string,
        title,
        channels: channels as string[],
        _meta: { duration, jobId: job.id },
      };
    } catch (error) {
      this.logger.error(
        `Failed to process notification for user: ${userId}`,
        error,
      );
      throw error;
    }
  }
}
