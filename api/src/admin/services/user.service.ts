import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserQueryDto } from '../dto/query-params.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Prisma, PlatformRole } from '@prisma/client';

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(private prisma: PrismaService) {}

  async getUsers(query: UserQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      const allowedRoles = [
        'attendee',
        'organizer',
        'moderator',
        'admin',
      ] as const;
      if (!allowedRoles.includes(role as any)) {
        throw new BadRequestException(`Invalid role: ${role}`);
      }
      where.role = role as PlatformRole;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'email',
        'name',
        'role',
        'status',
        'createdAt',
        'updatedAt',
        'emailVerifiedAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          emailVerifiedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
      },
    });

    return user;
  }

  async suspendUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'suspended' },
    });

    return { message: 'User suspended successfully' };
  }

  async activateUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    return { message: 'User activated successfully' };
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  async grantPlatformRole(
    targetUserId: string,
    role: PlatformRole,
    actorId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousRole = user.role;

    if (previousRole === role) {
      return {
        message: 'User already has the requested role',
        user: { id: user.id, role: previousRole },
      };
    }

    if (actorId && actorId === targetUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action: 'grant_role',
        targetKind: 'User',
        targetId: targetUserId,
        meta: {
          from: previousRole,
          to: role,
        },
      },
    });

    this.logger.log(
      `Granted role ${role} to user ${targetUserId} (actor: ${actorId || 'system'})`,
    );

    return { message: 'Role granted successfully', user: updated };
  }

  async revokePlatformRole(
    targetUserId: string,
    actorId?: string,
    fallback: PlatformRole = PlatformRole.attendee,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousRole = user.role;

    if (previousRole === fallback) {
      return {
        message: 'User already has fallback role',
        user: { id: user.id, role: previousRole },
      };
    }

    if (actorId && actorId === targetUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: fallback },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action: 'revoke_role',
        targetKind: 'User',
        targetId: targetUserId,
        meta: {
          from: previousRole,
          to: fallback,
        },
      },
    });

    this.logger.log(
      `Revoked role ${previousRole} from user ${targetUserId}, set to ${fallback} (actor: ${actorId || 'system'})`,
    );

    return { message: 'Role revoked successfully', user: updated };
  }
}
