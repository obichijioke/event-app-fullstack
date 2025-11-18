import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFaCodeDto {
  @ApiProperty({ description: '6-digit code sent for two-factor action' })
  @IsString()
  code: string;
}

export class RequestTwoFaCodeDto {
  @ApiProperty({
    description: 'Purpose for the 2FA code',
    enum: ['enable', 'disable'],
    default: 'enable',
    required: false,
  })
  @IsString()
  purpose: 'enable' | 'disable' = 'enable';
}
