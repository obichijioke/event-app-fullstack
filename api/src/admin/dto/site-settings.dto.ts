import {
  IsString,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SiteSettingsDto {
  @ApiProperty({ description: 'Site name', example: 'EventHub' })
  @IsString()
  siteName: string;

  @ApiProperty({
    description: 'Site tagline',
    example: 'Discover amazing events',
  })
  @IsString()
  @IsOptional()
  siteTagline?: string;

  @ApiProperty({
    description: 'Support email',
    example: 'support@eventhub.com',
  })
  @IsEmail()
  supportEmail: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'contact@eventhub.com',
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ description: 'Enable maintenance mode', example: false })
  @IsBoolean()
  maintenanceMode: boolean;

  @ApiProperty({
    description: 'Maintenance message',
    example: 'We are currently performing maintenance',
  })
  @IsString()
  @IsOptional()
  maintenanceMessage?: string;

  @ApiProperty({ description: 'Allow new user registrations', example: true })
  @IsBoolean()
  allowRegistrations: boolean;

  @ApiProperty({ description: 'Require email verification', example: true })
  @IsBoolean()
  requireEmailVerification: boolean;

  @ApiProperty({ description: 'Default currency', example: 'NGN' })
  @IsString()
  defaultCurrency: string;

  @ApiProperty({ description: 'Default timezone', example: 'Africa/Lagos' })
  @IsString()
  defaultTimezone: string;

  @ApiProperty({ description: 'Platform fee percentage', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent: number;

  @ApiProperty({
    description: 'Payment processing fee percentage',
    example: 1.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  processingFeePercent: number;

  @ApiProperty({ description: 'Enable Stripe payments', example: true })
  @IsBoolean()
  enableStripe: boolean;

  @ApiProperty({ description: 'Enable Paystack payments', example: true })
  @IsBoolean()
  enablePaystack: boolean;

  @ApiProperty({ description: 'Maximum file upload size in MB', example: 10 })
  @IsNumber()
  @Min(1)
  @Max(100)
  maxUploadSizeMB: number;

  @ApiProperty({ description: 'Events require approval', example: false })
  @IsBoolean()
  eventsRequireApproval: boolean;

  @ApiProperty({ description: 'Enable event analytics', example: true })
  @IsBoolean()
  enableAnalytics: boolean;

  @ApiProperty({
    description: 'Terms of service URL',
    example: 'https://eventhub.com/terms',
  })
  @IsString()
  @IsOptional()
  termsUrl?: string;

  @ApiProperty({
    description: 'Privacy policy URL',
    example: 'https://eventhub.com/privacy',
  })
  @IsString()
  @IsOptional()
  privacyUrl?: string;

  @ApiProperty({
    description: 'Facebook URL',
    example: 'https://facebook.com/eventhub',
  })
  @IsString()
  @IsOptional()
  facebookUrl?: string;

  @ApiProperty({
    description: 'Twitter URL',
    example: 'https://twitter.com/eventhub',
  })
  @IsString()
  @IsOptional()
  twitterUrl?: string;

  @ApiProperty({
    description: 'Instagram URL',
    example: 'https://instagram.com/eventhub',
  })
  @IsString()
  @IsOptional()
  instagramUrl?: string;

  @ApiProperty({
    description: 'LinkedIn URL',
    example: 'https://linkedin.com/company/eventhub',
  })
  @IsString()
  @IsOptional()
  linkedinUrl?: string;
}

export class UpdateSiteSettingsDto {
  @ApiProperty({ description: 'Site name', example: 'EventHub' })
  @IsString()
  @IsOptional()
  siteName?: string;

  @ApiProperty({
    description: 'Site tagline',
    example: 'Discover amazing events',
  })
  @IsString()
  @IsOptional()
  siteTagline?: string;

  @ApiProperty({
    description: 'Support email',
    example: 'support@eventhub.com',
  })
  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'contact@eventhub.com',
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ description: 'Enable maintenance mode', example: false })
  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean;

  @ApiProperty({
    description: 'Maintenance message',
    example: 'We are currently performing maintenance',
  })
  @IsString()
  @IsOptional()
  maintenanceMessage?: string;

  @ApiProperty({ description: 'Allow new user registrations', example: true })
  @IsBoolean()
  @IsOptional()
  allowRegistrations?: boolean;

  @ApiProperty({ description: 'Require email verification', example: true })
  @IsBoolean()
  @IsOptional()
  requireEmailVerification?: boolean;

  @ApiProperty({ description: 'Default currency', example: 'NGN' })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiProperty({ description: 'Default timezone', example: 'Africa/Lagos' })
  @IsString()
  @IsOptional()
  defaultTimezone?: string;

  @ApiProperty({ description: 'Platform fee percentage', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  platformFeePercent?: number;

  @ApiProperty({
    description: 'Payment processing fee percentage',
    example: 1.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  processingFeePercent?: number;

  @ApiProperty({ description: 'Enable Stripe payments', example: true })
  @IsBoolean()
  @IsOptional()
  enableStripe?: boolean;

  @ApiProperty({ description: 'Enable Paystack payments', example: true })
  @IsBoolean()
  @IsOptional()
  enablePaystack?: boolean;

  @ApiProperty({ description: 'Maximum file upload size in MB', example: 10 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxUploadSizeMB?: number;

  @ApiProperty({ description: 'Events require approval', example: false })
  @IsBoolean()
  @IsOptional()
  eventsRequireApproval?: boolean;

  @ApiProperty({ description: 'Enable event analytics', example: true })
  @IsBoolean()
  @IsOptional()
  enableAnalytics?: boolean;

  @ApiProperty({
    description: 'Terms of service URL',
    example: 'https://eventhub.com/terms',
  })
  @IsString()
  @IsOptional()
  termsUrl?: string;

  @ApiProperty({
    description: 'Privacy policy URL',
    example: 'https://eventhub.com/privacy',
  })
  @IsString()
  @IsOptional()
  privacyUrl?: string;

  @ApiProperty({
    description: 'Facebook URL',
    example: 'https://facebook.com/eventhub',
  })
  @IsString()
  @IsOptional()
  facebookUrl?: string;

  @ApiProperty({
    description: 'Twitter URL',
    example: 'https://twitter.com/eventhub',
  })
  @IsString()
  @IsOptional()
  twitterUrl?: string;

  @ApiProperty({
    description: 'Instagram URL',
    example: 'https://instagram.com/eventhub',
  })
  @IsString()
  @IsOptional()
  instagramUrl?: string;

  @ApiProperty({
    description: 'LinkedIn URL',
    example: 'https://linkedin.com/company/eventhub',
  })
  @IsString()
  @IsOptional()
  linkedinUrl?: string;
}
