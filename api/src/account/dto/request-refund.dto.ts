import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RequestRefundDto {
  @ApiProperty({ description: 'Order ID to refund' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Amount in cents to refund (defaults to full order total)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @ApiPropertyOptional({ description: 'Reason for the refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}
