import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export type HomepageTimeframe = 'today' | 'weekend' | 'upcoming';

export const HOMEPAGE_TIMEFRAME_OPTIONS: Array<{
  id: HomepageTimeframe;
  label: string;
}> = [
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'upcoming', label: 'Upcoming' },
];

const toFloat = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

const toInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

export class GetHomepageDto {
  @ApiPropertyOptional({
    description: 'City or metro area to bias results towards',
    example: 'Austin',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Category slug to emphasize in the response',
    example: 'music',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Latitude for geo-personalized sections',
    example: 30.2672,
  })
  @IsOptional()
  @Transform(({ value }) => toFloat(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for geo-personalized sections',
    example: -97.7431,
  })
  @IsOptional()
  @Transform(({ value }) => toFloat(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Radius in kilometers used for distance calculations',
    example: 75,
  })
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsNumber()
  @Min(5)
  @Max(500)
  radiusKm?: number;

  @ApiPropertyOptional({
    description: 'Preferred timeframe for events',
    enum: HOMEPAGE_TIMEFRAME_OPTIONS.map((option) => option.id),
    example: 'weekend',
  })
  @IsOptional()
  @IsIn(HOMEPAGE_TIMEFRAME_OPTIONS.map((option) => option.id))
  timeframe?: HomepageTimeframe;

  @ApiPropertyOptional({
    description: 'Optional audience segment (family, nightlife, etc.)',
    example: 'family',
  })
  @IsOptional()
  @IsString()
  segment?: string;
}
