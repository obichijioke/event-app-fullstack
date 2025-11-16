import { Visibility } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class PublishDraftDto {
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsBoolean()
  sendNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApproveTickets?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
