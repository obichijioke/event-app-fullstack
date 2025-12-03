import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { AnnouncementsService } from './announcements.service';

@Injectable()
export class AnnouncementsSchedulerService {
  private readonly logger = new Logger(AnnouncementsSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private announcementsService: AnnouncementsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledAnnouncements() {
    const now = new Date();

    // Find announcements scheduled for publication
    const scheduledAnnouncements = await this.prisma.eventAnnouncement.findMany(
      {
        where: {
          scheduledFor: { lte: now },
          publishedAt: null,
          isActive: false, // Draft state
        },
      },
    );

    this.logger.log(
      `Found ${scheduledAnnouncements.length} announcements to publish`,
    );

    for (const announcement of scheduledAnnouncements) {
      try {
        // Publish announcement
        await this.prisma.eventAnnouncement.update({
          where: { id: announcement.id },
          data: {
            isActive: true,
            publishedAt: now,
          },
        });

        // Send notification if it's important/urgent
        if (
          announcement.type === 'important' ||
          announcement.type === 'urgent'
        ) {
          await this.announcementsService.sendAnnouncementNotification(
            announcement,
          );
        }

        this.logger.log(`Published announcement ${announcement.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to publish announcement ${announcement.id}:`,
          error,
        );
      }
    }
  }
}
