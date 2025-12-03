import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PayoutQueryDto } from '../dto/query-params.dto';
import { Prisma, PayoutStatus } from '@prisma/client';
import { QueuesService, QueueName } from '../../queues/queues.service';
import {
  ProcessPayoutDto,
  RejectPayoutDto,
  RetryPayoutDto,
} from '../dto/payout.dto';

@Injectable()
export class AdminPayoutService {
  constructor(
    private prisma: PrismaService,
    private readonly queuesService: QueuesService,
  ) {}

  async findAll(query: PayoutQueryDto) {
    return this.getPayouts(query);
  }

  async approve(payoutId: string) {
    return this.approvePayout(payoutId);
  }

  async process(payoutId: string, dto?: ProcessPayoutDto) {
    return this.processPayout(payoutId, dto);
  }

  async reject(payoutId: string, dto: RejectPayoutDto) {
    return this.rejectPayout(payoutId, dto);
  }

  async retry(payoutId: string, dto?: RetryPayoutDto) {
    return this.retryPayout(payoutId, dto);
  }

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

  async processPayout(payoutId: string, dto?: ProcessPayoutDto) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { org: true },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (
      !dto?.force &&
      payout.status !== PayoutStatus.pending &&
      payout.status !== PayoutStatus.in_review
    ) {
      throw new BadRequestException(
        `Cannot process payout in status ${payout.status}`,
      );
    }

    if (payout.org?.status === 'suspended') {
      throw new BadRequestException(
        'Cannot process payout: organization is suspended',
      );
    }

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.in_review,
        initiatedAt: new Date(),
        failureReason: null,
      },
    });

    await this.queuesService.addJob(
      QueueName.PAYOUT,
      'process-payout',
      { payoutId },
      { attempts: 3 },
    );

    return { message: 'Payout processing started' };
  }

  async rejectPayout(payoutId: string, dto: RejectPayoutDto) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (
      payout.status !== PayoutStatus.pending &&
      payout.status !== PayoutStatus.in_review
    ) {
      throw new BadRequestException(
        `Cannot reject payout in status ${payout.status}`,
      );
    }

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.canceled,
        failureReason: dto.reason,
      },
    });

    return updated;
  }

  async retryPayout(payoutId: string, dto?: RetryPayoutDto) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== PayoutStatus.failed) {
      throw new BadRequestException(
        `Only failed payouts can be retried (current: ${payout.status})`,
      );
    }

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.pending,
        failureReason: dto?.reason || null,
      },
    });

    await this.queuesService.addJob(
      QueueName.PAYOUT,
      'retry-payout',
      { payoutId },
      { attempts: 3 },
    );

    return { message: 'Payout retry enqueued' };
  }

  async getAnalytics(query: {
    orgId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: Prisma.PayoutWhereInput = {};
    if (query.orgId) where.orgId = query.orgId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const stats = await this.prisma.payout.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { amountCents: true },
    });

    const initial: Record<string, { count: number; amountCents: number }> = {
      pending: { count: 0, amountCents: 0 },
      in_review: { count: 0, amountCents: 0 },
      paid: { count: 0, amountCents: 0 },
      failed: { count: 0, amountCents: 0 },
      canceled: { count: 0, amountCents: 0 },
    };

    for (const row of stats) {
      initial[row.status] = {
        count: row._count.id,
        amountCents: Number(row._sum.amountCents || 0),
      };
    }

    const totalAmount = Object.values(initial).reduce(
      (sum, entry) => sum + entry.amountCents,
      0,
    );

    return {
      pending: initial.pending.count,
      inReview: initial.in_review.count,
      paid: initial.paid.count,
      failed: initial.failed.count,
      canceled: initial.canceled.count,
      totalAmount,
    };
  }
}
