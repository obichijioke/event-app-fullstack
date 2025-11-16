import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AssetKind {
  IMAGE = 'image',
  PDF = 'pdf',
  VIDEO = 'video',
  SEATMAP_RENDER = 'seatmap-render',
}

export class CreateEventAssetDto {
  @ApiProperty({
    description: 'Type of asset',
    enum: AssetKind,
  })
  @IsEnum(AssetKind)
  kind: AssetKind;

  @ApiProperty({ description: 'URL of the asset' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false, description: 'Alt text for the asset' })
  @IsString()
  @IsOptional()
  altText?: string;
}
