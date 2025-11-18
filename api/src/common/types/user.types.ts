import { PlatformRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: PlatformRole;
  iat?: number;
  exp?: number;
}

export interface UserEntity {
  id: string;
  email: string;
  name?: string;
  role: PlatformRole;
}

export type AuthenticatedUser = UserEntity;
