import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  IsISO8601,
} from 'class-validator';

const VISIBILITY_VALUES = ['public', 'unlisted', 'private'] as const;

export class UpdateEventDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Long-form description/markdown' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: VISIBILITY_VALUES })
  @IsOptional()
  @IsIn(VISIBILITY_VALUES)
  visibility?: (typeof VISIBILITY_VALUES)[number];

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueId?: string | null;
}
