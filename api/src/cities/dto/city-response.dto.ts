import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CityResponseDto {
  @ApiProperty({ description: 'City ID', example: 'city-ng-lagos' })
  id: string;

  @ApiProperty({ description: 'City name', example: 'Lagos' })
  name: string;

  @ApiProperty({ description: 'Country code (ISO 3166-1 alpha-2)', example: 'NG' })
  countryCode: string;

  @ApiProperty({ description: 'Country name', example: 'Nigeria' })
  countryName: string;

  @ApiProperty({ description: 'Latitude', example: 6.5244 })
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: 3.3792 })
  longitude: number;

  @ApiPropertyOptional({ description: 'Timezone', example: 'Africa/Lagos' })
  timezone?: string;

  @ApiPropertyOptional({ description: 'Population', example: 15388000 })
  population?: number;

  @ApiProperty({ description: 'Is a major city', example: true })
  isMajor: boolean;

  @ApiPropertyOptional({
    description: 'Alternative names/aliases',
    example: ['Lagos Island', 'Eko'],
  })
  aliases?: string[];
}

export class CityListResponseDto {
  @ApiProperty({ type: [CityResponseDto] })
  data: CityResponseDto[];
}
