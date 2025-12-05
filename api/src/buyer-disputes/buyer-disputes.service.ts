import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationCategory,
  DisputeType,
} from '@prisma/client';
import {
  CreateDisputeDto,
  AddDisputeMessageDto,
  AppealDisputeDto,
} from './dto/create-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';

@Injectable()
export class BuyerDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new platform dispute
   */
  async create(userId: string, dto: CreateDisputeDto) {
    // Validate dispute eligibility
    await this.validateDisputeEligibility(dto.orderId, userId);

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            orgId: true,
            startAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate response deadline (7 days from now)
    const respondByAt = new Date();
    respondByAt.setDate(respondByAt.getDate() + 7);

    // Create dispute
    const dispute = await this.prisma.dispute.create({
      data: {
        orderId: dto.orderId,
        type: DisputeType.platform,
        initiatorId: userId,
        category: dto.category,
        subcategory: dto.subcategory,
        description: dto.description,
        status: 'open',
        amountCents: order.totalCents,
        respondByAt,
      },
      include: {
        order: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                orgId: true,
              },
            },
          },
        },
      },
    });

    // Create initial message
    await this.prisma.disputeMessage.create({
      data: {
        disputeId: dispute.id,
        senderId: userId,
        senderRole: 'buyer',
        message: dto.description,
      },
    });

    // Notify organization members
    await this.notifyOrganization(
      order.event.orgId,
      dispute,
      'dispute_created',
    );

    return dispute;
  }

  /**
   * Validate if user can create dispute for this order
   */
  private async validateDisputeEligibility(
    orderId: string,
    userId: string,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        disputes: {
          where: {
            type: DisputeType.platform,
          },
        },
      },
    });

    // 1. Order exists and belongs to user
    if (!order || order.buyerId !== userId) {
      throw new ForbiddenException('Order not found or access denied');
    }

    // 2. Order is paid or refunded (can dispute refunded orders too)
    if (order.status !== 'paid' && order.status !== 'refunded') {
      throw new BadRequestException(
        'Can only dispute paid or refunded orders',
      );
    }

    // 3. Check time limits (90 days from order OR 30 days after event)
    const orderAge = Date.now() - order.createdAt.getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (order.event.startAt) {
      const eventStartTime = new Date(order.event.startAt).getTime();
      const eventEnded = eventStartTime < Date.now();

      if (eventEnded) {
        const daysSinceEvent = Date.now() - eventStartTime;
        if (daysSinceEvent > thirtyDaysMs) {
          throw new BadRequestException(
            'Dispute window closed (30 days after event)',
          );
        }
      }
    } else {
      // No event date, use 90-day limit from purchase
      if (orderAge > ninetyDaysMs) {
        throw new BadRequestException(
          'Dispute window closed (90 days from purchase)',
        );
      }
    }

    // 4. No existing open platform disputes on this order
    const openDispute = order.disputes.find(
      (d) => !['resolved', 'closed'].includes(d.status),
    );

    if (openDispute) {
      throw new BadRequestException(
        'An open dispute already exists for this order',
      );
    }
  }

  /**
   * Get all disputes for the current user
   */
  async findAll(userId: string, query: DisputeQueryDto) {
    const { page = 1, limit = 10, search, status, category } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      initiatorId: userId,
      type: DisputeType.platform,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [disputes, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              totalCents: true,
              currency: true,
              event: {
                select: {
                  title: true,
                },
              },
            },
          },
          evidence: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + disputes.length < total,
    };
  }

  /**
   * Get a single dispute by ID
   */
  async findOne(userId: string, disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                orgId: true,
              },
            },
          },
        },
        evidence: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Verify access
    if (dispute.initiatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this dispute',
      );
    }

    return dispute;
  }

  /**
   * Add a message to the dispute thread
   */
  async addMessage(userId: string, disputeId: string, dto: AddDisputeMessageDto) {
    // Verify dispute access
    const dispute = await this.findOne(userId, disputeId);

    // Check if dispute is still open for communication
    if (['resolved', 'closed'].includes(dispute.status)) {
      throw new BadRequestException(
        'Cannot add messages to a closed dispute',
      );
    }

    const message = await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        senderRole: 'buyer',
        message: dto.message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify relevant parties
    if (dispute.status === 'organizer_responded') {
      // Notify moderator if assigned
      if (dispute.moderatorId) {
        await this.notifyModerator(dispute.moderatorId, dispute, 'new_message');
      }
    }

    return message;
  }

  /**
   * Upload evidence for a dispute
   */
  async uploadEvidence(
    userId: string,
    disputeId: string,
    file: any, // Multer file type
  ) {
    // Verify dispute access
    const dispute = await this.findOne(userId, disputeId);

    // Check if can still upload evidence
    if (['resolved', 'closed'].includes(dispute.status)) {
      throw new BadRequestException(
        'Cannot upload evidence to a closed dispute',
      );
    }

    // In production, upload to S3. For now, use local path
    const fileUrl = `/uploads/disputes/${disputeId}/${file.filename}`;

    const evidence = await this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        fileUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return evidence;
  }

  /**
   * Appeal a dispute decision
   */
  async appeal(userId: string, disputeId: string, dto: AppealDisputeDto) {
    const dispute = await this.findOne(userId, disputeId);

    // Can only appeal resolved disputes
    if (dispute.status !== 'resolved') {
      throw new BadRequestException('Can only appeal resolved disputes');
    }

    // Check if already appealed
    if (dispute.appealedAt) {
      throw new BadRequestException('This dispute has already been appealed');
    }

    // Check if lost (can't appeal if you won)
    if (
      dispute.resolution === 'full_refund' ||
      dispute.resolution === 'partial_refund'
    ) {
      throw new BadRequestException(
        'Cannot appeal a dispute you already won',
      );
    }

    // Update dispute
    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'appealed',
        appealedAt: new Date(),
        appealNote: dto.appealNote,
        appealedBy: userId,
      },
    });

    // Notify moderators about appeal
    await this.notifyModeratorsPool(updatedDispute, 'appeal_submitted');

    return updatedDispute;
  }

  /**
   * Notify organization members about dispute
   */
  private async notifyOrganization(
    orgId: string,
    dispute: any,
    eventType: 'dispute_created' | 'new_message',
  ) {
    const members = await this.prisma.orgMember.findMany({
      where: { orgId },
      select: { userId: true },
    });

    const memberIds = members.map((m) => m.userId);
    if (memberIds.length === 0) return;

    let title: string;
    let message: string;

    const amountFormatted = `${dispute.order.currency} ${(Number(dispute.amountCents) / 100).toFixed(2)}`;

    if (eventType === 'dispute_created') {
      title = '⚠️ New Buyer Dispute Filed';
      message = `A buyer has filed a dispute for ${amountFormatted} on order ${dispute.orderId.slice(0, 8)}. You have 7 days to respond.`;
    } else {
      title = '💬 New Message in Dispute';
      message = `The buyer has added a new message to dispute ${dispute.id.slice(0, 8)}.`;
    }

    const notificationPromises = memberIds.map((userId) =>
      this.notificationsService.createNotification({
        userId,
        type: NotificationType.warning,
        category: NotificationCategory.order,
        title,
        message,
        channels: ['in_app', 'email'],
        actionUrl: `/organizer/disputes/${dispute.id}?type=platform`,
        actionText: 'View Dispute',
        data: {
          disputeId: dispute.id,
          orderId: dispute.orderId,
          category: dispute.category,
          amount: amountFormatted,
        },
      }),
    );

    await Promise.all(notificationPromises);
  }

  /**
   * Notify moderator about dispute update
   */
  private async notifyModerator(
    moderatorId: string,
    dispute: any,
    eventType: string,
  ) {
    await this.notificationsService.createNotification({
      userId: moderatorId,
      type: NotificationType.info,
      category: NotificationCategory.system,
      title: '💬 New Activity in Assigned Dispute',
      message: `There is new activity in dispute ${dispute.id.slice(0, 8)} assigned to you.`,
      channels: ['in_app', 'email'],
      actionUrl: `/moderator/disputes/${dispute.id}`,
      actionText: 'Review Dispute',
      data: {
        disputeId: dispute.id,
        eventType,
      },
    });
  }

  /**
   * Notify all moderators about new appeal
   */
  private async notifyModeratorsPool(dispute: any, eventType: string) {
    const moderators = await this.prisma.user.findMany({
      where: {
        OR: [{ role: 'moderator' }, { role: 'admin' }],
      },
      select: { id: true },
    });

    const moderatorIds = moderators.map((m) => m.id);

    const notificationPromises = moderatorIds.map((userId) =>
      this.notificationsService.createNotification({
        userId,
        type: NotificationType.warning,
        category: NotificationCategory.system,
        title: '⚖️ Dispute Appeal Submitted',
        message: `A buyer has appealed dispute ${dispute.id.slice(0, 8)}. Review needed.`,
        channels: ['in_app', 'email'],
        actionUrl: `/moderator/disputes/${dispute.id}`,
        actionText: 'Review Appeal',
        data: {
          disputeId: dispute.id,
          eventType,
        },
      }),
    );

    await Promise.all(notificationPromises);
  }
}
