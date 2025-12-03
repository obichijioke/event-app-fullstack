import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Clean up expired sessions daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredSessions() {
    this.logger.log('Starting cleanup of expired sessions...');

    try {
      const result = await this.prisma.userSession.deleteMany({
        where: {
          OR: [
            // Delete expired sessions
            {
              expiresAt: {
                lt: new Date(),
              },
            },
            // Delete revoked sessions older than 30 days
            {
              revokedAt: {
                not: null,
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      });

      this.logger.log(
        `Successfully cleaned up ${result.count} expired/old sessions`,
      );

      // Log session statistics
      await this.logSessionStats();
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error);
    }
  }

  /**
   * Clean up orphaned sessions (users deleted but sessions remain)
   * Runs weekly on Sunday at 3 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOrphanedSessions() {
    this.logger.log('Starting cleanup of orphaned sessions...');

    try {
      // Find sessions for deleted users (soft delete check)
      const orphanedSessions = await this.prisma.userSession.findMany({
        where: {
          user: {
            deletedAt: {
              not: null,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (orphanedSessions.length > 0) {
        const result = await this.prisma.userSession.deleteMany({
          where: {
            id: {
              in: orphanedSessions.map((s) => s.id),
            },
          },
        });

        this.logger.log(
          `Successfully cleaned up ${result.count} orphaned sessions`,
        );
      } else {
        this.logger.log('No orphaned sessions found');
      }
    } catch (error) {
      this.logger.error('Failed to cleanup orphaned sessions', error);
    }
  }

  /**
   * Log session statistics for monitoring
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async logSessionStats() {
    try {
      const [totalSessions, activeSessions, expiredSessions, revokedSessions] =
        await Promise.all([
          this.prisma.userSession.count(),
          this.prisma.userSession.count({
            where: {
              revokedAt: null,
              expiresAt: { gt: new Date() },
            },
          }),
          this.prisma.userSession.count({
            where: {
              revokedAt: null,
              expiresAt: { lte: new Date() },
            },
          }),
          this.prisma.userSession.count({
            where: {
              revokedAt: { not: null },
            },
          }),
        ]);

      this.logger.log(
        `Session Stats - Total: ${totalSessions}, Active: ${activeSessions}, Expired: ${expiredSessions}, Revoked: ${revokedSessions}`,
      );

      // Warn if active sessions are unusually high
      if (activeSessions > 1000) {
        this.logger.warn(
          `High number of active sessions detected: ${activeSessions}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to log session stats', error);
    }
  }

  /**
   * Manual cleanup method for admin use
   */
  async manualCleanup(options?: {
    olderThanDays?: number;
    includeActive?: boolean;
  }) {
    const olderThanDays = options?.olderThanDays ?? 30;
    const includeActive = options?.includeActive ?? false;

    this.logger.log(
      `Manual cleanup initiated - olderThanDays: ${olderThanDays}, includeActive: ${includeActive}`,
    );

    const deleteConditions: any = {
      OR: [
        // Delete revoked sessions older than specified days
        {
          revokedAt: {
            not: null,
            lt: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000),
          },
        },
        // Delete expired sessions
        {
          expiresAt: {
            lt: new Date(),
          },
        },
      ],
    };

    // Optionally include all old sessions, even active ones
    if (includeActive) {
      deleteConditions.OR.push({
        createdAt: {
          lt: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    const result = await this.prisma.userSession.deleteMany({
      where: deleteConditions,
    });

    this.logger.log(
      `Manual cleanup completed - deleted ${result.count} sessions`,
    );

    return {
      deletedCount: result.count,
      timestamp: new Date(),
    };
  }
}
