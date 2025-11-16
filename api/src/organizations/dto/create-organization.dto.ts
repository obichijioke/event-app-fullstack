import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationType } from '@prisma/client';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Organization type',
    enum: OrganizationType,
    default: OrganizationType.personal,
  })
  @IsEnum(OrganizationType)
  @IsOptional()
  type?: OrganizationType;

  @ApiPropertyOptional({ description: 'Legal business name' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Organization website URL' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Country code' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Support email address' })
  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @ApiPropertyOptional({
    description: 'Tax ID or business registration number',
  })
  @IsString()
  @IsOptional()
  taxId?: string;
}
