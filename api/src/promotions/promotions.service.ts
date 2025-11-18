import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
import {
  CreatePromotionDto,
  CreatePromoCodeDto,
  ValidatePromoCodeDto,
} from './dto/create-promotion.dto';
import {
  UpdatePromotionDto,
  UpdatePromoCodeDto,
} from './dto/update-promotion.dto';
import { Promotion } from '@prisma/client';
import { checkOrgPermission } from '../common/utils';

@Injectable()
export class PromotionsService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
  ) {}

  // ============================================================================
  // PROMOTION METHODS (Campaign Management)
  // ============================================================================

  async createPromotion(
    orgId: string,
    userId: string,
    createPromotionDto: CreatePromotionDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to create promotions for this organization',
    );

    const {
      name,
      description,
      type,
      discountType,
      discountValue,
      currency,
      maxUses,
      maxUsesPerUser,
      startsAt,
      endsAt,
      eventIds,
      ticketTypeIds,
      minOrderAmount,
    } = createPromotionDto;

    if (!startsAt || !endsAt) {
      throw new BadRequestException(
        'Promotion must include start and end dates',
      );
    }

    // Get default currency if not provided
    const finalCurrency =
      currency || (await this.currencyService.getDefaultCurrency());

    // Create promotion in the new promotions table
    const promotion = await this.prisma.promotion.create({
      data: {
        orgId,
        name,
        description,
        type,
        discountType,
        discountValue,
        currency: finalCurrency,
        maxUses: maxUses || 0,
        maxUsesPerUser,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        eventIds: eventIds || [],
        ticketTypeIds: ticketTypeIds || [],
        minOrderAmount,
      },
      include: {
        promoCodes: true,
      },
    });

    return promotion;
  }

  async findAllPromotions(orgId: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const promotions = await this.prisma.promotion.findMany({
      where: {
        orgId,
      },
      include: {
        promoCodes: {
          include: {
            _count: {
              select: {
                redemptions: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return promotions;
  }

  async findOnePromotion(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        promoCodes: {
          include: {
            _count: {
              select: {
                redemptions: true,
              },
            },
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to view this promotion',
      );
    }

    return promotion;
  }

  async updatePromotion(
    id: string,
    orgId: string,
    userId: string,
    updatePromotionDto: UpdatePromotionDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to update promotions for this organization',
    );

    // Check if promotion exists and belongs to the organization
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to update this promotion',
      );
    }

    // Update promotion
    const updatedPromotion = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(updatePromotionDto.name && { name: updatePromotionDto.name }),
        ...(updatePromotionDto.description !== undefined && {
          description: updatePromotionDto.description,
        }),
        ...(updatePromotionDto.discountType && {
          discountType: updatePromotionDto.discountType,
        }),
        ...(updatePromotionDto.discountValue !== undefined && {
          discountValue: updatePromotionDto.discountValue,
        }),
        ...(updatePromotionDto.maxUses !== undefined && {
          maxUses: updatePromotionDto.maxUses,
        }),
        ...(updatePromotionDto.maxUsesPerUser !== undefined && {
          maxUsesPerUser: updatePromotionDto.maxUsesPerUser,
        }),
        ...(updatePromotionDto.startsAt && {
          startsAt: new Date(updatePromotionDto.startsAt),
        }),
        ...(updatePromotionDto.endsAt && {
          endsAt: new Date(updatePromotionDto.endsAt),
        }),
        ...(updatePromotionDto.eventIds && {
          eventIds: updatePromotionDto.eventIds,
        }),
        ...(updatePromotionDto.ticketTypeIds && {
          ticketTypeIds: updatePromotionDto.ticketTypeIds,
        }),
        ...(updatePromotionDto.minOrderAmount !== undefined && {
          minOrderAmount: updatePromotionDto.minOrderAmount,
        }),
      },
      include: {
        promoCodes: true,
      },
    });

    return updatedPromotion;
  }

  async removePromotion(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to delete promotions for this organization',
    );

    // Check if promotion exists and belongs to the organization
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to delete this promotion',
      );
    }

    // Delete promotion (cascade will handle related promo codes)
    await this.prisma.promotion.delete({
      where: { id },
    });

    return { message: 'Promotion deleted successfully' };
  }

  // ============================================================================
  // PROMO CODE METHODS
  // ============================================================================

  async createPromoCode(
    orgId: string,
    userId: string,
    createPromoCodeDto: CreatePromoCodeDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to create promo codes for this organization',
    );

    // Check if promo code already exists
    const existingPromoCode = await this.prisma.promoCode.findFirst({
      where: {
        code: createPromoCodeDto.code.toUpperCase(),
        orgId,
      },
    });

    if (existingPromoCode) {
      throw new BadRequestException('Promo code already exists');
    }

    const { code, promotionId, maxUses, maxUsesPerUser, startsAt, endsAt } =
      createPromoCodeDto;

    // If promotionId is provided, fetch the promotion to get discount details
    let promotion: Promotion | null = null;
    if (promotionId) {
      promotion = await this.prisma.promotion.findUnique({
        where: { id: promotionId },
      });

      if (!promotion) {
        throw new NotFoundException('Promotion not found');
      }

      if (promotion.orgId !== orgId) {
        throw new ForbiddenException(
          'Promotion does not belong to this organization',
        );
      }
    }

    // Get default currency if not provided
    const defaultCurrency = await this.currencyService.getDefaultCurrency();

    // Create promo code
    const promoCode = await this.prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        orgId,
        promotionId,
        kind: promotion?.type || 'discount',
        percentOff:
          promotion?.discountType === 'percentage' &&
          promotion.discountValue !== null &&
          promotion.discountValue !== undefined
            ? promotion.discountValue
            : null,
        amountOffCents:
          promotion?.discountType === 'fixed' &&
          promotion.discountValue !== null &&
          promotion.discountValue !== undefined
            ? BigInt(promotion.discountValue)
            : null,
        currency: promotion?.currency || defaultCurrency,
        maxRedemptions: maxUses,
        perUserLimit: maxUsesPerUser,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
      include: {
        promotion: true,
      },
    });

    return promoCode;
  }

  async findAllPromoCodes(orgId: string, userId: string, promotionId?: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const whereClause: any = {
      orgId,
    };

    if (promotionId) {
      whereClause.promotionId = promotionId;
    }

    const promoCodes = await this.prisma.promoCode.findMany({
      where: whereClause,
      include: {
        promotion: true,
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return promoCodes;
  }

  async updatePromoCode(
    id: string,
    orgId: string,
    userId: string,
    updatePromoCodeDto: UpdatePromoCodeDto,
  ) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to update promo codes for this organization',
    );

    // Check if promo code exists and belongs to the organization
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    if (promoCode.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to update this promo code',
      );
    }

    const { code, maxUses, maxUsesPerUser, startsAt, endsAt } =
      updatePromoCodeDto;

    // Update promo code
    const updatedPromoCode = await this.prisma.promoCode.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(maxUses !== undefined && { maxRedemptions: maxUses }),
        ...(maxUsesPerUser !== undefined && { perUserLimit: maxUsesPerUser }),
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(endsAt && { endsAt: new Date(endsAt) }),
      },
      include: {
        promotion: true,
      },
    });

    return updatedPromoCode;
  }

  async removePromoCode(id: string, orgId: string, userId: string) {
    // Check if user is a member of the organization with appropriate permissions
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to delete promo codes for this organization',
    );

    // Check if promo code exists and belongs to the organization
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    if (promoCode.orgId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to delete this promo code',
      );
    }

    // Delete promo code (cascade will handle related records)
    await this.prisma.promoCode.delete({
      where: { id },
    });

    return { message: 'Promo code deleted successfully' };
  }

  // ============================================================================
  // VALIDATION & REDEMPTION
  // ============================================================================

  async validatePromoCode(
    validatePromoCodeDto: ValidatePromoCodeDto,
    userId?: string,
  ) {
    const { code, eventId, ticketTypeIds, orderAmount } = validatePromoCodeDto;

    // Find promo code
    const promoCode = await this.prisma.promoCode.findFirst({
      where: { code: code.toUpperCase() },
      include: {
        promotion: true,
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!promoCode) {
      throw new NotFoundException('Invalid promo code');
    }

    // Check if promo code is active
    const now = new Date();
    if (promoCode.startsAt && promoCode.startsAt > now) {
      throw new BadRequestException('Promo code is not yet active');
    }

    if (promoCode.endsAt && promoCode.endsAt < now) {
      throw new BadRequestException('Promo code has expired');
    }

    // Check usage limits
    if (
      promoCode.maxRedemptions &&
      promoCode._count.redemptions >= promoCode.maxRedemptions
    ) {
      throw new BadRequestException(
        'Promo code has reached its maximum usage limit',
      );
    }

    if (userId && promoCode.perUserLimit) {
      const userUses = await this.prisma.promoRedemption.count({
        where: {
          promoId: promoCode.id,
          userId,
        },
      });

      if (userUses >= promoCode.perUserLimit) {
        throw new BadRequestException(
          'You have reached the maximum usage limit for this promo code',
        );
      }
    }

    // Check if promo code applies to this event
    if (promoCode.eventId && promoCode.eventId !== eventId) {
      throw new BadRequestException(
        'Promo code is not applicable to this event',
      );
    }

    // Calculate discount
    let discountAmount = BigInt(0);
    if (promoCode.percentOff) {
      discountAmount =
        (BigInt(orderAmount || 0) * BigInt(Number(promoCode.percentOff))) /
        BigInt(100);
    } else if (promoCode.amountOffCents) {
      discountAmount = promoCode.amountOffCents;
    }

    return {
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        kind: promoCode.kind,
        percentOff: promoCode.percentOff,
        amountOffCents: promoCode.amountOffCents,
      },
      discountAmount,
      isValid: true,
    };
  }

  async usePromoCode(promoCodeId: string, userId: string, orderId: string) {
    // Create promo redemption record
    await this.prisma.promoRedemption.create({
      data: {
        promoId: promoCodeId,
        userId,
        orderId,
        redeemedAt: new Date(),
      },
    });

    // Increment promotion redemption count if promo code has a promotion
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id: promoCodeId },
    });

    if (promoCode?.promotionId) {
      await this.prisma.promotion.update({
        where: { id: promoCode.promotionId },
        data: {
          redemptions: {
            increment: 1,
          },
        },
      });
    }

    return { message: 'Promo code used successfully' };
  }
}
