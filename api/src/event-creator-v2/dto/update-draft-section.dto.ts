import { EventCreatorSectionStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
} from 'class-validator';

export class UpdateDraftSectionDto {
  @IsObject()
  payload!: Record<string, any>;

  @IsOptional()
  @IsEnum(EventCreatorSectionStatus)
  status?: EventCreatorSectionStatus;

  @IsOptional()
  @IsArray()
  errors?: Record<string, any>[];

  @IsOptional()
  @IsBoolean()
  autosave?: boolean;
}
