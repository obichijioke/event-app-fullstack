import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus, PayoutStatus } from '@prisma/client';
import { OrganizerFinancialsQueryDto } from './dto/organizer-financials-query.dto';
import { OrganizerOrderQueryDto } from './dto/organizer-order-query.dto';
import { OrganizerOrdersService } from './organizer-orders.service';
import { checkFinancePermission, serializeResponse } from '../common/utils';

@Injectable()
export class OrganizerFinancialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrganizerOrdersService,
  ) {}

  async getSummary(
    orgId: string,
    userId: string,
    query: OrganizerFinancialsQueryDto,
  ) {
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to view financials for this organization',
    );

    const where: any = {
      orgId,
      status: OrderStatus.paid,
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [
      ordersAggregate,
      refundsAggregate,
      payoutsAggregate,
      ticketAggregate,
      orders,
    ] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        where,
        _sum: {
          totalCents: true,
          feesCents: true,
          taxCents: true,
          subtotalCents: true,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.refund.aggregate({
        where: {
          order: {
            orgId,
            status: OrderStatus.paid,
            ...(where.createdAt ? { createdAt: where.createdAt } : {}),
          },
        },
        _sum: {
          amountCents: true,
        },
      }),
      this.prisma.payout.aggregate({
        where: {
          orgId,
          status: {
            in: [
              PayoutStatus.pending,
              PayoutStatus.in_review,
              PayoutStatus.paid,
            ],
          },
        },
        _sum: {
          amountCents: true,
        },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          order: where,
        },
        _sum: {
          quantity: true,
        },
      }),
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          totalCents: true,
          currency: true,
        },
      }),
    ]);

    const grossRevenueCents = Number(
      ordersAggregate._sum.totalCents || BigInt(0),
    );
    const feeCents = Number(ordersAggregate._sum.feesCents || BigInt(0));
    const refundCents = Number(refundsAggregate._sum.amountCents || BigInt(0));
    const netRevenueCents = grossRevenueCents - feeCents - refundCents;

    const ordersByDay = orders.reduce<Record<string, number>>((acc, order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      acc[dateKey] =
        (acc[dateKey] || 0) + Number(order.totalCents || BigInt(0));
      return acc;
    }, {});

    return serializeResponse({
      totals: {
        grossRevenueCents,
        netRevenueCents,
        feeCents,
        refundCents,
        taxCents: Number(ordersAggregate._sum.taxCents || BigInt(0)),
        subtotalCents: Number(ordersAggregate._sum.subtotalCents || BigInt(0)),
        ordersCount: ordersAggregate._count._all,
        ticketsSold: Number(ticketAggregate._sum.quantity || 0),
        payoutsCents: Number(payoutsAggregate._sum.amountCents || BigInt(0)),
      },
      ordersByDay,
    });
  }

  exportOrders(orgId: string, userId: string, query: OrganizerOrderQueryDto) {
    return this.ordersService.exportOrders(orgId, userId, query);
  }
}
