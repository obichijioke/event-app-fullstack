import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PayoutQueryDto } from '../dto/query-params.dto';
import { Prisma, PayoutStatus } from '@prisma/client';

@Injectable()
export class AdminPayoutService {
  constructor(private prisma: PrismaService) {}

  async getPayouts(query: PayoutQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      orgId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayoutWhereInput = {};

    if (search) {
      where.org = {
        name: { contains: search, mode: 'insensitive' },
      };
    }

    if (status) {
      const allowedPayoutStatuses = [
        'pending',
        'in_review',
        'paid',
        'failed',
        'canceled',
      ] as const;
      const statusStr = String(status);
      if (
        !allowedPayoutStatuses.includes(
          statusStr as (typeof allowedPayoutStatuses)[number],
        )
      ) {
        throw new BadRequestException(`Invalid payout status: ${status}`);
      }
      where.status = statusStr as PayoutStatus;
    }

    if (orgId) {
      where.orgId = orgId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const orderBy: Prisma.PayoutOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'orgId',
        'amountCents',
        'currency',
        'status',
        'scheduledFor',
        'initiatedAt',
        'provider',
        'providerRef',
        'failureReason',
        'createdAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orgId: true,
          amountCents: true,
          currency: true,
          status: true,
          scheduledFor: true,
          initiatedAt: true,
          provider: true,
          providerRef: true,
          failureReason: true,
          createdAt: true,
          org: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.payout.count({ where }),
    ]);

    const data = payouts.map((payout) => ({
      ...payout,
      orgName: payout.org.name,
      org: undefined,
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

  async approvePayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        org: {
          select: { id: true, status: true },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.org?.status === 'suspended') {
      throw new BadRequestException(
        'Cannot approve payout: organization is suspended',
      );
    }

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'in_review' },
    });

    return { message: 'Payout approved successfully' };
  }
}
