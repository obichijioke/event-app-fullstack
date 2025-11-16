import { EventStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBooleanString } from 'class-validator';

export class OrganizerEventQueryDto {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Filter events by organization' })
  @IsOptional()
  @IsString()
  orgId?: string;

  @ApiPropertyOptional({ description: 'Filter events by category' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter to upcoming events' })
  @IsOptional()
  @IsBooleanString()
  upcoming?: string;

  @ApiPropertyOptional({
    description: 'Text search across title and description',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
