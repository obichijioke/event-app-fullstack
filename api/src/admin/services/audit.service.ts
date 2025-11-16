import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogQueryDto } from '../dto/query-params.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminAuditService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(query: AuditLogQueryDto) {
    const {
      page = 1,
      limit = 10,
      action,
      targetKind,
      actorId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = action;
    }

    if (targetKind) {
      where.targetKind = targetKind;
    }

    if (actorId) {
      where.actorId = actorId;
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

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'actorId',
        'action',
        'targetKind',
        'targetId',
        'createdAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          actorId: true,
          action: true,
          targetKind: true,
          targetId: true,
          meta: true,
          createdAt: true,
          actor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const data = logs.map((log) => ({
      ...log,
      actorName: log.actor?.name || log.actor?.email || 'System',
      actor: undefined,
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
}
