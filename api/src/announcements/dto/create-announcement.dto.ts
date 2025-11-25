import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AnnouncementType {
  info = 'info',
  warning = 'warning',
  important = 'important',
  urgent = 'urgent',
}

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: AnnouncementType, default: 'info' })
  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Schedule announcement for future publication' })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  @ApiProperty({ required: false, default: false, description: 'Send notification immediately' })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}
