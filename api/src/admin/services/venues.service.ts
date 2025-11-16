import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminVenueQueryDto } from '../dto/venue-query.dto';

type VenueWithRelations = Prisma.VenueGetPayload<{
  include: {
    org: true;
    catalogVenue: {
      select: {
        id: true;
        name: true;
        imageUrl: true;
      };
    };
    _count: {
      select: {
        seatmaps: true;
        events: true;
      };
    };
  };
}>;

@Injectable()
export class AdminVenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminVenueQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.VenueWhereInput = {};

    if (query.status === 'archived') {
      where.deletedAt = { not: null };
    } else if (query.status !== 'all') {
      where.deletedAt = null;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        {
          org: {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
        {
          address: {
            path: ['city'],
            string_contains: query.search,
            mode: 'insensitive',
          },
        } as Prisma.VenueWhereInput,
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.venue.findMany({
        where,
        include: {
          org: true,
          catalogVenue: {
            select: {
              id: true,
              name: true,
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
        skip,
        take: limit,
      }),
      this.prisma.venue.count({ where }),
    ]);

    return {
      data: items.map((item) => this.serialize(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        org: true,
        catalogVenue: {
          select: {
            id: true,
            name: true,
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
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return this.serialize(venue);
  }

  async archive(id: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (venue.deletedAt) {
      return { archived: true };
    }

    await this.prisma.venue.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { archived: true };
  }

  async restore(id: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (!venue.deletedAt) {
      return { restored: true };
    }

    await this.prisma.venue.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });

    return { restored: true };
  }

  private serialize(venue: VenueWithRelations) {
    return {
      id: venue.id,
      name: venue.name,
      address: venue.address,
      timezone: venue.timezone,
      capacity: venue.capacity,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
      visibility: venue.visibility,
      deletedAt: venue.deletedAt,
      catalogVenue: venue.catalogVenue
        ? {
            id: venue.catalogVenue.id,
            name: venue.catalogVenue.name,
            imageUrl: venue.catalogVenue.imageUrl,
          }
        : null,
      organization: venue.org,
      seatmapCount: venue._count.seatmaps,
      eventCount: venue._count.events,
      createdAt: venue.createdAt,
      status: venue.deletedAt ? 'archived' : 'active',
    };
  }
}
