import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DisputeStatus {
  needs_response = 'needs_response',
  under_review = 'under_review',
  won = 'won',
  lost = 'lost',
  warning = 'warning',
  charge_refunded = 'charge_refunded',
}

export class DisputeQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by order ID, case ID, or user' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by dispute status',
    enum: DisputeStatus,
  })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ description: 'Filter by payment provider' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    default: 'openedAt',
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

export class UpdateDisputeStatusDto {
  @ApiProperty({
    description: 'New dispute status',
    enum: DisputeStatus,
  })
  @IsNotEmpty()
  @IsEnum(DisputeStatus)
  status: DisputeStatus;

  @ApiPropertyOptional({ description: 'Admin note for status change' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class RespondToDisputeDto {
  @ApiProperty({ description: 'Response message to payment provider' })
  @IsNotEmpty()
  @IsString()
  response: string;

  @ApiPropertyOptional({
    description: 'Evidence document URLs (comma-separated)',
  })
  @IsOptional()
  @IsString()
  evidenceUrls?: string;
}

export class CloseDisputeDto {
  @ApiProperty({
    description: 'Final status',
    enum: [
      DisputeStatus.won,
      DisputeStatus.lost,
      DisputeStatus.charge_refunded,
    ],
  })
  @IsNotEmpty()
  @IsEnum([
    DisputeStatus.won,
    DisputeStatus.lost,
    DisputeStatus.charge_refunded,
  ])
  status:
    | DisputeStatus.won
    | DisputeStatus.lost
    | DisputeStatus.charge_refunded;

  @ApiPropertyOptional({ description: 'Closing note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Closed date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  closedAt?: string;
}
