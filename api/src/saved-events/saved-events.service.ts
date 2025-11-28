import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SavedEventsService {
  constructor(private prisma: PrismaService) {}

  async toggleSave(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedEvent.delete({
        where: { id: existing.id },
      });
      return { saved: false };
    } else {
      await this.prisma.savedEvent.create({
        data: {
          userId,
          eventId,
        },
      });
      return { saved: true };
    }
  }

  async getSavedEvents(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.savedEvent.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              org: true,
              venue: true,
              category: true,
              assets: true,
              ticketTypes: {
                orderBy: { priceCents: 'asc' },
                take: 1,
              },
              promoCodes: {
                where: {
                  startsAt: { lte: new Date() },
                  endsAt: { gte: new Date() },
                },
                take: 1,
              },
              _count: {
                select: {
                  orders: true,
                  tickets: true,
                  ticketTypes: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.savedEvent.count({ where: { userId } }),
    ]);

    return {
      data: items.map((item) => item.event),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSavedEventIds(userId: string) {
    const saved = await this.prisma.savedEvent.findMany({
      where: { userId },
      select: { eventId: true },
    });
    return saved.map((s) => s.eventId);
  }
}
