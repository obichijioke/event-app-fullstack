import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Length,
  Min,
} from 'class-validator';

export class AddExchangeRateDto {
  @IsString()
  @Length(3, 3)
  @ApiProperty({
    example: 'USD',
    description: 'Source currency code',
  })
  fromCurrency: string;

  @IsString()
  @Length(3, 3)
  @ApiProperty({
    example: 'NGN',
    description: 'Target currency code',
  })
  toCurrency: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    example: 1575.5,
    description: 'Exchange rate (1 fromCurrency = X toCurrency)',
  })
  rate: number;

  @IsOptional()
  @IsEnum(['manual', 'api', 'system'])
  @ApiProperty({
    example: 'manual',
    enum: ['manual', 'api', 'system'],
    description: 'Source of the exchange rate',
  })
  source?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'exchangerate-api.com',
    description: 'API provider name if applicable',
  })
  provider?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Rate valid from this date',
  })
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    example: '2025-12-31T23:59:59Z',
    description: 'Rate valid until this date',
  })
  validUntil?: Date;
}
