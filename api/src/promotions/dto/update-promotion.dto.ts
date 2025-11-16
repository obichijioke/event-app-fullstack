import { PartialType } from '@nestjs/mapped-types';
import { CreatePromotionDto } from './create-promotion.dto';

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}

export class UpdatePromoCodeDto extends PartialType(
  class {
    code?: string;
    promotionId?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    startsAt?: string;
    endsAt?: string;
  },
) {}
