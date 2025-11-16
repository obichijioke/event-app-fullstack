import {
  IsString,
  IsOptional,
  IsInt,
  IsObject,
  Min,
  IsNumber,
} from 'class-validator';

export class AddressDto {
  @IsString()
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city: string;

  @IsString()
  region: string; // state/province

  @IsString()
  postal: string;

  @IsString()
  country: string;
}

export class CreateVenueDto {
  @IsString()
  name: string;

  @IsObject()
  address: AddressDto;

  @IsString()
  timezone: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  catalogVenueId?: string;
}

export class UpdateVenueDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  address?: AddressDto;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  catalogVenueId?: string;
}
