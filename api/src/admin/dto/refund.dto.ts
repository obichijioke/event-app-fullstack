import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundStatus } from '@prisma/client';

export class RefundQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by order ID or user email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by refund status',
    enum: RefundStatus,
  })
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

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

export class CreateRefundDto {
  @ApiProperty({ description: 'Order ID to refund' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Refund amount in cents' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amountCents: number;

  @ApiProperty({ description: 'Currency code (e.g., USD, NGN)' })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'User ID who created the refund (defaults to current admin)',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateRefundStatusDto {
  @ApiProperty({
    description: 'New refund status',
    enum: RefundStatus,
  })
  @IsNotEmpty()
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveRefundDto {
  @ApiPropertyOptional({ description: 'Approval note' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectRefundDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ProcessRefundDto {
  @ApiPropertyOptional({
    description: 'Force processing even if already processed',
    default: false,
  })
  @IsOptional()
  force?: boolean;
}
