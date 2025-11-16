import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventQueryDto } from '../dto/query-params.dto';
import { UpdateEventStatusDto } from '../dto/update-event-status.dto';
import { Prisma, EventStatus } from '@prisma/client';
import { QueuesService, QueueName } from '../../queues/queues.service';

@Injectable()
export class AdminEventService {
  private readonly logger = new Logger(AdminEventService.name);

  constructor(
    private prisma: PrismaService,
    private queuesService: QueuesService,
  ) {}

  // Compatibility wrappers for controller expectations
  async findAll(query: EventQueryDto) {
    return this.getEvents(query);
  }

  async findOne(eventId: string) {
    return this.getEvent(eventId);
  }

  async updateStatus(eventId: string, data: UpdateEventStatusDto, actorId?: string) {
    return this.updateEventStatus(eventId, data, actorId);
  }

  async getEvents(query: EventQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      categoryId,
      organizerId,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { descriptionMd: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as EventStatus;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (organizerId) {
      where.orgId = organizerId;
    }

    const orderBy: Prisma.EventOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'title',
        'status',
        'visibility',
        'startAt',
        'endAt',
        'createdAt',
        'updatedAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          descriptionMd: true,
          status: true,
          visibility: true,
          startAt: true,
          endAt: true,
          categoryId: true,
          orgId: true,
          venueId: true,
          createdAt: true,
          updatedAt: true,
          org: {
            select: {
              name: true,
            },
          },
          venue: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              tickets: true,
              orders: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    const data = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.descriptionMd,
      status: event.status,
      visibility: event.visibility,
      startAt: event.startAt,
      endAt: event.endAt,
      categoryId: event.categoryId,
      organizerId: event.orgId,
      organizerName: event.org.name,
      venueId: event.venueId,
      venueName: event.venue?.name,
      ticketCount: event._count.tickets,
      orderCount: event._count.orders,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
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

  async getEvent(eventId: string) {
    type EventAdminPayload = Prisma.EventGetPayload<{
      include: {
        org: { select: { id: true; name: true } };
        venue: { select: { id: true; name: true } };
        ticketTypes: true;
        occurrences: true;
        assets: true;
        promoCodes: true;
        policies: true;
        _count: { select: { tickets: true; orders: true } };
      };
    }>;

    const event = (await this.prisma.event.findUnique({
      where: { id: eventId },
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
          },
        },
        ticketTypes: true,
        occurrences: true,
        assets: true,
        promoCodes: true,
        policies: true,
        _count: {
          select: {
            tickets: true,
            orders: true,
          },
        },
      },
    })) as EventAdminPayload | null;

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      id: event.id,
      title: event.title,
      description: event.descriptionMd,
      status: event.status,
      visibility: event.visibility,
      startAt: event.startAt,
      endAt: event.endAt,
      categoryId: event.categoryId,
      organizerId: event.orgId,
      organizerName: event.org?.name ?? null,
      venueId: event.venueId,
      venueName: event.venue?.name ?? null,
      ticketCount: event._count?.tickets ?? 0,
      orderCount: event._count?.orders ?? 0,
      ticketTypes: event.ticketTypes ?? [],
      occurrences: event.occurrences ?? [],
      assets: event.assets ?? [],
      promoCodes: event.promoCodes ?? [],
      policies: event.policies ?? null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  async updateEventStatus(
    eventId: string,
    data: UpdateEventStatusDto,
    actorId?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        orgId: true,
        org: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.org?.status === 'suspended') {
      throw new BadRequestException(
        'Cannot update event status: organization is suspended',
      );
    }

    const currentStatus = event.status;
    const newStatus = data.status;

    const allowedTransitions: Record<EventStatus, EventStatus[]> = {
      [EventStatus.draft]: [EventStatus.pending, EventStatus.canceled],
      [EventStatus.pending]: [
        EventStatus.approved,
        EventStatus.draft,
        EventStatus.canceled,
      ],
      [EventStatus.approved]: [
        EventStatus.live,
        EventStatus.paused,
        EventStatus.canceled,
      ],
      [EventStatus.live]: [
        EventStatus.paused,
        EventStatus.ended,
        EventStatus.canceled,
      ],
      [EventStatus.paused]: [EventStatus.live, EventStatus.canceled],
      [EventStatus.ended]: [],
      [EventStatus.canceled]: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from "${currentStatus}" to "${newStatus}"`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { id: eventId },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId || null,
          action: 'update_event_status',
          targetKind: 'Event',
          targetId: eventId,
          meta: {
            from: currentStatus,
            to: newStatus,
            orgId: event.orgId,
          },
        },
      });

      return updated;
    });

    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: event.orgId },
        include: { owner: { select: { id: true, email: true, name: true } } },
      });

      if (org?.owner?.id) {
        await this.queuesService.addJob(
          QueueName.NOTIFICATION,
          'event-status-change',
          {
            userId: org.owner.id,
            title: `Event status changed: ${newStatus}`,
            body: `Event ${eventId} status changed from ${currentStatus} to ${newStatus}`,
            channels: ['in_app', 'email'],
            emailData: {
              template: 'event_status_change',
              context: {
                eventId,
                from: currentStatus,
                to: newStatus,
                ownerName: org.owner.name,
              },
            },
          },
          { attempts: 3 },
        );
      }
    } catch (enqueueError) {
      const errMsg =
        enqueueError instanceof Error
          ? enqueueError.stack || enqueueError.message
          : String(enqueueError);
      this.logger.error(`Failed to enqueue notification job: ${errMsg}`);
    }

    return { message: 'Event status updated successfully', event: result };
  }
}
