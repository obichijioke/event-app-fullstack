import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  RefundQueryDto,
  CreateRefundDto,
  UpdateRefundStatusDto,
  ApproveRefundDto,
  RejectRefundDto,
  ProcessRefundDto,
} from '../dto/refund.dto';
import { Prisma, RefundStatus } from '@prisma/client';

@Injectable()
export class AdminRefundService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: RefundQueryDto) {
    return this.getRefunds(query);
  }

  async findOne(refundId: string) {
    return this.getRefund(refundId);
  }

  async create(dto: CreateRefundDto) {
    return this.createRefund(dto);
  }

  async updateStatus(refundId: string, dto: UpdateRefundStatusDto) {
    return this.updateRefundStatus(refundId, dto);
  }

  async approve(refundId: string, dto: ApproveRefundDto) {
    return this.approveRefund(refundId, dto);
  }

  async reject(refundId: string, dto: RejectRefundDto) {
    return this.rejectRefund(refundId, dto);
  }

  async process(refundId: string, dto: ProcessRefundDto) {
    return this.processRefund(refundId, dto);
  }

  async getRefunds(query: RefundQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      orderId,
      userId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RefundWhereInput = {};

    if (search) {
      where.OR = [
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

    if (orderId) {
      where.orderId = orderId;
    }

    if (userId) {
      where.order = {
        buyerId: userId,
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const orderBy: Prisma.RefundOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'orderId',
        'amountCents',
        'currency',
        'reason',
        'status',
        'createdBy',
        'createdAt',
        'processedAt',
        'providerRef',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orderId: true,
          amountCents: true,
          currency: true,
          reason: true,
          status: true,
          createdBy: true,
          createdAt: true,
          processedAt: true,
          providerRef: true,
          order: {
            select: {
              id: true,
              buyerId: true,
              eventId: true,
              totalCents: true,
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
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.refund.count({ where }),
    ]);

    const data = refunds.map((refund) => ({
      id: refund.id,
      orderId: refund.orderId,
      amountCents: refund.amountCents,
      currency: refund.currency,
      reason: refund.reason,
      status: refund.status,
      createdBy: refund.createdBy,
      createdAt: refund.createdAt,
      processedAt: refund.processedAt,
      providerRef: refund.providerRef,
      orderTotal: refund.order.totalCents,
      orderStatus: refund.order.status,
      buyerId: refund.order.buyerId,
      buyerName: refund.order.buyer.name || refund.order.buyer.email,
      buyerEmail: refund.order.buyer.email,
      eventId: refund.order.eventId,
      eventTitle: refund.order.event.title,
      creatorName: refund.creator?.name || refund.creator?.email || 'System',
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

  async getRefund(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
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
              },
            },
            items: {
              include: {
                ticketType: {
                  select: {
                    name: true,
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
              },
              where: {
                status: 'captured',
              },
              take: 1,
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return refund;
  }

  async createRefund(dto: CreateRefundDto) {
    const { orderId, amountCents, currency, reason, createdBy } = dto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        refunds: true,
        org: {
          select: { id: true, status: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.org?.status === 'suspended') {
      throw new BadRequestException(
        'Cannot create refund: organization is suspended',
      );
    }

    if (order.status !== 'paid') {
      throw new BadRequestException('Order must be in paid status to refund');
    }

    const totalRefunded = order.refunds
      .filter((r) => r.status === 'processed')
      .reduce((sum, r) => sum + Number(r.amountCents), 0);

    const availableAmount = Number(order.totalCents) - totalRefunded;
    if (amountCents > availableAmount) {
      throw new BadRequestException(
        `Refund amount (${amountCents}) exceeds available amount (${availableAmount})`,
      );
    }

    if (currency !== order.currency) {
      throw new BadRequestException(
        `Currency mismatch: order is ${order.currency}, refund is ${currency}`,
      );
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId,
        amountCents,
        currency,
        reason,
        status: RefundStatus.pending,
        createdBy: createdBy || null,
      },
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
              },
            },
          },
        },
      },
    });

    return refund;
  }

  async updateRefundStatus(refundId: string, dto: UpdateRefundStatusDto) {
    const { status, reason } = dto;

    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    const updatedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status,
        reason: reason || refund.reason,
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

    return updatedRefund;
  }

  async approveRefund(refundId: string, dto: ApproveRefundDto) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== RefundStatus.pending) {
      throw new BadRequestException(
        `Refund is ${refund.status}, can only approve pending refunds`,
      );
    }

    await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.approved,
        reason: dto.note || refund.reason,
      },
    });

    return { message: 'Refund approved successfully' };
  }

  async rejectRefund(refundId: string, dto: RejectRefundDto) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== RefundStatus.pending) {
      throw new BadRequestException(
        `Refund is ${refund.status}, can only reject pending refunds`,
      );
    }

    await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.canceled,
        reason: dto.reason,
      },
    });

    return { message: 'Refund rejected successfully' };
  }

  async processRefund(refundId: string, dto: ProcessRefundDto) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        order: {
          include: {
            payments: {
              where: {
                status: 'captured',
              },
              take: 1,
            },
            tickets: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status === RefundStatus.processed && !dto.force) {
      throw new BadRequestException('Refund already processed');
    }

    if (refund.status === RefundStatus.canceled) {
      throw new BadRequestException('Cannot process canceled refund');
    }

    if (!refund.order.payments || refund.order.payments.length === 0) {
      throw new BadRequestException('No payment found for this order');
    }

    const providerRef = `ref_${Date.now()}_${refundId.substring(0, 8)}`;

    await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.processed,
        processedAt: new Date(),
        providerRef,
      },
    });

    const isFullRefund =
      Number(refund.amountCents) === Number(refund.order.totalCents);

    if (isFullRefund) {
      await this.prisma.order.update({
        where: { id: refund.orderId },
        data: {
          status: 'refunded',
        },
      });

      await this.prisma.ticket.updateMany({
        where: { orderId: refund.orderId },
        data: {
          status: 'void',
        },
      });
    }

    return {
      message: 'Refund processed successfully',
      providerRef,
    };
  }
}
