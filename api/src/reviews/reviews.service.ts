import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  serializeResponse,
  clampPagination,
  buildPaginatedResponse,
  calculateSkip,
} from '../common/utils';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureEventExists(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, orgId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  private async ensureOrganizationExists(orgId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async createEventReview(
    userId: string,
    eventId: string,
    dto: CreateReviewDto,
  ) {
    await this.ensureEventExists(eventId);

    const hasTicket = await this.prisma.ticket.findFirst({
      where: {
        eventId,
        ownerId: userId,
        status: {
          notIn: [TicketStatus.refunded, TicketStatus.void],
        },
      },
      select: { id: true },
    });

    if (!hasTicket) {
      throw new ForbiddenException(
        'You must have a valid ticket for this event to leave a review',
      );
    }

    const existingReview = await this.prisma.eventReview.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this event');
    }

    const review = await this.prisma.eventReview.create({
      data: {
        eventId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return serializeResponse(review);
  }

  async updateEventReview(
    userId: string,
    eventId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ) {
    if (dto.rating === undefined && dto.comment === undefined) {
      throw new BadRequestException('No updates provided');
    }

    const review = await this.prisma.eventReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.eventId !== eventId) {
      throw new NotFoundException('Event review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own review');
    }

    const updated = await this.prisma.eventReview.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating ?? review.rating,
        comment: dto.comment ?? review.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return serializeResponse(updated);
  }

  async deleteEventReview(userId: string, eventId: string, reviewId: string) {
    const review = await this.prisma.eventReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.eventId !== eventId) {
      throw new NotFoundException('Event review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own review');
    }

    await this.prisma.eventReview.delete({
      where: { id: reviewId },
    });

    return { success: true };
  }

  async listEventReviews(eventId: string, page = 1, limit = 20) {
    await this.ensureEventExists(eventId);

    const { page: safePage, limit: safeLimit } = clampPagination(page, limit);
    const skip = calculateSkip(safePage, safeLimit);

    const [total, reviews] = await this.prisma.$transaction([
      this.prisma.eventReview.count({ where: { eventId } }),
      this.prisma.eventReview.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return serializeResponse(
      buildPaginatedResponse(reviews, safePage, safeLimit, total),
    );
  }

  async getEventReviewSummary(eventId: string) {
    await this.ensureEventExists(eventId);

    const stats = await this.prisma.eventReview.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      averageRating: stats._avg.rating ? Number(stats._avg.rating) : 0,
      reviewCount: stats._count._all,
    };
  }

  async createOrganizerReview(
    userId: string,
    orgId: string,
    dto: CreateReviewDto,
  ) {
    await this.ensureOrganizationExists(orgId);

    const hasAttendedEvent = await this.prisma.ticket.findFirst({
      where: {
        ownerId: userId,
        status: {
          notIn: [TicketStatus.refunded, TicketStatus.void],
        },
        event: {
          orgId,
        },
      },
      select: { id: true },
    });

    if (!hasAttendedEvent) {
      throw new ForbiddenException(
        'You must have attended an event from this organization to leave a review',
      );
    }

    const existingReview = await this.prisma.organizerReview.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already reviewed this organization',
      );
    }

    const review = await this.prisma.organizerReview.create({
      data: {
        orgId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return serializeResponse(review);
  }

  async updateOrganizerReview(
    userId: string,
    orgId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ) {
    if (dto.rating === undefined && dto.comment === undefined) {
      throw new BadRequestException('No updates provided');
    }

    const review = await this.prisma.organizerReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.orgId !== orgId) {
      throw new NotFoundException('Organizer review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own review');
    }

    const updated = await this.prisma.organizerReview.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating ?? review.rating,
        comment: dto.comment ?? review.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return serializeResponse(updated);
  }

  async deleteOrganizerReview(userId: string, orgId: string, reviewId: string) {
    const review = await this.prisma.organizerReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.orgId !== orgId) {
      throw new NotFoundException('Organizer review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own review');
    }

    await this.prisma.organizerReview.delete({
      where: { id: reviewId },
    });

    return { success: true };
  }

  async listOrganizerReviews(orgId: string, page = 1, limit = 20) {
    await this.ensureOrganizationExists(orgId);

    const { page: safePage, limit: safeLimit } = clampPagination(page, limit);
    const skip = calculateSkip(safePage, safeLimit);

    const [total, reviews] = await this.prisma.$transaction([
      this.prisma.organizerReview.count({ where: { orgId } }),
      this.prisma.organizerReview.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return serializeResponse(
      buildPaginatedResponse(reviews, safePage, safeLimit, total),
    );
  }

  async getOrganizerReviewSummary(orgId: string) {
    await this.ensureOrganizationExists(orgId);

    const stats = await this.prisma.organizerReview.aggregate({
      where: { orgId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      averageRating: stats._avg.rating ? Number(stats._avg.rating) : 0,
      reviewCount: stats._count._all,
    };
  }
}
