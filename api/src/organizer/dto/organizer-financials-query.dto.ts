import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class OrganizerFinancialsQueryDto {
  @ApiProperty({ description: 'Organization ID', required: true })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({
    description: 'Start date for reporting window (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for reporting window (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Currency code to normalize totals to' })
  @IsOptional()
  @IsString()
  currency?: string;
}
