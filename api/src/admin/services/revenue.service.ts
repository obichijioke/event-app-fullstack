import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevenueQueryDto, RevenuePeriod } from '../dto/revenue.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminRevenueService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: RevenuePeriod, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case RevenuePeriod.TODAY:
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case RevenuePeriod.WEEK:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case RevenuePeriod.MONTH:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case RevenuePeriod.QUARTER:
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case RevenuePeriod.YEAR:
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case RevenuePeriod.CUSTOM:
        start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = endDate ? new Date(endDate) : now;
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  async getRevenueOverview(query: RevenueQueryDto) {
    const { period = RevenuePeriod.MONTH, startDate, endDate, organizationId, categoryId } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    const where: Prisma.OrderWhereInput = {
      status: 'paid',
      paidAt: {
        gte: start,
        lte: end,
      },
    };

    if (organizationId) {
      where.orgId = organizationId;
    }

    if (categoryId) {
      where.event = {
        categoryId,
      };
    }

    const [orders, totalRevenue, totalFees, totalOrders, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          totalCents: true,
          feesCents: true,
          currency: true,
        },
      }),
      this.prisma.order.aggregate({
        where,
        _sum: {
          totalCents: true,
        },
      }),
      this.prisma.order.aggregate({
        where,
        _sum: {
          feesCents: true,
        },
      }),
      this.prisma.order.count({ where }),
      this.prisma.refund.aggregate({
        where: {
          status: 'processed',
          processedAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          amountCents: true,
        },
      }),
    ]);

    // Calculate platform revenue (fees collected)
    const platformRevenueCents = totalFees._sum.feesCents || BigInt(0);
    const grossRevenueCents = totalRevenue._sum.totalCents || BigInt(0);
    const refundedCents = refunds._sum.amountCents || BigInt(0);
    const netRevenueCents = grossRevenueCents - refundedCents;

    // Calculate average order value
    const averageOrderCents = totalOrders > 0 ? Number(grossRevenueCents) / totalOrders : 0;

    return {
      period: {
        start,
        end,
        label: period,
      },
      revenue: {
        grossCents: Number(grossRevenueCents),
        netCents: Number(netRevenueCents),
        platformCents: Number(platformRevenueCents),
        refundedCents: Number(refundedCents),
      },
      orders: {
        total: totalOrders,
        averageValueCents: Math.round(averageOrderCents),
      },
      currency: orders[0]?.currency || 'USD',
    };
  }

  async getRevenueByPeriod(query: RevenueQueryDto) {
    const { period = RevenuePeriod.MONTH, startDate, endDate, organizationId, categoryId, groupBy = 'day' } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    const where: Prisma.OrderWhereInput = {
      status: 'paid',
      paidAt: {
        gte: start,
        lte: end,
      },
    };

    if (organizationId) {
      where.orgId = organizationId;
    }

    if (categoryId) {
      where.event = {
        categoryId,
      };
    }

    // Get all paid orders in the period
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        paidAt: true,
        totalCents: true,
        feesCents: true,
        currency: true,
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    // Group by period
    const grouped = new Map<string, { totalCents: bigint; feesCents: bigint; count: number }>();

    orders.forEach((order) => {
      if (!order.paidAt) return;

      let key: string;
      const date = new Date(order.paidAt);

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      const existing = grouped.get(key) || { totalCents: BigInt(0), feesCents: BigInt(0), count: 0 };
      grouped.set(key, {
        totalCents: existing.totalCents + order.totalCents,
        feesCents: existing.feesCents + order.feesCents,
        count: existing.count + 1,
      });
    });

    const data = Array.from(grouped.entries()).map(([date, stats]) => ({
      date,
      totalCents: Number(stats.totalCents),
      feesCents: Number(stats.feesCents),
      orderCount: stats.count,
    }));

    return {
      groupBy,
      period: {
        start,
        end,
      },
      data,
    };
  }

  async getRevenueByOrganization(query: RevenueQueryDto) {
    const { period = RevenuePeriod.MONTH, startDate, endDate } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    const orders = await this.prisma.order.groupBy({
      by: ['orgId'],
      where: {
        status: 'paid',
        paidAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        totalCents: true,
        feesCents: true,
      },
      _count: {
        id: true,
      },
    });

    const orgIds = orders.map((o) => o.orgId);
    const organizations = await this.prisma.organization.findMany({
      where: {
        id: { in: orgIds },
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    const orgMap = new Map(organizations.map((org) => [org.id, org]));

    const data = orders
      .map((order) => {
        const org = orgMap.get(order.orgId);
        return {
          organizationId: order.orgId,
          organizationName: org?.name || 'Unknown',
          organizationType: org?.type || 'unknown',
          totalCents: Number(order._sum.totalCents || 0),
          feesCents: Number(order._sum.feesCents || 0),
          orderCount: order._count.id,
        };
      })
      .sort((a, b) => b.totalCents - a.totalCents);

    return {
      period: {
        start,
        end,
      },
      data,
    };
  }

  async getRevenueByCategory(query: RevenueQueryDto) {
    const { period = RevenuePeriod.MONTH, startDate, endDate } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'paid',
        paidAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        totalCents: true,
        feesCents: true,
        event: {
          select: {
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Group by category
    const grouped = new Map<string, { name: string; slug: string; totalCents: bigint; feesCents: bigint; count: number }>();

    orders.forEach((order) => {
      const categoryId = order.event.categoryId || 'uncategorized';
      const categoryName = order.event.category?.name || 'Uncategorized';
      const categorySlug = order.event.category?.slug || 'uncategorized';

      const existing = grouped.get(categoryId) || {
        name: categoryName,
        slug: categorySlug,
        totalCents: BigInt(0),
        feesCents: BigInt(0),
        count: 0
      };

      grouped.set(categoryId, {
        name: categoryName,
        slug: categorySlug,
        totalCents: existing.totalCents + order.totalCents,
        feesCents: existing.feesCents + order.feesCents,
        count: existing.count + 1,
      });
    });

    const data = Array.from(grouped.entries())
      .map(([categoryId, stats]) => ({
        categoryId,
        categoryName: stats.name,
        categorySlug: stats.slug,
        totalCents: Number(stats.totalCents),
        feesCents: Number(stats.feesCents),
        orderCount: stats.count,
      }))
      .sort((a, b) => b.totalCents - a.totalCents);

    return {
      period: {
        start,
        end,
      },
      data,
    };
  }

  async getRevenueTrends(query: RevenueQueryDto) {
    const { period = RevenuePeriod.MONTH, startDate, endDate } = query;
    const currentRange = this.getDateRange(period, startDate, endDate);

    // Calculate previous period for comparison
    const periodLength = currentRange.end.getTime() - currentRange.start.getTime();
    const previousRange = {
      start: new Date(currentRange.start.getTime() - periodLength),
      end: currentRange.start,
    };

    const [currentRevenue, previousRevenue] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: 'paid',
          paidAt: {
            gte: currentRange.start,
            lte: currentRange.end,
          },
        },
        _sum: {
          totalCents: true,
          feesCents: true,
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: 'paid',
          paidAt: {
            gte: previousRange.start,
            lte: previousRange.end,
          },
        },
        _sum: {
          totalCents: true,
          feesCents: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const currentTotal = Number(currentRevenue._sum.totalCents || 0);
    const previousTotal = Number(previousRevenue._sum.totalCents || 0);
    const currentFees = Number(currentRevenue._sum.feesCents || 0);
    const previousFees = Number(previousRevenue._sum.feesCents || 0);

    const revenueGrowth = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    const feeGrowth = previousFees > 0
      ? ((currentFees - previousFees) / previousFees) * 100
      : 0;

    const orderGrowth = previousRevenue._count.id > 0
      ? ((currentRevenue._count.id - previousRevenue._count.id) / previousRevenue._count.id) * 100
      : 0;

    return {
      current: {
        period: currentRange,
        totalCents: currentTotal,
        feesCents: currentFees,
        orderCount: currentRevenue._count.id,
      },
      previous: {
        period: previousRange,
        totalCents: previousTotal,
        feesCents: previousFees,
        orderCount: previousRevenue._count.id,
      },
      growth: {
        revenue: Number(revenueGrowth.toFixed(2)),
        fees: Number(feeGrowth.toFixed(2)),
        orders: Number(orderGrowth.toFixed(2)),
      },
    };
  }
}
