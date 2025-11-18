import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUrl,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { EventStatus, Visibility } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  descriptionMd?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus = EventStatus.draft;

  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility = Visibility.public;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsDateString()
  @IsOptional()
  doorTime?: string;

  @IsDateString()
  @IsOptional()
  publishAt?: string;

  @IsString()
  @IsOptional()
  ageRestriction?: string;

  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  venueId?: string;

  @IsString()
  @IsOptional()
  seatmapId?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate for events without a venue (-90 to 90)',
    example: 6.5244,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description:
      'Longitude coordinate for events without a venue (-180 to 180)',
    example: 3.3792,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;
}

export class CreateEventPoliciesDto {
  @IsString()
  @IsOptional()
  refundPolicy?: string;

  @IsOptional()
  transferAllowed?: boolean = true;

  @IsString()
  @IsOptional()
  transferCutoff?: string;

  @IsOptional()
  resaleAllowed?: boolean = false;
}

export class CreateEventOccurrenceDto {
  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsDateString()
  @IsOptional()
  gateOpenAt?: string;
}
