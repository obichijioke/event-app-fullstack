import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreateSeatmapDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  spec: any; // JSON object representing the seatmap specification

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateSeatDto {
  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  @IsOptional()
  row?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsObject()
  @IsOptional()
  pos?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}
