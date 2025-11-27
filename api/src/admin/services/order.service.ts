import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderAdminQueryDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class AdminOrderService {
  constructor(private prisma: PrismaService) {}

  async getOrders(query: OrderAdminQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      eventId,
      orgId,
      buyerId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
        { buyer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (orgId) {
      where.orgId = orgId;
    }

    if (buyerId) {
      where.buyerId = buyerId;
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

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'createdAt',
        'totalCents',
        'status',
        'paidAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          buyerId: true,
          orgId: true,
          eventId: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          paidAt: true,
          buyer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          org: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const data = orders.map((order) => ({
      id: order.id,
      buyerId: order.buyerId,
      buyerEmail: order.buyer.email,
      buyerName: order.buyer.name,
      orgId: order.orgId,
      orgName: order.org.name,
      eventId: order.eventId,
      eventTitle: order.event.title,
      status: order.status,
      totalCents: Number(order.totalCents),
      currency: order.currency,
      ticketCount: order._count.tickets,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
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

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
        org: {
          select: {
            id: true,
            name: true,
            supportEmail: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
          },
        },
        items: {
          include: {
            ticketType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
            amountCents: true,
            currency: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tickets: {
          select: {
            id: true,
            status: true,
            qrCode: true,
            issuedAt: true,
          },
          orderBy: { issuedAt: 'asc' },
        },
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      orderNumber: order.id,
      buyerId: order.buyerId,
      buyerName: order.buyer?.name,
      buyerEmail: order.buyer?.email,
      orgId: order.orgId,
      orgName: order.org?.name,
      eventId: order.eventId,
      eventTitle: order.event?.title,
      eventStartAt: order.event?.startAt,
      status: order.status,
      paymentStatus: order.payments?.[0]?.status || order.status,
      currency: order.currency,
      amountCents: Number(order.totalCents),
      totalCents: Number(order.totalCents),
      ticketCount: order.tickets?.length || 0,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      tickets: order.tickets?.map((t) => ({
        id: t.id,
        status: t.status,
      })),
      payments: order.payments?.map((p) => ({
        id: p.id,
        provider: p.provider,
        status: p.status,
        amountCents: Number(p.amountCents),
        currency: p.currency,
        createdAt: p.createdAt,
      })),
      items: order.items?.map((i) => ({
        ticketType: { name: i.ticketType?.name },
      })),
    };
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
      },
    });

    return {
      message: 'Order status updated successfully',
      order: updatedOrder,
    };
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.canceled) {
      throw new BadRequestException('Order is already canceled');
    }

    if (order.status === OrderStatus.refunded) {
      throw new BadRequestException('Cannot cancel a refunded order');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.canceled,
        canceledAt: new Date(),
      },
    });

    return { message: 'Order canceled successfully' };
  }

  async getOrderStats() {
    const [total, pending, paid, canceled, refunded, totalRevenue] =
      await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: OrderStatus.pending } }),
        this.prisma.order.count({ where: { status: OrderStatus.paid } }),
        this.prisma.order.count({ where: { status: OrderStatus.canceled } }),
        this.prisma.order.count({ where: { status: OrderStatus.refunded } }),
        this.prisma.order.aggregate({
          where: { status: OrderStatus.paid },
          _sum: { totalCents: true },
        }),
      ]);

    const recent24h = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      total,
      pending,
      paid,
      canceled,
      refunded,
      recent24h,
      totalRevenueCents: Number(totalRevenue._sum.totalCents || 0),
    };
  }
}
