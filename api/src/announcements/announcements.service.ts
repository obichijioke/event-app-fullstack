import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { QueuesService, QueueName } from '../queues/queues.service';
import { NotificationType, NotificationCategory } from '@prisma/client';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private queuesService: QueuesService,
  ) {}

  async create(eventId: string, userId: string, dto: CreateAnnouncementDto) {
    // Verify user has permission for this event
    await this.verifyEventAccess(eventId, userId);

    const announcement = await this.prisma.eventAnnouncement.create({
      data: {
        eventId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'info',
        isActive: dto.isActive ?? true,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        publishedAt: dto.scheduledFor ? null : new Date(),
      },
    });

    // Send notification immediately if requested and not scheduled
    if (dto.sendNotification && !dto.scheduledFor) {
      await this.sendAnnouncementNotification(announcement);
    }

    return announcement;
  }

  async findByEvent(eventId: string, includeInactive = false) {
    const where: any = { eventId };
    if (!includeInactive) {
      where.isActive = true;
      where.publishedAt = { not: null };
    }

    return this.prisma.eventAnnouncement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    eventId: string,
    announcementId: string,
    userId: string,
    dto: UpdateAnnouncementDto,
  ) {
    await this.verifyEventAccess(eventId, userId);

    const announcement = await this.prisma.eventAnnouncement.findFirst({
      where: { id: announcementId, eventId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.eventAnnouncement.update({
      where: { id: announcementId },
      data: {
        ...dto,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      },
    });
  }

  async remove(eventId: string, announcementId: string, userId: string) {
    await this.verifyEventAccess(eventId, userId);

    const announcement = await this.prisma.eventAnnouncement.findFirst({
      where: { id: announcementId, eventId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.eventAnnouncement.delete({
      where: { id: announcementId },
    });
  }

  // Track view
  async trackView(announcementId: string, userId: string): Promise<void> {
    await this.prisma.announcementView.upsert({
      where: {
        announcementId_userId: { announcementId, userId },
      },
      create: { announcementId, userId },
      update: { viewedAt: new Date() },
    });

    await this.prisma.eventAnnouncement.update({
      where: { id: announcementId },
      data: { viewCount: { increment: 1 } },
    });
  }

  // Dismissal management
  async dismissAnnouncement(
    announcementId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.announcementDismissal.create({
      data: { announcementId, userId },
    });
  }

  async getDismissed(eventId: string, userId: string): Promise<string[]> {
    const dismissals = await this.prisma.announcementDismissal.findMany({
      where: {
        userId,
        announcement: { eventId },
      },
      select: { announcementId: true },
    });

    return dismissals.map((d) => d.announcementId);
  }

  async undismissAnnouncement(
    announcementId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.announcementDismissal.delete({
      where: {
        announcementId_userId: { announcementId, userId },
      },
    });
  }

  // Analytics
  async getAnalytics(eventId: string, userId: string) {
    await this.verifyEventAccess(eventId, userId);

    const announcements = await this.prisma.eventAnnouncement.findMany({
      where: { eventId },
      include: {
        views: true,
        dismissals: true,
      },
    });

    const totalViews = announcements.reduce((sum, a) => sum + a.viewCount, 0);
    const totalDismissals = announcements.reduce(
      (sum, a) => sum + a.dismissals.length,
      0,
    );

    const allViewers = new Set<string>();
    announcements.forEach((a) => {
      a.views.forEach((v) => allViewers.add(v.userId));
    });

    const byType = announcements.reduce(
      (acc, a) => {
        const existing = acc.find((item) => item.type === a.type);
        if (existing) {
          existing.count += 1;
          existing.views += a.viewCount;
        } else {
          acc.push({ type: a.type, count: 1, views: a.viewCount });
        }
        return acc;
      },
      [] as Array<{ type: string; count: number; views: number }>,
    );

    const topAnnouncements = announcements
      .map((a) => ({
        id: a.id,
        title: a.title,
        views: a.viewCount,
        dismissals: a.dismissals.length,
        engagementRate:
          a.viewCount > 0
            ? (a.viewCount / (a.viewCount + a.dismissals.length)) * 100
            : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalAnnouncements: announcements.length,
      activeAnnouncements: announcements.filter((a) => a.isActive).length,
      scheduledAnnouncements: announcements.filter(
        (a) => a.scheduledFor && !a.publishedAt,
      ).length,
      totalViews,
      uniqueViewers: allViewers.size,
      totalDismissals,
      byType,
      topAnnouncements,
    };
  }

  // Send notification to all ticket holders
  async sendAnnouncementNotification(announcement: any): Promise<void> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        eventId: announcement.eventId,
        status: 'issued',
      },
      select: { ownerId: true },
      distinct: ['ownerId'],
    });

    for (const ticket of tickets) {
      await this.queuesService.addJob(
        QueueName.NOTIFICATION,
        'send-notification',
        {
          userId: ticket.ownerId,
          type: this.mapAnnouncementTypeToNotificationType(announcement.type),
          title: `Event Update: ${announcement.title}`,
          message: announcement.message,
          channels:
            announcement.type === 'urgent' || announcement.type === 'important'
              ? ['in_app', 'email', 'push']
              : ['in_app'],
          category: NotificationCategory.event,
          actionUrl: `/events/${announcement.eventId}`,
          actionText: 'View Event',
        },
      );
    }
  }

  private mapAnnouncementTypeToNotificationType(
    type: string,
  ): NotificationType {
    switch (type) {
      case 'urgent':
      case 'important':
        return NotificationType.warning;
      case 'warning':
        return NotificationType.warning;
      case 'info':
      default:
        return NotificationType.info;
    }
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        org: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.org.members.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to manage this event',
      );
    }
  }
}
