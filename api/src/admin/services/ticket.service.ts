import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TicketAdminQueryDto, TransferQueryDto, CheckinQueryDto } from '../dto/ticket.dto';
import { Prisma, TicketStatus } from '@prisma/client';

@Injectable()
export class AdminTicketService {
  constructor(private prisma: PrismaService) {}

  async getTickets(query: TicketAdminQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      eventId,
      ownerId,
      orderId,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    const orderBy: Prisma.TicketOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'issuedAt', 'status'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.issuedAt = 'desc';
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orderId: true,
          eventId: true,
          ownerId: true,
          status: true,
          qrCode: true,
          issuedAt: true,
          owner: {
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
              startAt: true,
            },
          },
          ticketType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const data = tickets.map((ticket) => ({
      id: ticket.id,
      orderId: ticket.orderId,
      eventId: ticket.eventId,
      eventTitle: ticket.event.title,
      eventStartAt: ticket.event.startAt,
      ownerId: ticket.ownerId,
      ownerEmail: ticket.owner.email,
      ownerName: ticket.owner.name,
      ticketTypeName: ticket.ticketType.name,
      status: ticket.status,
      qrCode: ticket.qrCode,
      issuedAt: ticket.issuedAt,
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

  async getTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
          },
        },
        order: {
          select: {
            id: true,
            totalCents: true,
            currency: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
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
        checkins: {
          orderBy: {
            scannedAt: 'desc',
          },
          take: 5,
        },
        transfersFrom: {
          orderBy: {
            initiatedAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async voidTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === TicketStatus.void) {
      throw new BadRequestException('Ticket is already void');
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.void,
      },
    });

    return { message: 'Ticket voided successfully' };
  }

  async getTransfers(query: TransferQueryDto) {
    const {
      page = 1,
      limit = 10,
      ticketId,
      fromUserId,
      toUserId,
      status,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransferWhereInput = {};

    if (ticketId) {
      where.ticketId = ticketId;
    }

    if (fromUserId) {
      where.fromUserId = fromUserId;
    }

    if (toUserId) {
      where.toUserId = toUserId;
    }

    if (status === 'pending') {
      where.acceptedAt = null;
      where.canceledAt = null;
    } else if (status === 'accepted') {
      where.acceptedAt = { not: null };
    } else if (status === 'canceled') {
      where.canceledAt = { not: null };
    }

    const orderBy: Prisma.TransferOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'initiatedAt', 'acceptedAt', 'canceledAt'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.initiatedAt = 'desc';
    }

    const [transfers, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          ticketId: true,
          fromUserId: true,
          toUserId: true,
          initiatedAt: true,
          acceptedAt: true,
          canceledAt: true,
          fromUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          toUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          ticket: {
            select: {
              id: true,
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    const data = transfers.map((transfer) => ({
      id: transfer.id,
      ticketId: transfer.ticketId,
      eventId: transfer.ticket.event.id,
      eventTitle: transfer.ticket.event.title,
      fromUserId: transfer.fromUserId,
      fromUserEmail: transfer.fromUser.email,
      fromUserName: transfer.fromUser.name,
      toUserId: transfer.toUserId,
      toUserEmail: transfer.toUser.email,
      toUserName: transfer.toUser.name,
      initiatedAt: transfer.initiatedAt,
      acceptedAt: transfer.acceptedAt,
      canceledAt: transfer.canceledAt,
      status: transfer.canceledAt
        ? 'canceled'
        : transfer.acceptedAt
          ? 'accepted'
          : 'pending',
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

  async getCheckins(query: CheckinQueryDto) {
    const {
      page = 1,
      limit = 10,
      eventId,
      scannerId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CheckinWhereInput = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (scannerId) {
      where.scannerId = scannerId;
    }

    if (dateFrom || dateTo) {
      where.scannedAt = {};
      if (dateFrom) {
        where.scannedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.scannedAt.lte = new Date(dateTo);
      }
    }

    const orderBy: Prisma.CheckinOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'scannedAt'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.scannedAt = 'desc';
    }

    const [checkins, total] = await Promise.all([
      this.prisma.checkin.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          ticketId: true,
          eventId: true,
          scannerId: true,
          gate: true,
          scannedAt: true,
          ticket: {
            select: {
              id: true,
              owner: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.checkin.count({ where }),
    ]);

    const data = checkins.map((checkin) => ({
      id: checkin.id,
      ticketId: checkin.ticketId,
      eventId: checkin.eventId,
      eventTitle: checkin.event.title,
      ownerEmail: checkin.ticket.owner.email,
      ownerName: checkin.ticket.owner.name,
      scannerId: checkin.scannerId,
      gate: checkin.gate,
      scannedAt: checkin.scannedAt,
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

  async getTicketStats() {
    const [total, issued, transferred, refunded, checkedIn, voided] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: TicketStatus.issued } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.transferred } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.refunded } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.checked_in } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.void } }),
    ]);

    const recent24h = await this.prisma.ticket.count({
      where: {
        issuedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      total,
      issued,
      transferred,
      refunded,
      checkedIn,
      voided,
      recent24h,
    };
  }
}
