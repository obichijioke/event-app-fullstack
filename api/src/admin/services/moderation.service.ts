import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  FlagQueryDto,
  ResolveFlagDto,
  ModerationActionQueryDto,
} from '../dto/moderation.dto';
import { Prisma, ModerationStatus } from '@prisma/client';

@Injectable()
export class AdminModerationService {
  constructor(private prisma: PrismaService) {}

  async getFlags(query: FlagQueryDto) {
    const {
      page = 1,
      limit = 10,
      targetKind,
      status,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FlagWhereInput = {};

    if (targetKind) {
      where.targetKind = targetKind;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.FlagOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'targetKind',
        'status',
        'createdAt',
        'resolvedAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [flags, total] = await Promise.all([
      this.prisma.flag.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          reporterId: true,
          targetKind: true,
          targetId: true,
          reason: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
          reporter: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.flag.count({ where }),
    ]);

    const data = flags.map((flag) => ({
      id: flag.id,
      reporterId: flag.reporterId,
      reporterEmail: flag.reporter?.email,
      reporterName: flag.reporter?.name,
      targetKind: flag.targetKind,
      targetId: flag.targetId,
      reason: flag.reason,
      status: flag.status,
      createdAt: flag.createdAt,
      resolvedAt: flag.resolvedAt,
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

  async getFlag(flagId: string) {
    const flag = await this.prisma.flag.findUnique({
      where: { id: flagId },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    return flag;
  }

  async resolveFlag(flagId: string, dto: ResolveFlagDto, moderatorId: string) {
    const flag = await this.prisma.flag.findUnique({
      where: { id: flagId },
    });

    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    if (flag.resolvedAt) {
      throw new BadRequestException('Flag is already resolved');
    }

    const [updatedFlag] = await Promise.all([
      this.prisma.flag.update({
        where: { id: flagId },
        data: {
          status: dto.status,
          resolvedAt: new Date(),
        },
      }),
      this.prisma.moderationAction.create({
        data: {
          moderatorId,
          targetKind: flag.targetKind,
          targetId: flag.targetId,
          action: dto.status,
          notes: dto.notes,
        },
      }),
    ]);

    return {
      message: 'Flag resolved successfully',
      flag: updatedFlag,
    };
  }

  async getModerationActions(query: ModerationActionQueryDto) {
    const {
      page = 1,
      limit = 10,
      targetKind,
      moderatorId,
      action,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ModerationActionWhereInput = {};

    if (targetKind) {
      where.targetKind = targetKind;
    }

    if (moderatorId) {
      where.moderatorId = moderatorId;
    }

    if (action) {
      where.action = action;
    }

    const orderBy: Prisma.ModerationActionOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'targetKind',
        'action',
        'createdAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [actions, total] = await Promise.all([
      this.prisma.moderationAction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          moderatorId: true,
          targetKind: true,
          targetId: true,
          action: true,
          notes: true,
          createdAt: true,
          moderator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.moderationAction.count({ where }),
    ]);

    const data = actions.map((action) => ({
      id: action.id,
      moderatorId: action.moderatorId,
      moderatorEmail: action.moderator.email,
      moderatorName: action.moderator.name,
      targetKind: action.targetKind,
      targetId: action.targetId,
      action: action.action,
      notes: action.notes,
      createdAt: action.createdAt,
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

  async getModerationStats() {
    const [totalFlags, openFlags, resolvedFlags, approvedFlags, rejectedFlags] =
      await Promise.all([
        this.prisma.flag.count(),
        this.prisma.flag.count({ where: { status: ModerationStatus.open } }),
        this.prisma.flag.count({
          where: { status: ModerationStatus.resolved },
        }),
        this.prisma.flag.count({
          where: { status: ModerationStatus.approved },
        }),
        this.prisma.flag.count({
          where: { status: ModerationStatus.rejected },
        }),
      ]);

    const flagsByTargetKind = await this.prisma.flag.groupBy({
      by: ['targetKind'],
      _count: {
        id: true,
      },
    });

    return {
      totalFlags,
      openFlags,
      resolvedFlags,
      approvedFlags,
      rejectedFlags,
      byTargetKind: flagsByTargetKind.map((item) => ({
        targetKind: item.targetKind,
        count: item._count.id,
      })),
    };
  }
}
