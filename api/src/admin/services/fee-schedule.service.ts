import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  FeeScheduleQueryDto,
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  CreateOrgFeeOverrideDto,
  UpdateOrgFeeOverrideDto,
} from '../dto/fee-schedule.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminFeeScheduleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FeeScheduleQueryDto) {
    return this.getFeeSchedules(query);
  }

  async getStats() {
    return this.getFeeScheduleStats();
  }

  async findOne(feeScheduleId: string) {
    return this.getFeeSchedule(feeScheduleId);
  }

  async create(dto: CreateFeeScheduleDto) {
    return this.createFeeSchedule(dto);
  }

  async update(feeScheduleId: string, dto: UpdateFeeScheduleDto) {
    return this.updateFeeSchedule(feeScheduleId, dto);
  }

  async remove(feeScheduleId: string) {
    return this.deleteFeeSchedule(feeScheduleId);
  }

  async deactivate(feeScheduleId: string) {
    return this.deactivateFeeSchedule(feeScheduleId);
  }

  async getFeeSchedules(query: FeeScheduleQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      kind,
      active,
      currency,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FeeScheduleWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (kind) {
      where.kind = kind;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (currency) {
      where.currency = currency;
    }

    const orderBy: Prisma.FeeScheduleOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'kind',
        'name',
        'percent',
        'fixedCents',
        'currency',
        'active',
        'createdAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [feeSchedules, total] = await Promise.all([
      this.prisma.feeSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          orgFeeOverrides: {
            select: {
              id: true,
              orgId: true,
              startsAt: true,
              endsAt: true,
              org: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.feeSchedule.count({ where }),
    ]);

    return {
      data: feeSchedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFeeSchedule(feeScheduleId: string) {
    const feeSchedule = await this.prisma.feeSchedule.findUnique({
      where: { id: feeScheduleId },
      include: {
        orgFeeOverrides: {
          include: {
            org: {
              select: {
                id: true,
                name: true,
                supportEmail: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    return feeSchedule;
  }

  async createFeeSchedule(dto: CreateFeeScheduleDto) {
    const { kind, name, percent, fixedCents, currency, active } = dto;

    const feeSchedule = await this.prisma.feeSchedule.create({
      data: {
        kind,
        name,
        percent,
        fixedCents,
        currency: currency || null,
        active: active !== undefined ? active : true,
      },
    });

    return feeSchedule;
  }

  async updateFeeSchedule(
    feeScheduleId: string,
    dto: UpdateFeeScheduleDto,
  ) {
    const feeSchedule = await this.prisma.feeSchedule.findUnique({
      where: { id: feeScheduleId },
    });

    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    const updatedFeeSchedule = await this.prisma.feeSchedule.update({
      where: { id: feeScheduleId },
      data: {
        ...dto,
      },
    });

    return updatedFeeSchedule;
  }

  async deleteFeeSchedule(feeScheduleId: string) {
    const feeSchedule = await this.prisma.feeSchedule.findUnique({
      where: { id: feeScheduleId },
      include: {
        orgFeeOverrides: true,
      },
    });

    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    if (feeSchedule.orgFeeOverrides.length > 0) {
      throw new ConflictException(
        'Cannot delete fee schedule with active organization overrides',
      );
    }

    await this.prisma.feeSchedule.delete({
      where: { id: feeScheduleId },
    });

    return { message: 'Fee schedule deleted successfully' };
  }

  async deactivateFeeSchedule(feeScheduleId: string) {
    const feeSchedule = await this.prisma.feeSchedule.findUnique({
      where: { id: feeScheduleId },
    });

    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    await this.prisma.feeSchedule.update({
      where: { id: feeScheduleId },
      data: { active: false },
    });

    return { message: 'Fee schedule deactivated successfully' };
  }

  // Organization Fee Override Management
  async createOrgFeeOverride(dto: CreateOrgFeeOverrideDto) {
    const { orgId, feeScheduleId, startsAt, endsAt } = dto;

    // Verify organization exists
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Verify fee schedule exists
    const feeSchedule = await this.prisma.feeSchedule.findUnique({
      where: { id: feeScheduleId },
    });

    if (!feeSchedule) {
      throw new NotFoundException('Fee schedule not found');
    }

    // Check for existing active override
    const existingOverride = await this.prisma.orgFeeOverride.findFirst({
      where: {
        orgId,
        feeScheduleId,
        OR: [
          { endsAt: null },
          { endsAt: { gte: new Date() } },
        ],
      },
    });

    if (existingOverride) {
      throw new ConflictException(
        'Organization already has an active override for this fee schedule',
      );
    }

    const override = await this.prisma.orgFeeOverride.create({
      data: {
        orgId,
        feeScheduleId,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        feeSchedule: true,
      },
    });

    return override;
  }

  async getOrgFeeOverrides(orgId: string) {
    const overrides = await this.prisma.orgFeeOverride.findMany({
      where: { orgId },
      include: {
        feeSchedule: true,
      },
    });

    return overrides;
  }

  async updateOrgFeeOverride(
    overrideId: string,
    dto: UpdateOrgFeeOverrideDto,
  ) {
    const override = await this.prisma.orgFeeOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new NotFoundException('Fee override not found');
    }

    if (dto.feeScheduleId) {
      const feeSchedule = await this.prisma.feeSchedule.findUnique({
        where: { id: dto.feeScheduleId },
      });

      if (!feeSchedule) {
        throw new NotFoundException('Fee schedule not found');
      }
    }

    const updatedOverride = await this.prisma.orgFeeOverride.update({
      where: { id: overrideId },
      data: {
        ...(dto.feeScheduleId && { feeScheduleId: dto.feeScheduleId }),
        ...(dto.startsAt !== undefined && {
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        }),
        ...(dto.endsAt !== undefined && {
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        }),
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        feeSchedule: true,
      },
    });

    return updatedOverride;
  }

  async deleteOrgFeeOverride(overrideId: string) {
    const override = await this.prisma.orgFeeOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new NotFoundException('Fee override not found');
    }

    await this.prisma.orgFeeOverride.delete({
      where: { id: overrideId },
    });

    return { message: 'Fee override deleted successfully' };
  }

  async getFeeScheduleStats() {
    const [total, activePlatform, activeProcessing, totalOverrides] =
      await Promise.all([
        this.prisma.feeSchedule.count(),
        this.prisma.feeSchedule.count({
          where: { kind: 'platform', active: true },
        }),
        this.prisma.feeSchedule.count({
          where: { kind: 'processing', active: true },
        }),
        this.prisma.orgFeeOverride.count(),
      ]);

    return {
      total,
      activePlatform,
      activeProcessing,
      totalOverrides,
    };
  }
}
