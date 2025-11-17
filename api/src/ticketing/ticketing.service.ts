import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateTicketTypeDto,
  CreateTicketPriceTierDto,
  CreateHoldDto,
} from './dto/create-ticket-type.dto';
import {
  UpdateTicketTypeDto,
  UpdateTicketPriceTierDto,
} from './dto/update-ticket-type.dto';
import { HoldReason, OrderStatus } from '@prisma/client';
import { checkOrgPermission } from '../common/utils';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class TicketingService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
  ) {}

  async createTicketTypeForEvent(
    eventId: string,
    userId: string,
    createTicketTypeDto: CreateTicketTypeDto,
  ) {
    // Check if user is a member of the organization that owns the event with appropriate permissions
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        orgId: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      undefined,
      'You do not have permission to create ticket types for this event',
    );

    const {
      name,
      kind,
      currency,
      priceCents,
      feeCents,
      capacity,
      perOrderLimit,
      salesStart,
      salesEnd,
      status,
      sortOrder,
    } = createTicketTypeDto;

    // Use default currency if not specified
    const finalCurrency =
      currency || (await this.currencyService.getDefaultCurrency());

    // Create ticket type for the event
    const ticketType = await this.prisma.ticketType.create({
      data: {
        eventId,
        name,
        kind,
        currency: finalCurrency,
        priceCents,
        feeCents,
        capacity,
        perOrderLimit,
        salesStart: salesStart ? new Date(salesStart) : undefined,
        salesEnd: salesEnd ? new Date(salesEnd) : undefined,
        status,
        sortOrder,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return ticketType;
  }

  async findAllTicketTypesForEvent(eventId: string, userId?: string) {
    // Check if user is a member of the organization that owns the event or if event is public
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        visibility: true,
        org: {
          select: {
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
        'You do not have permission to view ticket types for this event',
      );
    }

    const ticketTypes = await this.prisma.ticketType.findMany({
      where: {
        eventId,
        deletedAt: null,
      },
      include: {
        priceTiers: {
          orderBy: {
            startsAt: 'asc',
          },
        },
        _count: {
          select: {
            holds: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return ticketTypes;
  }

  async findOneTicketType(id: string, userId?: string) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id, deletedAt: null },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            visibility: true,
            org: {
              select: {
                members: {
                  where: userId ? { userId } : { userId: 'non-existent' },
                },
              },
            },
          },
        },
        priceTiers: {
          orderBy: {
            startsAt: 'asc',
          },
        },
        ticketTypeSeats: {
          include: {
            seat: true,
          },
        },
        _count: {
          select: {
            holds: true,
          },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    if (
      ticketType.event.visibility !== 'public' &&
      (!userId || ticketType.event.org.members.length === 0)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this ticket type',
      );
    }

    return ticketType;
  }

  async updateTicketType(
    id: string,
    userId: string,
    updateTicketTypeDto: UpdateTicketTypeDto,
  ) {
    // Check if user is a member of the organization that owns the ticket type with appropriate permissions
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id, deletedAt: null },
      include: {
        event: {
          select: {
            id: true,
            orgId: true,
          },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    await checkOrgPermission(
      this.prisma,
      ticketType.event.orgId,
      userId,
      undefined,
      'You do not have permission to update this ticket type',
    );

    // Check if tickets have been sold for this ticket type
    const ticketsCount = await this.prisma.ticket.count({
      where: {
        ticketTypeId: id,
      },
    });

    if (ticketsCount > 0) {
      // Only allow updating certain fields after tickets have been sold
      const allowedFields = ['status', 'salesStart', 'salesEnd'];
      const hasDisallowedFields = Object.keys(updateTicketTypeDto).some(
        (key) => !allowedFields.includes(key),
      );

      if (hasDisallowedFields) {
        throw new ForbiddenException(
          'Cannot modify ticket type details after tickets have been sold',
        );
      }
    }

    const updatedTicketType = await this.prisma.ticketType.update({
      where: { id },
      data: {
        ...updateTicketTypeDto,
        salesStart: updateTicketTypeDto.salesStart
          ? new Date(updateTicketTypeDto.salesStart)
          : undefined,
        salesEnd: updateTicketTypeDto.salesEnd
          ? new Date(updateTicketTypeDto.salesEnd)
          : undefined,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updatedTicketType;
  }

  async removeTicketType(id: string, userId: string) {
    // Check if user is a member of the organization that owns the ticket type with appropriate permissions
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id, deletedAt: null },
      include: {
        event: {
          select: {
            id: true,
            orgId: true,
          },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    await checkOrgPermission(
      this.prisma,
      ticketType.event.orgId,
      userId,
      undefined,
      'You do not have permission to delete this ticket type',
    );

    // Check if tickets have been sold for this ticket type
    const ticketsCount = await this.prisma.ticket.count({
      where: {
        ticketTypeId: id,
      },
    });

    if (ticketsCount > 0) {
      throw new ForbiddenException(
        'Cannot delete ticket type with sold tickets',
      );
    }

    // Soft delete the ticket type
    await this.prisma.ticketType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Ticket type deleted successfully' };
  }

  async createPriceTier(
    ticketTypeId: string,
    userId: string,
    createPriceTierDto: CreateTicketPriceTierDto,
  ) {
    // Check if user is a member of the organization that owns the ticket type with appropriate permissions
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: ticketTypeId, deletedAt: null },
      include: {
        event: {
          select: {
            id: true,
            orgId: true,
          },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    await checkOrgPermission(
      this.prisma,
      ticketType.event.orgId,
      userId,
      undefined,
      'You do not have permission to create price tiers for this ticket type',
    );

    const { startsAt, endsAt, minQty, priceCents, feeCents } =
      createPriceTierDto;

    const priceTier = await this.prisma.ticketPriceTier.create({
      data: {
        ticketTypeId,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        minQty,
        priceCents,
        feeCents,
      },
    });

    return priceTier;
  }

  async updatePriceTier(
    id: string,
    userId: string,
    updatePriceTierDto: UpdateTicketPriceTierDto,
  ) {
    // Check if user is a member of the organization that owns the price tier with appropriate permissions
    const priceTier = await this.prisma.ticketPriceTier.findUnique({
      where: { id },
      include: {
        ticketType: {
          include: {
            event: {
              select: {
                id: true,
                orgId: true,
              },
            },
          },
        },
      },
    });

    if (!priceTier) {
      throw new NotFoundException('Price tier not found');
    }

    await checkOrgPermission(
      this.prisma,
      priceTier.ticketType.event.orgId,
      userId,
      undefined,
      'You do not have permission to update this price tier',
    );

    const updatedPriceTier = await this.prisma.ticketPriceTier.update({
      where: { id },
      data: {
        ...updatePriceTierDto,
        startsAt: updatePriceTierDto.startsAt
          ? new Date(updatePriceTierDto.startsAt)
          : undefined,
        endsAt: updatePriceTierDto.endsAt
          ? new Date(updatePriceTierDto.endsAt)
          : undefined,
      },
    });

    return updatedPriceTier;
  }

  async removePriceTier(id: string, userId: string) {
    // Check if user is a member of the organization that owns the price tier with appropriate permissions
    const priceTier = await this.prisma.ticketPriceTier.findUnique({
      where: { id },
      include: {
        ticketType: {
          include: {
            event: {
              select: {
                id: true,
                orgId: true,
              },
            },
          },
        },
      },
    });

    if (!priceTier) {
      throw new NotFoundException('Price tier not found');
    }

    await checkOrgPermission(
      this.prisma,
      priceTier.ticketType.event.orgId,
      userId,
      undefined,
      'You do not have permission to delete this price tier',
    );

    await this.prisma.ticketPriceTier.delete({
      where: { id },
    });

    return { message: 'Price tier deleted successfully' };
  }

  async bulkAssignSeats(
    ticketTypeId: string,
    userId: string,
    seatIds: string[],
  ) {
    if (seatIds.length === 0) {
      throw new BadRequestException('At least one seat must be provided');
    }

    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: ticketTypeId, deletedAt: null },
      include: {
        event: {
          select: {
            id: true,
            orgId: true,
            seatmapId: true,
            seatmap: true,
            eventSeatmaps: {
              include: {
                seatmap: true,
              },
            },
          },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    await checkOrgPermission(
      this.prisma,
      ticketType.event.orgId,
      userId,
      undefined,
      'You do not have permission to manage seats for this ticket type',
    );

    if (ticketType.kind === 'GA') {
      throw new BadRequestException(
        'General admission ticket types do not use seats',
      );
    }

    const allowedSeatmapIds = new Set<string>();
    if (ticketType.event.seatmapId) {
      allowedSeatmapIds.add(ticketType.event.seatmapId);
    }
    (ticketType.event.eventSeatmaps || []).forEach((mapping) =>
      allowedSeatmapIds.add(mapping.seatmapId),
    );

    if (allowedSeatmapIds.size === 0) {
      throw new BadRequestException(
        'Event does not have an associated seatmap',
      );
    }

    const seats = await this.prisma.seat.findMany({
      where: {
        id: { in: seatIds },
      },
      include: {
        seatmap: true,
      },
    });

    if (seats.length !== seatIds.length) {
      throw new NotFoundException('One or more seats could not be found');
    }

    const invalidSeat = seats.find(
      (seat) => !allowedSeatmapIds.has(seat.seatmapId),
    );

    if (invalidSeat) {
      throw new BadRequestException(
        'All seats must belong to seatmaps attached to the event',
      );
    }

    await this.prisma.ticketTypeSeat.createMany({
      data: seatIds.map((seatId) => ({
        ticketTypeId,
        seatId,
      })),
      skipDuplicates: true,
    });

    return {
      message: 'Seats assigned successfully',
      assigned: seatIds.length,
    };
  }

  async getInventorySummary(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        org: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
        ticketTypes: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const membership = event.org.members[0];
    if (!membership) {
      throw new ForbiddenException(
        'You do not have permission to view inventory for this event',
      );
    }

    const now = new Date();

    const ticketSummaries = await Promise.all(
      event.ticketTypes.map(async (ticketType) => {
        const [soldCount, checkedInCount, activeHolds, revenue] =
          await Promise.all([
            this.prisma.ticket.count({
              where: {
                ticketTypeId: ticketType.id,
                status: {
                  notIn: ['void'],
                },
              },
            }),
            this.prisma.ticket.count({
              where: {
                ticketTypeId: ticketType.id,
                status: 'checked_in',
              },
            }),
            this.prisma.hold.count({
              where: {
                ticketTypeId: ticketType.id,
                expiresAt: { gt: now },
              },
            }),
            this.prisma.orderItem.aggregate({
              where: {
                ticketTypeId: ticketType.id,
                order: {
                  status: OrderStatus.paid,
                },
              },
              _sum: {
                quantity: true,
                unitPriceCents: true,
                unitFeeCents: true,
              },
            }),
          ]);

        const capacity = ticketType.capacity ?? null;
        const totalSold = soldCount;
        const remainingCapacity = capacity
          ? Math.max(capacity - totalSold - activeHolds, 0)
          : null;

        const grossCents = Number(revenue._sum.unitPriceCents || BigInt(0));
        const feeCents = Number(revenue._sum.unitFeeCents || BigInt(0));

        return {
          id: ticketType.id,
          name: ticketType.name,
          kind: ticketType.kind,
          capacity,
          sold: totalSold,
          checkedIn: checkedInCount,
          holds: activeHolds,
          available: remainingCapacity,
          grossRevenueCents: grossCents,
          feeRevenueCents: feeCents,
          currency: ticketType.currency,
        };
      }),
    );

    const totals = ticketSummaries.reduce(
      (acc, summary) => {
        acc.sold += summary.sold;
        acc.checkedIn += summary.checkedIn;
        acc.holds += summary.holds;
        acc.grossRevenueCents += summary.grossRevenueCents;
        acc.feeRevenueCents += summary.feeRevenueCents;
        return acc;
      },
      {
        sold: 0,
        checkedIn: 0,
        holds: 0,
        grossRevenueCents: 0,
        feeRevenueCents: 0,
      },
    );

    return {
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        startAt: event.startAt,
      },
      totals,
      ticketTypes: ticketSummaries,
    };
  }

  async createHold(
    eventId: string,
    userId: string,
    createHoldDto: CreateHoldDto,
  ) {
    // Check if user is a member of the organization that owns the event
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        org: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.org.members.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to create holds for this event',
      );
    }

    const { ticketTypeId, seatId, occurrenceId, quantity, expiresAt } =
      createHoldDto;

    // Validate ticket type belongs to the event
    if (ticketTypeId) {
      const ticketType = await this.prisma.ticketType.findUnique({
        where: { id: ticketTypeId, eventId },
      });

      if (!ticketType) {
        throw new BadRequestException('Invalid ticket type for this event');
      }
    }

    // Validate seat belongs to the event's seatmap
    if (seatId) {
      const seat = await this.prisma.seat.findUnique({
        where: { id: seatId },
        include: {
          seatmap: {
            include: {
              events: {
                where: {
                  id: eventId,
                },
              },
            },
          },
        },
      });

      if (!seat || seat.seatmap.events.length === 0) {
        throw new BadRequestException('Invalid seat for this event');
      }
    }

    // Validate occurrence belongs to the event
    if (occurrenceId) {
      const occurrence = await this.prisma.eventOccurrence.findUnique({
        where: { id: occurrenceId, eventId },
      });

      if (!occurrence) {
        throw new BadRequestException('Invalid occurrence for this event');
      }
    }

    // Create hold
    const hold = await this.prisma.hold.create({
      data: {
        eventId,
        ticketTypeId,
        seatId,
        occurrenceId,
        userId,
        reason: HoldReason.checkout,
        quantity,
        expiresAt: new Date(expiresAt),
      },
    });

    return hold;
  }

  async getHoldsForEvent(eventId: string, userId: string) {
    // Check if user is a member of the organization that owns the event
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        org: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.org.members.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to view holds for this event',
      );
    }

    const holds = await this.prisma.hold.findMany({
      where: {
        eventId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        ticketType: true,
        seat: true,
        occurrence: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    return holds;
  }

  async releaseHold(holdId: string, userId: string) {
    // Check if user is a member of the organization that owns the hold
    const hold = await this.prisma.hold.findUnique({
      where: { id: holdId },
      include: {
        event: {
          include: {
            org: {
              include: {
                members: {
                  where: {
                    userId,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!hold) {
      throw new NotFoundException('Hold not found');
    }

    if (hold.event.org.members.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to release this hold',
      );
    }

    // Delete the hold
    await this.prisma.hold.delete({
      where: { id: holdId },
    });

    return { message: 'Hold released successfully' };
  }
}
