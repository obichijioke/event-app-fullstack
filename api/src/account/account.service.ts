import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus, TicketStatus, RefundStatus } from '@prisma/client';
import { RequestRefundDto } from './dto/request-refund.dto';

type TransferStatus = 'pending' | 'accepted' | 'canceled';
type TransferDirection = 'sent' | 'received' | 'all';

interface TransferQuery {
  type?: TransferDirection;
  status?: TransferStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const [orderAggregate, activeTickets, followingCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          buyerId: userId,
          status: {
            in: [OrderStatus.paid, OrderStatus.refunded, OrderStatus.pending],
          },
        },
        _count: { id: true },
        _sum: { totalCents: true },
      }),
      this.prisma.ticket.count({
        where: {
          ownerId: userId,
          status: {
            in: [TicketStatus.issued, TicketStatus.checked_in],
          },
        },
      }),
      this.prisma.userFollow.count({
        where: { userId },
      }),
    ]);

    return {
      totalOrders: orderAggregate._count.id ?? 0,
      totalSpentCents: Number(orderAggregate._sum.totalCents ?? 0n),
      activeTickets,
      following: followingCount,
    };
  }

  async getTransfers(userId: string, query: TransferQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

    const type: TransferDirection = query.type ?? 'all';
    const status: TransferStatus | undefined = query.status;

    if (type && !['sent', 'received', 'all'].includes(type)) {
      throw new BadRequestException('Invalid transfer type');
    }
    if (status && !['pending', 'accepted', 'canceled'].includes(status)) {
      throw new BadRequestException('Invalid transfer status');
    }

    const where: any = {};
    if (type === 'sent') {
      where.fromUserId = userId;
    } else if (type === 'received') {
      where.toUserId = userId;
    } else {
      where.OR = [{ fromUserId: userId }, { toUserId: userId }];
    }

    if (status === 'pending') {
      where.acceptedAt = null;
      where.canceledAt = null;
    } else if (status === 'accepted') {
      where.acceptedAt = { not: null };
    } else if (status === 'canceled') {
      where.canceledAt = { not: null };
    }

    const [transfers, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        include: {
          ticket: {
            select: {
              id: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  startAt: true,
                },
              },
              ticketType: {
                select: {
                  id: true,
                  name: true,
                  kind: true,
                },
              },
            },
          },
          fromUser: {
            select: { id: true, email: true, name: true },
          },
          toUser: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { initiatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transfer.count({ where }),
    ]);

    const items = transfers.map((transfer) => {
      let derivedStatus: TransferStatus = 'pending';
      if (transfer.canceledAt) {
        derivedStatus = 'canceled';
      } else if (transfer.acceptedAt) {
        derivedStatus = 'accepted';
      }

      const direction: TransferDirection =
        transfer.fromUserId === userId ? 'sent' : 'received';

      return {
        id: transfer.id,
        ticketId: transfer.ticketId,
        direction,
        status: derivedStatus,
        initiatedAt: transfer.initiatedAt,
        acceptedAt: transfer.acceptedAt,
        canceledAt: transfer.canceledAt,
        ticket: transfer.ticket,
        fromUser: transfer.fromUser,
        toUser: transfer.toUser,
      };
    });

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async getRefunds(
    userId: string,
    query: { status?: string; page?: number; limit?: number },
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

    const where: any = {
      order: {
        buyerId: userId,
      },
    };

    if (query.status) {
      const allowed = Object.values(RefundStatus);
      if (!allowed.includes(query.status as RefundStatus)) {
        throw new BadRequestException('Invalid refund status');
      }
      where.status = query.status as RefundStatus;
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              totalCents: true,
              currency: true,
              status: true,
              createdAt: true,
              eventId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { items: refunds, total, page, limit };
  }

  async requestRefund(userId: string, dto: RequestRefundDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        totalCents: true,
        currency: true,
      },
    });

    if (!order || order.buyerId !== userId) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== OrderStatus.paid) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const existingPending = await this.prisma.refund.findFirst({
      where: {
        orderId: order.id,
        status: { in: [RefundStatus.pending, RefundStatus.approved] },
      },
    });

    if (existingPending) {
      throw new BadRequestException('Refund already requested for this order');
    }

    const amountCents =
      dto.amountCents && dto.amountCents > 0
        ? BigInt(dto.amountCents)
        : order.totalCents;

    if (amountCents > order.totalCents) {
      throw new BadRequestException('Refund amount exceeds order total');
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId: order.id,
        amountCents,
        currency: order.currency,
        reason: dto.reason,
        createdBy: userId,
        status: RefundStatus.pending,
      },
    });

    return refund;
  }
}
