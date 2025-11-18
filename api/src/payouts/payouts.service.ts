import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreatePayoutDto,
  CreatePayoutAccountDto,
  CalculatePayoutsDto,
} from './dto/create-payout.dto';
import {
  UpdatePayoutDto,
  UpdatePayoutAccountDto,
} from './dto/update-payout.dto';
import { PayoutStatus } from '@prisma/client';
import { checkFinancePermission } from '../common/utils';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async createPayout(
    orgId: string,
    userId: string,
    createPayoutDto: CreatePayoutDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to create payouts for this organization',
    );

    const { amountCents, currency, scheduledFor, provider, providerRef } =
      createPayoutDto;

    // Create payout
    const payout = await this.prisma.payout.create({
      data: {
        orgId,
        amountCents: BigInt(amountCents),
        currency,
        status: PayoutStatus.pending,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        provider,
        providerRef,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return payout;
  }

  async findAllPayouts(
    orgId: string,
    userId: string,
    filters?: {
      status?: PayoutStatus;
      startDate?: string;
      endDate?: string;
    },
  ) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const whereClause: any = {
      orgId,
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    const payouts = await this.prisma.payout.findMany({
      where: whereClause,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payouts;
  }

  async findOnePayout(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to view this payout',
      );
    }

    return payout;
  }

  async updatePayout(
    id: string,
    orgId: string,
    userId: string,
    updatePayoutDto: UpdatePayoutDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to update payouts for this organization',
    );

    // Check if payout exists and belongs to the organization
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to update this payout',
      );
    }

    const { amountCents, currency, scheduledFor, provider, providerRef } =
      updatePayoutDto;

    // Update payout
    const updatedPayout = await this.prisma.payout.update({
      where: { id },
      data: {
        amountCents: amountCents ? BigInt(amountCents) : undefined,
        currency,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        provider,
        providerRef,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedPayout;
  }

  async removePayout(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization with appropriate permissions
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to delete payouts for this organization',
    );

    // Check if payout exists and belongs to the organization
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to delete this payout',
      );
    }

    // Delete payout
    await this.prisma.payout.delete({
      where: { id },
    });

    return { message: 'Payout deleted successfully' };
  }

  async retryPayout(id: string, orgId: string, userId: string) {
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to retry payouts for this organization',
    );

    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to retry this payout',
      );
    }

    if (payout.status !== PayoutStatus.failed) {
      throw new BadRequestException(
        'Only failed payouts can be retried at this time',
      );
    }

    return this.prisma.payout.update({
      where: { id },
      data: {
        status: PayoutStatus.pending,
        failureReason: null,
        initiatedAt: new Date(),
      },
    });
  }

  async createPayoutAccount(
    orgId: string,
    userId: string,
    createPayoutAccountDto: CreatePayoutAccountDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to create payout accounts for this organization',
    );

    const { provider, externalId, defaultAccount } = createPayoutAccountDto;

    // If this is set as default, unset all other default accounts for this org
    if (defaultAccount) {
      await this.prisma.payoutAccount.updateMany({
        where: {
          orgId,
          defaultAccount: true,
        },
        data: {
          defaultAccount: false,
        },
      });
    }

    // Create payout account
    const payoutAccount = await this.prisma.payoutAccount.create({
      data: {
        orgId,
        provider,
        externalId,
        defaultAccount: defaultAccount || true,
      },
    });

    return payoutAccount;
  }

  async findAllPayoutAccounts(orgId: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const payoutAccounts = await this.prisma.payoutAccount.findMany({
      where: {
        orgId,
      },
      orderBy: {
        defaultAccount: 'desc',
      },
    });

    return payoutAccounts;
  }

  async updatePayoutAccount(
    id: string,
    orgId: string,
    userId: string,
    updatePayoutAccountDto: UpdatePayoutAccountDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to update payout accounts for this organization',
    );

    // Check if payout account exists and belongs to the organization
    const payoutAccount = await this.prisma.payoutAccount.findUnique({
      where: { id },
    });

    if (!payoutAccount) {
      throw new NotFoundException('Payout account not found');
    }

    if (payoutAccount.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to update this payout account',
      );
    }

    const { provider, externalId, defaultAccount } = updatePayoutAccountDto;

    // If this is set as default, unset all other default accounts for this org
    if (defaultAccount) {
      await this.prisma.payoutAccount.updateMany({
        where: {
          orgId,
          defaultAccount: true,
          id: { not: id },
        },
        data: {
          defaultAccount: false,
        },
      });
    }

    // Update payout account
    const updatedPayoutAccount = await this.prisma.payoutAccount.update({
      where: { id },
      data: {
        provider,
        externalId,
        defaultAccount,
      },
    });

    return updatedPayoutAccount;
  }

  async removePayoutAccount(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization with appropriate permissions
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to delete payout accounts for this organization',
    );

    // Check if payout account exists and belongs to the organization
    const payoutAccount = await this.prisma.payoutAccount.findUnique({
      where: { id },
    });

    if (!payoutAccount) {
      throw new NotFoundException('Payout account not found');
    }

    if (payoutAccount.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to delete this payout account',
      );
    }

    // Delete payout account
    await this.prisma.payoutAccount.delete({
      where: { id },
    });

    return { message: 'Payout account deleted successfully' };
  }

  async calculatePayouts(
    calculatePayoutsDto: CalculatePayoutsDto,
    userId: string,
  ) {
    const { orgId, startDate, endDate, eventId } = calculatePayoutsDto;

    // Check if user is a member of the organization with appropriate permissions
    await checkFinancePermission(
      this.prisma,
      orgId,
      userId,
      'You do not have permission to calculate payouts for this organization',
    );

    // Get all completed orders within the date range
    const whereClause: any = {
      orgId,
      status: 'paid',
      paidAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (eventId) {
      whereClause.eventId = eventId;
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            ticketType: true,
          },
        },
        feeLines: true,
      },
    });

    // Calculate totals
    let totalRevenue = BigInt(0);
    let platformFees = BigInt(0);
    let organizerRevenue = BigInt(0);
    let currency = 'USD';

    for (const order of orders) {
      totalRevenue += order.totalCents;

      // Sum up all fee lines where beneficiary is 'platform'
      const orderPlatformFees = order.feeLines
        .filter((fee) => fee.beneficiary === 'platform')
        .reduce((sum, fee) => sum + fee.amountCents, BigInt(0));

      platformFees += orderPlatformFees;

      if (orders.length > 0) {
        currency = order.currency;
      }
    }

    organizerRevenue = totalRevenue - platformFees;

    // Check if there are any existing payouts for this period
    const existingPayouts = await this.prisma.payout.findMany({
      where: {
        orgId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    return {
      period: {
        startDate,
        endDate,
        eventId,
      },
      summary: {
        totalOrders: orders.length,
        totalRevenue: totalRevenue.toString(),
        platformFees: platformFees.toString(),
        organizerRevenue: organizerRevenue.toString(),
        currency,
      },
      existingPayouts: existingPayouts.length,
      canCreatePayout: existingPayouts.length === 0 && organizerRevenue > 0,
    };
  }

  async getPayoutStats(
    orgId: string,
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    },
  ) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const whereClause: any = {
      orgId,
    };

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    const stats = await this.prisma.payout.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        amountCents: true,
      },
    });

    return stats;
  }
}
