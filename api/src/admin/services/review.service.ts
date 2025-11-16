import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReviewQueryDto } from '../dto/review.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminReviewService {
  constructor(private prisma: PrismaService) {}

  async getEventReviews(query: ReviewQueryDto) {
    const {
      page = 1,
      limit = 10,
      eventId,
      userId,
      minRating,
      maxRating,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventReviewWhereInput = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    const orderBy: Prisma.EventReviewOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'rating', 'createdAt', 'updatedAt'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [reviews, total] = await Promise.all([
      this.prisma.eventReview.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          eventId: true,
          userId: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.eventReview.count({ where }),
    ]);

    const data = reviews.map((review) => ({
      id: review.id,
      eventId: review.eventId,
      eventTitle: review.event.title,
      userId: review.userId,
      userEmail: review.user.email,
      userName: review.user.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
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

  async getOrganizerReviews(query: ReviewQueryDto) {
    const {
      page = 1,
      limit = 10,
      orgId,
      userId,
      minRating,
      maxRating,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizerReviewWhereInput = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    const orderBy: Prisma.OrganizerReviewOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'rating', 'createdAt', 'updatedAt'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [reviews, total] = await Promise.all([
      this.prisma.organizerReview.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orgId: true,
          userId: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.organizerReview.count({ where }),
    ]);

    const data = reviews.map((review) => ({
      id: review.id,
      orgId: review.orgId,
      orgName: review.organization.name,
      userId: review.userId,
      userEmail: review.user.email,
      userName: review.user.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
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

  async deleteEventReview(reviewId: string) {
    const review = await this.prisma.eventReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Event review not found');
    }

    await this.prisma.eventReview.delete({
      where: { id: reviewId },
    });

    return { message: 'Event review deleted successfully' };
  }

  async deleteOrganizerReview(reviewId: string) {
    const review = await this.prisma.organizerReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Organizer review not found');
    }

    await this.prisma.organizerReview.delete({
      where: { id: reviewId },
    });

    return { message: 'Organizer review deleted successfully' };
  }

  async getReviewStats() {
    const [eventReviews, organizerReviews, eventAvgRating, organizerAvgRating] = await Promise.all([
      this.prisma.eventReview.count(),
      this.prisma.organizerReview.count(),
      this.prisma.eventReview.aggregate({
        _avg: { rating: true },
      }),
      this.prisma.organizerReview.aggregate({
        _avg: { rating: true },
      }),
    ]);

    const recent24h = await Promise.all([
      this.prisma.eventReview.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.organizerReview.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      eventReviews: {
        total: eventReviews,
        averageRating: eventAvgRating._avg.rating || 0,
        recent24h: recent24h[0],
      },
      organizerReviews: {
        total: organizerReviews,
        averageRating: organizerAvgRating._avg.rating || 0,
        recent24h: recent24h[1],
      },
      totalReviews: eventReviews + organizerReviews,
    };
  }
}
