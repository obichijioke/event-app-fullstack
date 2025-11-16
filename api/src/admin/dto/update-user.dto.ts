import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: PlatformRole })
  @IsOptional()
  @IsEnum(PlatformRole)
  role?: PlatformRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
