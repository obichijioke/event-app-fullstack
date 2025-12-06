import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, Length } from 'class-validator';

export class SearchCitiesDto {
  @ApiPropertyOptional({
    description: 'Search query for city name',
    example: 'Lagos',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by country code (ISO 3166-1 alpha-2)',
    example: 'NG',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter to only major cities',
    example: true,
  })
  @IsOptional()
  major?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
