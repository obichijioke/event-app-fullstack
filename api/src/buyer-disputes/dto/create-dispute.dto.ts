import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DisputeCategory } from '@prisma/client';

export class CreateDisputeDto {
  @ApiProperty({ description: 'Order ID to dispute' })
  @IsString()
  orderId: string;

  @ApiProperty({
    enum: DisputeCategory,
    description: 'Category of the dispute',
  })
  @IsEnum(DisputeCategory)
  category: DisputeCategory;

  @ApiProperty({
    description: 'Subcategory or specific issue (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  subcategory?: string;

  @ApiProperty({
    description: 'Detailed description of the issue (50-2000 characters)',
  })
  @IsString()
  @MinLength(50, { message: 'Description must be at least 50 characters' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  description: string;

  @ApiProperty({
    description: 'URLs of uploaded evidence files (optional)',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  evidenceUrls?: string[];
}

export class AddDisputeMessageDto {
  @ApiProperty({ description: 'Message to add to dispute thread' })
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;
}

export class AppealDisputeDto {
  @ApiProperty({ description: 'Reason for appeal' })
  @IsString()
  @MinLength(50, { message: 'Appeal reason must be at least 50 characters' })
  @MaxLength(1000, { message: 'Appeal reason cannot exceed 1000 characters' })
  appealNote: string;
}
