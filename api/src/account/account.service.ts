import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { OrderStatus, TicketStatus, RefundStatus } from '@prisma/client';
import { RequestRefundDto } from './dto/request-refund.dto';

type TransferStatus = 'pending' | 'accepted' | 'canceled';
type TransferDirection = 'sent' | 'received' | 'all';

interface TransferQuery {
  type?: TransferDirection;
  status?: TransferStatus;
  page?: number;
  limit?: number;
}

const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getStats(userId: string) {
    const [orderAggregate, activeTickets, followingCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          buyerId: userId,
          status: {
            in: [OrderStatus.paid, OrderStatus.refunded, OrderStatus.pending],
          },
        },
        _count: { id: true },
        _sum: { totalCents: true },
      }),
      this.prisma.ticket.count({
        where: {
          ownerId: userId,
          status: {
            in: [TicketStatus.issued, TicketStatus.checked_in],
          },
        },
      }),
      this.prisma.userFollow.count({
        where: { userId },
      }),
    ]);

    return {
      totalOrders: orderAggregate._count.id ?? 0,
      totalSpentCents: Number(orderAggregate._sum.totalCents ?? 0n),
      activeTickets,
      following: followingCount,
    };
  }

  async getTransfers(userId: string, query: TransferQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

    const type: TransferDirection = query.type ?? 'all';
    const status: TransferStatus | undefined = query.status;

    if (type && !['sent', 'received', 'all'].includes(type)) {
      throw new BadRequestException('Invalid transfer type');
    }
    if (status && !['pending', 'accepted', 'canceled'].includes(status)) {
      throw new BadRequestException('Invalid transfer status');
    }

    const where: any = {};
    if (type === 'sent') {
      where.fromUserId = userId;
    } else if (type === 'received') {
      where.toUserId = userId;
    } else {
      where.OR = [{ fromUserId: userId }, { toUserId: userId }];
    }

    if (status === 'pending') {
      where.acceptedAt = null;
      where.canceledAt = null;
    } else if (status === 'accepted') {
      where.acceptedAt = { not: null };
    } else if (status === 'canceled') {
      where.canceledAt = { not: null };
    }

    const [transfers, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        include: {
          ticket: {
            select: {
              id: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  startAt: true,
                },
              },
              ticketType: {
                select: {
                  id: true,
                  name: true,
                  kind: true,
                },
              },
            },
          },
          fromUser: {
            select: { id: true, email: true, name: true },
          },
          toUser: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { initiatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transfer.count({ where }),
    ]);

    const items = transfers.map((transfer) => {
      let derivedStatus: TransferStatus = 'pending';
      if (transfer.canceledAt) {
        derivedStatus = 'canceled';
      } else if (transfer.acceptedAt) {
        derivedStatus = 'accepted';
      }

      const direction: TransferDirection =
        transfer.fromUserId === userId ? 'sent' : 'received';

      return {
        id: transfer.id,
        ticketId: transfer.ticketId,
        direction,
        status: derivedStatus,
        initiatedAt: transfer.initiatedAt,
        acceptedAt: transfer.acceptedAt,
        canceledAt: transfer.canceledAt,
        ticket: transfer.ticket,
        fromUser: transfer.fromUser,
        toUser: transfer.toUser,
      };
    });

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async getRefunds(
    userId: string,
    query: { status?: string; page?: number; limit?: number },
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

    const where: any = {
      order: {
        buyerId: userId,
      },
    };

    if (query.status) {
      const allowed = Object.values(RefundStatus);
      if (!allowed.includes(query.status as RefundStatus)) {
        throw new BadRequestException('Invalid refund status');
      }
      where.status = query.status as RefundStatus;
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              totalCents: true,
              currency: true,
              status: true,
              createdAt: true,
              eventId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { items: refunds, total, page, limit };
  }

  async requestRefund(userId: string, dto: RequestRefundDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        totalCents: true,
        currency: true,
      },
    });

    if (!order || order.buyerId !== userId) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== OrderStatus.paid) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const existingPending = await this.prisma.refund.findFirst({
      where: {
        orderId: order.id,
        status: { in: [RefundStatus.pending, RefundStatus.approved] },
      },
    });

    if (existingPending) {
      throw new BadRequestException('Refund already requested for this order');
    }

    const amountCents =
      dto.amountCents && dto.amountCents > 0
        ? BigInt(dto.amountCents)
        : order.totalCents;

    if (amountCents > order.totalCents) {
      throw new BadRequestException('Refund amount exceeds order total');
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId: order.id,
        amountCents,
        currency: order.currency,
        reason: dto.reason,
        createdBy: userId,
        status: RefundStatus.pending,
      },
    });

    return refund;
  }

  /**
   * Get user profile including avatar
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        twofaEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  /**
   * Upload or update user avatar
   */
  async uploadAvatar(
    userId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    // Validate file type
    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_AVATAR_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
      );
    }

    // Get current user to check for existing avatar
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Delete old avatar if exists
    if (user.avatarKey) {
      try {
        await this.storageService.deleteFile(user.avatarKey);
        this.logger.log(`Deleted old avatar for user ${userId}`);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old avatar: ${user.avatarKey}`,
          error,
        );
      }
    }

    // Upload new avatar
    const result = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'avatars',
    );

    // Update user with new avatar
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: result.url,
        avatarKey: result.key,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    this.logger.log(`Avatar uploaded for user ${userId}: ${result.key}`);

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.avatarKey) {
      throw new BadRequestException('No avatar to delete');
    }

    // Delete from storage
    try {
      await this.storageService.deleteFile(user.avatarKey);
    } catch (error) {
      this.logger.warn(
        `Failed to delete avatar file: ${user.avatarKey}`,
        error,
      );
    }

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatarKey: null,
      },
    });

    this.logger.log(`Avatar deleted for user ${userId}`);

    return { message: 'Avatar deleted successfully' };
  }

  /**
   * Get fresh avatar URL (useful for S3 signed URLs that expire)
   */
  async getAvatarUrl(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true, avatarUrl: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.avatarKey) {
      return null;
    }

    // Get a fresh signed URL if using S3
    try {
      const url = await this.storageService.getSignedUrl(user.avatarKey);
      return url;
    } catch {
      return user.avatarUrl;
    }
  }
}
