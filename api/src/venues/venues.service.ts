import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { OrgMemberRole } from '@prisma/client';
import { checkOrgPermission } from '../common/utils';

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createVenueDto: CreateVenueDto) {
    const { name, address, timezone, capacity } = createVenueDto;

    // Create venue
    const venue = await this.prisma.venue.create({
      data: {
        orgId: '', // Will be set after checking organization membership
        name,
        address,
        timezone,
        capacity,
      },
    });

    return venue;
  }

  async createForOrg(
    orgId: string,
    userId: string,
    createVenueDto: CreateVenueDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to create venues for this organization',
    );

    const { name, address, timezone, capacity } = createVenueDto;

    // Create venue for the organization
    const venue = await this.prisma.venue.create({
      data: {
        orgId,
        name,
        address,
        timezone,
        capacity,
      },
    });

    return venue;
  }

  async findAll(userId: string) {
    // Get venues from organizations where user is a member
    const venues = await this.prisma.venue.findMany({
      where: {
        org: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
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

  async findOne(id: string, userId: string) {
    // Check if user is a member of the organization that owns the venue
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        org: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
        events: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
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

    if (venue.org.members.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to view this venue',
      );
    }

    return venue;
  }

  async update(id: string, userId: string, updateVenueDto: UpdateVenueDto) {
    // Check if user is a member of the organization that owns the venue with appropriate permissions
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        org: true,
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    await checkOrgPermission(
      this.prisma,
      venue.orgId,
      userId,
      undefined,
      'You do not have permission to update this venue',
    );

    const updatedVenue = await this.prisma.venue.update({
      where: { id },
      data: updateVenueDto,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedVenue;
  }

  async remove(id: string, userId: string) {
    // Check if user is a member of the organization that owns the venue with appropriate permissions
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        org: true,
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    await checkOrgPermission(
      this.prisma,
      venue.orgId,
      userId,
      undefined,
      'You do not have permission to delete this venue',
    );

    // Check if venue has any events
    const eventsCount = await this.prisma.event.count({
      where: {
        venueId: id,
      },
    });

    if (eventsCount > 0) {
      throw new ForbiddenException('Cannot delete venue with existing events');
    }

    await this.prisma.venue.delete({
      where: { id },
    });

    return { message: 'Venue deleted successfully' };
  }

  /**
   * Public method to fetch all venues with their event counts
   */
  async findAllPublic() {
    const venues = await this.prisma.venue.findMany({
      where: {
        deletedAt: null,
        events: {
          some: {
            status: 'live',
          },
        },
      },
      select: {
        id: true,
        name: true,
        address: true,
        timezone: true,
        capacity: true,
        latitude: true,
        longitude: true,
        catalogVenue: {
          select: {
            imageUrl: true,
          },
        },
        _count: {
          select: {
            events: {
              where: {
                status: 'live',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      timezone: venue.timezone,
      capacity: venue.capacity,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
      imageUrl: venue.catalogVenue?.imageUrl ?? null,
      eventCount: venue._count.events,
    }));
  }

  /**
   * Public method to fetch a single venue by ID with upcoming events
   */
  async findOnePublic(id: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        address: true,
        timezone: true,
        capacity: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        _count: {
          select: {
            events: {
              where: {
                status: 'live',
              },
            },
          },
        },
        events: {
          where: {
            status: 'live',
            startAt: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            coverImageUrl: true,
            org: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 20,
          orderBy: {
            startAt: 'asc',
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return {
      id: venue.id,
      name: venue.name,
      address: venue.address,
      timezone: venue.timezone,
      capacity: venue.capacity,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
      eventCount: venue._count.events,
      upcomingEvents: venue.events.map((event) => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        coverImageUrl: event.coverImageUrl,
        organizer: event.org,
      })),
    };
  }
}
