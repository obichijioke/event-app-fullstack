import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  EventStatus,
  ModerationStatus,
  OrderStatus,
  OrgMemberRole,
  PayoutStatus,
} from '@prisma/client';

@Injectable()
export class OrganizerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(orgId: string, userId: string) {
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    const now = new Date();

    const [
      upcomingEvents,
      salesAggregate,
      ticketQuantity,
      unsettledPayouts,
      draftEvents,
      moderationAlerts,
      recentOrders,
      venueStats,
      recentVenues,
    ] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where: {
          orgId,
          startAt: { gte: now },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          status: true,
          startAt: true,
          publishAt: true,
        },
        orderBy: {
          startAt: 'asc',
        },
        take: 5,
      }),
      this.prisma.order.aggregate({
        where: {
          orgId,
          status: OrderStatus.paid,
        },
        _sum: {
          totalCents: true,
          subtotalCents: true,
          feesCents: true,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          order: {
            orgId,
            status: OrderStatus.paid,
          },
        },
        _sum: {
          quantity: true,
        },
      }),
      this.prisma.payout.aggregate({
        where: {
          orgId,
          status: {
            in: [
              PayoutStatus.pending,
              PayoutStatus.in_review,
              PayoutStatus.failed,
            ],
          },
        },
        _sum: {
          amountCents: true,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.event.findMany({
        where: {
          orgId,
          status: {
            in: [EventStatus.draft, EventStatus.pending],
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          status: true,
          startAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
      }),
      this.prisma.flag.count({
        where: {
          targetKind: 'event',
          status: {
            notIn: [ModerationStatus.resolved, ModerationStatus.approved],
          },
          event: {
            orgId,
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          orgId,
        },
        select: {
          id: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
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
        take: 5,
      }),
      // Venue statistics
      this.prisma.venue.aggregate({
        where: {
          orgId,
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),
      // Recent venues with counts
      this.prisma.venue.findMany({
        where: {
          orgId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          address: true,
          capacity: true,
          _count: {
            select: {
              seatmaps: true,
              events: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    const grossRevenueCents = Number(
      salesAggregate._sum.totalCents || BigInt(0),
    );
    const subtotalCents = Number(
      salesAggregate._sum.subtotalCents || BigInt(0),
    );
    const feesCents = Number(salesAggregate._sum.feesCents || BigInt(0));

    const tasks = {
      drafts: draftEvents,
      moderationAlerts,
      unsettledPayouts: {
        count: unsettledPayouts._count._all,
        amountCents: Number(unsettledPayouts._sum.amountCents || BigInt(0)),
      },
    };

    return {
      organization: {
        id: membership.org.id,
        name: membership.org.name,
        status: membership.org.status,
        role: membership.role,
      },
      metrics: {
        upcomingEvents: upcomingEvents.length,
        grossRevenueCents,
        netRevenueCents: grossRevenueCents - feesCents,
        subtotalCents,
        feesCents,
        ordersCount: salesAggregate._count._all,
        ticketsSold: Number(ticketQuantity._sum.quantity || 0),
        unsettledPayouts: tasks.unsettledPayouts,
        totalVenues: venueStats._count._all,
      },
      upcomingEvents,
      recentOrders,
      recentVenues,
      tasks,
    };
  }
}
