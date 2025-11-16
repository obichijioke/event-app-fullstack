import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVenueDto, UpdateVenueDto } from './dto/create-venue.dto';
import { VenueCatalogQueryDto } from './dto/venue-catalog-query.dto';
import { Prisma, VenueVisibility } from '@prisma/client';

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new venue for an organization
   */
  async create(orgId: string, userId: string, dto: CreateVenueDto) {
    // Verify user has access to organization
    await this.verifyOrgAccess(orgId, userId);

    const include = {
      org: {
        select: {
          id: true,
          name: true,
        },
      },
      catalogVenue: {
        select: {
          id: true,
          name: true,
          address: true,
          timezone: true,
          tags: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          seatmaps: true,
          events: true,
        },
      },
    };

    if (dto.catalogVenueId) {
      const catalog = await this.prisma.venueCatalog.findFirst({
        where: {
          id: dto.catalogVenueId,
          deletedAt: null,
        },
      });

      if (!catalog) {
        throw new NotFoundException('Catalog venue not found or unavailable');
      }

      const venue = await this.prisma.venue.create({
        data: {
          orgId,
          catalogVenueId: catalog.id,
          visibility: VenueVisibility.shared_ref,
          name: dto.name || catalog.name,
          address: catalog.address as any,
          timezone: catalog.timezone,
          capacity:
            dto.capacity ?? catalog.capacityMax ?? catalog.capacityMin ?? null,
          latitude: catalog.latitude,
          longitude: catalog.longitude,
        },
        include,
      });

      return venue;
    }

    const venue = await this.prisma.venue.create({
      data: {
        orgId,
        name: dto.name,
        address: dto.address as any,
        timezone: dto.timezone,
        capacity: dto.capacity,
        latitude: dto.latitude,
        longitude: dto.longitude,
        visibility: VenueVisibility.private,
      },
      include,
    });

    return venue;
  }

  /**
   * Get all venues accessible to the user
   */
  async findAll(userId: string) {
    // Get all organizations the user is a member of
    const memberships = await this.prisma.orgMember.findMany({
      where: { userId },
      select: { orgId: true },
    });

    const orgIds = memberships.map((m) => m.orgId);

    // Get venues for those organizations
    const venues = await this.prisma.venue.findMany({
      where: {
        orgId: { in: orgIds },
        deletedAt: null,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        catalogVenue: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true,
            tags: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            seatmaps: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return venues;
  }

  /**
   * Get a specific venue by ID
   */
  async findOne(id: string, userId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        catalogVenue: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true,
            tags: true,
            imageUrl: true,
          },
        },
        seatmaps: {
          select: {
            id: true,
            name: true,
            description: true,
            isDefault: true,
            createdAt: true,
            _count: {
              select: {
                seats: true,
              },
            },
          },
          orderBy: {
            isDefault: 'desc', // Default seatmaps first
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Verify user has access
    await this.verifyOrgAccess(venue.orgId, userId);

    return venue;
  }

  /**
   * Update a venue
   */
  async update(id: string, userId: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findFirst({
      where: { id, deletedAt: null },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    await this.verifyOrgAccess(venue.orgId, userId);

    const updated = await this.prisma.venue.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address as any,
        timezone: dto.timezone,
        capacity: dto.capacity,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        catalogVenue: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true,
            tags: true,
          },
        },
        _count: {
          select: {
            seatmaps: true,
            events: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Soft delete a venue
   */
  async remove(id: string, userId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    await this.verifyOrgAccess(venue.orgId, userId);

    // Check if venue has events
    if (venue._count.events > 0) {
      throw new ForbiddenException(
        'Cannot delete venue with existing events. Please delete or move the events first.',
      );
    }

    await this.prisma.venue.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Venue deleted successfully' };
  }

  /**
   * Get all venues for a specific organization
   */
  async findByOrg(orgId: string, userId: string) {
    await this.verifyOrgAccess(orgId, userId);

    const venues = await this.prisma.venue.findMany({
      where: {
        orgId,
        deletedAt: null,
      },
      include: {
        catalogVenue: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true,
            tags: true,
          },
        },
        _count: {
          select: {
            seatmaps: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return venues;
  }

  /**
   * Search shared venue catalog entries
   */
  async searchCatalogVenues(userId: string, query: VenueCatalogQueryDto) {
    await this.ensureHasAnyOrg(userId);

    const filters: Prisma.VenueCatalogWhereInput[] = [
      {
        deletedAt: null,
      },
    ];

    if (query.search) {
      filters.push({
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          {
            description: { contains: query.search, mode: 'insensitive' },
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
      } as Prisma.VenueCatalogWhereInput);
    }

    if (query.country) {
      filters.push({
        address: {
          path: ['country'],
          string_contains: query.country,
          mode: 'insensitive',
        },
      } as Prisma.VenueCatalogWhereInput);
    }

    if (query.tags?.length) {
      filters.push({
        tags: {
          hasSome: query.tags,
        },
      });
    }

    const where: Prisma.VenueCatalogWhereInput = filters.length
      ? { AND: filters }
      : {};

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const skip = (page - 1) * limit;

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
      data: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        address: item.address,
        timezone: item.timezone,
        capacityMin: item.capacityMin,
        capacityMax: item.capacityMax,
        latitude: item.latitude ? Number(item.latitude) : null,
        longitude: item.longitude ? Number(item.longitude) : null,
        tags: item.tags ?? [],
        defaultSeatmapSpec: item.defaultSeatmapSpec,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Verify user has access to an organization
   */
  private async verifyOrgAccess(orgId: string, userId: string) {
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    return membership;
  }

  private async ensureHasAnyOrg(userId: string) {
    const membership = await this.prisma.orgMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Join or create an organization to browse shared venues',
      );
    }

    return membership.orgId;
  }
}
