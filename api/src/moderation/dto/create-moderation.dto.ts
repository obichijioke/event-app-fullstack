import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ModerationStatus } from '@prisma/client';

export class CreateFlagDto {
  @IsString()
  @IsOptional()
  reporterId?: string;

  @IsString()
  targetKind: string; // 'user', 'organization', 'event', 'ticket'

  @IsString()
  targetId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  metadata?: string; // JSON string
}

export class CreateModerationActionDto {
  @IsString()
  moderatorId: string;

  @IsString()
  targetKind: string; // 'user', 'organization', 'event', 'ticket'

  @IsString()
  targetId: string;

  @IsString()
  action: string; // 'approve', 'reject', 'pause', 'unlist', 'suspend-user'

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  metadata?: string; // JSON string
}

export class UpdateFlagDto {
  @IsEnum(ModerationStatus)
  @IsOptional()
  status?: ModerationStatus;

  @IsDateString()
  @IsOptional()
  resolvedAt?: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

export class GetFlagsDto {
  @IsString()
  @IsOptional()
  targetKind?: string;

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsEnum(ModerationStatus)
  @IsOptional()
  status?: ModerationStatus;

  @IsString()
  @IsOptional()
  reporterId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 20;
}

export class GetModerationStatsDto {
  @IsString()
  @IsOptional()
  targetKind?: string;

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
