import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateCurrencyConfigDto } from './dto/update-currency-config.dto';
import { AddExchangeRateDto } from './dto/add-exchange-rate.dto';
import { CurrencyConfiguration, ExchangeRate, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private currencyCache: CurrencyConfiguration | null = null;
  private readonly CACHE_TTL = 60000; // 1 minute
  private lastCacheUpdate = 0;

  // ISO 4217 Currency Codes
  private readonly VALID_CURRENCIES = [
    'NGN',
    'USD',
    'EUR',
    'GBP',
    'GHS',
    'KES',
    'ZAR',
    'EGP',
    'JPY',
    'CNY',
    'AUD',
    'CAD',
    'CHF',
    'SEK',
    'NZD',
    'INR',
  ];

  private readonly CURRENCY_SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
    EGP: 'E£',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    SEK: 'kr',
    NZD: 'NZ$',
    INR: '₹',
  };

  private readonly CURRENCY_NAMES: Record<string, string> = {
    NGN: 'Nigerian Naira',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    GHS: 'Ghanaian Cedi',
    KES: 'Kenyan Shilling',
    ZAR: 'South African Rand',
    EGP: 'Egyptian Pound',
    JPY: 'Japanese Yen',
    CNY: 'Chinese Yuan',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    SEK: 'Swedish Krona',
    NZD: 'New Zealand Dollar',
    INR: 'Indian Rupee',
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get current platform currency configuration
   * Uses caching to avoid repeated DB queries
   */
  async getCurrencyConfig(): Promise<CurrencyConfiguration> {
    const now = Date.now();

    // Return cached config if still valid
    if (this.currencyCache && now - this.lastCacheUpdate < this.CACHE_TTL) {
      return this.currencyCache;
    }

    // Fetch from database
    let config = await this.prisma.currencyConfiguration.findFirst();

    // Initialize with defaults if not exists
    if (!config) {
      this.logger.log('Initializing currency configuration with NGN defaults');
      config = await this.prisma.currencyConfiguration.create({
        data: {
          defaultCurrency: 'NGN',
          supportedCurrencies: [
            'NGN',
            'USD',
            'GBP',
            'EUR',
            'GHS',
            'KES',
            'ZAR',
          ],
          currencySymbol: '₦',
          currencyPosition: 'before',
          multiCurrencyEnabled: false,
        },
      });
    }

    // Update cache
    this.currencyCache = config;
    this.lastCacheUpdate = now;

    return config;
  }

  /**
   * Update currency configuration (Admin only)
   */
  async updateCurrencyConfig(
    dto: UpdateCurrencyConfigDto,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CurrencyConfiguration> {
    // Validate currency code if provided
    if (dto.defaultCurrency) {
      this.validateCurrencyCode(dto.defaultCurrency);
    }

    // Validate supported currencies if provided
    if (dto.supportedCurrencies) {
      dto.supportedCurrencies.forEach((currency) =>
        this.validateCurrencyCode(currency),
      );

      // Ensure default currency is in supported list
      const defaultCurrency =
        dto.defaultCurrency || (await this.getDefaultCurrency());
      if (!dto.supportedCurrencies.includes(defaultCurrency)) {
        dto.supportedCurrencies.push(defaultCurrency);
      }
    }

    // Get current config
    const currentConfig = await this.getCurrencyConfig();

    // Track changes for audit log
    const changes: Record<string, { old: any; new: any }> = {};

    if (
      dto.defaultCurrency &&
      dto.defaultCurrency !== currentConfig.defaultCurrency
    ) {
      changes.defaultCurrency = {
        old: currentConfig.defaultCurrency,
        new: dto.defaultCurrency,
      };
    }

    if (
      dto.multiCurrencyEnabled !== undefined &&
      dto.multiCurrencyEnabled !== currentConfig.multiCurrencyEnabled
    ) {
      changes.multiCurrencyEnabled = {
        old: currentConfig.multiCurrencyEnabled,
        new: dto.multiCurrencyEnabled,
      };
    }

    // Update configuration
    const updated = await this.prisma.currencyConfiguration.update({
      where: { id: currentConfig.id },
      data: {
        ...dto,
        updatedBy: adminId,
      },
    });

    // Clear cache
    this.currencyCache = null;

    // Log changes
    if (Object.keys(changes).length > 0) {
      await this.logCurrencyChange(
        changes.defaultCurrency ? 'default_currency' : 'multi_currency_toggle',
        currentConfig,
        updated,
        adminId,
        ipAddress,
        userAgent,
      );

      this.logger.log(
        `Currency configuration updated by admin ${adminId}: ${JSON.stringify(changes)}`,
      );
    }

    return updated;
  }

  /**
   * Toggle multi-currency mode
   */
  async toggleMultiCurrency(
    enabled: boolean,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CurrencyConfiguration> {
    return this.updateCurrencyConfig(
      { multiCurrencyEnabled: enabled },
      adminId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Get default currency code
   */
  async getDefaultCurrency(): Promise<string> {
    const config = await this.getCurrencyConfig();
    return config.defaultCurrency;
  }

  /**
   * Check if multi-currency is enabled
   */
  async isMultiCurrencyEnabled(): Promise<boolean> {
    const config = await this.getCurrencyConfig();
    return config.multiCurrencyEnabled;
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    const config = await this.getCurrencyConfig();
    return config.supportedCurrencies;
  }

  /**
   * Check if a currency is supported
   */
  async isCurrencySupported(currency: string): Promise<boolean> {
    const supported = await this.getSupportedCurrencies();
    return supported.includes(currency.toUpperCase());
  }

  /**
   * Format amount with currency symbol
   */
  async formatAmount(
    amountCents: number | bigint,
    currency?: string,
  ): Promise<string> {
    const config = await this.getCurrencyConfig();
    const currencyCode = currency || config.defaultCurrency;
    const symbol = this.getCurrencySymbol(currencyCode);

    // Convert cents to main unit
    const amount = Number(amountCents) / 100;

    // Format with locale
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });

    return config.currencyPosition === 'before'
      ? `${symbol}${formatted}`
      : `${formatted}${symbol}`;
  }

  /**
   * Get currency symbol for a given code
   */
  getCurrencySymbol(currencyCode: string): string {
    return this.CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
  }

  /**
   * Get currency name
   */
  getCurrencyName(currencyCode: string): string {
    return (
      this.CURRENCY_NAMES[currencyCode.toUpperCase()] ||
      currencyCode.toUpperCase()
    );
  }

  /**
   * Get all valid currencies with metadata
   */
  getAllValidCurrencies() {
    return this.VALID_CURRENCIES.map((code) => ({
      code,
      symbol: this.getCurrencySymbol(code),
      name: this.getCurrencyName(code),
    }));
  }

  /**
   * Validate currency code
   */
  private validateCurrencyCode(code: string): void {
    const upper = code.toUpperCase();
    if (!this.VALID_CURRENCIES.includes(upper)) {
      throw new BadRequestException(`Invalid currency code: ${code}`);
    }
  }

  // ============================================================================
  // EXCHANGE RATE MANAGEMENT
  // ============================================================================

  /**
   * Add or update exchange rate
   */
  async addExchangeRate(
    dto: AddExchangeRateDto,
    adminId: string,
  ): Promise<ExchangeRate> {
    // Validate currencies
    this.validateCurrencyCode(dto.fromCurrency);
    this.validateCurrencyCode(dto.toCurrency);

    // Calculate inverse rate
    const rate = new Decimal(dto.rate);
    const inverseRate = new Decimal(1).dividedBy(rate);

    // Deactivate old rates for this pair
    await this.prisma.exchangeRate.updateMany({
      where: {
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        isActive: true,
      },
      data: {
        isActive: false,
        validUntil: new Date(),
      },
    });

    // Create new rate
    const exchangeRate = await this.prisma.exchangeRate.create({
      data: {
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        rate,
        inverseRate,
        source: dto.source || 'manual',
        provider: dto.provider,
        validFrom: dto.validFrom || new Date(),
        validUntil: dto.validUntil,
        isActive: true,
        metadata: {
          updatedBy: adminId,
          source: dto.source || 'manual',
        } satisfies Prisma.JsonObject,
      },
    });

    this.logger.log(
      `Exchange rate added: 1 ${dto.fromCurrency} = ${dto.rate} ${dto.toCurrency}`,
    );

    return exchangeRate;
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // Find active exchange rate
    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: {
        validFrom: 'desc',
      },
    });

    if (!rate) {
      throw new NotFoundException(
        `No exchange rate found for ${fromCurrency} to ${toCurrency}`,
      );
    }

    return rate.rate.toNumber();
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amountCents: number | bigint,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return Number(amountCents);
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return Math.round(Number(amountCents) * rate);
  }

  /**
   * Get all active exchange rates
   */
  async getActiveExchangeRates(): Promise<ExchangeRate[]> {
    return this.prisma.exchangeRate.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: [{ fromCurrency: 'asc' }, { toCurrency: 'asc' }],
    });
  }

  // ============================================================================
  // AUDIT & LOGGING
  // ============================================================================

  /**
   * Log currency configuration change
   */
  private async logCurrencyChange(
    changeType: string,
    oldConfig: CurrencyConfiguration,
    newConfig: CurrencyConfiguration,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.prisma.currencyChangeLog.create({
      data: {
        changeType,
        oldValue: oldConfig as any,
        newValue: newConfig as any,
        changedBy: adminId,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get currency change history
   */
  async getCurrencyChangeHistory(limit = 50) {
    return this.prisma.currencyChangeLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
