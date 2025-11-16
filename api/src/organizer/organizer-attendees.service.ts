import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { OrgMemberRole, TicketStatus, Prisma } from '@prisma/client';
import { OrganizerAttendeeQueryDto } from './dto/organizer-attendee-query.dto';
import { OrganizerTransferTicketDto } from './dto/organizer-transfer.dto';
import { CreateCheckinDto } from '../tickets/dto/create-ticket.dto';
import { checkOrgPermission, serializeResponse } from '../common/utils';

@Injectable()
export class OrganizerAttendeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
  ) {}

  private async ensureEventAccess(
    orgId: string,
    eventId: string,
    userId: string,
  ) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        orgId,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      [
        OrgMemberRole.owner,
        OrgMemberRole.manager,
        OrgMemberRole.finance,
        OrgMemberRole.staff,
      ],
      'You do not have permission to manage attendees for this event',
    );

    return event;
  }

  async listAttendees(
    orgId: string,
    eventId: string,
    userId: string,
    query: OrganizerAttendeeQueryDto,
  ) {
    await this.ensureEventAccess(orgId, eventId, userId);

    const where: Prisma.TicketWhereInput = {
      eventId,
      status: {
        not: TicketStatus.void,
      },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        {
          owner: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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
        order: {
          select: {
            id: true,
            buyerId: true,
            createdAt: true,
          },
        },
        checkins: true,
      },
      orderBy: {
        issuedAt: 'asc',
      },
    });

    return serializeResponse(tickets);
  }

  async transferTicket(
    orgId: string,
    ticketId: string,
    userId: string,
    dto: OrganizerTransferTicketDto,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket || ticket.event.orgId !== orgId) {
      throw new NotFoundException('Ticket not found');
    }

    await this.ensureEventAccess(orgId, ticket.eventId, userId);

    if (ticket.status !== TicketStatus.issued) {
      throw new BadRequestException(
        'Only issued tickets can be reassigned by the organizer',
      );
    }

    const newOwner = await this.prisma.user.findUnique({
      where: { id: dto.toUserId },
    });

    if (!newOwner) {
      throw new NotFoundException('Recipient user not found');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        ownerId: dto.toUserId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return serializeResponse({
      message: 'Ticket ownership updated',
      ticket: updatedTicket,
    });
  }

  async resendTicket(orgId: string, ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!ticket || ticket.event.orgId !== orgId) {
      throw new NotFoundException('Ticket not found');
    }

    await this.ensureEventAccess(orgId, ticket.eventId, userId);

    // In a full implementation this would enqueue an email. For now we just confirm.
    return {
      message: 'Ticket resend queued',
      recipient: ticket.owner,
    };
  }

  async recordCheckin(orgId: string, userId: string, dto: CreateCheckinDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket || ticket.event.orgId !== orgId) {
      throw new NotFoundException('Ticket not found');
    }

    await this.ensureEventAccess(orgId, ticket.eventId, userId);

    return this.ticketsService.checkInTicket(dto, userId);
  }

  async getCheckinStats(orgId: string, eventId: string, userId: string) {
    await this.ensureEventAccess(orgId, eventId, userId);

    const [totalTickets, checkedIn] = await this.prisma.$transaction([
      this.prisma.ticket.count({
        where: {
          eventId,
          status: {
            not: TicketStatus.void,
          },
        },
      }),
      this.prisma.ticket.count({
        where: {
          eventId,
          status: TicketStatus.checked_in,
        },
      }),
    ]);

    const pending = Math.max(totalTickets - checkedIn, 0);
    const checkInRate =
      totalTickets > 0 ? Number(((checkedIn / totalTickets) * 100).toFixed(1)) : 0;

    return {
      totalTickets,
      checkedIn,
      pending,
      checkInRate,
    };
  }

  async getRecentCheckins(
    orgId: string,
    eventId: string,
    userId: string,
    limit = 10,
  ) {
    await this.ensureEventAccess(orgId, eventId, userId);

    const take = Math.min(Math.max(limit, 1), 50);

    const checkins = await this.prisma.checkin.findMany({
      where: {
        eventId,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketType: {
              select: {
                name: true,
              },
            },
            owner: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
      take,
    });

    return checkins.map((checkin) => ({
      id: checkin.id,
      ticketId: checkin.ticketId,
      attendeeName: checkin.ticket.owner?.name ?? 'Attendee',
      ticketType: checkin.ticket.ticketType?.name ?? 'Ticket',
      scannedAt: checkin.scannedAt,
    }));
  }
}
