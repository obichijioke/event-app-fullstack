import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateWebhookDto,
  CreateWebhookEventDto,
  RetryWebhookDto,
} from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { checkOrgPermission } from '../common/utils';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private webhookProcessorService: WebhookProcessorService,
  ) {}

  async createWebhook(
    orgId: string,
    userId: string,
    createWebhookDto: CreateWebhookDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to create webhooks for this organization',
    );

    const { url, eventFilters, description, secret, active } = createWebhookDto;

    // Create webhook endpoint
    const webhook = await this.prisma.webhookEndpoint.create({
      data: {
        orgId,
        url,
        secret: secret || this.generateSecret(),
        eventFilters: eventFilters || [],
        active: active !== undefined ? active : true,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return webhook;
  }

  async findAllWebhooks(orgId: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const webhooks = await this.prisma.webhookEndpoint.findMany({
      where: {
        orgId,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return webhooks;
  }

  async findOneWebhook(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        attempts: {
          orderBy: {
            attemptedAt: 'desc',
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to view this webhook',
      );
    }

    return webhook;
  }

  async updateWebhook(
    id: string,
    orgId: string,
    userId: string,
    updateWebhookDto: UpdateWebhookDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to update webhooks for this organization',
    );

    // Check if webhook exists and belongs to the organization
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to update this webhook',
      );
    }

    const { url, eventFilters, description, secret, active } = updateWebhookDto;

    // Update webhook
    const updatedWebhook = await this.prisma.webhookEndpoint.update({
      where: { id },
      data: {
        url,
        secret,
        active,
        eventFilters,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedWebhook;
  }

  async removeWebhook(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to delete webhooks for this organization',
    );

    // Check if webhook exists and belongs to the organization
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to delete this webhook',
      );
    }

    // Delete webhook (cascade will handle related records)
    await this.prisma.webhookEndpoint.delete({
      where: { id },
    });

    return { message: 'Webhook deleted successfully' };
  }

  async getWebhookEvents(
    webhookId: string,
    orgId: string,
    userId: string,
    filters?: {
      status?: string;
      topic?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check if webhook exists and belongs to the organization
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to view events for this webhook',
      );
    }

    const whereClause: {
      attempts: {
        some: {
          endpointId: string;
          success?: boolean;
        };
      };
      topic?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      attempts: {
        some: {
          endpointId: webhookId,
        },
      },
    };

    if (filters?.status) {
      whereClause.attempts.some.success = filters.status === 'success';
    }

    if (filters?.topic) {
      whereClause.topic = filters.topic;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    const events = await this.prisma.webhookEvent.findMany({
      where: whereClause,
      include: {
        attempts: {
          where: {
            endpointId: webhookId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events;
  }

  async retryWebhookEvent(
    webhookEventId: string,
    orgId: string,
    userId: string,
  ) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get webhook event with endpoint details
    const webhookEvent = await this.prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
      include: {
        attempts: {
          include: {
            endpoint: true,
          },
        },
      },
    });

    if (!webhookEvent) {
      throw new NotFoundException('Webhook event not found');
    }

    // Get the most recent attempt
    const latestAttempt = webhookEvent.attempts[0];
    if (!latestAttempt) {
      throw new NotFoundException('No attempts found for webhook event');
    }

    if (latestAttempt.endpoint.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to retry this webhook event',
      );
    }

    // Retry webhook event
    await this.webhookProcessorService.retryWebhookEvent(webhookEventId);

    return { message: 'Webhook event retry initiated' };
  }

  async triggerWebhook(
    createWebhookEventDto: CreateWebhookEventDto,
    orgId: string,
    userId: string,
  ) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get webhook endpoint
    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id: createWebhookEventDto.webhookId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    if (endpoint.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to trigger webhooks for this organization',
      );
    }

    // Trigger webhook
    const webhookEvent = await this.webhookProcessorService.triggerWebhook(
      createWebhookEventDto.webhookId,
      createWebhookEventDto.eventType,
      createWebhookEventDto.data,
    );

    return webhookEvent;
  }

  async getWebhookStats(
    webhookId: string,
    orgId: string,
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    },
  ) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check if webhook exists and belongs to the organization
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to view stats for this webhook',
      );
    }

    const whereClause: {
      endpointId: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      endpointId: webhookId,
    };

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    const stats = await this.prisma.webhookAttempt.groupBy({
      by: ['success'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    return stats;
  }

  private generateSecret(): string {
    // Generate a random secret key
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
}
