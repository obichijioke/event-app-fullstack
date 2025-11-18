import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  NotificationQueryDto,
  BroadcastNotificationDto,
} from '../dto/notification.dto';
import { Prisma, NotificationChannel } from '@prisma/client';

@Injectable()
export class AdminNotificationService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(query: NotificationQueryDto) {
    const {
      page = 1,
      limit = 10,
      userId,
      type,
      category,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    const orderBy: Prisma.NotificationOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'type',
        'category',
        'createdAt',
        'readAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          userId: true,
          type: true,
          category: true,
          title: true,
          message: true,
          channels: true,
          readAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const data = notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      userEmail: notification.user.email,
      userName: notification.user.name,
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      channels: notification.channels,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async broadcastNotification(dto: BroadcastNotificationDto) {
    const {
      type,
      category,
      title,
      message,
      channels = [NotificationChannel.in_app],
      data,
      actionUrl,
      actionText,
      userIds,
    } = dto;

    let targetUserIds: string[];

    if (userIds && userIds.length > 0) {
      // Send to specific users
      targetUserIds = userIds;
    } else {
      // Broadcast to all users
      const users = await this.prisma.user.findMany({
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      throw new BadRequestException('No users found to send notification');
    }

    // Create notifications for all target users
    const notifications = await this.prisma.notification.createMany({
      data: targetUserIds.map((userId) => ({
        userId,
        type,
        category,
        title,
        message,
        channels,
        data: data || {},
        actionUrl,
        actionText,
      })),
    });

    return {
      message: 'Broadcast notification sent successfully',
      sentCount: notifications.count,
      targetUserIds,
    };
  }

  async deleteNotification(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  async getNotificationStats() {
    const [total, unread, byCategory, byType] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { readAt: null } }),
      this.prisma.notification.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
    ]);

    const recent24h = await this.prisma.notification.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      total,
      unread,
      read: total - unread,
      recent24h,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        count: item._count.id,
      })),
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
    };
  }
}
