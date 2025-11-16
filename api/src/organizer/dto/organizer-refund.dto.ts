import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OrganizerRefundDto {
  @ApiPropertyOptional({
    description: 'Optional refund amount in cents; defaults to full amount',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amountCents?: number;

  @ApiPropertyOptional({ description: 'Reason for the refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}
