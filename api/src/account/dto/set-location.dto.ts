import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { LocationSource } from '@prisma/client';

export class SetLocationDto {
  @ApiPropertyOptional({
    description: 'Latitude (-90 to 90)',
    example: 6.5244,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude (-180 to 180)',
    example: 3.3792,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'City ID from cities database',
    example: 'city-ng-lagos',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({
    description: 'Location source',
    enum: ['browser', 'manual'],
    default: 'manual',
  })
  @IsOptional()
  @IsEnum(['browser', 'manual'] as const)
  source?: 'browser' | 'manual';
}

export class BrowserLocationDto {
  @ApiPropertyOptional({
    description: 'Latitude (-90 to 90)',
    example: 6.5244,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiPropertyOptional({
    description: 'Longitude (-180 to 180)',
    example: 3.3792,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Accuracy in meters from browser geolocation API',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracy?: number;
}
