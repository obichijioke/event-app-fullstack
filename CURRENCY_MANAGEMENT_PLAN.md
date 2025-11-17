# Currency Management Implementation Plan

## 📋 Executive Summary

This plan outlines the implementation of a centralized currency management system where platform administrators can configure the default currency for the entire application. This will standardize pricing, payments, and financial reporting across all events and transactions.

---

## 🎯 Objectives

1. **Admin Control**: Allow admins to set and change the platform's default currency
2. **Consistency**: Ensure all financial transactions use the configured currency
3. **Flexibility**: Support currency changes with proper data migration
4. **Multi-Currency Support** (Future): Lay groundwork for future multi-currency features
5. **Payment Provider Integration**: Ensure compatibility with Stripe and Paystack

---

## 📊 Current State Analysis

### Current Currency Implementation

From schema analysis, currency is currently stored as:
- **String field** in multiple models (TicketType, Order, Payment, Payout, etc.)
- **Default value**: `"USD"` (hardcoded in PriceTier model)
- **No centralized management**: Each model stores its own currency value
- **Inconsistency risk**: Different parts of the system could use different currencies

### Models with Currency Fields

1. `TicketType.currency` (line 358)
2. `PriceTier.currency` (line 635) - Default: "USD"
3. `Order.currency` (line 725)
4. `Payment.currency` (line 760)
5. `Payout.currency` (line 806)
6. `Refund.currency` (line 895)
7. `Dispute.currency` (line 924)
8. `PromoCode.currency` (line 965)
9. `Transaction.currency` (line 1063)
10. `CreatorAnalytics.currency` (line 1514) - Default: "USD"

---

## 🏗️ Proposed Architecture

### 1. Database Schema Design

#### Option A: Simple Settings Table (Recommended for MVP)

```prisma
model PlatformSettings {
  id                String   @id @default(cuid())
  settingKey        String   @unique  // e.g., "default_currency"
  settingValue      String              // e.g., "USD", "NGN", "EUR"
  settingType       String              // "currency", "feature_flag", etc.
  description       String?
  updatedBy         String?             // Admin user ID
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("platform_settings")
}
```

**Pros**:
- Flexible for other settings
- Simple to implement
- Easy to query
- Can add more settings without schema changes

**Cons**:
- Requires type casting from string
- No type safety at database level

#### Option B: Dedicated Currency Configuration (Recommended for Production)

```prisma
model CurrencyConfiguration {
  id                    String   @id @default(cuid())
  defaultCurrency       String   @default("USD")  // ISO 4217 code
  supportedCurrencies   String[] @default(["USD", "NGN", "GBP", "EUR"]) // For future multi-currency

  // Currency display settings
  currencySymbol        String   @default("$")
  currencyPosition      String   @default("before") // "before" or "after"
  decimalSeparator      String   @default(".")
  thousandsSeparator    String   @default(",")
  decimalPlaces         Int      @default(2)

  // Exchange rate settings (for future use)
  exchangeRatesEnabled  Boolean  @default(false)
  exchangeRateProvider  String?  // "manual", "api", etc.
  lastRateUpdate        DateTime?

  // Audit
  updatedBy             String?  // Admin user ID
  updatedByUser         User?    @relation(fields: [updatedBy], references: [id])

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("currency_configuration")
}

// Add exchange rates for future multi-currency support
model ExchangeRate {
  id              String   @id @default(cuid())
  fromCurrency    String   // e.g., "USD"
  toCurrency      String   // e.g., "NGN"
  rate            Decimal  @db.Decimal(18, 6)  // e.g., 1575.50
  source          String   @default("manual")  // "manual", "api", etc.
  validFrom       DateTime @default(now())
  validUntil      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([fromCurrency, toCurrency])
  @@map("exchange_rates")
}
```

**Pros**:
- Type-safe currency configuration
- Built-in support for multi-currency (future)
- Rich currency formatting options
- Audit trail with user tracking

**Cons**:
- More complex initial setup
- Requires schema migration

---

### 2. Backend Implementation

#### File Structure

