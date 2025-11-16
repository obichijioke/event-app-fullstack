import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CleanupJobData {
  type:
    | 'expired_sessions'
    | 'old_notifications'
    | 'completed_orders'
    | 'old_webhook_events'
    | 'audit_logs';
  daysOld?: number;
  dryRun?: boolean;
}

@Injectable()
export class CleanupProcessor extends BaseQueueProcessor {
  constructor(
    redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {
    super(redisService, 'cleanup');
  }

  async process(job: Job<CleanupJobData>): Promise<any> {
    const { type, daysOld = 30, dryRun = false } = job.data;

    this.logger.log(
      `Running ${type} cleanup for data older than ${daysOld} days (dry run: ${dryRun})`,
    );

    try {
      let result: any = {
        type,
        daysOld,
        dryRun,
        deletedCount: 0,
      };

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      switch (type) {
        case 'expired_sessions':
          result = await this.cleanupExpiredSessions(cutoffDate, dryRun);
          break;

        case 'old_notifications':
          result = await this.cleanupOldNotifications(cutoffDate, dryRun);
          break;

        case 'completed_orders':
          result = await this.cleanupCompletedOrders(cutoffDate, dryRun);
          break;

        case 'old_webhook_events':
          result = await this.cleanupOldWebhookEvents(cutoffDate, dryRun);
          break;

        case 'audit_logs':
          result = await this.cleanupAuditLogs(cutoffDate, dryRun);
          break;

        default:
          throw new Error(`Unknown cleanup type: ${type}`);
      }

      this.logger.log(
        `Completed ${type} cleanup: ${result.deletedCount} items ${dryRun ? 'would be' : ''} deleted`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to run ${type} cleanup`, error);
      throw error;
    }
  }

  private async cleanupExpiredSessions(cutoffDate: Date, dryRun: boolean) {
    // Note: Session model is not in the schema, so we'll skip this for now
    // Find expired sessions
    // const expiredSessions = await this.prisma.session.findMany({
    //   where: {
    //     expiresAt: {
    //       lt: cutoffDate,
    //     },
    //   },
    // });

    if (dryRun) {
      return {
        type: 'expired_sessions',
        daysOld: Math.floor(
          (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
        dryRun,
        deletedCount: 0, // expiredSessions.length,
      };
    }

    // Delete expired sessions
    // const result = await this.prisma.session.deleteMany({
    //   where: {
    //     expiresAt: {
    //       lt: cutoffDate,
    //     },
    //   },
    // });

    return {
      type: 'expired_sessions',
      daysOld: Math.floor(
        (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
      dryRun,
      deletedCount: 0, // result.count,
    };
  }

  private async cleanupOldNotifications(cutoffDate: Date, dryRun: boolean) {
    // Note: Notification model is not in the schema, so we'll skip this for now
    // Find old notifications
    // const oldNotifications = await this.prisma.notification.findMany({
    //   where: {
    //     createdAt: {
    //       lt: cutoffDate,
    //     },
    //     read: true, // Only clean up read notifications
    //   },
    // });

    if (dryRun) {
      return {
        type: 'old_notifications',
        daysOld: Math.floor(
          (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
        dryRun,
        deletedCount: 0, // oldNotifications.length,
      };
    }

    // Delete old notifications
    // const result = await this.prisma.notification.deleteMany({
    //   where: {
    //     createdAt: {
    //       lt: cutoffDate,
    //     },
    //     read: true, // Only clean up read notifications
    //   },
    // });

    return {
      type: 'old_notifications',
      daysOld: Math.floor(
        (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
      dryRun,
      deletedCount: 0, // result.count,
    };
  }

  private async cleanupCompletedOrders(cutoffDate: Date, dryRun: boolean) {
    // Find old completed orders
    const oldOrders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: 'paid',
      },
    });

    if (dryRun) {
      return {
        type: 'completed_orders',
        daysOld: Math.floor(
          (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
        dryRun,
        deletedCount: oldOrders.length,
      };
    }

    // Delete old completed orders
    const result = await this.prisma.order.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: 'paid',
      },
    });

    return {
      type: 'completed_orders',
      daysOld: Math.floor(
        (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
      dryRun,
      deletedCount: result.count,
    };
  }

  private async cleanupOldWebhookEvents(cutoffDate: Date, dryRun: boolean) {
    // Find old webhook events
    const oldWebhookEvents = await this.prisma.webhookEvent.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (dryRun) {
      return {
        type: 'old_webhook_events',
        daysOld: Math.floor(
          (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
        dryRun,
        deletedCount: oldWebhookEvents.length,
      };
    }

    // Delete old webhook events
    const result = await this.prisma.webhookEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      type: 'old_webhook_events',
      daysOld: Math.floor(
        (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
      dryRun,
      deletedCount: result.count,
    };
  }

  private async cleanupAuditLogs(cutoffDate: Date, dryRun: boolean) {
    // Find old audit logs
    const oldAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (dryRun) {
      return {
        type: 'audit_logs',
        daysOld: Math.floor(
          (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
        dryRun,
        deletedCount: oldAuditLogs.length,
      };
    }

    // Delete old audit logs
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      type: 'audit_logs',
      daysOld: Math.floor(
        (new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
      dryRun,
      deletedCount: result.count,
    };
  }
}
