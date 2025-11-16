import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionQueryDto } from '../dto/session.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminSessionService {
  constructor(private prisma: PrismaService) {}

  async getSessions(query: SessionQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      userId,
      status,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserSessionWhereInput = {};
    const now = new Date();

    // Filter by user
    if (userId) {
      where.userId = userId;
    }

    // Search by user email or name
    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Filter by status
    if (status === 'active') {
      where.revokedAt = null;
      where.expiresAt = { gte: now };
    } else if (status === 'expired') {
      where.revokedAt = null;
      where.expiresAt = { lt: now };
    } else if (status === 'revoked') {
      where.revokedAt = { not: null };
    }

    const orderBy: Prisma.UserSessionOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'userId',
        'createdAt',
        'expiresAt',
        'revokedAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [sessions, total] = await Promise.all([
      this.prisma.userSession.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          userId: true,
          userAgent: true,
          ipAddr: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.userSession.count({ where }),
    ]);

    const data = sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      userEmail: session.user.email,
      userName: session.user.name,
      userRole: session.user.role,
      userAgent: session.userAgent,
      ipAddr: session.ipAddr,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      isActive: !session.revokedAt && session.expiresAt > now,
      isExpired: !session.revokedAt && session.expiresAt <= now,
      isRevoked: !!session.revokedAt,
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

  async getSessionStats() {
    const now = new Date();

    const [total, active, expired, revoked, totalUsers, recentLogins] =
      await Promise.all([
        this.prisma.userSession.count(),
        this.prisma.userSession.count({
          where: {
            revokedAt: null,
            expiresAt: { gte: now },
          },
        }),
        this.prisma.userSession.count({
          where: {
            revokedAt: null,
            expiresAt: { lt: now },
          },
        }),
        this.prisma.userSession.count({
          where: {
            revokedAt: { not: null },
          },
        }),
        this.prisma.userSession.groupBy({
          by: ['userId'],
          where: {
            revokedAt: null,
            expiresAt: { gte: now },
          },
        }),
        this.prisma.userSession.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

    return {
      total,
      active,
      expired,
      revoked,
      activeUsers: totalUsers.length,
      recentLogins24h: recentLogins,
    };
  }

  async revokeSession(sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revokedAt) {
      throw new BadRequestException('Session is already revoked');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllUserSessions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gte: now },
      },
      data: {
        revokedAt: now,
      },
    });

    return {
      message: `Revoked ${result.count} active session(s) for user`,
      count: result.count,
    };
  }
}
