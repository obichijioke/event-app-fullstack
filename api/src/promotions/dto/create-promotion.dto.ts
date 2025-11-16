import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
} from 'class-validator';

// Define the enums locally since they're not exported from Prisma client
enum PromoType {
  discount = 'discount',
  access = 'access',
}

enum DiscountType {
  percentage = 'percentage',
  fixed = 'fixed',
}

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PromoType)
  type: PromoType;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  discountValue: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @IsNumber()
  @IsOptional()
  maxUsesPerUser?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsArray()
  @IsOptional()
  eventIds?: string[];

  @IsArray()
  @IsOptional()
  ticketTypeIds?: string[];

  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @IsString()
  @IsOptional()
  createdBy?: string;
}

export class CreatePromoCodeDto {
  @IsString()
  code: string;

  @IsString()
  promotionId: string;

  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @IsNumber()
  @IsOptional()
  maxUsesPerUser?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;
}

export class ValidatePromoCodeDto {
  @IsString()
  code: string;

  @IsString()
  eventId: string;

  @IsArray()
  @IsOptional()
  ticketTypeIds?: string[];

  @IsNumber()
  @IsOptional()
  orderAmount?: number;
}
