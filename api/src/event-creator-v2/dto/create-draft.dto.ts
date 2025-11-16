import { EventCreatorEventType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  organizationId!: string;

  @IsEnum(EventCreatorEventType)
  eventType!: EventCreatorEventType;

  @IsString()
  timezone!: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  sourceEventId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
