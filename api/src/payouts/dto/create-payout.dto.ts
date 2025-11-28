import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreatePayoutDto {
  @IsNumber()
  amountCents: number;

  @IsString()
  currency: string;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  providerRef?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePayoutAccountDto {
  @IsString()
  provider: string; // 'stripe', 'paypal', etc.

  @IsString()
  externalId: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  sortCode?: string;

  @IsOptional()
  @IsString()
  bic?: string;

  @IsOptional()
  @IsString()
  accountType?: string;

  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsBoolean()
  defaultAccount?: boolean = true;
}

export class CalculatePayoutsDto {
  @IsString()
  orgId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}
