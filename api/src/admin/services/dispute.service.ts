import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  DisputeQueryDto,
  UpdateDisputeStatusDto,
  RespondToDisputeDto,
  CloseDisputeDto,
  DisputeStatus,
} from '../dto/dispute.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminDisputeService {
  constructor(private prisma: PrismaService) {}

  async getDisputes(query: DisputeQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      provider,
      orderId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {};

    if (search) {
      where.OR = [
        { caseId: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        {
          order: {
            buyer: {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
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

    if (orderId) {
      where.orderId = orderId;
    }

    if (dateFrom || dateTo) {
      where.openedAt = {};
      if (dateFrom) {
        where.openedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.openedAt.lte = new Date(dateTo);
      }
    }

    const orderBy: Prisma.DisputeOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'orderId',
        'provider',
        'caseId',
        'status',
        'amountCents',
        'reason',
        'openedAt',
        'closedAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.openedAt = 'desc';
    }

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orderId: true,
          provider: true,
          caseId: true,
          status: true,
          amountCents: true,
          reason: true,
          openedAt: true,
          closedAt: true,
          order: {
            select: {
              id: true,
              buyerId: true,
              eventId: true,
              totalCents: true,
              currency: true,
              status: true,
              buyer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              event: {
                select: {
                  id: true,
                  title: true,
                  orgId: true,
                  org: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    const data = disputes.map((dispute) => ({
      id: dispute.id,
      orderId: dispute.orderId,
      provider: dispute.provider,
      caseId: dispute.caseId,
      status: dispute.status,
      amountCents: dispute.amountCents,
      reason: dispute.reason,
      openedAt: dispute.openedAt,
      closedAt: dispute.closedAt,
      orderTotal: dispute.order.totalCents,
      orderCurrency: dispute.order.currency,
      orderStatus: dispute.order.status,
      buyerId: dispute.order.buyerId,
      buyerName: dispute.order.buyer.name || dispute.order.buyer.email,
      buyerEmail: dispute.order.buyer.email,
      eventId: dispute.order.eventId,
      eventTitle: dispute.order.event.title,
      orgId: dispute.order.event.orgId,
      orgName: dispute.order.event.org.name,
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

  async getDispute(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                orgId: true,
                org: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            payments: {
              select: {
                id: true,
                provider: true,
                providerCharge: true,
                amountCents: true,
                capturedAt: true,
                status: true,
              },
              where: {
                status: 'captured',
              },
              take: 1,
            },
            refunds: {
              select: {
                id: true,
                amountCents: true,
                status: true,
                processedAt: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  async updateDisputeStatus(disputeId: string, dto: UpdateDisputeStatusDto) {
    const { status, note } = dto;

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // If status is being set to won/lost/charge_refunded, set closedAt
    const shouldClose = ['won', 'lost', 'charge_refunded'].includes(status);

    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        ...(shouldClose && !dispute.closedAt ? { closedAt: new Date() } : {}),
      },
      include: {
        order: {
          include: {
            buyer: true,
            event: true,
          },
        },
      },
    });

    return updatedDispute;
  }

  async respondToDispute(disputeId: string, dto: RespondToDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'needs_response') {
      throw new BadRequestException(
        `Cannot respond to dispute in status: ${dispute.status}`,
      );
    }

    // Update status to under_review after responding
    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'under_review',
      },
    });

    return {
      message: 'Response submitted to payment provider successfully',
      response: dto.response,
    };
  }

  async closeDispute(disputeId: string, dto: CloseDisputeDto) {
    const { status, note, closedAt } = dto;

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.closedAt) {
      throw new BadRequestException('Dispute is already closed');
    }

    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        closedAt: closedAt ? new Date(closedAt) : new Date(),
      },
      include: {
        order: {
          include: {
            buyer: true,
            event: true,
          },
        },
      },
    });

    return updatedDispute;
  }

  async getDisputeStats() {
    const [total, needsResponse, underReview, won, lost, totalAmount] =
      await Promise.all([
        this.prisma.dispute.count(),
        this.prisma.dispute.count({ where: { status: 'needs_response' } }),
        this.prisma.dispute.count({ where: { status: 'under_review' } }),
        this.prisma.dispute.count({ where: { status: 'won' } }),
        this.prisma.dispute.count({ where: { status: 'lost' } }),
        this.prisma.dispute.aggregate({
          _sum: {
            amountCents: true,
          },
        }),
      ]);

    return {
      total,
      needsResponse,
      underReview,
      won,
      lost,
      totalAmountCents: totalAmount._sum.amountCents || 0,
      winRate: total > 0 ? ((won / (won + lost || 1)) * 100).toFixed(2) : '0',
    };
  }
}
