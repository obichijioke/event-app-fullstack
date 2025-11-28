import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentService } from '../orders/services/payment.service';
import {
  OrderStatus,
  PaymentStatus,
  TicketStatus,
  Prisma,
} from '@prisma/client';
import { OrganizerOrderQueryDto } from './dto/organizer-order-query.dto';
import { OrganizerRefundDto } from './dto/organizer-refund.dto';
import {
  checkFinancePermission,
  serializeResponse,
  clampPagination,
  calculateSkip,
  buildPaginatedResponse,
} from '../common/utils';

@Injectable()
export class OrganizerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async listOrders(
    orgId: string,
    userId: string,
    query: OrganizerOrderQueryDto,
  ) {
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to manage orders for this organization',
    );

    const { page, limit } = clampPagination(
      query.page ? parseInt(query.page, 10) : 1,
      query.limit ? parseInt(query.limit, 10) : 20,
    );

    const where: Prisma.OrderWhereInput = {
      orgId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.eventId) {
      where.eventId = query.eventId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        {
          buyer: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          items: {
            include: {
              ticketType: {
                select: {
                  id: true,
                  name: true,
                  kind: true,
                },
              },
              seat: {
                select: {
                  id: true,
                  section: true,
                  row: true,
                  number: true,
                },
              },
            },
          },
          tickets: {
            select: {
              id: true,
              status: true,
              ownerId: true,
            },
          },
          refunds: true,
          payments: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: calculateSkip(page, limit),
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return serializeResponse(
      buildPaginatedResponse(orders, page, limit, total),
    );
  }

  async getOrder(orgId: string, orderId: string, userId: string) {
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to manage orders for this organization',
    );

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        orgId,
      },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            ticketType: true,
            seat: true,
          },
        },
        tickets: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            checkins: true,
          },
        },
        payments: true,
        refunds: true,
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return serializeResponse(order);
  }

  async refundOrder(
    orgId: string,
    orderId: string,
    userId: string,
    dto: OrganizerRefundDto,
  ) {
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to manage orders for this organization',
    );

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        orgId,
      },
      include: {
        payments: true,
        tickets: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.paid) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const capturedPayment = order.payments.find(
      (payment) => payment.status === PaymentStatus.captured,
    );

    if (!capturedPayment) {
      throw new BadRequestException(
        'Order does not have a captured payment to refund',
      );
    }

    const refund = await this.paymentService.refundPayment(
      capturedPayment.id,
      dto.amountCents,
      userId,
    );

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.refunded,
      },
    });

    await this.prisma.ticket.updateMany({
      where: { orderId: order.id },
      data: { status: TicketStatus.refunded },
    });

    if (dto.reason) {
      await this.prisma.refund.updateMany({
        where: {
          orderId: order.id,
          providerRef: refund.id ? String(refund.id) : refund.id,
        },
        data: {
          reason: dto.reason,
          createdBy: userId,
        },
      });
    }

    return {
      message: 'Refund initiated successfully',
      refund,
    };
  }

  async exportOrders(
    orgId: string,
    userId: string,
    query: OrganizerOrderQueryDto,
  ) {
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to manage orders for this organization',
    );

    const where: Prisma.OrderWhereInput = {
      orgId,
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

    if (query.eventId) {
      where.eventId = query.eventId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return serializeResponse(orders);
  }
}
