import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AdminOrganizationService,
  AdminUserService,
  AdminEventService,
  AdminPaymentService,
  AdminPayoutService,
  AdminRefundService,
  AdminCategoryService,
} from './services';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly organizationService: AdminOrganizationService,
    private readonly userService: AdminUserService,
    private readonly eventService: AdminEventService,
    private readonly paymentService: AdminPaymentService,
    private readonly payoutService: AdminPayoutService,
    private readonly refundService: AdminRefundService,
    private readonly categoryService: AdminCategoryService,
    private readonly prisma: PrismaService,
  ) {}

  async getMetrics() {
    const [totalUsers, activeEvents, totalRevenue, totalOrders, paidOrders] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.event.count({
          where: { status: { in: ['approved', 'live'] } },
        }),
        this.prisma.order.aggregate({
          where: { status: 'paid' },
          _sum: { totalCents: true },
        }),
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: 'paid' } }),
      ]);

    const conversionRate =
      totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    return {
      totalUsers,
      activeEvents,
      totalRevenue: Number(totalRevenue._sum.totalCents || 0),
      conversionRate,
    };
  }
}
