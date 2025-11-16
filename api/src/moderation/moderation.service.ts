import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateFlagDto,
  CreateModerationActionDto,
  UpdateFlagDto,
  GetFlagsDto,
  GetModerationStatsDto,
} from './dto/create-moderation.dto';
import { UpdateModerationActionDto } from './dto/update-moderation.dto';
import { ModerationStatus, PlatformRole } from '@prisma/client';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private prisma: PrismaService) {}

  async createFlag(createFlagDto: CreateFlagDto, userId?: string) {
    const { reporterId, targetKind, targetId, reason, description, metadata } =
      createFlagDto;

    // Check if target exists
    await this.validateTarget(targetKind, targetId);

    // Check if there's already an open flag for this target
    const existingFlag = await this.prisma.flag.findFirst({
      where: {
        targetKind,
        targetId,
        status: ModerationStatus.open,
      },
    });

    if (existingFlag) {
      throw new BadRequestException(
        'An open flag already exists for this target',
      );
    }

    // Create flag
    const flag = await this.prisma.flag.create({
      data: {
        reporterId: reporterId || userId,
        targetKind,
        targetId,
        reason,
        status: ModerationStatus.open,
        createdAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Auto-assign to moderators if needed
    await this.autoAssignFlag(flag.id);

    return flag;
  }

  async findAllFlags(getFlagsDto: GetFlagsDto, userId?: string) {
    const {
      targetKind,
      targetId,
      status,
      reporterId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = getFlagsDto;

    // Check if user is a moderator or admin
    const isModerator = await this.isModerator(userId);

    const whereClause: any = {};

    if (targetKind) {
      whereClause.targetKind = targetKind;
    }

    if (targetId) {
      whereClause.targetId = targetId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (reporterId) {
      whereClause.reporterId = reporterId;
    }

    // Non-moderators can only see their own flags
    if (!isModerator && userId) {
      whereClause.reporterId = userId;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const [flags, total] = await Promise.all([
      this.prisma.flag.findMany({
        where: whereClause,
        include: {
          reporter: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.flag.count({ where: whereClause }),
    ]);

    return {
      flags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneFlag(id: string, userId?: string) {
    // Check if user is a moderator or admin
    const isModerator = await this.isModerator(userId);

    const flag = await this.prisma.flag.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    // Non-moderators can only see their own flags
    if (!isModerator && userId && flag.reporterId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this flag',
      );
    }

    return flag;
  }

  async updateFlag(id: string, userId: string, updateFlagDto: UpdateFlagDto) {
    // Check if user is a moderator or admin
    const isModerator = await this.isModerator(userId);

    if (!isModerator) {
      throw new ForbiddenException(
        'You do not have permission to update flags',
      );
    }

    // Check if flag exists
    const flag = await this.prisma.flag.findUnique({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    const { status, resolvedAt } = updateFlagDto;

    // Update flag
    const updatedFlag = await this.prisma.flag.update({
      where: { id },
      data: {
        status,
        resolvedAt: resolvedAt ? new Date(resolvedAt) : undefined,
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return updatedFlag;
  }

  async createModerationAction(
    createModerationActionDto: CreateModerationActionDto,
    userId: string,
  ) {
    // Check if user is a moderator or admin
    const isModerator = await this.isModerator(userId);

    if (!isModerator) {
      throw new ForbiddenException(
        'You do not have permission to perform moderation actions',
      );
    }

    const { moderatorId, targetKind, targetId, action, notes, metadata } =
      createModerationActionDto;

    // Check if target exists
    await this.validateTarget(targetKind, targetId);

    // Create moderation action
    const moderationAction = await this.prisma.moderationAction.create({
      data: {
        moderatorId: moderatorId || userId,
        targetKind,
        targetId,
        action,
        notes,
        createdAt: new Date(),
      },
      include: {
        moderator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Apply the action to the target
    await this.applyModerationAction(moderationAction);

    return moderationAction;
  }

  async getModerationStats(
    getModerationStatsDto: GetModerationStatsDto,
    userId?: string,
  ) {
    // Check if user is a moderator or admin
    const isModerator = await this.isModerator(userId);

    if (!isModerator) {
      throw new ForbiddenException(
        'You do not have permission to view moderation statistics',
      );
    }

    const { targetKind, targetId, startDate, endDate } = getModerationStatsDto;

    const whereClause: any = {};

    if (targetKind) {
      whereClause.targetKind = targetKind;
    }

    if (targetId) {
      whereClause.targetId = targetId;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const [flagStats, actionStats] = await Promise.all([
      this.prisma.flag.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          id: true,
        },
      }),
      this.prisma.moderationAction.groupBy({
        by: ['action'],
        where: whereClause,
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      flags: flagStats,
      actions: actionStats,
    };
  }

  async getFlaggedContent(userId?: string) {
    // Check if user is a moderator or admin
    const isModerator = await this.isModerator(userId);

    if (!isModerator) {
      throw new ForbiddenException(
        'You do not have permission to view flagged content',
      );
    }

    // Get all open flags
    const flags = await this.prisma.flag.findMany({
      where: {
        status: ModerationStatus.open,
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get content details for each flag
    const flaggedContent = await Promise.all(
      flags.map(async (flag) => {
        const content = await this.getTargetContent(
          flag.targetKind,
          flag.targetId,
        );
        return {
          flag,
          content,
        };
      }),
    );

    return flaggedContent;
  }

  private async validateTarget(targetKind: string, targetId: string) {
    switch (targetKind) {
      case 'user':
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        break;

      case 'organization':
        const org = await this.prisma.organization.findUnique({
          where: { id: targetId },
        });
        if (!org) {
          throw new NotFoundException('Organization not found');
        }
        break;

      case 'event':
        const event = await this.prisma.event.findUnique({
          where: { id: targetId },
        });
        if (!event) {
          throw new NotFoundException('Event not found');
        }
        break;

      case 'ticket':
        const ticket = await this.prisma.ticket.findUnique({
          where: { id: targetId },
        });
        if (!ticket) {
          throw new NotFoundException('Ticket not found');
        }
        break;

      default:
        throw new BadRequestException('Invalid target kind');
    }
  }

  private async getTargetContent(targetKind: string, targetId: string) {
    switch (targetKind) {
      case 'user':
        return this.prisma.user.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });

      case 'organization':
        return this.prisma.organization.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        });

      case 'event':
        return this.prisma.event.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            title: true,
            descriptionMd: true,
            startAt: true,
            status: true,
            visibility: true,
          },
        });

      case 'ticket':
        return this.prisma.ticket.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            status: true,
            issuedAt: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

      default:
        return null;
    }
  }

  private async applyModerationAction(moderationAction: any) {
    const { targetKind, targetId, action } = moderationAction;

    switch (action) {
      case 'approve':
        // Mark related flags as resolved
        await this.prisma.flag.updateMany({
          where: {
            targetKind,
            targetId,
            status: ModerationStatus.open,
          },
          data: {
            status: ModerationStatus.resolved,
            resolvedAt: new Date(),
          },
        });
        break;

      case 'reject':
        // Mark related flags as resolved
        await this.prisma.flag.updateMany({
          where: {
            targetKind,
            targetId,
            status: ModerationStatus.open,
          },
          data: {
            status: ModerationStatus.resolved,
            resolvedAt: new Date(),
          },
        });
        break;

      case 'pause':
        if (targetKind === 'event') {
          await this.prisma.event.update({
            where: { id: targetId },
            data: {
              status: 'paused',
            },
          });
        }
        break;

      case 'unlist':
        if (targetKind === 'event') {
          await this.prisma.event.update({
            where: { id: targetId },
            data: {
              visibility: 'unlisted',
            },
          });
        }
        break;

      case 'suspend-user':
        if (targetKind === 'user') {
          await this.prisma.user.update({
            where: { id: targetId },
            data: {
              role: PlatformRole.attendee,
            },
          });
        }
        break;

      default:
        this.logger.warn(`Unknown moderation action: ${action}`);
    }
  }

  private async autoAssignFlag(flagId: string) {
    // Get moderators
    const moderators = await this.prisma.user.findMany({
      where: {
        role: {
          in: [PlatformRole.moderator, PlatformRole.admin],
        },
      },
    });

    if (moderators.length === 0) {
      this.logger.warn('No moderators available for auto-assignment');
      return;
    }

    // Assign to the moderator with the least active flags
    const moderatorStats = await this.prisma.moderationAction.groupBy({
      by: ['moderatorId'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: {
        id: true,
      },
    });

    // Find moderator with least actions
    let leastBusyModerator = moderators[0];
    let minActions = Infinity;

    for (const moderator of moderators) {
      const stat = moderatorStats.find((s) => s.moderatorId === moderator.id);
      const actionCount = stat?._count?.id || 0;

      if (actionCount < minActions) {
        minActions = actionCount;
        leastBusyModerator = moderator;
      }
    }

    // Create a notification or assignment record
    this.logger.log(
      `Auto-assigning flag ${flagId} to moderator ${leastBusyModerator.id}`,
    );
  }

  private async isModerator(userId?: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
      },
    });

    return (
      user?.role === PlatformRole.moderator || user?.role === PlatformRole.admin
    );
  }
}
