import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentService } from '../../orders/services/payment.service';
import { MailerService } from '../../common/mailer/mailer.service';
import {
  RefundQueryDto,
  CreateRefundDto,
  UpdateRefundStatusDto,
  ApproveRefundDto,
  RejectRefundDto,
  ProcessRefundDto,
} from '../dto/refund.dto';
import { Prisma, RefundStatus } from '@prisma/client';
import { refundEmailIncludes, RefundWithEmailData } from '../../common/types/prisma-helpers';

@Injectable()
export class AdminRefundService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private mailerService: MailerService,
  ) {}

  async findAll(query: RefundQueryDto) {
    return this.getRefunds(query);
  }

  async findOne(refundId: string) {
    return this.getRefund(refundId);
  }

  async create(dto: CreateRefundDto, actorId?: string) {
    return this.createRefund(dto, actorId);
  }

  async updateStatus(refundId: string, dto: UpdateRefundStatusDto, actorId?: string) {
    return this.updateRefundStatus(refundId, dto, actorId);
  }

  async approve(refundId: string, dto: ApproveRefundDto, actorId?: string) {
    return this.approveRefund(refundId, dto, actorId);
  }

  async reject(refundId: string, dto: RejectRefundDto, actorId?: string) {
    return this.rejectRefund(refundId, dto, actorId);
  }

  async process(refundId: string, dto: ProcessRefundDto, actorId?: string) {
    return this.processRefund(refundId, dto, actorId);
  }

  async export(query: RefundQueryDto) {
    return this.exportRefunds(query);
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
      amountMin,
      amountMax,
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

    if (amountMin !== undefined || amountMax !== undefined) {
      where.amountCents = {};
      if (amountMin !== undefined) {
        where.amountCents.gte = BigInt(amountMin);
      }
      if (amountMax !== undefined) {
        where.amountCents.lte = BigInt(amountMax);
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

  async exportRefunds(query: RefundQueryDto) {
    // Use same filters/sorting without pagination cap
    const result = await this.getRefunds({
      ...query,
      page: 1,
      limit: 10000,
    });

    const headers = [
      'id',
      'orderId',
      'amountCents',
      'currency',
      'status',
      'reason',
      'buyerName',
      'buyerEmail',
      'eventTitle',
      'createdAt',
      'processedAt',
      'providerRef',
    ];

    const csv = [
      headers.join(','),
      ...result.data.map((row) =>
        [
          row.id,
          row.orderId,
          row.amountCents,
          row.currency,
          row.status,
          JSON.stringify(row.reason || ''),
          JSON.stringify(row.buyerName || ''),
          JSON.stringify(row.buyerEmail || ''),
          JSON.stringify(row.eventTitle || ''),
          row.createdAt,
          row.processedAt || '',
          row.providerRef || '',
        ].join(','),
      ),
    ].join('\n');

    return csv;
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

  async createRefund(dto: CreateRefundDto, actorId?: string) {
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

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId || createdBy || null,
        action: 'refund_create',
        targetKind: 'Refund',
        targetId: refund.id,
        meta: {
          orderId: refund.orderId,
          amountCents,
          currency,
          reason,
        },
      },
    });

    return refund;
  }

  async updateRefundStatus(refundId: string, dto: UpdateRefundStatusDto, actorId?: string) {
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

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action: 'refund_status_update',
        targetKind: 'Refund',
        targetId: refundId,
        meta: {
          previousStatus: refund.status,
          newStatus: status,
          reason: reason || null,
        },
      },
    });

    return updatedRefund;
  }

  async approveRefund(refundId: string, dto: ApproveRefundDto, actorId?: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        order: {
          include: {
            buyer: true,
          },
        },
      },
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

    if (refund.order?.buyerId) {
      await this.prisma.notification.create({
        data: {
          userId: refund.order.buyerId,
          type: 'info',
          category: 'order',
          title: 'Refund approved',
          message: `Your refund for order ${refund.orderId} was approved.`,
          channels: ['in_app', 'email'],
          data: {
            refundId,
            orderId: refund.orderId,
          },
          actionUrl: `/account/refunds`,
          actionText: 'View refund',
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action: 'refund_approve',
        targetKind: 'Refund',
        targetId: refundId,
        meta: { note: dto.note || null },
      },
    });

    return { message: 'Refund approved successfully' };
  }

  async rejectRefund(refundId: string, dto: RejectRefundDto, actorId?: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        order: {
          include: {
            buyer: true,
          },
        },
      },
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

    if (refund.order?.buyerId) {
      await this.prisma.notification.create({
        data: {
          userId: refund.order.buyerId,
          type: 'warning',
          category: 'order',
          title: 'Refund rejected',
          message: `Your refund for order ${refund.orderId} was rejected.`,
          channels: ['in_app', 'email'],
          data: {
            refundId,
            orderId: refund.orderId,
            reason: dto.reason,
          },
          actionUrl: `/account/refunds`,
          actionText: 'View refund',
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action: 'refund_reject',
        targetKind: 'Refund',
        targetId: refundId,
        meta: { reason: dto.reason },
      },
    });

    return { message: 'Refund rejected successfully' };
  }

  async processRefund(refundId: string, dto: ProcessRefundDto, actorId?: string) {
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
            buyer: true,
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

    const payment = refund.order.payments[0];
    let refundResult;
    try {
      refundResult = await this.paymentService.refundCapturedPayment(
        payment.id,
        Number(refund.amountCents),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refund provider error';
      const normalized = message.toLowerCase();
      const alreadyProcessed =
        normalized.includes('refund already exist') ||
        normalized.includes('already refund') ||
        normalized.includes('already processed');

      if (alreadyProcessed) {
        await this.prisma.refund.update({
          where: { id: refundId },
          data: {
            status: RefundStatus.processed,
            processedAt: new Date(),
          },
        });

        await this.prisma.auditLog.create({
          data: {
            actorId: actorId || null,
            action: 'refund_process',
            targetKind: 'Refund',
            targetId: refundId,
            meta: {
              providerRef: refund.providerRef,
              providerStatus: 'processed',
              status: RefundStatus.processed,
              note: 'Marked processed due to existing provider refund',
            },
          },
        });

        return {
          message: 'Refund already processed at provider; marked as processed',
          providerRef: refund.providerRef,
          providerStatus: 'processed',
        };
      }

      throw new BadRequestException(`Refund provider failed: ${message}`);
    }

    const providerRef = refundResult.providerReference
      ? String(refundResult.providerReference)
      : null;
    const providerStatus = (refundResult.status || '').toLowerCase();
    const processedStatuses = ['succeeded', 'processed', 'success'];
    const failedStatuses = ['failed', 'canceled'];

    const status = processedStatuses.includes(providerStatus)
      ? RefundStatus.processed
      : failedStatuses.includes(providerStatus)
        ? RefundStatus.failed
        : RefundStatus.pending;

    await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status,
        processedAt: status === RefundStatus.processed ? new Date() : null,
        providerRef,
      },
    });

    const isFullRefund =
      Number(refund.amountCents) === Number(refund.order.totalCents);

    if (status === RefundStatus.processed && isFullRefund) {
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

    if (refund.order?.buyerId) {
      await this.prisma.notification.create({
        data: {
          userId: refund.order.buyerId,
          type: status === RefundStatus.processed ? 'success' : 'warning',
          category: 'order',
          title:
            status === RefundStatus.processed
              ? 'Refund processed'
              : status === RefundStatus.failed
                ? 'Refund failed'
                : 'Refund initiated',
          message: `Your refund for order ${refund.orderId} is now ${status}.`,
          channels: ['in_app', 'email'],
          data: {
            refundId,
            orderId: refund.orderId,
            providerRef,
            status,
          },
          actionUrl: `/account/refunds`,
          actionText: 'View refund',
        },
      });

      // Send refund confirmation email only if processed successfully
      if (status === RefundStatus.processed) {
        await this.sendRefundConfirmationEmail(refundId).catch((error) => {
          console.error('Failed to send refund confirmation email:', error);
          // Don't fail the refund if email fails
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action: 'refund_process',
        targetKind: 'Refund',
        targetId: refundId,
        meta: {
          providerRef,
          providerStatus,
          status,
        },
      },
    });

    return {
      message:
        status === RefundStatus.processed
          ? 'Refund processed successfully'
          : status === RefundStatus.failed
            ? 'Refund failed at provider'
            : 'Refund initiated; awaiting provider confirmation',
      providerRef,
      providerStatus,
    };
  }

  private async sendRefundConfirmationEmail(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      ...refundEmailIncludes,
    }) as RefundWithEmailData | null;

    if (!refund?.order?.event) {
      return;
    }

    const order = refund.order;

    // Fetch buyer (user) separately
    const user = await this.prisma.user.findUnique({
      where: { id: order.buyerId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return;
    }

    // Format dates
    const processedDate = refund.processedAt
      ? new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(refund.processedAt))
      : new Date().toLocaleDateString();

    // Calculate refund amount
    const refundAmount = this.formatCurrency(refund.amountCents);
    const originalTotal = this.formatCurrency(order.totalCents);
    const isFullRefund = Number(refund.amountCents) === Number(order.totalCents);

    // Get refunded tickets if any
    const refundedTickets = order.items.map((item) => {
      let seatInfo = '';
      if (item.seat) {
        seatInfo = `Section ${item.seat.section}, Row ${item.seat.row}, Seat ${item.seat.number}`;
      }

      return {
        ticketType: item.ticketType?.name || 'General Admission',
        seatInfo: seatInfo || null,
        price: this.formatCurrency(item.unitPriceCents),
      };
    });

    // Get payment method details
    const payment = order.payments?.[0];
    const paymentMethod = this.formatPaymentMethod(payment?.provider);

    // Calculate fees if partial refund
    let serviceFee: string | null = null;
    let cancellationFee: string | null = null;

    if (!isFullRefund) {
      const refundedAmount = Number(refund.amountCents);
      const originalAmount = Number(order.totalCents);
      const deductedAmount = originalAmount - refundedAmount;

      if (deductedAmount > 0) {
        // For now, assume the difference is fees
        cancellationFee = this.formatCurrency(BigInt(deductedAmount));
      }
    }

    await this.mailerService.sendTemplatedMail({
      to: user.email,
      subject: `Refund Processed - ${order.event.title}`,
      template: 'refund-confirmation',
      context: {
        userName: user.name || user.email.split('@')[0],
        refundAmount,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        eventName: order.event.title,
        processedDate,
        refundId: refund.id,
        paymentMethod,
        last4: null,
        refundDays: '5-7',
        refundedTickets: refundedTickets.length > 0 ? refundedTickets : null,
        partialRefund: !isFullRefund,
        serviceFee,
        cancellationFee: cancellationFee || null,
        reason: refund.reason || null,
        orderUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders/${order.id}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@eventflow.dev',
        organizerEmail: order.event.org.supportEmail || 'noreply@eventflow.dev',
      },
    });
  }

  private formatCurrency(cents: bigint): string {
    const dollars = Number(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  }

  private formatPaymentMethod(provider?: string): string {
    if (!provider) return 'Card';

    const providerMap: Record<string, string> = {
      stripe: 'Credit/Debit Card',
      paystack: 'Card',
    };

    return providerMap[provider.toLowerCase()] || provider;
  }
}
