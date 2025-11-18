import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailVerificationDto {
  @ApiProperty({ description: 'Email to verify' })
  @IsEmail()
  email: string;
}
