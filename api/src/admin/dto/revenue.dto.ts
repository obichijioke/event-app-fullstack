import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum RevenuePeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class RevenueQueryDto {
  @ApiPropertyOptional({ description: 'Time period', enum: RevenuePeriod })
  @IsOptional()
  @IsEnum(RevenuePeriod)
  period?: RevenuePeriod = RevenuePeriod.MONTH;

  @ApiPropertyOptional({ description: 'Start date for custom period (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for custom period (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by organization ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Group by field', enum: ['day', 'week', 'month'] })
  @IsOptional()
  @IsString()
  groupBy?: string;
}
