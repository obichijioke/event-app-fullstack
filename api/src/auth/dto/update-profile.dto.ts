import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}
