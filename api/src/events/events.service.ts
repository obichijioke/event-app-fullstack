import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateEventDto,
  CreateEventOccurrenceDto,
} from './dto/create-event.dto';
import { UpdateEventDto, UpdateEventPoliciesDto } from './dto/update-event.dto';
import { CreateEventAssetDto } from './dto/create-event-asset.dto';
import { OrgMemberRole, EventStatus, Prisma } from '@prisma/client';
import { checkOrgPermission, serializeResponse } from '../common/utils';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private prisma: PrismaService) {}

  async createForOrg(
    orgId: string,
    userId: string,
    createEventDto: CreateEventDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to create events for this organization',
    );

    const {
      title,
      shortDescription,
      descriptionMd,
      status,
      visibility,
      categoryId,
      startAt,
      endAt,
      doorTime,
      publishAt,
      ageRestriction,
      coverImageUrl,
      language,
      venueId,
      seatmapId,
    } = createEventDto;

    // Validate venue and seatmap belong to the organization
    if (venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: venueId },
      });

      if (!venue || venue.orgId !== orgId) {
        throw new BadRequestException('Invalid venue for this organization');
      }
    }

    if (seatmapId) {
      const seatmap = await this.prisma.seatmap.findUnique({
        where: { id: seatmapId },
        include: {
          venue: {
            select: {
              orgId: true,
            },
          },
        },
      });

      if (!seatmap || seatmap.venue.orgId !== orgId) {
        throw new BadRequestException('Invalid seatmap for this organization');
      }
    }

    // Create event for the organization
    const event = await this.prisma.event.create({
      data: {
        orgId,
        title,
        shortDescription,
        descriptionMd,
        status,
        visibility,
        categoryId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        doorTime: doorTime ? new Date(doorTime) : undefined,
        publishAt: publishAt ? new Date(publishAt) : undefined,
        ageRestriction,
        coverImageUrl,
        language,
        venueId,
        seatmapId,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: true,
        seatmap: true,
        category: true,
      },
    });

    return serializeResponse(event);
  }

  private async getManagedEvent(
    eventId: string,
    userId: string,
    allowedRoles: OrgMemberRole[] = [
      OrgMemberRole.owner,
      OrgMemberRole.manager,
    ],
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
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
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const membership = event.org.members[0];
    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage this event',
      );
    }

    return event;
  }

  private async transitionEventStatus(
    eventId: string,
    userId: string,
    nextStatus: EventStatus,
    allowedFrom?: EventStatus[],
  ) {
    const event = await this.getManagedEvent(eventId, userId);

    if (allowedFrom && !allowedFrom.includes(event.status)) {
      throw new BadRequestException(
        `Cannot change event status from ${event.status} to ${nextStatus}`,
      );
    }

    const data: Prisma.EventUpdateInput = {
      status: nextStatus,
    };

    if (
      nextStatus === EventStatus.live &&
      (!event.publishAt || event.publishAt > new Date())
    ) {
      data.publishAt = new Date();
    }

    if (nextStatus === EventStatus.draft) {
      data.publishAt = null;
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return serializeResponse(updated);
  }

  async publish(eventId: string, userId: string) {
    return this.transitionEventStatus(eventId, userId, EventStatus.live, [
      EventStatus.draft,
      EventStatus.pending,
      EventStatus.approved,
      EventStatus.paused,
    ]);
  }

  async pause(eventId: string, userId: string) {
    return this.transitionEventStatus(eventId, userId, EventStatus.paused, [
      EventStatus.live,
    ]);
  }

  async cancel(eventId: string, userId: string) {
    return this.transitionEventStatus(eventId, userId, EventStatus.canceled, [
      EventStatus.live,
      EventStatus.pending,
      EventStatus.approved,
    ]);
  }

  async findAll(
    userId: string,
    filters?: {
      status?: EventStatus;
      categoryId?: string;
      orgId?: string;
      upcoming?: boolean;
      search?: string;
    },
  ) {
    // Get events from organizations where user is a member
    const whereClause: any = {
      deletedAt: null,
      org: {
        members: {
          some: {
            userId,
          },
        },
      },
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.upcoming) {
      whereClause.startAt = {
        gte: new Date(),
      };
    }

    if (filters?.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { descriptionMd: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: true,
        category: true,
        _count: {
          select: {
            ticketTypes: true,
            orders: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return events;
  }

  async findPublic(
    filters?: {
      status?: EventStatus;
      categoryId?: string;
      upcoming?: boolean;
      search?: string;
      following?: boolean;
    },
    userId?: string,
  ) {
    const whereClause: any = {
      visibility: 'public',
      status: 'live',
      deletedAt: null,
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters?.upcoming) {
      whereClause.startAt = {
        gte: new Date(),
      };
    }

    if (filters?.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { descriptionMd: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filter by followed organizations
    if (filters?.following && userId) {
      const followedOrgs = await this.prisma.userFollow.findMany({
        where: { userId },
        select: { organizationId: true },
      });

      const orgIds = followedOrgs.map((f) => f.organizationId);

      if (orgIds.length > 0) {
        whereClause.orgId = { in: orgIds };
      } else {
        // User is not following any organizations, return empty array
        return [];
      }
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      include: {
        org: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true,
            latitude: true,
            longitude: true,
          },
        },
        category: true,
        assets: {
          select: {
            id: true,
            url: true,
            kind: true,
            altText: true,
          },
          where: {
            kind: { in: ['image', 'video'] },
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 3,
        },
        ticketTypes: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            feeCents: true,
            currency: true,
            kind: true,
            capacity: true,
            status: true,
            salesStart: true,
            salesEnd: true,
          },
          where: {
            status: 'active',
            deletedAt: null,
          },
          orderBy: {
            priceCents: 'asc',
          },
        },
        policies: true,
        promoCodes: {
          select: {
            id: true,
            code: true,
            kind: true,
            percentOff: true,
            amountOffCents: true,
            currency: true,
            startsAt: true,
            endsAt: true,
          },
          where: {
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
          take: 1,
        },
        seatmap: {
          select: {
            id: true,
            name: true,
          },
        },
        eventSeatmaps: {
          select: {
            id: true,
            seatmapId: true,
          },
        },
        _count: {
          select: {
            ticketTypes: true,
            orders: true,
            tickets: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
      take: 50, // Limit for public API
    });

    return serializeResponse(events);
  }

  async findOne(id: string, userId?: string) {
    const includeClause: any = {
      org: {
        select: {
          id: true,
          name: true,
        },
      },
      venue: true,
      seatmap: true,
      category: true,
      occurrences: {
        orderBy: {
          startsAt: 'asc',
        },
      },
      assets: true,
      policies: true,
      ticketTypes: {
        where: {
          status: 'active',
        },
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          _count: {
            select: {
              holds: true,
              tickets: true,
            },
          },
        },
      },
      _count: {
        select: {
          ticketTypes: true,
          orders: true,
        },
      },
    };

    let event;

    try {
      if (userId) {
        event = await this.prisma.event.findFirst({
          where: { id, deletedAt: null },
          include: {
            ...includeClause,
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
        });

        if (!event) {
          throw new NotFoundException('Event not found');
        }

        if (event.visibility !== 'public' && event.org.members.length === 0) {
          throw new ForbiddenException(
            'You do not have permission to view this event',
          );
        }
      } else {
        event = await this.prisma.event.findFirst({
          where: { id, deletedAt: null },
          include: includeClause,
        });

        if (!event) {
          throw new NotFoundException('Event not found');
        }

        if (event.visibility !== 'public' || event.status !== 'live') {
          throw new ForbiddenException('This event is not publicly available');
        }
      }

      const fees = await this.getApplicableFees(event.orgId);
      
      return serializeResponse({ ...event, fees });
    } catch (error) {
      this.logger.error('findOne error', error);
      throw error;
    }
  }

  async update(id: string, userId: string, updateEventDto: UpdateEventDto) {
    // Check if user is a member of the organization that owns the event with appropriate permissions
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        org: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      undefined,
      'You do not have permission to update this event',
    );

    // Prevent changing seatmap if tickets have been sold
    if (
      updateEventDto.seatmapId &&
      updateEventDto.seatmapId !== event.seatmapId
    ) {
      const ticketsCount = await this.prisma.ticket.count({
        where: {
          eventId: id,
        },
      });

      if (ticketsCount > 0) {
        throw new ForbiddenException(
          'Cannot change seatmap after tickets have been sold',
        );
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startAt: updateEventDto.startAt
          ? new Date(updateEventDto.startAt)
          : undefined,
        endAt: updateEventDto.endAt
          ? new Date(updateEventDto.endAt)
          : undefined,
        doorTime: updateEventDto.doorTime
          ? new Date(updateEventDto.doorTime)
          : undefined,
        publishAt: updateEventDto.publishAt
          ? new Date(updateEventDto.publishAt)
          : undefined,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: true,
        seatmap: true,
        category: true,
      },
    });

    return updatedEvent;
  }

  async assignSeatmap(eventId: string, userId: string, seatmapId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { org: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      [OrgMemberRole.owner, OrgMemberRole.manager],
      'You do not have permission to update this event seatmap',
    );

    const seatmap = await this.prisma.seatmap.findUnique({
      where: { id: seatmapId },
      include: {
        venue: {
          select: {
            orgId: true,
          },
        },
        seats: {
          select: {
            id: true,
            section: true,
            row: true,
            number: true,
            pos: true,
          },
        },
      },
    });

    if (!seatmap || seatmap.venue.orgId !== event.orgId) {
      throw new BadRequestException('Invalid seatmap for this organization');
    }

    if (event.seatmapId && event.seatmapId !== seatmapId) {
      const ticketsCount = await this.prisma.ticket.count({
        where: { eventId },
      });

      if (ticketsCount > 0) {
        throw new ForbiddenException(
          'Cannot change seatmap after tickets have been sold',
        );
      }
    }

    const snapshot = {
      spec: seatmap.spec,
      seats: seatmap.seats,
    };

    await this.prisma.eventSeatmap.upsert({
      where: { eventId },
      update: {
        seatmapId,
        snapshot,
      },
      create: {
        eventId,
        seatmapId,
        snapshot,
      },
    });

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        seatmapId,
      },
    });

    return serializeResponse(updatedEvent);
  }

  async clearSeatmap(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { org: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      [OrgMemberRole.owner, OrgMemberRole.manager],
      'You do not have permission to update this event seatmap',
    );

    if (event.seatmapId) {
      const ticketsCount = await this.prisma.ticket.count({
        where: { eventId },
      });

      if (ticketsCount > 0) {
        throw new ForbiddenException(
          'Cannot remove seatmap after tickets have been sold',
        );
      }
    }

    await this.prisma.eventSeatmap.deleteMany({
      where: { eventId },
    });

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        seatmapId: null,
      },
    });

    return serializeResponse(updatedEvent);
  }

  async remove(id: string, userId: string) {
    // Check if user is a member of the organization that owns the event with appropriate permissions
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        org: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      undefined,
      'You do not have permission to delete this event',
    );

    // Check if event has any tickets sold
    const ticketsCount = await this.prisma.ticket.count({
      where: {
        eventId: id,
      },
    });

    if (ticketsCount > 0) {
      throw new ForbiddenException('Cannot delete event with sold tickets');
    }

    await this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Event archived successfully' };
  }

  async updatePolicies(
    id: string,
    userId: string,
    policiesDto: UpdateEventPoliciesDto,
  ) {
    // Check if user is a member of the organization that owns the event with appropriate permissions
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        org: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      undefined,
      'You do not have permission to update this event',
    );

    const updatedPolicies = await this.prisma.eventPolicies.upsert({
      where: { eventId: id },
      update: policiesDto,
      create: {
        eventId: id,
        ...policiesDto,
      },
    });

    return updatedPolicies;
  }

  async addOccurrence(
    id: string,
    userId: string,
    occurrenceDto: CreateEventOccurrenceDto,
  ) {
    // Check if user is a member of the organization that owns the event with appropriate permissions
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        org: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      undefined,
      'You do not have permission to add occurrences to this event',
    );

    const { startsAt, endsAt, gateOpenAt } = occurrenceDto;

    const occurrence = await this.prisma.eventOccurrence.create({
      data: {
        eventId: id,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        gateOpenAt: gateOpenAt ? new Date(gateOpenAt) : undefined,
      },
    });

    return occurrence;
  }

  async getOccurrences(id: string, userId?: string) {
    // Check if user is a member of the organization that owns the event or if event is public
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        visibility: true,
        org: {
          select: {
            members: {
              where: userId ? { userId } : { userId: 'non-existent' },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      event.visibility !== 'public' &&
      (!userId || event.org.members.length === 0)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view occurrences for this event',
      );
    }

    const occurrences = await this.prisma.eventOccurrence.findMany({
      where: {
        eventId: id,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    return occurrences;
  }

  async addAsset(
    eventId: string,
    userId: string,
    createAssetDto: CreateEventAssetDto,
  ) {
    // Check if user is a member of the organization that owns the event
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        org: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      undefined,
      'You do not have permission to add assets to this event',
    );

    const { kind, url, altText } = createAssetDto;

    const asset = await this.prisma.eventAsset.create({
      data: {
        eventId,
        kind,
        url,
        altText,
      },
    });

    return asset;
  }

  async getAssets(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const assets = await this.prisma.eventAsset.findMany({
      where: { eventId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assets;
  }

  async deleteAsset(eventId: string, assetId: string, userId: string) {
    // Check if user is a member of the organization that owns the event
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        org: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await checkOrgPermission(
      this.prisma,
      event.orgId,
      userId,
      undefined,
      'You do not have permission to delete assets from this event',
    );

    const asset = await this.prisma.eventAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.eventId !== eventId) {
      throw new NotFoundException('Asset not found');
    }

    await this.prisma.eventAsset.delete({
      where: { id: assetId },
    });

    return { message: 'Asset deleted successfully' };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find events near a specific location
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radius: number = 50,
    page: number = 1,
    limit: number = 20,
  ) {
    // Get all public live events with coordinates
    const events = await this.prisma.event.findMany({
      where: {
        visibility: 'public',
        status: 'live',
        OR: [
          {
            // Events with their own coordinates
            AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
          },
          {
            // Events with venue coordinates
            venue: {
              AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
            },
          },
        ],
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        category: true,
        _count: {
          select: {
            ticketTypes: true,
            orders: true,
          },
        },
      },
    });

    // Calculate distances and filter by radius
    const eventsWithDistance = events
      .map((event) => {
        // Use event coordinates if available, otherwise use venue coordinates
        const eventLat = event.latitude
          ? Number(event.latitude)
          : event.venue?.latitude
            ? Number(event.venue.latitude)
            : null;
        const eventLon = event.longitude
          ? Number(event.longitude)
          : event.venue?.longitude
            ? Number(event.venue.longitude)
            : null;

        if (eventLat === null || eventLon === null) {
          return null;
        }

        const distance = this.calculateDistance(
          latitude,
          longitude,
          eventLat,
          eventLon,
        );

        return {
          ...event,
          distance,
          coordinates: {
            latitude: eventLat,
            longitude: eventLon,
          },
        };
      })
      .filter(
        (event): event is NonNullable<typeof event> & { distance: number } =>
          event !== null && event.distance <= radius,
      )
      .sort((a, b) => a.distance - b.distance);

    // Pagination
    const total = eventsWithDistance.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedEvents = eventsWithDistance.slice(skip, skip + limit);

    return {
      data: paginatedEvents,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getApplicableFees(orgId: string) {
    // 1. Fetch active FeeSchedules (platform and processing)
    const feeSchedules = await this.prisma.feeSchedule.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch active OrgFeeOverride for this org
    const now = new Date();
    const overrides = await this.prisma.orgFeeOverride.findMany({
      where: {
        orgId,
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        startsAt: { lte: now },
      },
      include: { feeSchedule: true },
    });

    // 3. Determine applicable schedules
    let platformSchedule = feeSchedules.find((fs) => fs.kind === 'platform');
    let processingSchedule = feeSchedules.find(
      (fs) => fs.kind === 'processing',
    );

    // Apply overrides
    for (const override of overrides) {
      if (override.feeSchedule.kind === 'platform') {
        platformSchedule = override.feeSchedule;
      } else if (override.feeSchedule.kind === 'processing') {
        processingSchedule = override.feeSchedule;
      }
    }

    return {
      platform: platformSchedule
        ? {
            percent: Number(platformSchedule.percent),
            fixedCents: Number(platformSchedule.fixedCents),
          }
        : null,
      processing: processingSchedule
        ? {
            percent: Number(processingSchedule.percent),
            fixedCents: Number(processingSchedule.fixedCents),
          }
        : null,
    };
  }
}
