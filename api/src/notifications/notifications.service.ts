import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  NotificationType,
  NotificationChannel,
  NotificationCategory,
  NotificationFrequency,
} from '@prisma/client';

export interface GetNotificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory;
  search?: string;
}

export interface NotificationListResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(
    params: GetNotificationsParams,
  ): Promise<NotificationListResponse> {
    const {
      userId,
      page = 1,
      limit = 20,
      unreadOnly = false,
      category,
      search,
    } = params;

    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    channels?: NotificationChannel[];
    category?: NotificationCategory;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
  }): Promise<any> {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        category: data.category || NotificationCategory.system,
        title: data.title,
        message: data.message,
        data: data.data || null,
        channels: data.channels || ['in_app'],
        actionUrl: data.actionUrl || null,
        actionText: data.actionText || null,
        imageUrl: data.imageUrl || null,
        readAt: null,
      },
    });
  }

  // Notification Preferences
  async getPreferences(userId: string): Promise<any[]> {
    // Get all categories
    const categories = Object.values(NotificationCategory);

    // Get existing preferences
    const existingPreferences =
      await this.prisma.notificationPreference.findMany({
        where: { userId },
      });

    // Create map of existing preferences
    const prefsMap = new Map(existingPreferences.map((p) => [p.category, p]));

    // Return preferences for all categories (with defaults for missing ones)
    return categories.map((category) => {
      const existing = prefsMap.get(category as NotificationCategory);
      return (
        existing || {
          category,
          inApp: 'instant',
          email: 'instant',
          push: 'instant',
          sms: 'disabled',
        }
      );
    });
  }

  async updatePreference(
    userId: string,
    category: NotificationCategory,
    data: {
      inApp?: NotificationFrequency;
      email?: NotificationFrequency;
      push?: NotificationFrequency;
      sms?: NotificationFrequency;
    },
  ): Promise<any> {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
      create: {
        userId,
        category,
        inApp: data.inApp || 'instant',
        email: data.email || 'instant',
        push: data.push || 'instant',
        sms: data.sms || 'disabled',
      },
      update: {
        inApp: data.inApp,
        email: data.email,
        push: data.push,
        sms: data.sms,
      },
    });
  }

  async bulkUpdatePreferences(
    userId: string,
    preferences: Array<{
      category: NotificationCategory;
      inApp?: NotificationFrequency;
      email?: NotificationFrequency;
      push?: NotificationFrequency;
      sms?: NotificationFrequency;
    }>,
  ): Promise<{ count: number }> {
    const operations = preferences.map((pref) =>
      this.prisma.notificationPreference.upsert({
        where: {
          userId_category: {
            userId,
            category: pref.category,
          },
        },
        create: {
          userId,
          category: pref.category,
          inApp: pref.inApp || 'instant',
          email: pref.email || 'instant',
          push: pref.push || 'instant',
          sms: pref.sms || 'disabled',
        },
        update: {
          inApp: pref.inApp,
          email: pref.email,
          push: pref.push,
          sms: pref.sms,
        },
      }),
    );

    await this.prisma.$transaction(operations);
    return { count: operations.length };
  }

  // Bulk Actions
  async bulkMarkAsRead(
    notificationIds: string[],
    userId: string,
  ): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async bulkDelete(
    notificationIds: string[],
    userId: string,
  ): Promise<{ count: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
    });

    return { count: result.count };
  }

  // Category Stats
  async getCategoryStats(
    userId: string,
  ): Promise<Array<{ category: string; count: number; unreadCount: number }>> {
    const categories = Object.values(NotificationCategory);

    const stats = await Promise.all(
      categories.map(async (category) => {
        const [count, unreadCount] = await Promise.all([
          this.prisma.notification.count({
            where: { userId, category: category as NotificationCategory },
          }),
          this.prisma.notification.count({
            where: {
              userId,
              category: category as NotificationCategory,
              readAt: null,
            },
          }),
        ]);

        return { category, count, unreadCount };
      }),
    );

    return stats;
  }
}
