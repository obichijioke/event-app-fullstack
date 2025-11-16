import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { TicketKind } from '@prisma/client';

export class CreateTicketTypeDto {
  @IsString()
  name: string;

  @IsEnum(TicketKind)
  kind: TicketKind;

  @IsString()
  currency: string;

  @IsNumber()
  priceCents: number;

  @IsNumber()
  @IsOptional()
  feeCents?: number = 0;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @IsOptional()
  perOrderLimit?: number;

  @IsDateString()
  @IsOptional()
  salesStart?: string;

  @IsDateString()
  @IsOptional()
  salesEnd?: string;

  @IsString()
  @IsOptional()
  status?: string = 'active';

  @IsNumber()
  @IsOptional()
  sortOrder?: number = 0;
}

export class CreateTicketPriceTierDto {
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsNumber()
  @IsOptional()
  minQty?: number = 1;

  @IsNumber()
  priceCents: number;

  @IsNumber()
  @IsOptional()
  feeCents?: number = 0;
}

export class CreateHoldDto {
  @IsString()
  @IsOptional()
  ticketTypeId?: string;

  @IsString()
  @IsOptional()
  seatId?: string;

  @IsString()
  @IsOptional()
  occurrenceId?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number = 1;

  @IsDateString()
  expiresAt: string;
}
