import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class NearbyEventsDto {
  @ApiPropertyOptional({
    description: 'Latitude coordinate (-90 to 90). Required if city is not provided.',
    example: 6.5244,
    minimum: -90,
    maximum: 90,
  })
  @ValidateIf((o) => !o.city)
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description:
      'Longitude coordinate (-180 to 180). Required if city is not provided.',
    example: 3.3792,
    minimum: -180,
    maximum: 180,
  })
  @ValidateIf((o) => !o.city)
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'City name or ID. Alternative to lat/lon coordinates.',
    example: 'Lagos',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 500,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  @IsOptional()
  radius?: number = 50;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'category-music',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