```
api/src/
├── currency/
│   ├── currency.module.ts
│   ├── currency.service.ts
│   ├── currency.controller.ts
│   ├── dto/
│   │   ├── update-currency-config.dto.ts
│   │   └── currency-response.dto.ts
│   ├── guards/
│   │   └── admin-only.guard.ts
│   └── decorators/
│       └── currency.decorator.ts
├── common/
│   ├── services/
│   │   └── currency-formatter.service.ts  // Currency formatting utilities
│   └── interceptors/
│       └── currency.interceptor.ts  // Auto-inject currency into responses
```

#### Core Service Implementation

```typescript
// currency.service.ts
@Injectable()
export class CurrencyService {
  private currencyCache: CurrencyConfiguration | null = null;
  private readonly CACHE_TTL = 60000; // 1 minute
  private lastCacheUpdate = 0;

  constructor(private prisma: PrismaService) {}

  /**
   * Get current platform currency configuration
   * Uses caching to avoid repeated DB queries
   */
  async getCurrencyConfig(): Promise<CurrencyConfiguration> {
    const now = Date.now();

    if (this.currencyCache && (now - this.lastCacheUpdate) < this.CACHE_TTL) {
      return this.currencyCache;
    }

    let config = await this.prisma.currencyConfiguration.findFirst();

    if (!config) {
      // Initialize with defaults if not exists
      config = await this.prisma.currencyConfiguration.create({
        data: {
          defaultCurrency: 'USD',
          supportedCurrencies: ['USD', 'NGN', 'GBP', 'EUR'],
          currencySymbol: '$',
          currencyPosition: 'before',
        },
      });
    }

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
  ): Promise<CurrencyConfiguration> {
    // Validate currency code
    if (dto.defaultCurrency && !this.isValidCurrencyCode(dto.defaultCurrency)) {
      throw new BadRequestException('Invalid currency code');
    }

    // Get current config
    const config = await this.getCurrencyConfig();

    // Update configuration
    const updated = await this.prisma.currencyConfiguration.update({
      where: { id: config.id },
      data: {
        ...dto,
        updatedBy: adminId,
      },
    });

    // Clear cache
    this.currencyCache = null;

    // Emit event for currency change (for audit/notifications)
    // EventEmitter can be used here

    return updated;
  }

  /**
   * Get default currency code
   */
  async getDefaultCurrency(): Promise<string> {
    const config = await this.getCurrencyConfig();
    return config.defaultCurrency;
  }

  /**
   * Format amount with currency
   */
  async formatAmount(amountCents: number): Promise<string> {
    const config = await this.getCurrencyConfig();
    const amount = amountCents / 100;

    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });

    return config.currencyPosition === 'before'
      ? `${config.currencySymbol}${formatted}`
      : `${formatted}${config.currencySymbol}`;
  }

  /**
   * Validate ISO 4217 currency code
   */
  private isValidCurrencyCode(code: string): boolean {
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR',
      'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SEK', 'NZD'
      // Add more as needed
    ];
    return validCurrencies.includes(code.toUpperCase());
  }

  /**
   * Get currency symbol for a given code
   */
  getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵',
      KES: 'KSh', ZAR: 'R', JPY: '¥', CNY: '¥',
    };
    return symbols[currencyCode] || currencyCode;
  }
}
```

#### Controller Implementation

```typescript
// currency.controller.ts
@Controller('currency')
@ApiTags('Currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get current currency configuration' })
  async getCurrencyConfig() {
    return this.currencyService.getCurrencyConfig();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default currency code' })
  async getDefaultCurrency() {
    const currency = await this.currencyService.getDefaultCurrency();
    return { currency };
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update currency configuration (Admin only)' })
  async updateCurrencyConfig(
    @CurrentUser() user: any,
    @Body() dto: UpdateCurrencyConfigDto,
  ) {
    return this.currencyService.updateCurrencyConfig(dto, user.id);
  }

  @Get('supported')
  @ApiOperation({ summary: 'Get list of supported currencies' })
  async getSupportedCurrencies() {
    const config = await this.currencyService.getCurrencyConfig();
    return {
      currencies: config.supportedCurrencies.map(code => ({
        code,
        symbol: this.currencyService.getCurrencySymbol(code),
        name: this.getCurrencyName(code),
      })),
    };
  }

  private getCurrencyName(code: string): string {
    const names: Record<string, string> = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      NGN: 'Nigerian Naira',
      GHS: 'Ghanaian Cedi',
      KES: 'Kenyan Shilling',
      ZAR: 'South African Rand',
    };
    return names[code] || code;
  }
}
```

