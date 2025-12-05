import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DisputeCategory, DisputeResolution } from '@prisma/client';

export class RespondToPlatformDisputeDto {
  @ApiProperty({
    description: 'Organizer response to the dispute (50-2000 characters)',
  })
  @IsString()
  @MinLength(50, {
    message: 'Response must be at least 50 characters',
  })
  @MaxLength(2000, {
    message: 'Response cannot exceed 2000 characters',
  })
  responseNote: string;

  @ApiProperty({
    description: 'Proposed resolution (optional)',
    enum: DisputeResolution,
    required: false,
  })
  @IsEnum(DisputeResolution)
  @IsOptional()
  proposedResolution?: DisputeResolution;

  @ApiProperty({
    description: 'Proposed refund amount in cents (for partial refund)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  proposedRefundCents?: number;
}

export class ProposeResolutionDto {
  @ApiProperty({
    description: 'Proposed resolution',
    enum: DisputeResolution,
  })
  @IsEnum(DisputeResolution)
  resolution: DisputeResolution;

  @ApiProperty({
    description: 'Proposed refund amount in cents (for partial_refund)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  refundAmountCents?: number;

  @ApiProperty({
    description: 'Explanation of the proposal (50-1000 characters)',
  })
  @IsString()
  @MinLength(50)
  @MaxLength(1000)
  proposalNote: string;
}

export class PlatformDisputeQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    enum: DisputeCategory,
    required: false,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsEnum(DisputeCategory)
  category?: DisputeCategory;

  @ApiProperty({
    required: false,
    description: 'Search by order ID, buyer email, or dispute ID',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by urgent (respond_by deadline < 48 hours)',
  })
  @IsOptional()
  urgentOnly?: boolean;
}
