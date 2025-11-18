import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentQueryDto } from '../dto/query-params.dto';
import { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminPaymentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaymentQueryDto) {
    return this.getPayments(query);
  }

  async getPayments(query: PaymentQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      provider,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (search) {
      where.OR = [
        {
          order: {
            buyer: { email: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          order: { buyer: { name: { contains: search, mode: 'insensitive' } } },
        },
      ];
    }

    if (status) {
      const allowedPaymentStatuses = [
        'requires_action',
        'authorized',
        'captured',
        'voided',
        'failed',
      ] as const;
      const statusStr = String(status);
      if (
        !allowedPaymentStatuses.includes(
          statusStr as (typeof allowedPaymentStatuses)[number],
        )
      ) {
        throw new BadRequestException(`Invalid payment status: ${status}`);
      }
      where.status = statusStr as PaymentStatus;
    }

    if (provider) {
      where.provider = provider;
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

    const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'orderId',
        'amountCents',
        'currency',
        'status',
        'provider',
        'providerIntent',
        'providerCharge',
        'capturedAt',
        'failureCode',
        'failureMessage',
        'createdAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orderId: true,
          amountCents: true,
          currency: true,
          status: true,
          provider: true,
          providerIntent: true,
          providerCharge: true,
          capturedAt: true,
          failureCode: true,
          failureMessage: true,
          createdAt: true,
          order: {
            select: {
              buyerId: true,
              eventId: true,
              buyer: {
                select: {
                  name: true,
                  email: true,
                },
              },
              event: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const data = payments.map((payment) => ({
      ...payment,
      buyerId: payment.order.buyerId,
      buyerName: payment.order.buyer.name || payment.order.buyer.email,
      buyerEmail: payment.order.buyer.email,
      eventId: payment.order.eventId,
      eventTitle: payment.order.event.title,
      order: undefined,
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
}
