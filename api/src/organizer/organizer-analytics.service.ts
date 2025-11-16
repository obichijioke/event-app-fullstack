import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrgMemberRole } from '@prisma/client';
import { checkOrgPermission, serializeResponse } from '../common/utils';

@Injectable()
export class OrganizerAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEventAnalytics(orgId: string, eventId: string, userId: string) {
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
      'You do not have permission to view analytics for this organization',
    );

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        orgId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        startAt: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const [ticketCounts, reviewAggregate, reviewList] =
      await this.prisma.$transaction([
        this.prisma.ticket.groupBy({
          by: ['status'],
          where: {
            eventId,
          },
          _count: {
            _all: true,
          },
          orderBy: {
            status: 'asc',
          },
        }),
        this.prisma.eventReview.aggregate({
          where: {
            eventId,
          },
          _avg: {
            rating: true,
          },
          _count: {
            _all: true,
          },
        }),
        this.prisma.eventReview.findMany({
          where: {
            eventId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        }),
      ]);

    const ticketStatus = ticketCounts.reduce<Record<string, number>>(
      (acc, item) => {
        const count =
          typeof item._count === 'object' ? (item._count._all ?? 0) : 0;
        acc[item.status] = count;
        return acc;
      },
      {},
    );

    return serializeResponse({
      event,
      tickets: ticketStatus,
      reviews: {
        averageRating: reviewAggregate._avg.rating || 0,
        total: reviewAggregate._count._all,
        recent: reviewList,
      },
    });
  }

  async getOrganizationInsights(orgId: string, userId: string) {
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
      'You do not have permission to view analytics for this organization',
    );

    const [followers, reviewsAggregate, reviews] =
      await this.prisma.$transaction([
        this.prisma.userFollow.count({
          where: {
            organizationId: orgId,
          },
        }),
        this.prisma.organizerReview.aggregate({
          where: {
            orgId,
          },
          _avg: {
            rating: true,
          },
          _count: {
            _all: true,
          },
        }),
        this.prisma.organizerReview.findMany({
          where: {
            orgId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        }),
      ]);

    return serializeResponse({
      followers,
      reviews: {
        averageRating: reviewsAggregate._avg.rating || 0,
        total: reviewsAggregate._count._all,
        recent: reviews,
      },
    });
  }
}
