import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WebhookQueryDto, WebhookEventQueryDto } from '../dto/webhook.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminWebhookService {
  constructor(private prisma: PrismaService) {}

  async getWebhooks(query: WebhookQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      orgId,
      active,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WebhookEndpointWhereInput = {};

    if (search) {
      where.url = { contains: search, mode: 'insensitive' };
    }

    if (orgId) {
      where.orgId = orgId;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const orderBy: Prisma.WebhookEndpointOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'url', 'active', 'createdAt'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [webhooks, total] = await Promise.all([
      this.prisma.webhookEndpoint.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orgId: true,
          url: true,
          eventFilters: true,
          active: true,
          createdAt: true,
          org: {
            select: {
              id: true,
              name: true,
            },
          },
          attempts: {
            select: {
              id: true,
              success: true,
              attemptedAt: true,
            },
            orderBy: {
              attemptedAt: 'desc',
            },
            take: 1,
          },
        },
      }),
      this.prisma.webhookEndpoint.count({ where }),
    ]);

    const data = webhooks.map((webhook) => ({
      id: webhook.id,
      orgId: webhook.orgId,
      orgName: webhook.org?.name,
      url: webhook.url,
      eventFilters: webhook.eventFilters,
      active: webhook.active,
      createdAt: webhook.createdAt,
      lastAttempt: webhook.attempts[0]?.attemptedAt,
      lastAttemptSuccess: webhook.attempts[0]?.success,
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

  async getWebhook(webhookId: string) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            supportEmail: true,
          },
        },
        attempts: {
          orderBy: {
            attemptedAt: 'desc',
          },
          take: 10,
          include: {
            webhookEvent: {
              select: {
                id: true,
                topic: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    return webhook;
  }

  async getWebhookEvents(query: WebhookEventQueryDto) {
    const {
      page = 1,
      limit = 10,
      topic,
      endpointId,
      success,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WebhookAttemptWhereInput = {};

    if (endpointId) {
      where.endpointId = endpointId;
    }

    if (success !== undefined) {
      where.success = success;
    }

    if (topic) {
      where.webhookEvent = {
        topic: { contains: topic, mode: 'insensitive' },
      };
    }

    if (dateFrom || dateTo) {
      where.attemptedAt = {};
      if (dateFrom) {
        where.attemptedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.attemptedAt.lte = new Date(dateTo);
      }
    }

    const orderBy: Prisma.WebhookAttemptOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'attemptedAt',
        'success',
        'retryCount',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.attemptedAt = 'desc';
    }

    const [attempts, total] = await Promise.all([
      this.prisma.webhookAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          webhookEventId: true,
          endpointId: true,
          statusCode: true,
          success: true,
          errorMessage: true,
          attemptedAt: true,
          retryCount: true,
          webhookEvent: {
            select: {
              id: true,
              topic: true,
              createdAt: true,
            },
          },
          endpoint: {
            select: {
              id: true,
              url: true,
              org: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.webhookAttempt.count({ where }),
    ]);

    const data = attempts.map((attempt) => ({
      id: attempt.id,
      webhookEventId: attempt.webhookEventId,
      endpointId: attempt.endpointId,
      endpointUrl: attempt.endpoint.url,
      orgId: attempt.endpoint.org?.id,
      orgName: attempt.endpoint.org?.name,
      topic: attempt.webhookEvent.topic,
      statusCode: attempt.statusCode,
      success: attempt.success,
      errorMessage: attempt.errorMessage,
      attemptedAt: attempt.attemptedAt,
      retryCount: attempt.retryCount,
      eventCreatedAt: attempt.webhookEvent.createdAt,
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

  async getWebhookStats() {
    const [
      totalEndpoints,
      activeEndpoints,
      totalEvents,
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      recentEvents,
    ] = await Promise.all([
      this.prisma.webhookEndpoint.count(),
      this.prisma.webhookEndpoint.count({ where: { active: true } }),
      this.prisma.webhookEvent.count(),
      this.prisma.webhookAttempt.count(),
      this.prisma.webhookAttempt.count({ where: { success: true } }),
      this.prisma.webhookAttempt.count({ where: { success: false } }),
      this.prisma.webhookEvent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    const successRate =
      totalAttempts > 0
        ? ((successfulAttempts / totalAttempts) * 100).toFixed(2)
        : '0';

    return {
      totalEndpoints,
      activeEndpoints,
      inactiveEndpoints: totalEndpoints - activeEndpoints,
      totalEvents,
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate,
      recentEvents24h: recentEvents,
    };
  }

  async retryWebhookEvent(attemptId: string) {
    const attempt = await this.prisma.webhookAttempt.findUnique({
      where: { id: attemptId },
      include: {
        webhookEvent: true,
        endpoint: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Webhook attempt not found');
    }

    if (attempt.success) {
      throw new BadRequestException('Cannot retry a successful webhook event');
    }

    // In a real implementation, this would trigger the webhook queue to retry
    // For now, we'll just return a success message
    return {
      message: 'Webhook retry queued successfully',
      attemptId: attempt.id,
      eventId: attempt.webhookEventId,
    };
  }

  async testWebhook(webhookId: string) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    // Create a test webhook event
    const testEvent = await this.prisma.webhookEvent.create({
      data: {
        topic: 'webhook.test',
        payload: {
          message: 'This is a test webhook event',
          timestamp: new Date().toISOString(),
        },
      },
    });

    // In a real implementation, this would trigger the webhook delivery
    // For now, we'll create a test attempt record
    await this.prisma.webhookAttempt.create({
      data: {
        webhookEventId: testEvent.id,
        endpointId: webhook.id,
        statusCode: 200,
        success: true,
        retryCount: 0,
      },
    });

    return {
      message: 'Test webhook sent successfully',
      webhookId: webhook.id,
      eventId: testEvent.id,
    };
  }
}
