import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailerService } from '../common/mailer/mailer.service';
import {
  CreateTransferDto,
  AcceptTransferDto,
  CreateCheckinDto,
  UpdateTicketStatusDto,
} from './dto/create-ticket.dto';
import { TicketStatus } from '@prisma/client';
import { transferEmailIncludes, TransferWithEmailData } from '../common/types/prisma-helpers';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async getUserTickets(
    userId: string,
    filters?: {
      eventId?: string;
      status?: TicketStatus;
      upcoming?: boolean;
    },
  ) {
    const whereClause: any = {
      ownerId: userId,
    };

    if (filters?.eventId) {
      whereClause.eventId = filters.eventId;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.upcoming) {
      whereClause.event = {
        startAt: {
          gte: new Date(),
        },
      };
    }

    const tickets = await this.prisma.ticket.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
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
            createdAt: true,
            totalCents: true,
            currency: true,
          },
        },
        checkins: {
          orderBy: {
            scannedAt: 'desc',
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return tickets;
  }

  async getTicketById(id: string, userId?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
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
            createdAt: true,
            totalCents: true,
            currency: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        checkins: {
          orderBy: {
            scannedAt: 'desc',
          },
        },
        transfersFrom: {
          include: {
            toUser: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user has permission to view this ticket
    if (userId && ticket.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this ticket',
      );
    }

    return ticket;
  }

  async initiateTransfer(userId: string, createTransferDto: CreateTransferDto) {
    const { ticketId, toUserId, recipientEmail } = createTransferDto;

    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          include: {
            policies: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.ownerId !== userId) {
      throw new ForbiddenException('You do not own this ticket');
    }

    if (ticket.status !== TicketStatus.issued) {
      throw new BadRequestException(
        'Ticket cannot be transferred in its current status',
      );
    }

    // Check if transfer is allowed
    if (ticket.event.policies && !ticket.event.policies.transferAllowed) {
      throw new BadRequestException('Transfers are not allowed for this event');
    }

    // Check transfer cutoff
    if (ticket.event.policies && ticket.event.policies.transferCutoff) {
      const eventStart = ticket.event.startAt;
      const cutoffHours = parseInt(ticket.event.policies.transferCutoff);
      const cutoffTime = new Date(
        eventStart.getTime() - cutoffHours * 60 * 60 * 1000,
      );

      if (new Date() > cutoffTime) {
        throw new BadRequestException('Transfer cutoff has passed');
      }
    }

    // Check if ticket is already being transferred
    const existingTransfer = await this.prisma.transfer.findFirst({
      where: {
        ticketId,
        acceptedAt: null,
        canceledAt: null,
      },
    });

    if (existingTransfer) {
      throw new BadRequestException('Ticket is already being transferred');
    }

    // Resolve recipient (email preferred, fallback to ID for compatibility)
    let toUserIdResolved: string | undefined = toUserId;
    if (recipientEmail) {
      const toUser = await this.prisma.user.findFirst({
        where: {
          email: {
            equals: recipientEmail,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });

      if (!toUser) {
        throw new NotFoundException('Recipient user not found');
      }
      toUserIdResolved = toUser.id;
    }

    if (!toUserIdResolved) {
      throw new BadRequestException('Recipient is required');
    }

    if (toUserIdResolved === userId) {
      throw new BadRequestException('You cannot transfer a ticket to yourself');
    }

    // Create transfer
    const transfer = await this.prisma.transfer.create({
      data: {
        ticketId,
        fromUserId: userId,
        toUserId: toUserIdResolved,
        initiatedAt: new Date(),
      },
      ...transferEmailIncludes,
    }) as TransferWithEmailData;

    // Send transfer notification emails
    await this.sendTransferNotificationEmails(transfer).catch((error) => {
      console.error('Failed to send transfer notification emails:', error);
      // Don't fail the transfer if emails fail
    });

    return transfer;
  }

  async acceptTransfer(userId: string, acceptTransferDto: AcceptTransferDto) {
    const { transferId } = acceptTransferDto;

    // Get transfer
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        ticket: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        toUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.toUserId !== userId) {
      throw new ForbiddenException(
        'You are not the recipient of this transfer',
      );
    }

    if (transfer.acceptedAt || transfer.canceledAt) {
      throw new BadRequestException('Transfer has already been processed');
    }

    // Update transfer
    await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        acceptedAt: new Date(),
      },
    });

    // Update ticket ownership
    await this.prisma.ticket.update({
      where: { id: transfer.ticketId },
      data: {
        ownerId: userId,
        transferredFrom: transfer.fromUserId,
      },
    });

    return { message: 'Transfer accepted successfully' };
  }

  async cancelTransfer(userId: string, transferId: string) {
    // Get transfer
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        ticket: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.fromUserId !== userId) {
      throw new ForbiddenException('You did not initiate this transfer');
    }

    if (transfer.acceptedAt || transfer.canceledAt) {
      throw new BadRequestException('Transfer has already been processed');
    }

    // Update transfer
    await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        canceledAt: new Date(),
      },
    });

    return { message: 'Transfer canceled successfully' };
  }

  async getTransfersForTicket(ticketId: string, userId: string) {
    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.ownerId !== userId) {
      throw new ForbiddenException('You do not own this ticket');
    }

    const transfers = await this.prisma.transfer.findMany({
      where: {
        ticketId,
      },
      include: {
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
      },
      orderBy: {
        initiatedAt: 'desc',
      },
    });

    return transfers;
  }

  async checkInTicket(createCheckinDto: CreateCheckinDto, scannerId?: string) {
    const { ticketId, gate } = createCheckinDto;

    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
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
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        checkins: {
          orderBy: {
            scannedAt: 'desc',
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if ticket is already checked in
    if (ticket.status === TicketStatus.checked_in) {
      throw new BadRequestException('Ticket is already checked in');
    }

    // Check if ticket is valid
    if (ticket.status !== TicketStatus.issued) {
      throw new BadRequestException(
        'Ticket is not in a valid status for check-in',
      );
    }

    // Check if event is in the past
    if (ticket.event.endAt < new Date()) {
      throw new BadRequestException('Event has already ended');
    }

    // Check if event hasn't started yet
    if (ticket.event.startAt > new Date()) {
      throw new BadRequestException('Event has not started yet');
    }

    // Create check-in record
    const checkin = await this.prisma.checkin.create({
      data: {
        ticketId,
        eventId: ticket.eventId,
        scannerId,
        gate,
        scannedAt: new Date(),
      },
    });

    // Update ticket status
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.checked_in,
      },
    });

    return {
      checkin,
      ticket: {
        id: ticket.id,
        owner: ticket.owner,
        ticketType: ticket.ticketType,
        seat: ticket.seat,
        event: ticket.event,
      },
    };
  }

  async getCheckinsForEvent(eventId: string, userId?: string) {
    // Check if user is a member of the organization that owns the event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        org: {
          include: {
            members: {
              where: userId ? { userId } : { userId: 'non-existent' },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      event.visibility !== 'public' &&
      (!userId || event.org.members.length === 0)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view check-ins for this event',
      );
    }

    const checkins = await this.prisma.checkin.findMany({
      where: {
        eventId,
      },
      include: {
        ticket: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
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
          },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
    });

    return checkins;
  }

  async updateTicketStatus(
    ticketId: string,
    userId: string,
    updateTicketStatusDto: UpdateTicketStatusDto,
  ) {
    const { status } = updateTicketStatusDto;

    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check permissions based on status
    if (status === TicketStatus.void) {
      // Only ticket owner or event organizer can void tickets
      const event = await this.prisma.event.findUnique({
        where: { id: ticket.eventId },
        include: {
          org: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const isOwner = ticket.ownerId === userId;
      const isOrgMember = event.org.members.length > 0;

      if (!isOwner && !isOrgMember) {
        throw new ForbiddenException(
          'You do not have permission to void this ticket',
        );
      }
    } else {
      // Only ticket owner can update other statuses
      if (ticket.ownerId !== userId) {
        throw new ForbiddenException('You do not own this ticket');
      }
    }

    // Update ticket status
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        event: {
          select: {
            id: true,
            title: true,
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
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return updatedTicket;
  }

  async regenerateQRCode(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.ownerId !== userId) {
      throw new ForbiddenException('You do not own this ticket');
    }

    // Generate new QR code
    const qrCode = this.generateQRCode(
      ticket.orderId,
      ticket.ticketTypeId,
      ticket.seatId || undefined,
    );

    // Update ticket
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { qrCode },
    });

    return { qrCode };
  }

  private generateQRCode(
    orderId: string,
    ticketTypeId: string,
    seatId?: string,
  ): string {
    // Generate a unique QR code
    const data = `${orderId}-${ticketTypeId}${seatId ? `-${seatId}` : ''}`;
    return Buffer.from(data).toString('base64');
  }

  async getTicketStats(eventId: string, userId?: string) {
    // Check if user is a member of the organization that owns the event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        org: {
          include: {
            members: {
              where: userId ? { userId } : { userId: 'non-existent' },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      event.visibility !== 'public' &&
      (!userId || event.org.members.length === 0)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view stats for this event',
      );
    }

    const stats = await this.prisma.ticket.groupBy({
      by: ['status'],
      where: {
        eventId,
      },
      _count: {
        id: true,
      },
    });

    return stats;
  }

  private async sendTransferNotificationEmails(transfer: any) {
    const { ticket, fromUser, toUser } = transfer;
    const event = ticket.event;

    // Format event date and time
    const eventDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(event.startAt));

    const eventTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(event.startAt));

    // Format venue address (address is a JSON field)
    let venueAddress = '';
    if (event.venue?.address) {
      const addr = event.venue.address as any;
      venueAddress = typeof addr === 'string'
        ? addr
        : [addr.street, addr.city, addr.state, addr.country]
            .filter(Boolean)
            .join(', ');
    }

    // Format seat info if available
    let seatInfo = '';
    if (ticket.seat) {
      seatInfo = `Section ${ticket.seat.section}, Row ${ticket.seat.row}, Seat ${ticket.seat.number}`;
    }

    // Prepare ticket data
    const ticketData = {
      ticketNumber: ticket.id.substring(0, 8).toUpperCase(),
      ticketType: ticket.ticketType?.name || 'General Admission',
      seatInfo: seatInfo || null,
      ticketId: ticket.id,
    };

    const baseContext = {
      eventName: event.title,
      eventDate,
      eventTime,
      venueName: event.venue?.name,
      venueAddress,
      tickets: [ticketData],
      ticketCount: 1,
      senderName: fromUser.name || fromUser.email.split('@')[0],
      senderEmail: fromUser.email,
      recipientName: toUser.name || toUser.email.split('@')[0],
      recipientEmail: toUser.email,
      transferId: transfer.id,
      transferDate: new Date().toLocaleDateString(),
      expiryDays: '7',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@eventflow.dev',
    };

    // Send email to recipient
    await this.mailerService.sendTemplatedMail({
      to: toUser.email,
      subject: `You've Received Tickets for ${event.title}`,
      template: 'ticket-transfer',
      context: {
        ...baseContext,
        isRecipient: true,
        hasAccount: true, // Assuming user exists
        acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/transfers/${transfer.id}/accept`,
        message: null, // Could be added if transfer has a message field
      },
    });

    // Send confirmation email to sender
    await this.mailerService.sendTemplatedMail({
      to: fromUser.email,
      subject: `Ticket Transfer Initiated - ${event.title}`,
      template: 'ticket-transfer',
      context: {
        ...baseContext,
        isRecipient: false,
        orderUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders`,
      },
    });
  }
}
