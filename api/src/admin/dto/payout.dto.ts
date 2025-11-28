import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessPayoutDto {
  @ApiPropertyOptional({
    description:
      'Force processing even if status is not pending/in_review (use cautiously)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class RejectPayoutDto {
  @ApiProperty({ description: 'Reason for rejecting the payout' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class RetryPayoutDto {
  @ApiPropertyOptional({
    description: 'Optional note for retrying the payout',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
