import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';
import { PaymentService } from './services/payment.service';
import { PromotionsService } from '../promotions/promotions.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private promotionsService: PromotionsService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { eventId, occurrenceId, items, promoCode } = createOrderDto;

    // Get event details
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        ticketTypes: {
          where: {
            deletedAt: null,
            status: { in: ['active', 'approved'] },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event is live and public
    if (event.status !== 'live' || event.visibility !== 'public') {
      throw new ForbiddenException('Event is not available for purchase');
    }

    // Validate occurrence if provided
    if (occurrenceId) {
      const occurrence = await this.prisma.eventOccurrence.findUnique({
        where: { id: occurrenceId, eventId },
      });

      if (!occurrence) {
        throw new BadRequestException('Invalid occurrence for this event');
      }
    }

    // Validate and calculate order
    let subtotalCents = BigInt(0);
    let feesCents = BigInt(0);
    const orderItems: any[] = [];

    for (const item of items) {
      // Get ticket type
      const ticketType = event.ticketTypes.find(
        (tt) => tt.id === item.ticketTypeId,
      );
      if (!ticketType) {
        throw new BadRequestException(
          `Invalid ticket type: ${item.ticketTypeId}`,
        );
      }

      // Check if ticket type is on sale
      const now = new Date();
      if (ticketType.salesStart && ticketType.salesStart > now) {
        throw new BadRequestException(
          `Ticket type ${ticketType.name} is not yet on sale`,
        );
      }
      if (ticketType.salesEnd && ticketType.salesEnd < now) {
        throw new BadRequestException(
          `Ticket type ${ticketType.name}} is no longer on sale`,
        );
      }

      // Check capacity for GA tickets
      if (ticketType.kind === 'GA' && ticketType.capacity) {
        const soldCount = await this.prisma.ticket.count({
          where: {
            ticketTypeId: item.ticketTypeId,
            status: { not: 'void' },
          },
        });

        const heldCount = await this.prisma.hold.count({
          where: {
            ticketTypeId: item.ticketTypeId,
            expiresAt: { gt: now },
          },
        });

        const availableCount = ticketType.capacity - soldCount - heldCount;
        if (availableCount < item.quantity) {
          throw new BadRequestException(
            `Not enough tickets available for ${ticketType.name}`,
          );
        }
      }

      // Check seat availability for seated tickets
      if (ticketType.kind === 'SEATED' && item.seatId) {
        const existingTicket = await this.prisma.ticket.findFirst({
          where: {
            ticketTypeId: item.ticketTypeId,
            seatId: item.seatId,
            status: { not: 'void' },
          },
        });

        if (existingTicket) {
          throw new BadRequestException(`Seat ${item.seatId} is already sold`);
        }

        const existingHold = await this.prisma.hold.findFirst({
          where: {
            ticketTypeId: item.ticketTypeId,
            seatId: item.seatId,
            expiresAt: { gt: now },
          },
        });

        if (existingHold) {
          throw new BadRequestException(
            `Seat ${item.seatId} is currently held`,
          );
        }
      }

      // Calculate price (could use price tiers here)
      const unitPriceCents = ticketType.priceCents;
      const unitFeeCents = ticketType.feeCents;

      subtotalCents += BigInt(unitPriceCents) * BigInt(item.quantity);
      feesCents += BigInt(unitFeeCents) * BigInt(item.quantity);

      orderItems.push({
        ticketTypeId: item.ticketTypeId,
        seatId: item.seatId,
        quantity: item.quantity,
        unitPriceCents: BigInt(unitPriceCents),
        unitFeeCents: BigInt(unitFeeCents),
        currency: ticketType.currency,
      });
    }

    // Calculate discount first
    let discountCents = BigInt(0);
    let promoCodeId: string | undefined;

    if (promoCode) {
      const validation = await this.promotionsService.validatePromoCode(
        {
          code: promoCode,
          eventId,
          orderAmount: Number(subtotalCents),
        },
        userId,
      );

      if (validation.valid && validation.discountAmount) {
        discountCents = BigInt(validation.discountAmount);
        promoCodeId = validation.promoCode?.id;
      }
    }

    // Calculate tax on discounted subtotal: Tax = (Subtotal - Discount) × Tax Rate
    // Tax rate is 7%, so multiply by 7 and divide by 100
    const taxableAmount = subtotalCents - discountCents;
    const taxCents = (taxableAmount * BigInt(7)) / BigInt(100); // 7% tax rate

    // Calculate fees
    const { totalFeeCents, feeLines } = await this.calculateFees(
      event.orgId,
      subtotalCents,
      items.reduce((acc, item) => acc + item.quantity, 0),
    );

    // Add ticket-specific fees
    feesCents += totalFeeCents;

    const totalCents = subtotalCents + feesCents + taxCents - discountCents;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        buyerId: userId,
        orgId: event.orgId,
        eventId,
        occurrenceId,
        status: OrderStatus.pending,
        subtotalCents,
        feesCents,
        taxCents,
        totalCents: totalCents > 0 ? totalCents : BigInt(0),
        currency: orderItems[0]?.currency || 'USD',
      },
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
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create order items
    await this.prisma.orderItem.createMany({
      data: orderItems.map((item) => ({
        orderId: order.id,
        ...item,
      })),
    });

    // Create tax and fee lines
    await this.prisma.orderTaxLine.create({
      data: {
        orderId: order.id,
        name: 'Sales Tax',
        rate: 0.07,
        amountCents: taxCents,
      },
    });

    // Create fee lines
    if (feeLines.length > 0) {
      await this.prisma.orderFeeLine.createMany({
        data: feeLines.map((line) => ({
          orderId: order.id,
          name: line.name,
          amountCents: line.amountCents,
          beneficiary: line.beneficiary,
        })),
      });
    }

    // Record promo usage if applicable
    if (promoCodeId) {
      await this.promotionsService.usePromoCode(promoCodeId, userId, order.id);
    }

    return {
      ...order,
      discountCents,
    };
  }

  private async calculateFees(
    orgId: string,
    subtotalCents: bigint,
    totalTickets: number,
  ): Promise<{
    totalFeeCents: bigint;
    feeLines: { name: string; amountCents: bigint; beneficiary: string }[];
  }> {
    // 1. Fetch active FeeSchedules (platform and processing)
    const feeSchedules = await this.prisma.feeSchedule.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch active OrgFeeOverride for this org
    const now = new Date();
    const overrides = await this.prisma.orgFeeOverride.findMany({
      where: {
        orgId,
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        startsAt: { lte: now },
      },
      include: { feeSchedule: true },
    });

    // 3. Determine applicable schedules
    let platformSchedule = feeSchedules.find((fs) => fs.kind === 'platform');
    let processingSchedule = feeSchedules.find(
      (fs) => fs.kind === 'processing',
    );

    // Apply overrides
    for (const override of overrides) {
      if (override.feeSchedule.kind === 'platform') {
        platformSchedule = override.feeSchedule;
      } else if (override.feeSchedule.kind === 'processing') {
        processingSchedule = override.feeSchedule;
      }
    }

    let totalFeeCents = BigInt(0);
    const feeLines: {
      name: string;
      amountCents: bigint;
      beneficiary: string;
    }[] = [];

    // 4. Calculate Platform Fee
    if (platformSchedule) {
      let platformFee = BigInt(0);
      if (platformSchedule.percent) {
        platformFee +=
          (subtotalCents *
            BigInt(Math.round(Number(platformSchedule.percent) * 100))) /
          BigInt(10000); // percent is decimal, so *100 for integer math, then /10000 (100*100)
      }
      if (platformSchedule.fixedCents) {
        platformFee +=
          BigInt(platformSchedule.fixedCents) * BigInt(totalTickets);
      }

      if (platformFee > 0) {
        totalFeeCents += platformFee;
        feeLines.push({
          name: platformSchedule.name,
          amountCents: platformFee,
          beneficiary: 'platform',
        });
      }
    }

    // 5. Calculate Processing Fee
    if (processingSchedule) {
      let processingFee = BigInt(0);
      if (processingSchedule.percent) {
        processingFee +=
          (subtotalCents *
            BigInt(Math.round(Number(processingSchedule.percent) * 100))) /
          BigInt(10000);
      }
      if (processingSchedule.fixedCents) {
        processingFee +=
          BigInt(processingSchedule.fixedCents) * BigInt(totalTickets);
      }

      if (processingFee > 0) {
        totalFeeCents += processingFee;
        feeLines.push({
          name: processingSchedule.name,
          amountCents: processingFee,
          beneficiary: 'platform', // Usually platform collects this to pay provider
        });
      }
    }

    return { totalFeeCents, feeLines };
  }

  async findAll(
    userId: string,
    filters?: {
      status?: OrderStatus;
      eventId?: string;
      orgId?: string;
      startDate?: string;
      endDate?: string;
    },
    pagination?: { page: number; limit: number },
  ) {
    const whereClause: any = {
      buyerId: userId,
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.eventId) {
      whereClause.eventId = filters.eventId;
    }

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const limit =
      pagination?.limit && pagination.limit > 0 && pagination.limit <= 100
        ? pagination.limit
        : 20;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: whereClause,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startAt: true,
            },
          },
          org: {
            select: {
              id: true,
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
          payments: true,
          tickets: true,
          _count: {
            select: {
              items: true,
              tickets: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where: whereClause }),
    ]);

    const itemsWithDiscount = orders.map((order) => {
      const discountCents =
        order.subtotalCents +
        order.feesCents +
        order.taxCents -
        order.totalCents;
      return {
        ...order,
        discountCents: discountCents > 0 ? discountCents : BigInt(0),
      };
    });

    return { items: itemsWithDiscount, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        event: {
          include: {
            org: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        org: {
          select: {
            id: true,
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
        taxLines: true,
        feeLines: true,
        payments: true,
        tickets: {
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
        refunds: true,
        _count: {
          select: {
            items: true,
            tickets: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    const discountCents =
      order.subtotalCents + order.feesCents + order.taxCents - order.totalCents;

    return {
      ...order,
      discountCents: discountCents > 0 ? discountCents : BigInt(0),
    };
  }

  async update(id: string, userId: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this order',
      );
    }

    // Only allow updating certain fields
    const allowedFields: string[] = [];
    const hasDisallowedFields = Object.keys(updateOrderDto).some(
      (key) => !allowedFields.includes(key),
    );

    if (hasDisallowedFields) {
      throw new BadRequestException(
        'Cannot update order details after creation',
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        // Only include fields that are actually in the DTO
        ...(updateOrderDto.eventId && { eventId: updateOrderDto.eventId }),
        ...(updateOrderDto.occurrenceId && {
          occurrenceId: updateOrderDto.occurrenceId,
        }),
      },
      include: {
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
      },
    });

    return updatedOrder;
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        payments: true,
        tickets: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to cancel this order',
      );
    }

    if (
      order.status === OrderStatus.canceled ||
      order.status === OrderStatus.refunded
    ) {
      throw new BadRequestException('Order is already canceled or refunded');
    }

    if (order.status === OrderStatus.paid) {
      // Need to process refund
      const payment = order.payments[0];
      if (payment && payment.status === 'captured') {
        await this.paymentService.refundPayment(payment.id);
      }
    }

    // Update order status
    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.canceled,
        canceledAt: new Date(),
      },
    });

    // Void tickets
    await this.prisma.ticket.updateMany({
      where: { orderId: id },
      data: {
        status: 'void',
      },
    });

    return { message: 'Order canceled successfully' };
  }

  async initiatePayment(
    orderId: string,
    userId: string,
    createPaymentDto: any,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to pay for this order',
      );
    }

    if (order.status !== OrderStatus.pending) {
      throw new BadRequestException('Order is not in pending status');
    }

    return this.paymentService.createPaymentIntent(orderId, createPaymentDto);
  }

  async processPayment(processPaymentDto: any, userId: string) {
    const { orderId } = processPaymentDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to pay for this order',
      );
    }

    const result = await this.paymentService.processPayment(processPaymentDto);

    // If payment was successful, create tickets
    if (result.status === 'succeeded' || result.status === 'success') {
      await this.createTicketsForOrder(orderId);
    }

    return result;
  }

  private async createTicketsForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            ticketType: true,
            seat: true,
          },
        },
        tickets: true, // Include existing tickets to check count
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Idempotency check: Calculate total expected tickets
    const totalExpectedTickets = order.items.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    // If we already have all tickets, we're done
    if (order.tickets && order.tickets.length === totalExpectedTickets) {
      return;
    }

    const existingQRCodes = new Set(order.tickets?.map((t) => t.qrCode) || []);

    // Create tickets for each order item
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        const qrCode = this.generateQRCode(
          order.id,
          item.ticketTypeId,
          item.seatId || undefined,
          i, // Pass index for uniqueness
        );
        // Skip if this specific ticket already exists
        if (existingQRCodes.has(qrCode)) {
          continue;
        }

        const barcode = this.generateBarcode(
          order.id,
          item.ticketTypeId,
          item.seatId || undefined,
          i, // Pass index for uniqueness
        );

        await this.prisma.ticket.create({
          data: {
            orderId: order.id,
            eventId: order.eventId,
            occurrenceId: order.occurrenceId,
            ticketTypeId: item.ticketTypeId,
            seatId: item.seatId,
            ownerId: order.buyerId,
            status: 'issued',
            qrCode,
            barcode,
            issuedAt: new Date(),
          },
        });
      }
    }
  }

  private generateQRCode(
    orderId: string,
    ticketTypeId: string,
    seatId?: string,
    index: number = 0,
  ): string {
    // Generate a unique QR code
    // Include index to ensure uniqueness for multiple tickets of same type
    const data = `${orderId}-${ticketTypeId}${seatId ? `-${seatId}` : ''}-${index}`;
    return Buffer.from(data).toString('base64');
  }

  private generateBarcode(
    orderId: string,
    ticketTypeId: string,
    seatId?: string,
    index: number = 0,
  ): string {
    // Generate a unique barcode
    const data = `${orderId}-${ticketTypeId}${seatId ? `-${seatId}` : ''}-${index}`;
    return data;
  }

  async getOrderStats(
    userId: string,
    filters?: {
      eventId?: string;
      orgId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const whereClause: any = {
      buyerId: userId,
    };

    if (filters?.eventId) {
      whereClause.eventId = filters.eventId;
    }

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    const stats = await this.prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        totalCents: true,
      },
    });

    return stats;
  }
}
