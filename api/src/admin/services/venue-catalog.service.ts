import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VenueCatalog } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateVenueCatalogDto,
  UpdateVenueCatalogDto,
  VenueCatalogImportOptionsDto,
  VenueCatalogImportStrategy,
  VenueCatalogQueryDto,
} from '../dto/venue-catalog.dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminVenueCatalogService {
  private readonly logger = new Logger(AdminVenueCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(query: VenueCatalogQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.venueCatalog.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.venueCatalog.count({ where }),
    ]);

    return {
      data: items.map((item) => this.serialize(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const entry = await this.prisma.venueCatalog.findUnique({
      where: { id },
    });
    if (!entry) {
      throw new NotFoundException('Catalog venue not found');
    }
    return this.serialize(entry);
  }

  async create(dto: CreateVenueCatalogDto) {
    const data = this.buildCreateData(dto);
    try {
      const created = await this.prisma.venueCatalog.create({ data });
      return this.serialize(created);
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateVenueCatalogDto) {
    const existing = await this.prisma.venueCatalog.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Catalog venue not found');
    }

    const data = this.buildUpdateData(dto);
    try {
      const updated = await this.prisma.venueCatalog.update({
        where: { id },
        data,
      });
      return this.serialize(updated);
    } catch (error) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async delete(id: string) {
    const existing = await this.prisma.venueCatalog.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Catalog venue not found');
    }

    const references = await this.prisma.venue.count({
      where: { catalogVenueId: id },
    });
    if (references > 0) {
      throw new BadRequestException(
        'Cannot delete catalog venue while organizer venues reference it. Remove references first.',
      );
    }

    await this.prisma.venueCatalog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  async importFromFile(buffer: Buffer, options?: VenueCatalogImportOptionsDto) {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Upload a JSON file with catalog entries');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(buffer.toString('utf-8'));
    } catch (error) {
      throw new BadRequestException('Unable to parse JSON file');
    }

    const entries = this.extractEntries(payload);
    if (!entries.length) {
      throw new BadRequestException('JSON file does not contain any entries');
    }

    const strategy = options?.strategy ?? VenueCatalogImportStrategy.UPSERT;
    const dryRun = options?.dryRun ?? false;

    const summary = {
      total: entries.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; message: string }>,
    };

    for (const [index, raw] of entries.entries()) {
      try {
        const dto = plainToInstance(CreateVenueCatalogDto, raw);
        const validationErrors = validateSync(dto, {
          whitelist: true,
          forbidNonWhitelisted: false,
        });
        if (validationErrors.length) {
          throw new BadRequestException(
            validationErrors
              .map((err) => Object.values(err.constraints ?? {}).join(', '))
              .filter(Boolean)
              .join('; ') || 'Validation failed',
          );
        }

        const slug = this.ensureSlug(dto.slug, dto.name);
        const existing = await this.prisma.venueCatalog.findUnique({
          where: { slug },
        });

        if (existing && strategy === VenueCatalogImportStrategy.SKIP) {
          summary.skipped += 1;
          continue;
        }

        if (dryRun) {
          if (existing) {
            summary.updated += 1;
          } else {
            summary.created += 1;
          }
          continue;
        }

        if (existing) {
          const data = this.buildUpdateData({ ...dto, slug });
          const result = await this.prisma.venueCatalog.update({
            where: { id: existing.id },
            data: {
              ...data,
              deletedAt: null,
            },
          });
          if (result) {
            summary.updated += 1;
          }
        } else {
          const data = this.buildCreateData({ ...dto, slug });
          await this.prisma.venueCatalog.create({ data });
          summary.created += 1;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown import error';
        summary.errors.push({ index, message });
        this.logger.warn(`Failed to import catalog entry ${index}: ${message}`);
      }
    }

    return summary;
  }

  private buildWhere(
    query: VenueCatalogQueryDto,
  ): Prisma.VenueCatalogWhereInput {
    const filters: Prisma.VenueCatalogWhereInput[] = [];

    if (!query.includeDeleted) {
      filters.push({ deletedAt: null });
    }

    if (query.search) {
      filters.push({
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          {
            description: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (query.city) {
      filters.push({
        address: {
          path: ['city'],
          string_contains: query.city,
          mode: 'insensitive',
        },
      });
    }

    if (query.country) {
      filters.push({
        address: {
          path: ['country'],
          string_contains: query.country,
          mode: 'insensitive',
        },
      });
    }

    if (query.tags?.length) {
      filters.push({
        tags: {
          hasSome: query.tags,
        },
      });
    }

    if (!filters.length) {
      return {};
    }

    return { AND: filters };
  }

  private buildCreateData(
    dto: CreateVenueCatalogDto,
  ): Prisma.VenueCatalogCreateInput {
    const slug = this.ensureSlug(dto.slug, dto.name);
    return {
      slug,
      name: dto.name,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      address: dto.address as unknown as Prisma.InputJsonValue,
      timezone: dto.timezone,
      capacityMin: dto.capacityMin ?? null,
      capacityMax: dto.capacityMax ?? null,
      latitude:
        dto.latitude !== undefined && dto.latitude !== null
          ? new Prisma.Decimal(dto.latitude)
          : null,
      longitude:
        dto.longitude !== undefined && dto.longitude !== null
          ? new Prisma.Decimal(dto.longitude)
          : null,
      tags: this.normalizeTags(dto.tags),
      defaultSeatmapSpec: this.parseSeatmapSpec(dto.defaultSeatmapSpec),
    };
  }

  private buildUpdateData(
    dto: UpdateVenueCatalogDto,
  ): Prisma.VenueCatalogUpdateInput {
    const data: Prisma.VenueCatalogUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.slug !== undefined) {
      data.slug = this.ensureSlug(dto.slug, dto.name ?? dto.slug);
    }
    if (dto.description !== undefined) {
      data.description = dto.description ?? null;
    }
    if (dto.address !== undefined) {
      data.address = dto.address as unknown as Prisma.InputJsonValue;
    }
    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone;
    }
    if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl ?? null;
    }
    if (dto.capacityMin !== undefined) {
      data.capacityMin = dto.capacityMin ?? null;
    }
    if (dto.capacityMax !== undefined) {
      data.capacityMax = dto.capacityMax ?? null;
    }
    if (dto.latitude !== undefined) {
      data.latitude =
        dto.latitude === null ? null : new Prisma.Decimal(dto.latitude);
    }
    if (dto.longitude !== undefined) {
      data.longitude =
        dto.longitude === null ? null : new Prisma.Decimal(dto.longitude);
    }
    if (dto.tags !== undefined) {
      data.tags = this.normalizeTags(dto.tags);
    }
    if (dto.defaultSeatmapSpec !== undefined) {
      data.defaultSeatmapSpec = this.parseSeatmapSpec(dto.defaultSeatmapSpec);
    }
    return data;
  }

  private parseSeatmapSpec(input: any) {
    if (input === undefined) {
      return undefined;
    }
    if (input === null) {
      return Prisma.JsonNull;
    }
    if (typeof input === 'string') {
      try {
        return JSON.parse(input);
      } catch (error) {
        throw new BadRequestException(
          'defaultSeatmapSpec must be valid JSON string',
        );
      }
    }
    if (typeof input === 'object') {
      return input as Prisma.InputJsonValue;
    }
    throw new BadRequestException(
      'defaultSeatmapSpec must be an object, array, or JSON string',
    );
  }

  private ensureSlug(slug: string | undefined, fallback: string) {
    const base = slug?.trim() || fallback;
    const normalized = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);
    return normalized || `venue-${randomUUID().slice(0, 8)}`;
  }

  private normalizeTags(tags?: string[]) {
    if (!tags?.length) {
      return [];
    }
    const set = new Set(
      tags
        .map((tag) => tag?.trim().toLowerCase())
        .filter((tag): tag is string => Boolean(tag)),
    );
    return Array.from(set);
  }

  private extractEntries(payload: unknown): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as any).entries)
    ) {
      return (payload as any).entries;
    }
    return [];
  }

  private serialize(entry: VenueCatalog) {
    return {
      id: entry.id,
      slug: entry.slug,
      name: entry.name,
      description: entry.description,
      address: entry.address,
      timezone: entry.timezone,
      imageUrl: entry.imageUrl,
      capacityMin: entry.capacityMin,
      capacityMax: entry.capacityMax,
      latitude: entry.latitude ? Number(entry.latitude) : null,
      longitude: entry.longitude ? Number(entry.longitude) : null,
      tags: entry.tags ?? [],
      defaultSeatmapSpec: entry.defaultSeatmapSpec,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      deletedAt: entry.deletedAt,
    };
  }

  private handleKnownErrors(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException('Slug already exists. Use a unique slug.');
    }
  }
}
