import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSeatmapDto, CreateSeatDto } from './dto/create-seatmap.dto';
import { UpdateSeatmapDto } from './dto/update-seatmap.dto';
import { checkOrgPermission } from '../common/utils';

@Injectable()
export class SeatmapsService {
  constructor(private prisma: PrismaService) {}

  async createForVenue(
    venueId: string,
    userId: string,
    createSeatmapDto: CreateSeatmapDto,
  ) {
    // Get venue and check user permissions
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { orgId: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      venue.orgId,
      userId,
      undefined,
      'You do not have permission to create seatmaps for this venue',
    );

    const { name, spec, description, isDefault } = createSeatmapDto;

    // If this is being set as default, unset other defaults for this venue
    if (isDefault) {
      await this.prisma.seatmap.updateMany({
        where: { venueId },
        data: { isDefault: false },
      });
    }

    // Create seatmap for the venue
    const seatmap = await this.prisma.seatmap.create({
      data: {
        venueId,
        name,
        description,
        spec,
        isDefault: isDefault || false,
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
      },
    });

    return seatmap;
  }

  async findAll(userId: string) {
    // Get seatmaps from venues in organizations where user is a member
    const seatmaps = await this.prisma.seatmap.findMany({
      where: {
        venue: {
          org: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
        _count: {
          select: {
            seats: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return seatmaps;
  }

  async findOne(id: string, userId: string) {
    // Check if user is a member of the organization that owns the seatmap's venue
    const seatmap = await this.prisma.seatmap.findUnique({
      where: { id },
      include: {
        venue: {
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
          },
        },
        seats: {
          orderBy: [{ section: 'asc' }, { row: 'asc' }, { number: 'asc' }],
        },
        events: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            seats: true,
            events: true,
          },
        },
      },
    });

    if (!seatmap) {
      throw new NotFoundException('Seatmap not found');
    }

    if (seatmap.venue.org.members.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to view this seatmap',
      );
    }

    return seatmap;
  }

  async update(id: string, userId: string, updateSeatmapDto: UpdateSeatmapDto) {
    // Check if user is a member of the organization that owns the seatmap's venue with appropriate permissions
    const seatmap = await this.prisma.seatmap.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            org: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!seatmap) {
      throw new NotFoundException('Seatmap not found');
    }

    await checkOrgPermission(
      this.prisma,
      seatmap.venue.org.id,
      userId,
      undefined,
      'You do not have permission to update this seatmap',
    );

    // Check if seatmap is used by any events
    const eventsCount = await this.prisma.event.count({
      where: {
        seatmapId: id,
      },
    });

    if (eventsCount > 0) {
      throw new ForbiddenException(
        'Cannot update seatmap that is used by events',
      );
    }

    // If setting as default, unset other defaults for this venue
    if (updateSeatmapDto.isDefault) {
      await this.prisma.seatmap.updateMany({
        where: { venueId: seatmap.venueId },
        data: { isDefault: false },
      });
    }

    const updatedSeatmap = await this.prisma.seatmap.update({
      where: { id },
      data: updateSeatmapDto,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            orgId: true,
          },
        },
      },
    });

    return updatedSeatmap;
  }

  async remove(id: string, userId: string) {
    // Check if user is a member of the organization that owns the seatmap's venue with appropriate permissions
    const seatmap = await this.prisma.seatmap.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            org: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!seatmap) {
      throw new NotFoundException('Seatmap not found');
    }

    await checkOrgPermission(
      this.prisma,
      seatmap.venue.org.id,
      userId,
      undefined,
      'You do not have permission to delete this seatmap',
    );

    // Check if seatmap is used by any events
    const eventsCount = await this.prisma.event.count({
      where: {
        seatmapId: id,
      },
    });

    if (eventsCount > 0) {
      throw new ForbiddenException(
        'Cannot delete seatmap that is used by events',
      );
    }

    await this.prisma.seatmap.delete({
      where: { id },
    });

    return { message: 'Seatmap deleted successfully' };
  }

  async addSeats(seatmapId: string, userId: string, seats: CreateSeatDto[]) {
    // Check if user is a member of the organization that owns the seatmap's venue with appropriate permissions
    const seatmap = await this.prisma.seatmap.findUnique({
      where: { id: seatmapId },
      include: {
        venue: {
          select: {
            id: true,
            org: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!seatmap) {
      throw new NotFoundException('Seatmap not found');
    }

    await checkOrgPermission(
      this.prisma,
      seatmap.venue.org.id,
      userId,
      undefined,
      'You do not have permission to add seats to this seatmap',
    );

    // Check if seatmap is used by any events
    const eventsCount = await this.prisma.event.count({
      where: {
        seatmapId,
      },
    });

    if (eventsCount > 0) {
      throw new ForbiddenException(
        'Cannot add seats to seatmap that is used by events',
      );
    }

    // Create seats
    const createdSeats = await this.prisma.seat.createMany({
      data: seats.map((seat) => ({
        seatmapId,
        section: seat.section,
        row: seat.row,
        number: seat.number,
        pos: seat.pos,
      })),
      skipDuplicates: true,
    });

    return { message: `Created ${createdSeats.count} seats` };
  }

  async removeSeat(seatId: string, userId: string) {
    // Check if user is a member of the organization that owns the seatmap's venue
    const seat = await this.prisma.seat.findUnique({
      where: { id: seatId },
      include: {
        seatmap: {
          include: {
            venue: {
              select: {
                id: true,
                org: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    await checkOrgPermission(
      this.prisma,
      seat.seatmap.venue.org.id,
      userId,
      undefined,
      'You do not have permission to remove this seat',
    );

    // Check if seatmap is used by any events
    const eventsCount = await this.prisma.event.count({
      where: {
        seatmapId: seat.seatmapId,
      },
    });

    if (eventsCount > 0) {
      throw new ForbiddenException(
        'Cannot remove seats from seatmap that is used by events',
      );
    }

    await this.prisma.seat.delete({
      where: { id: seatId },
    });

    return { message: 'Seat removed successfully' };
  }

  async getSeats(seatmapId: string, userId: string) {
    // Check if user is a member of the organization that owns the seatmap's venue
    const seatmap = await this.prisma.seatmap.findUnique({
      where: { id: seatmapId },
      include: {
        venue: {
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
          },
        },
      },
    });

    if (!seatmap) {
      throw new NotFoundException('Seatmap not found');
    }

    if (seatmap.venue.org.members.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to view seats for this seatmap',
      );
    }

    const seats = await this.prisma.seat.findMany({
      where: {
        seatmapId,
      },
      orderBy: [{ section: 'asc' }, { row: 'asc' }, { number: 'asc' }],
    });

    return seats;
  }
}
