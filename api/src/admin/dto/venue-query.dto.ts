import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AdminVenueQueryDto {
  @ApiPropertyOptional({
    description: 'Search by venue or organization name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['active', 'archived', 'all'],
    default: 'active',
  })
  @IsOptional()
  @IsIn(['active', 'archived', 'all'])
  status: 'active' | 'archived' | 'all' = 'active';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 1 : parsed;
  })
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 20 : Math.min(parsed, 100);
  })
  limit = 20;
}
