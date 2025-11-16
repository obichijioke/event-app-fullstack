import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateTransferDto {
  @IsString()
  ticketId: string;

  @IsString()
  toUserId: string;
}

export class AcceptTransferDto {
  @IsString()
  transferId: string;
}

export class CreateCheckinDto {
  @IsString()
  ticketId: string;

  @IsString()
  @IsOptional()
  scannerId?: string;

  @IsString()
  @IsOptional()
  gate?: string;
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
