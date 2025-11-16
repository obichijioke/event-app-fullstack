import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min as MinValue,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FeeKind {
  platform = 'platform',
  processing = 'processing',
}

export class FeeScheduleQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by fee kind',
    enum: FeeKind,
  })
  @IsOptional()
  @IsEnum(FeeKind)
  kind?: FeeKind;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Filter by currency' })
  @IsOptional()
  @IsString()
  currency?: string;

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

export class CreateFeeScheduleDto {
  @ApiProperty({
    description: 'Fee kind',
    enum: FeeKind,
  })
  @IsNotEmpty()
  @IsEnum(FeeKind)
  kind: FeeKind;

  @ApiProperty({ description: 'Fee schedule name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Percentage fee (e.g., 2.5 for 2.5%)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @MinValue(0)
  percent: number;

  @ApiProperty({ description: 'Fixed fee in cents' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @MinValue(0)
  fixedCents: number;

  @ApiPropertyOptional({ description: 'Currency code (e.g., USD, NGN)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateFeeScheduleDto {
  @ApiPropertyOptional({ description: 'Fee schedule name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Percentage fee (e.g., 2.5 for 2.5%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @MinValue(0)
  percent?: number;

  @ApiPropertyOptional({ description: 'Fixed fee in cents' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @MinValue(0)
  fixedCents?: number;

  @ApiPropertyOptional({ description: 'Currency code (e.g., USD, NGN)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateOrgFeeOverrideDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  orgId: string;

  @ApiProperty({ description: 'Fee schedule ID' })
  @IsNotEmpty()
  @IsString()
  feeScheduleId: string;

  @ApiPropertyOptional({ description: 'Override start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Override end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class UpdateOrgFeeOverrideDto {
  @ApiPropertyOptional({ description: 'Fee schedule ID' })
  @IsOptional()
  @IsString()
  feeScheduleId?: string;

  @ApiPropertyOptional({ description: 'Override start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Override end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
