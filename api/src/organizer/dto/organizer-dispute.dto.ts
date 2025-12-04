import { IsOptional, IsString, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class OrganizerDisputeQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string; // Search by orderId, caseId, buyer email

  @IsOptional()
  @IsEnum(['needs_response', 'under_review', 'won', 'lost', 'warning', 'charge_refunded'])
  status?: string;

  @IsOptional()
  @IsEnum(['stripe', 'paystack'])
  provider?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SubmitDisputeResponseDto {
  @IsString()
  responseNote: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[]; // URLs of uploaded evidence files
}

export class UploadDisputeEvidenceDto {
  @IsString()
  disputeId: string;
}
