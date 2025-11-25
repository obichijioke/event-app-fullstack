import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, userId: string, dto: CreateFaqDto) {
    await this.verifyEventAccess(eventId, userId);

    // Get the highest sort order and add 1
    const highestOrder = await this.prisma.eventFAQ.findFirst({
      where: { eventId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.eventFAQ.create({
      data: {
        eventId,
        question: dto.question,
        answer: dto.answer,
        sortOrder: dto.sortOrder ?? (highestOrder?.sortOrder ?? 0) + 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findByEvent(eventId: string, includeInactive = false) {
    const where: any = { eventId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.eventFAQ.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(eventId: string, faqId: string, userId: string, dto: UpdateFaqDto) {
    await this.verifyEventAccess(eventId, userId);

    const faq = await this.prisma.eventFAQ.findFirst({
      where: { id: faqId, eventId },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return this.prisma.eventFAQ.update({
      where: { id: faqId },
      data: dto,
    });
  }

  async remove(eventId: string, faqId: string, userId: string) {
    await this.verifyEventAccess(eventId, userId);

    const faq = await this.prisma.eventFAQ.findFirst({
      where: { id: faqId, eventId },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return this.prisma.eventFAQ.delete({
      where: { id: faqId },
    });
  }

  // Track view
  async trackView(faqId: string): Promise<void> {
    await this.prisma.eventFAQ.update({
      where: { id: faqId },
      data: { viewCount: { increment: 1} },
    });
  }

  // Mark helpful
  async markHelpful(faqId: string): Promise<void> {
    await this.prisma.eventFAQ.update({
      where: { id: faqId },
      data: { helpfulCount: { increment: 1 } },
    });
  }

  // Reorder FAQs
  async reorderFAQs(eventId: string, userId: string, faqIds: string[]): Promise<void> {
    await this.verifyEventAccess(eventId, userId);

    // Update sort order for each FAQ in a transaction
    await this.prisma.$transaction(
      faqIds.map((faqId, index) =>
        this.prisma.eventFAQ.update({
          where: { id: faqId },
          data: { sortOrder: index + 1 },
        }),
      ),
    );
  }

  // Search FAQs
  async search(eventId: string, query: string) {
    return this.prisma.eventFAQ.findMany({
      where: {
        eventId,
        isActive: true,
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        org: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.org.members.length === 0) {
      throw new ForbiddenException('You do not have permission to manage this event');
    }
  }
}
