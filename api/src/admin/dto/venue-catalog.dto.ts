import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class VenueCatalogAddressDto {
  @ApiProperty()
  @IsString()
  line1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  region: string;

  @ApiProperty()
  @IsString()
  postal: string;

  @ApiProperty()
  @IsString()
  country: string;
}

export class CreateVenueCatalogDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cover image URL for catalog entry',
    example: 'https://images.example.com/venues/lagos-arena.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ type: VenueCatalogAddressDto })
  @ValidateNested()
  @Type(() => VenueCatalogAddressDto)
  address: VenueCatalogAddressDto;

  @ApiProperty()
  @IsString()
  timezone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacityMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacityMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Default seatmap spec stored as JSON (object or array)',
  })
  @IsOptional()
  defaultSeatmapSpec?: any;
}

export class UpdateVenueCatalogDto extends PartialType(CreateVenueCatalogDto) {}

export class VenueCatalogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma separated or repeated query param)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => item.split(','))
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return undefined;
  })
  tags?: string[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
  })
  includeDeleted = false;
}

export enum VenueCatalogImportStrategy {
  UPSERT = 'upsert',
  SKIP = 'skip',
}

export class VenueCatalogImportOptionsDto {
  @ApiPropertyOptional({
    enum: VenueCatalogImportStrategy,
    default: VenueCatalogImportStrategy.UPSERT,
  })
  @IsOptional()
  @IsEnum(VenueCatalogImportStrategy)
  strategy: VenueCatalogImportStrategy = VenueCatalogImportStrategy.UPSERT;

  @ApiPropertyOptional({
    description: 'When true, validates without persisting changes',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
  })
  dryRun = false;
}