#### DTOs

```typescript
// dto/update-currency-config.dto.ts
export class UpdateCurrencyConfigDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @ApiProperty({ example: 'USD' })
  defaultCurrency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['USD', 'NGN', 'EUR'] })
  supportedCurrencies?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '$' })
  currencySymbol?: string;

  @IsOptional()
  @IsEnum(['before', 'after'])
  @ApiProperty({ example: 'before' })
  currencyPosition?: 'before' | 'after';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  @ApiProperty({ example: 2 })
  decimalPlaces?: number;
}
```

---

### 3. Integration Points

#### A. Update Existing Services

**TicketingService** - Use default currency when creating tickets:

```typescript
async createTicketType(dto: CreateTicketTypeDto) {
  const currency = await this.currencyService.getDefaultCurrency();

  return this.prisma.ticketType.create({
    data: {
      ...dto,
      currency, // Use platform default
    },
  });
}
```

**OrdersService** - Inherit currency from ticket type or use default:

```typescript
async createOrder(dto: CreateOrderDto) {
  const currency = await this.currencyService.getDefaultCurrency();

  // Validate all items use same currency
  const ticketTypes = await this.prisma.ticketType.findMany({
    where: { id: { in: itemIds } },
  });

  const currencies = [...new Set(ticketTypes.map(t => t.currency))];
  if (currencies.length > 1) {
    throw new BadRequestException('Cannot mix currencies in single order');
  }

  return this.prisma.order.create({
    data: {
      ...dto,
      currency: currencies[0] || currency,
    },
  });
}
```

#### B. Add Currency Decorator

```typescript
// decorators/currency.decorator.ts
export const Currency = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const currencyService = request.currencyService;
    return await currencyService.getDefaultCurrency();
  },
);

// Usage in controllers:
@Post()
async create(
  @Currency() currency: string,
  @Body() dto: CreateTicketTypeDto,
) {
  // currency is automatically injected
}
```

---

### 4. Frontend Implementation

#### A. Currency Context/Hook

```typescript
// lib/hooks/use-currency.ts
import { create } from 'zustand';

interface CurrencyConfig {
  defaultCurrency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
}

interface CurrencyStore {
  config: CurrencyConfig | null;
  loading: boolean;
  fetchConfig: () => Promise<void>;
  formatAmount: (cents: number) => string;
}

export const useCurrency = create<CurrencyStore>((set, get) => ({
  config: null,
  loading: false,

  fetchConfig: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/currency/config');
      const config = await response.json();
      set({ config, loading: false });
    } catch (error) {
      console.error('Failed to fetch currency config:', error);
      set({ loading: false });
    }
  },

  formatAmount: (cents: number) => {
    const { config } = get();
    if (!config) return `${cents / 100}`;

    const amount = cents / 100;
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });

    return config.currencyPosition === 'before'
      ? `${config.currencySymbol}${formatted}`
      : `${formatted}${config.currencySymbol}`;
  },
}));
```

#### B. Currency Display Component

```typescript
// components/ui/currency-display.tsx
'use client';

import { useCurrency } from '@/lib/hooks/use-currency';
import { useEffect } from 'react';

interface CurrencyDisplayProps {
  amountCents: number;
  className?: string;
}

export function CurrencyDisplay({ amountCents, className }: CurrencyDisplayProps) {
  const { config, fetchConfig, formatAmount } = useCurrency();

  useEffect(() => {
    if (!config) {
      fetchConfig();
    }
  }, [config, fetchConfig]);

  if (!config) {
    return <span className={className}>{amountCents / 100}</span>;
  }

  return <span className={className}>{formatAmount(amountCents)}</span>;
}
```

#### C. Admin Currency Settings Page

