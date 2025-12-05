import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '@prisma/client';
import {
  OrganizerDisputeQueryDto,
  SubmitDisputeResponseDto,
} from './dto/organizer-dispute.dto';

@Injectable()
export class OrganizerDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get all disputes for the organizer's events
   */
  async findAll(
    orgId: string,
    query: OrganizerDisputeQueryDto,
  ): Promise<{
    disputes: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const { page = 1, limit = 10, search, status, provider, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      order: {
        event: {
          orgId,
        },
      },
    };

    if (search) {
      where.OR = [
        { caseId: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        {
          order: {
            user: {
              email: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    if (startDate || endDate) {
      where.openedAt = {};
      if (startDate) {
        where.openedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.openedAt.lte = new Date(endDate);
      }
    }

    // Execute queries in parallel
    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              status: true,
              totalCents: true,
              currency: true,
              createdAt: true,
              buyerId: true,
              eventId: true,
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
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          openedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    // Fetch user details separately for each dispute
    const disputesWithUsers = await Promise.all(
      disputes.map(async (dispute) => {
        const buyer = await this.prisma.user.findUnique({
          where: { id: dispute.order.buyerId },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });
        return {
          ...dispute,
          order: {
            ...dispute.order,
            buyer,
          },
        };
      }),
    );

    return {
      disputes: disputesWithUsers,
      total,
      page,
      limit,
      hasMore: skip + disputes.length < total,
    };
  }

  /**
   * Get dispute statistics for the organizer
   */
  async getStats(orgId: string): Promise<{
    total: number;
    needs_response: number;
    under_review: number;
    won: number;
    lost: number;
    totalAmount: number;
    winRate: number;
  }> {
    const disputes = await this.prisma.dispute.findMany({
      where: {
        order: {
          event: {
            orgId,
          },
        },
      },
      select: {
        status: true,
        amountCents: true,
      },
    });

    const stats = {
      total: disputes.length,
      needs_response: 0,
      under_review: 0,
      won: 0,
      lost: 0,
      totalAmount: 0,
      winRate: 0,
    };

    disputes.forEach((dispute) => {
      if (dispute.status === 'needs_response') stats.needs_response++;
      if (dispute.status === 'under_review') stats.under_review++;
      if (dispute.status === 'won') stats.won++;
      if (dispute.status === 'lost') stats.lost++;
      if (dispute.amountCents) {
        stats.totalAmount += Number(dispute.amountCents);
      }
    });

    // Calculate win rate (won / (won + lost))
    const resolved = stats.won + stats.lost;
    stats.winRate = resolved > 0 ? (stats.won / resolved) * 100 : 0;

    return stats;
  }

  /**
   * Get a single dispute by ID
   */
  async findOne(orgId: string, disputeId: string): Promise<any> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalCents: true,
            currency: true,
            createdAt: true,
            buyerId: true,
            eventId: true,
            event: {
              select: {
                id: true,
                title: true,
                orgId: true,
              },
            },
            payments: true,
          },
        },
        evidence: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Verify the dispute belongs to this organizer's event
    if (dispute.order.event.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to access this dispute',
      );
    }

    // Fetch buyer details
    const buyer = await this.prisma.user.findUnique({
      where: { id: dispute.order.buyerId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return {
      ...dispute,
      order: {
        ...dispute.order,
        buyer,
      },
    };
  }

  /**
   * Submit response to a dispute
   */
  async submitResponse(
    orgId: string,
    disputeId: string,
    dto: SubmitDisputeResponseDto,
    userId: string,
  ): Promise<any> {
    // Find and verify dispute ownership
    const dispute = await this.findOne(orgId, disputeId);

    // Check if dispute is in a state that allows response
    if (!['needs_response', 'warning'].includes(dispute.status)) {
      throw new BadRequestException(
        `Cannot respond to dispute with status: ${dispute.status}`,
      );
    }

    // Check if response deadline has passed
    if (dispute.respondByAt && new Date() > new Date(dispute.respondByAt)) {
      throw new BadRequestException(
        'Response deadline has passed for this dispute',
      );
    }

    // Update dispute with response
    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'under_review',
        responseNote: dto.responseNote,
        submittedAt: new Date(),
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalCents: true,
            currency: true,
            buyerId: true,
            eventId: true,
            event: true,
          },
        },
        evidence: true,
      },
    });

    // Fetch buyer details
    const buyer = await this.prisma.user.findUnique({
      where: { id: updatedDispute.order.buyerId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Send notification to organizer members about response submission
    await this.notifyOrganizationMembers(
      orgId,
      updatedDispute,
      'response_submitted',
    );

    // TODO: Submit response to payment provider (Stripe/Paystack)

    return {
      ...updatedDispute,
      order: {
        ...updatedDispute.order,
        buyer,
      },
    };
  }

  /**
   * Upload evidence for a dispute
   */
  async uploadEvidence(
    orgId: string,
    disputeId: string,
    fileUrl: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    userId: string,
  ): Promise<any> {
    // Find and verify dispute ownership
    const dispute = await this.findOne(orgId, disputeId);

    // Check if dispute allows evidence upload
    if (
      !['needs_response', 'under_review', 'warning'].includes(dispute.status)
    ) {
      throw new BadRequestException(
        `Cannot upload evidence for dispute with status: ${dispute.status}`,
      );
    }

    // Create evidence record
    const evidence = await this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        fileUrl,
        fileName,
        mimeType,
        fileSize,
        uploadedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return evidence;
  }

  /**
   * Get all evidence for a dispute
   */
  async getEvidence(orgId: string, disputeId: string): Promise<any[]> {
    // Verify dispute ownership
    await this.findOne(orgId, disputeId);

    const evidence = await this.prisma.disputeEvidence.findMany({
      where: { disputeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return evidence;
  }

  /**
   * Delete evidence (only if dispute not yet submitted)
   */
  async deleteEvidence(
    orgId: string,
    disputeId: string,
    evidenceId: string,
    userId: string,
  ): Promise<void> {
    // Verify dispute ownership
    const dispute = await this.findOne(orgId, disputeId);

    // Check if dispute allows evidence deletion
    if (dispute.status !== 'needs_response') {
      throw new BadRequestException(
        'Cannot delete evidence after response has been submitted',
      );
    }

    const evidence = await this.prisma.disputeEvidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence || evidence.disputeId !== disputeId) {
      throw new NotFoundException('Evidence not found');
    }

    // Delete the evidence record
    await this.prisma.disputeEvidence.delete({
      where: { id: evidenceId },
    });

    // TODO: Delete the file from S3/local storage
  }

  /**
   * Notify organization members about dispute events
   */
  private async notifyOrganizationMembers(
    orgId: string,
    dispute: any,
    eventType: 'created' | 'response_submitted' | 'resolved' | 'deadline_approaching',
  ): Promise<void> {
    // Get all organization members
    const members = await this.prisma.orgMember.findMany({
      where: {
        orgId,
      },
      select: {
        userId: true,
      },
    });

    const memberIds = members.map((m) => m.userId);
    if (memberIds.length === 0) return;

    // Prepare notification data
    let title: string;
    let message: string;
    let type: NotificationType;
    let actionUrl: string;

    const amountFormatted = dispute.amountCents
      ? `${dispute.order.currency} ${(dispute.amountCents / 100).toFixed(2)}`
      : 'N/A';

    actionUrl = `/organizer/disputes/${dispute.id}?orgId=${orgId}`;

    switch (eventType) {
      case 'created':
        type = NotificationType.warning;
        title = '⚠️ New Payment Dispute';
        message = `A dispute of ${amountFormatted} has been filed for order ${dispute.orderId.slice(0, 8)}. Respond promptly to avoid losing the dispute.`;
        break;

      case 'response_submitted':
        type = NotificationType.info;
        title = '✅ Dispute Response Submitted';
        message = `Your response to the dispute for order ${dispute.orderId.slice(0, 8)} has been submitted and is now under review.`;
        break;

      case 'resolved':
        if (dispute.status === 'won') {
          type = NotificationType.success;
          title = '🎉 Dispute Won';
          message = `You won the dispute for order ${dispute.orderId.slice(0, 8)}. The ${amountFormatted} charge has been upheld.`;
        } else {
          type = NotificationType.error;
          title = '❌ Dispute Lost';
          message = `You lost the dispute for order ${dispute.orderId.slice(0, 8)}. The ${amountFormatted} has been refunded to the buyer.`;
        }
        break;

      case 'deadline_approaching':
        type = NotificationType.warning;
        title = '⏰ Dispute Deadline Approaching';
        message = `The response deadline for dispute ${dispute.caseId} is in less than 24 hours. Submit your response now!`;
        break;
    }

    // Create notifications for all members
    const notificationPromises = memberIds.map((userId) =>
      this.notificationsService.createNotification({
        userId,
        type,
        category: NotificationCategory.order,
        title,
        message,
        channels: ['in_app', 'email'],
        actionUrl,
        actionText: 'View Dispute',
        data: {
          disputeId: dispute.id,
          orderId: dispute.orderId,
          caseId: dispute.caseId,
          provider: dispute.provider,
          status: dispute.status,
          amount: amountFormatted,
          eventType,
        },
      }),
    );

    await Promise.all(notificationPromises);
  }

  /**
   * Create notifications when a dispute is created (called by webhook handlers)
   */
  async notifyDisputeCreated(disputeId: string): Promise<void> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            event: {
              select: {
                orgId: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) return;

    await this.notifyOrganizationMembers(
      dispute.order.event.orgId,
      dispute,
      'created',
    );
  }

  /**
   * Create notifications when a dispute is resolved (called by webhook handlers)
   */
  async notifyDisputeResolved(disputeId: string): Promise<void> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            event: {
              select: {
                orgId: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) return;

    await this.notifyOrganizationMembers(
      dispute.order.event.orgId,
      dispute,
      'resolved',
    );
  }

  // ========== PLATFORM DISPUTE METHODS ==========

  /**
   * Get all platform disputes for organization's events
   */
  async findPlatformDisputes(orgId: string, query: any) {
    const { page = 1, limit = 10, search, status, category, urgentOnly } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      type: 'platform',
      order: {
        event: {
          orgId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // Urgent filter: respond_by deadline within 48 hours
    if (urgentOnly) {
      const fortyEightHours = new Date();
      fortyEightHours.setHours(fortyEightHours.getHours() + 48);
      where.respondByAt = {
        lte: fortyEightHours,
        gte: new Date(), // Not expired yet
      };
      where.status = 'open'; // Only open disputes can be urgent
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        {
          order: {
            buyer: {
              email: { contains: search, mode: 'insensitive' },
            },
          },
        },
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
              buyerId: true,
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          initiator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          evidence: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: [
          { respondByAt: 'asc' }, // Most urgent first
          { createdAt: 'desc' },
        ],
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
   * Get single platform dispute details
   */
  async findOnePlatformDispute(orgId: string, disputeId: string) {
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
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Verify ownership
    if (dispute.order.event.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to access this dispute',
      );
    }

    return dispute;
  }

  /**
   * Respond to a platform dispute
   */
  async respondToPlatformDispute(
    orgId: string,
    disputeId: string,
    dto: any,
    userId: string,
  ) {
    const dispute = await this.findOnePlatformDispute(orgId, disputeId);

    // Check if can respond
    if (dispute.status !== 'open') {
      throw new BadRequestException(
        `Cannot respond to dispute with status: ${dispute.status}`,
      );
    }

    // Check if deadline passed
    if (dispute.respondByAt && new Date() > new Date(dispute.respondByAt)) {
      throw new BadRequestException('Response deadline has passed');
    }

    // Update dispute
    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'organizer_responded',
        responseNote: dto.responseNote,
        submittedAt: new Date(),
      },
    });

    // Add message to thread
    await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        senderRole: 'organizer',
        message: dto.responseNote,
      },
    });

    // Notify buyer
    if (dispute.initiatorId) {
      await this.notifyBuyer(dispute.initiatorId, updatedDispute, 'organizer_responded');
    }

    return updatedDispute;
  }

  /**
   * Propose a resolution
   */
  async proposeResolution(
    orgId: string,
    disputeId: string,
    dto: any,
    userId: string,
  ) {
    const dispute = await this.findOnePlatformDispute(orgId, disputeId);

    // Can propose resolution when organizer has responded
    if (!['organizer_responded', 'open'].includes(dispute.status)) {
      throw new BadRequestException(
        'Cannot propose resolution at this stage',
      );
    }

    // Update dispute with proposal
    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        resolution: dto.resolution,
        refundedCents: dto.refundAmountCents,
        resolutionNote: dto.proposalNote,
        status: 'organizer_responded',
      },
    });

    // Add internal message about proposal
    await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        senderRole: 'organizer',
        message: `Proposed resolution: ${dto.resolution}. ${dto.proposalNote}`,
      },
    });

    // Notify buyer of proposal
    if (dispute.initiatorId) {
      await this.notifyBuyer(
        dispute.initiatorId,
        updatedDispute,
        'resolution_proposed',
      );
    }

    return updatedDispute;
  }

  /**
   * Accept a moderator's resolution
   */
  async acceptResolution(orgId: string, disputeId: string) {
    const dispute = await this.findOnePlatformDispute(orgId, disputeId);

    if (dispute.status !== 'resolved') {
      throw new BadRequestException(
        'Can only accept resolutions on resolved disputes',
      );
    }

    // Update to closed
    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    return { message: 'Resolution accepted, dispute closed' };
  }

  /**
   * Notify buyer about dispute updates
   */
  private async notifyBuyer(
    buyerId: string,
    dispute: any,
    eventType: 'organizer_responded' | 'resolution_proposed',
  ) {
    let title: string;
    let message: string;

    if (eventType === 'organizer_responded') {
      title = '💬 Organizer Responded to Your Dispute';
      message = `The organizer has responded to your dispute ${dispute.id.slice(0, 8)}. Please review their response.`;
    } else {
      title = '🤝 Resolution Proposed';
      message = `The organizer has proposed a resolution for dispute ${dispute.id.slice(0, 8)}. Please review the proposal.`;
    }

    await this.notificationsService.createNotification({
      userId: buyerId,
      type: NotificationType.info,
      category: NotificationCategory.order,
      title,
      message,
      channels: ['in_app', 'email'],
      actionUrl: `/buyer/disputes/${dispute.id}`,
      actionText: 'View Dispute',
      data: {
        disputeId: dispute.id,
        eventType,
      },
    });
  }
}
