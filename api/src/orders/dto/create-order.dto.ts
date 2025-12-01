import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  eventId: string;

  @IsString()
  @IsOptional()
  occurrenceId?: string;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsString()
  @IsOptional()
  holdId?: string;

  @IsArray()
  items: CreateOrderItemDto[];
}

export class CreateOrderItemDto {
  @IsString()
  ticketTypeId: string;

  @IsString()
  @IsOptional()
  seatId?: string;

  @IsNumber()
  quantity: number;
}

export class CreatePaymentDto {
  @IsString()
  provider: string; // 'stripe' or 'paystack'

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  returnUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

export class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  sourceId?: string;
}