```typescript
// app/(admin)/admin/settings/currency/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { currencyApi } from '@/lib/api/currency-api';

export default function CurrencySettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const data = await currencyApi.getConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleUpdate = async (updates) => {
    await currencyApi.updateConfig(updates);
    await loadConfig();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Currency Settings</h1>

      {/* Currency selector */}
      {/* Symbol configuration */}
      {/* Decimal places */}
      {/* Preview */}
    </div>
  );
}
```

---

## 📝 Implementation Steps

### Phase 1: Database & Core Backend (Week 1)

**Step 1: Create Database Schema**
- [ ] Add `CurrencyConfiguration` model to Prisma schema
- [ ] Add `ExchangeRate` model (for future)
- [ ] Create and run migration
- [ ] Seed initial configuration

**Step 2: Build Currency Service**
- [ ] Create `CurrencyModule`, `CurrencyService`, `CurrencyController`
- [ ] Implement caching mechanism
- [ ] Add validation for currency codes
- [ ] Create DTOs

**Step 3: Create API Endpoints**
- [ ] `GET /api/currency/config` - Get configuration
- [ ] `GET /api/currency/default` - Get default currency
- [ ] `PATCH /api/currency/config` - Update (admin only)
- [ ] `GET /api/currency/supported` - List supported currencies

**Step 4: Add Admin Guard**
- [ ] Verify AdminGuard exists or create it
- [ ] Protect currency update endpoint

### Phase 2: Integration (Week 2)

**Step 5: Update Existing Services**
- [ ] Modify `TicketingService` to use default currency
- [ ] Update `OrdersService` to use default currency
- [ ] Update `PaymentService` to validate currency
- [ ] Update `PayoutService` to use default currency

**Step 6: Add Currency Decorator**
- [ ] Create `@Currency()` decorator
- [ ] Update controllers to use decorator where needed

**Step 7: Update DTOs**
- [ ] Make `currency` field optional in DTOs
- [ ] Add validation to ensure consistency

### Phase 3: Frontend (Week 3)

**Step 8: Create Currency Hook**
- [ ] Build `useCurrency` Zustand store
- [ ] Add currency fetching logic
- [ ] Implement formatting helper

**Step 9: Build UI Components**
- [ ] Create `CurrencyDisplay` component
- [ ] Create `CurrencySelector` component
- [ ] Add currency symbols mapping

**Step 10: Admin Settings Page**
- [ ] Design currency settings UI
- [ ] Implement update functionality
- [ ] Add preview/validation

**Step 11: Update Existing Pages**
- [ ] Replace hardcoded currency displays
- [ ] Use `CurrencyDisplay` component
- [ ] Test on all payment flows

### Phase 4: Testing & Documentation (Week 4)

**Step 12: Testing**
- [ ] Unit tests for CurrencyService
- [ ] Integration tests for currency endpoints
- [ ] E2E tests for currency changes
- [ ] Test payment flows with different currencies

**Step 13: Documentation**
- [ ] API documentation (Swagger)
- [ ] Admin user guide
- [ ] Developer documentation
- [ ] Migration guide for existing data

**Step 14: Data Migration**
- [ ] Script to update existing records
- [ ] Backup strategy
- [ ] Rollback plan

---

## 🔄 Data Migration Strategy

### Migration Script

