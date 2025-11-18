import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  orgId: string;

  @IsString()
  @IsUrl()
  url: string;

  @IsArray()
  @IsString({ each: true })
  eventFilters: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  secret?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class CreateWebhookEventDto {
  @IsString()
  webhookId: string;

  @IsString()
  eventType: string;

  @IsOptional()
  data?: any;
}

export class RetryWebhookDto {
  @IsString()
  webhookEventId: string;
}
