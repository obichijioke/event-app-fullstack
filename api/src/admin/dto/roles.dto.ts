import { IsEnum, IsOptional } from 'class-validator';
import { PlatformRole } from '@prisma/client';

export class GrantRoleDto {
  @IsEnum(PlatformRole)
  role: PlatformRole;
}

export class RevokeRoleDto {
  @IsOptional()
  @IsEnum(PlatformRole)
  fallback?: PlatformRole;
}