```typescript
// scripts/migrate-currency.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCurrency() {
  console.log('Starting currency migration...');

  // 1. Create default currency configuration
  const config = await prisma.currencyConfiguration.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'NGN', 'EUR', 'GBP'],
      currencySymbol: '$',
      currencyPosition: 'before',
    },
    update: {},
  });

  console.log(`Default currency set to: ${config.defaultCurrency}`);

  // 2. Update all records with null/empty currency
  const updates = await Promise.all([
    prisma.ticketType.updateMany({
      where: { OR: [{ currency: null }, { currency: '' }] },
      data: { currency: config.defaultCurrency },
    }),
    prisma.order.updateMany({
      where: { OR: [{ currency: null }, { currency: '' }] },
      data: { currency: config.defaultCurrency },
    }),
    // ... repeat for other models
  ]);

  console.log('Migration completed successfully!');
  console.log('Updated records:', updates);
}

migrateCurrency()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 🌍 Multi-Currency Support (Future Enhancement)

### Phase 5: Multi-Currency (Optional - Future)

This lays the groundwork for allowing organizers to price in different currencies:

1. **Organizer-Level Currency**:
   ```prisma
   model Organization {
     // ...
     preferredCurrency String @default("USD")
   }
   ```

2. **Real-Time Exchange Rates**:
   - Integrate with exchange rate API (e.g., exchangerate-api.io)
   - Auto-update rates daily
   - Display prices in user's local currency

3. **Currency Conversion**:
   ```typescript
   async convertCurrency(
     amount: number,
     fromCurrency: string,
     toCurrency: string,
   ): Promise<number> {
     const rate = await this.getExchangeRate(fromCurrency, toCurrency);
     return Math.round(amount * rate);
   }
   ```

---

## ⚠️ Considerations & Best Practices

### 1. **Currency Change Impact**
- Changing currency affects existing unpaid orders
- Need strategy: cancel old orders or honor old currency
- Recommendation: Allow grace period for old orders

### 2. **Payment Provider Compatibility**
- **Stripe**: Supports 135+ currencies
- **Paystack**: Primarily NGN, GHS, ZAR, USD
- Validate currency is supported by selected payment provider

### 3. **Decimal Places**
- Some currencies have no decimals (JPY, KRW)
- Some have 3 decimals (BHD, KWD)
- Store amounts in smallest unit (cents/kobo) to avoid float issues

### 4. **Audit Trail**
- Log all currency configuration changes
- Track which admin made changes
- Notify stakeholders of currency changes

### 5. **Caching**
- Cache currency config (1-5 minute TTL)
- Invalidate cache on updates
- Use Redis for distributed systems

---

## 📊 Database Schema Summary

```prisma
// Add to schema.prisma

model CurrencyConfiguration {
  id                    String   @id @default(cuid())
  defaultCurrency       String   @default("USD")
  supportedCurrencies   String[] @default(["USD", "NGN", "GBP", "EUR"])
  currencySymbol        String   @default("$")
  currencyPosition      String   @default("before")
  decimalSeparator      String   @default(".")
  thousandsSeparator    String   @default(",")
  decimalPlaces         Int      @default(2)
  exchangeRatesEnabled  Boolean  @default(false)
  exchangeRateProvider  String?
  lastRateUpdate        DateTime?
  updatedBy             String?
  updatedByUser         User?    @relation(fields: [updatedBy], references: [id])
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("currency_configuration")
}

model ExchangeRate {
  id              String   @id @default(cuid())
  fromCurrency    String
  toCurrency      String
  rate            Decimal  @db.Decimal(18, 6)
  source          String   @default("manual")
  validFrom       DateTime @default(now())
  validUntil      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([fromCurrency, toCurrency])
  @@map("exchange_rates")
}

// Add to existing User model
model User {
  // ... existing fields
  currencyConfigUpdates CurrencyConfiguration[]
}
```

---

## 🎯 Success Metrics

- [ ] Single source of truth for currency
- [ ] Admin can change currency in < 30 seconds
- [ ] All prices display consistently
- [ ] Payment providers work with selected currency
- [ ] Currency formatting is correct everywhere
- [ ] Performance impact < 50ms per request

---

## 📚 Resources

- ISO 4217 Currency Codes: https://www.iso.org/iso-4217-currency-codes.html
- Stripe Supported Currencies: https://stripe.com/docs/currencies
- Paystack Supported Currencies: https://paystack.com/docs/payments/multi-currency-payments/
- Exchange Rate API: https://exchangerate-api.com/

---

## 🚀 Quick Start (Recommended MVP)

For fastest implementation:

1. **Use Simple Settings Table** (Option A)
2. **Single default currency** (no multi-currency yet)
3. **Basic admin UI** (dropdown + save button)
4. **Automatic application** (inject into all new records)
5. **Manual migration** (update existing records via script)

**Estimated Timeline**: 2-3 days for MVP

---

## Summary

This plan provides a comprehensive, scalable approach to currency management that:

✅ Centralizes currency configuration
✅ Provides admin control
✅ Maintains data consistency
✅ Supports future multi-currency
✅ Integrates with payment providers
✅ Includes migration strategy
✅ Has clear implementation steps

**Recommended Next Step**: Review and approve architecture, then proceed with Phase 1 implementation.
