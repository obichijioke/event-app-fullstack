import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PromotionQueryDto, PromoCodeQueryDto } from '../dto/promotion.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminPromotionService {
  constructor(private prisma: PrismaService) {}

  async getPromotions(query: PromotionQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      orgId,
      type,
      active,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PromotionWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (orgId) {
      where.orgId = orgId;
    }

    if (type) {
      where.type = type;
    }

    if (active === 'true') {
      const now = new Date();
      where.startsAt = { lte: now };
      where.endsAt = { gte: now };
    } else if (active === 'false') {
      const now = new Date();
      where.OR = [
        { startsAt: { gt: now } },
        { endsAt: { lt: now } },
      ];
    }

    const orderBy: Prisma.PromotionOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'name', 'type', 'redemptions', 'startsAt', 'endsAt', 'createdAt'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orgId: true,
          name: true,
          description: true,
          type: true,
          discountType: true,
          discountValue: true,
          currency: true,
          maxUses: true,
          redemptions: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          org: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              promoCodes: true,
            },
          },
        },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    const now = new Date();
    const data = promotions.map((promotion) => ({
      id: promotion.id,
      orgId: promotion.orgId,
      orgName: promotion.org.name,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      currency: promotion.currency,
      maxUses: promotion.maxUses,
      redemptions: promotion.redemptions,
      promoCodesCount: promotion._count.promoCodes,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      createdAt: promotion.createdAt,
      isActive: promotion.startsAt <= now && promotion.endsAt >= now,
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

  async getPromotion(promotionId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            supportEmail: true,
          },
        },
        promoCodes: {
          select: {
            id: true,
            code: true,
            kind: true,
            startsAt: true,
            endsAt: true,
            _count: {
              select: {
                redemptions: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion;
  }

  async deactivatePromotion(promotionId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        endsAt: new Date(),
      },
    });

    return { message: 'Promotion deactivated successfully' };
  }

  async getPromoCodes(query: PromoCodeQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      orgId,
      eventId,
      promotionId,
      kind,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PromoCodeWhereInput = {};

    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    if (orgId) {
      where.orgId = orgId;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (promotionId) {
      where.promotionId = promotionId;
    }

    if (kind) {
      where.kind = kind;
    }

    const orderBy: Prisma.PromoCodeOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = ['id', 'code', 'kind', 'createdAt', 'startsAt', 'endsAt'] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [promoCodes, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          orgId: true,
          promotionId: true,
          eventId: true,
          code: true,
          kind: true,
          percentOff: true,
          amountOffCents: true,
          currency: true,
          maxRedemptions: true,
          perUserLimit: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          org: {
            select: {
              id: true,
              name: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          promotion: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
      }),
      this.prisma.promoCode.count({ where }),
    ]);

    const now = new Date();
    const data = promoCodes.map((promoCode) => ({
      id: promoCode.id,
      orgId: promoCode.orgId,
      orgName: promoCode.org.name,
      promotionId: promoCode.promotionId,
      promotionName: promoCode.promotion?.name,
      eventId: promoCode.eventId,
      eventTitle: promoCode.event?.title,
      code: promoCode.code,
      kind: promoCode.kind,
      percentOff: promoCode.percentOff ? Number(promoCode.percentOff) : null,
      amountOffCents: promoCode.amountOffCents ? Number(promoCode.amountOffCents) : null,
      currency: promoCode.currency,
      maxRedemptions: promoCode.maxRedemptions,
      redemptions: promoCode._count.redemptions,
      perUserLimit: promoCode.perUserLimit,
      startsAt: promoCode.startsAt,
      endsAt: promoCode.endsAt,
      createdAt: promoCode.createdAt,
      isActive:
        (!promoCode.startsAt || promoCode.startsAt <= now) &&
        (!promoCode.endsAt || promoCode.endsAt >= now) &&
        (!promoCode.maxRedemptions || promoCode._count.redemptions < promoCode.maxRedemptions),
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

  async getPromotionStats() {
    const [totalPromotions, totalPromoCodes, totalRedemptions, activePromotions] =
      await Promise.all([
        this.prisma.promotion.count(),
        this.prisma.promoCode.count(),
        this.prisma.promoRedemption.count(),
        this.prisma.promotion.count({
          where: {
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        }),
      ]);

    const topPromoCodes = await this.prisma.promoCode.findMany({
      select: {
        id: true,
        code: true,
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: {
        redemptions: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return {
      totalPromotions,
      activePromotions,
      totalPromoCodes,
      totalRedemptions,
      topPromoCodes: topPromoCodes.map((code) => ({
        id: code.id,
        code: code.code,
        redemptions: code._count.redemptions,
      })),
    };
  }
}
