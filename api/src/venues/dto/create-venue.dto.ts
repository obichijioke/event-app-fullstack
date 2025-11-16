import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVenueDto {
  @ApiProperty({ description: 'Venue name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Venue address',
    example: {
      line1: '123 Main St',
      city: 'Lagos',
      region: 'Lagos State',
      postal: '100001',
      country: 'Nigeria',
    },
  })
  @IsObject()
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };

  @ApiProperty({
    description: 'Timezone (IANA format)',
    example: 'Africa/Lagos',
  })
  @IsString()
  timezone: string;

  @ApiPropertyOptional({ description: 'Venue capacity' })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Latitude coordinate (-90 to 90)',
    example: 6.5244,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate (-180 to 180)',
    example: 3.3792,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;
}
