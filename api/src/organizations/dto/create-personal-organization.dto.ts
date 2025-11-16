import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePersonalOrganizationDto {
  @ApiProperty({
    description:
      'Display name for your organizer profile (e.g., "John\'s Events" or your business name)',
    example: "John's Events",
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Brief description about yourself or your events',
    example: 'Organizing community events and workshops',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  @IsOptional()
  country?: string;
}
