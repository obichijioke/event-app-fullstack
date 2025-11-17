import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { UpdateCurrencyConfigDto } from './dto/update-currency-config.dto';
import { AddExchangeRateDto } from './dto/add-exchange-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformRole } from '@prisma/client';
import type { Request } from 'express';

@Controller('currency')
@ApiTags('Currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get current currency configuration' })
  @ApiResponse({ status: 200, description: 'Currency configuration retrieved' })
  async getCurrencyConfig() {
    return this.currencyService.getCurrencyConfig();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default currency code' })
  @ApiResponse({ status: 200, description: 'Default currency retrieved' })
  async getDefaultCurrency() {
    const currency = await this.currencyService.getDefaultCurrency();
    return { currency };
  }

  @Get('multi-currency-enabled')
  @ApiOperation({ summary: 'Check if multi-currency mode is enabled' })
  @ApiResponse({ status: 200, description: 'Multi-currency status retrieved' })
  async isMultiCurrencyEnabled() {
    const enabled = await this.currencyService.isMultiCurrencyEnabled();
    return { enabled };
  }

  @Get('supported')
  @ApiOperation({ summary: 'Get list of supported currencies' })
  @ApiResponse({ status: 200, description: 'Supported currencies retrieved' })
  async getSupportedCurrencies() {
    const config = await this.currencyService.getCurrencyConfig();
    const currencies = config.supportedCurrencies.map((code) => ({
      code,
      symbol: this.currencyService.getCurrencySymbol(code),
      name: this.currencyService.getCurrencyName(code),
    }));

    return { currencies, multiCurrencyEnabled: config.multiCurrencyEnabled };
  }

  @Get('all-currencies')
  @ApiOperation({ summary: 'Get all valid currency codes' })
  @ApiResponse({ status: 200, description: 'All currencies retrieved' })
  async getAllCurrencies() {
    const currencies = this.currencyService.getAllValidCurrencies();
    return { currencies };
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PlatformRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update currency configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updateCurrencyConfig(
    @CurrentUser() user: any,
    @Body() dto: UpdateCurrencyConfigDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.currencyService.updateCurrencyConfig(
      dto,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post('toggle-multi-currency')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PlatformRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle multi-currency mode (Admin only)' })
  @ApiResponse({ status: 200, description: 'Multi-currency mode toggled' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async toggleMultiCurrency(
    @CurrentUser() user: any,
    @Body('enabled') enabled: boolean,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.currencyService.toggleMultiCurrency(
      enabled,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // EXCHANGE RATES
  // ============================================================================

  @Get('exchange-rates')
  @ApiOperation({ summary: 'Get all active exchange rates' })
  @ApiResponse({ status: 200, description: 'Exchange rates retrieved' })
  async getExchangeRates() {
    const rates = await this.currencyService.getActiveExchangeRates();
    return { rates };
  }

  @Get('exchange-rate')
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiResponse({ status: 200, description: 'Exchange rate retrieved' })
  @ApiResponse({ status: 404, description: 'Exchange rate not found' })
  async getExchangeRate(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const rate = await this.currencyService.getExchangeRate(from, to);
    return {
      from,
      to,
      rate,
      formatted: `1 ${from} = ${rate} ${to}`,
    };
  }

  @Post('exchange-rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PlatformRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add exchange rate (Admin only)' })
  @ApiResponse({ status: 201, description: 'Exchange rate added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async addExchangeRate(
    @CurrentUser() user: any,
    @Body() dto: AddExchangeRateDto,
  ) {
    return this.currencyService.addExchangeRate(dto, user.id);
  }

  // ============================================================================
  // CURRENCY CONVERSION & FORMATTING
  // ============================================================================

  @Get('format')
  @ApiOperation({ summary: 'Format amount with currency symbol' })
  @ApiResponse({ status: 200, description: 'Formatted amount' })
  async formatAmount(
    @Query('amount', ParseIntPipe) amountCents: number,
    @Query('currency') currency?: string,
  ) {
    const formatted = await this.currencyService.formatAmount(
      amountCents,
      currency,
    );
    return { formatted, amountCents, currency };
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiResponse({ status: 200, description: 'Amount converted' })
  @ApiResponse({ status: 404, description: 'Exchange rate not found' })
  async convertCurrency(
    @Query('amount', ParseIntPipe) amountCents: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const convertedAmount = await this.currencyService.convertCurrency(
      amountCents,
      from,
      to,
    );

    const fromFormatted = await this.currencyService.formatAmount(
      amountCents,
      from,
    );
    const toFormatted = await this.currencyService.formatAmount(
      convertedAmount,
      to,
    );

    return {
      original: {
        amount: amountCents,
        currency: from,
        formatted: fromFormatted,
      },
      converted: {
        amount: convertedAmount,
        currency: to,
        formatted: toFormatted,
      },
    };
  }

  // ============================================================================
  // AUDIT & HISTORY
  // ============================================================================

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PlatformRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get currency change history (Admin only)' })
  @ApiResponse({ status: 200, description: 'Change history retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getChangeHistory(@Query('limit', ParseIntPipe) limit = 50) {
    return this.currencyService.getCurrencyChangeHistory(limit);
  }
}
