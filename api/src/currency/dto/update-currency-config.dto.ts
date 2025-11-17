import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsInt,
  IsEnum,
  Min,
  Max,
  Length,
} from 'class-validator';

export class UpdateCurrencyConfigDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @ApiProperty({
    example: 'NGN',
    description: 'ISO 4217 currency code (3 letters)',
  })
  defaultCurrency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['NGN', 'USD', 'EUR', 'GBP'],
    description: 'List of supported currency codes',
  })
  supportedCurrencies?: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    description: 'Enable multi-currency mode for organizers',
  })
  multiCurrencyEnabled?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: '₦',
    description: 'Currency symbol to display',
  })
  currencySymbol?: string;

  @IsOptional()
  @IsEnum(['before', 'after'])
  @ApiProperty({
    example: 'before',
    enum: ['before', 'after'],
    description: 'Position of currency symbol relative to amount',
  })
  currencyPosition?: 'before' | 'after';

  @IsOptional()
  @IsString()
  @Length(1, 1)
  @ApiProperty({
    example: '.',
    description: 'Decimal separator character',
  })
  decimalSeparator?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1)
  @ApiProperty({
    example: ',',
    description: 'Thousands separator character',
  })
  thousandsSeparator?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  @ApiProperty({
    example: 2,
    description: 'Number of decimal places',
  })
  decimalPlaces?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    description: 'Enable exchange rate functionality',
  })
  exchangeRatesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    description: 'Allow organizers to set their own currency (multi-currency mode only)',
  })
  allowOrganizerCurrency?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    description: 'Automatically update exchange rates',
  })
  autoUpdateRates?: boolean;

  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly'])
  @ApiProperty({
    example: 'daily',
    enum: ['hourly', 'daily', 'weekly'],
    description: 'Frequency for automatic exchange rate updates',
  })
  updateFrequency?: 'hourly' | 'daily' | 'weekly';
}
