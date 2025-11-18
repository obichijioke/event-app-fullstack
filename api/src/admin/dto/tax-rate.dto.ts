import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  Min as MinValue,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxRateQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by name or postal code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by country code (e.g., US, NG)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by region/state' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class CreateTaxRateDto {
  @ApiProperty({ description: 'Country code (e.g., US, NG, GB)' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Region/State (e.g., CA, Lagos)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  @IsOptional()
  @IsString()
  postal?: string;

  @ApiProperty({
    description: 'Tax rate as decimal (e.g., 0.0725 for 7.25%)',
    minimum: 0,
    maximum: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @MinValue(0)
  @Max(1)
  rate: number;

  @ApiProperty({ description: 'Tax rate name (e.g., Sales Tax, VAT, GST)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTaxRateDto {
  @ApiPropertyOptional({ description: 'Country code (e.g., US, NG, GB)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Region/State (e.g., CA, Lagos)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  @IsOptional()
  @IsString()
  postal?: string;

  @ApiPropertyOptional({
    description: 'Tax rate as decimal (e.g., 0.0725 for 7.25%)',
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @MinValue(0)
  @Max(1)
  rate?: number;

  @ApiPropertyOptional({
    description: 'Tax rate name (e.g., Sales Tax, VAT, GST)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
