# Payment Provider Admin Control - Implementation Plan

## Executive Summary

This document outlines the plan to implement a feature that allows platform administrators to enable/disable payment providers (Stripe, Paystack, Test) that are available for event organizers and attendees to use.

## Current Architecture Analysis

### Payment System Overview

**Current State:**
- **Payment Providers**: Stripe, Paystack, Test
- **Provider Registration**: All providers are injected via dependency injection in `OrdersModule`
- **Provider Selection**: Per-order basis via `CreatePaymentDto.provider` field
- **Configuration**: Environment variables only (no database configuration)
- **Availability**: All configured providers are always available

**Key Files:**
- `api/src/orders/services/payment.service.ts` - Central payment orchestration
- `api/src/orders/providers/stripe/stripe.service.ts` - Stripe implementation
- `api/src/orders/providers/paystack/paystack.service.ts` - Paystack implementation
- `api/src/orders/providers/test/test-payment.provider.ts` - Test provider
- `api/src/orders/providers/payment-provider.interface.ts` - Provider interface
- `api/src/orders/orders.module.ts` - Module with provider registration
- `api/src/webhooks/stripe-webhook.controller.ts` - Stripe webhooks
- `api/src/webhooks/paystack-webhook.controller.ts` - Paystack webhooks

**Payment Flow:**
1. User creates order → `POST /orders`
2. User initiates payment → `POST /orders/:id/payment` with `provider` field
3. `PaymentService.createPaymentIntent()` validates and selects provider
4. Provider initializes payment (creates intent/transaction)
5. Frontend handles payment UI
6. User confirms payment → `POST /orders/:id/payment/process`
7. `PaymentService.processPayment()` confirms with provider
8. Webhook confirms payment asynchronously

**Current Limitations:**
- ❌ No database-level provider configuration
- ❌ No admin control to enable/disable providers
- ❌ No audit trail for provider configuration changes
- ❌ No per-organization provider preferences
- ❌ No frontend visibility into which providers are enabled
- ❌ All environment-configured providers are always available

## Feature Requirements

### Functional Requirements

**FR1: Database Schema**
- Create `PaymentProviderConfig` table to store provider configuration
- Track: provider name, enabled status, display name, description, settings, priority
- Store provider-specific metadata (supported currencies, countries, fees)

**FR2: Admin API Endpoints**
- `GET /admin/payment-providers` - List all payment providers with status
- `GET /admin/payment-providers/:provider` - Get specific provider details
- `PATCH /admin/payment-providers/:provider` - Update provider configuration
- `POST /admin/payment-providers/:provider/enable` - Enable a provider
- `POST /admin/payment-providers/:provider/disable` - Disable a provider
- `GET /admin/payment-providers/:provider/test-connection` - Test provider credentials

**FR3: Payment Service Integration**
- Modify `PaymentService` to check provider enabled status before use
- Filter available providers based on configuration
- Provide method to list available providers for frontend

**FR4: Public API Endpoints**
- `GET /payment-providers/available` - List enabled providers for users
- Include provider metadata (name, display name, supported currencies)

**FR5: Admin UI** (Frontend)
- Payment provider management page in admin dashboard
- Enable/disable toggle switches for each provider
- Display provider status, configuration, and metadata
- Test connection functionality
- Audit log viewer for configuration changes

**FR6: Audit Logging**
- Log all provider configuration changes
- Track: who made change, when, what changed, old/new values
- Link to existing `AuditLog` system

**FR7: Error Handling**
- Graceful degradation if all providers are disabled
- Clear error messages for users when selected provider is disabled
- Prevent disabling all providers (at least one must be enabled)
- Handle provider errors during payment processing

**FR8: Backward Compatibility**
- Existing orders with disabled providers should still be viewable
- Refunds for orders made with now-disabled providers should work
- Webhooks for disabled providers should still be processed

### Non-Functional Requirements

**NFR1: Performance**
- Cache provider configuration to avoid database queries on every payment
- Invalidate cache when configuration changes
- Load provider config at application startup

**NFR2: Security**
- Only platform admins can modify provider configuration
- Sensitive provider settings (API keys) stored in environment, not database
- Audit all configuration changes

**NFR3: Scalability**
- Support adding new providers without code changes to admin system
- Configuration schema flexible enough for provider-specific settings

**NFR4: Reliability**
- Default to all providers enabled if configuration is missing
- Prevent payment system failure if provider config is corrupted

## Implementation Plan

### Phase 1: Database Schema and Migrations

#### 1.1 Create Prisma Schema

**File**: `api/prisma/schema.prisma`

```prisma
model PaymentProviderConfig {
  id                String   @id @default(cuid())
  provider          String   @unique // 'stripe', 'paystack', 'test'
  enabled           Boolean  @default(true)
  displayName       String   @map("display_name") // 'Stripe', 'Paystack'
  description       String?  // Short description for admin UI
  logoUrl           String?  @map("logo_url") // Provider logo
  supportedCurrencies String[] @map("supported_currencies") // ['USD', 'EUR', 'NGN']
  supportedCountries  String[] @map("supported_countries") // ['US', 'NG', 'GB']
  priority          Int      @default(0) // Display order (higher = first)

  // Provider-specific settings (JSON)
  settings          Json?    // { "minAmount": 100, "maxAmount": 1000000, ... }

  // Metadata
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  lastEnabledAt     DateTime? @map("last_enabled_at")
  lastDisabledAt    DateTime? @map("last_disabled_at")
  lastEnabledBy     String?  @map("last_enabled_by") // Admin user ID
  lastDisabledBy    String?  @map("last_disabled_by") // Admin user ID

  @@map("payment_provider_config")
  @@index([enabled])
  @@index([priority])
}
```

#### 1.2 Create Migration

**Command**: `npx prisma migrate dev --name add_payment_provider_config`

**Migration File**: `api/prisma/migrations/[timestamp]_add_payment_provider_config/migration.sql`

```sql
-- CreateTable
CREATE TABLE "payment_provider_config" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "supported_currencies" TEXT[],
    "supported_countries" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_enabled_at" TIMESTAMP(3),
    "last_disabled_at" TIMESTAMP(3),
    "last_enabled_by" TEXT,
    "last_disabled_by" TEXT,

    CONSTRAINT "payment_provider_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_provider_config_provider_key" ON "payment_provider_config"("provider");
CREATE INDEX "payment_provider_config_enabled_idx" ON "payment_provider_config"("enabled");
CREATE INDEX "payment_provider_config_priority_idx" ON "payment_provider_config"("priority");
```

#### 1.3 Seed Default Provider Configuration

**File**: `api/prisma/seed.ts` (append to existing seed)

```typescript
// Seed payment provider configuration
const stripeConfig = await prisma.paymentProviderConfig.upsert({
  where: { provider: 'stripe' },
  create: {
    provider: 'stripe',
    enabled: true,
    displayName: 'Stripe',
    description: 'Accept payments globally with credit/debit cards',
    logoUrl: '/logos/stripe.svg',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportedCountries: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT'],
    priority: 100,
    settings: {
      minAmountCents: 50, // $0.50 minimum
      maxAmountCents: 99999900, // $999,999 maximum
      processingFee: 2.9, // 2.9% + $0.30
      fixedFeeCents: 30,
    },
  },
  update: {},
});

const paystackConfig = await prisma.paymentProviderConfig.upsert({
  where: { provider: 'paystack' },
  create: {
    provider: 'paystack',
    enabled: true,
    displayName: 'Paystack',
    description: 'Accept payments in Africa with cards and mobile money',
    logoUrl: '/logos/paystack.svg',
    supportedCurrencies: ['NGN', 'GHS', 'ZAR', 'USD'],
    supportedCountries: ['NG', 'GH', 'ZA', 'KE'],
    priority: 90,
    settings: {
      minAmountCents: 10000, // ₦100 minimum
      maxAmountCents: 10000000000, // ₦100,000,000 maximum
      processingFee: 1.5, // 1.5% + ₦100
      fixedFeeCents: 10000,
    },
  },
  update: {},
});

const testConfig = await prisma.paymentProviderConfig.upsert({
  where: { provider: 'test' },
  create: {
    provider: 'test',
    enabled: process.env.NODE_ENV === 'development',
    displayName: 'Test Payment Provider',
    description: 'Test provider for development and testing',
    supportedCurrencies: ['USD', 'EUR', 'NGN'],
    supportedCountries: ['*'], // All countries
    priority: 0, // Lowest priority
    settings: {
      minAmountCents: 1,
      maxAmountCents: Number.MAX_SAFE_INTEGER,
    },
  },
  update: {},
});

console.log('Payment provider configuration seeded:', {
  stripe: stripeConfig.provider,
  paystack: paystackConfig.provider,
  test: testConfig.provider,
});
```

### Phase 2: Backend Services

#### 2.1 Create Payment Provider Config Service

**File**: `api/src/admin/services/payment-provider-config.service.ts`

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePaymentProviderDto } from '../dto/update-payment-provider.dto';
import { AuditLogService } from '../../common/audit-log/audit-log.service';

@Injectable()
export class PaymentProviderConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getAll() {
    return this.prisma.paymentProviderConfig.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  async getByProvider(provider: string) {
    const config = await this.prisma.paymentProviderConfig.findUnique({
      where: { provider: provider.toLowerCase() },
    });

    if (!config) {
      throw new NotFoundException(`Payment provider '${provider}' not found`);
    }

    return config;
  }

  async getEnabledProviders() {
    return this.prisma.paymentProviderConfig.findMany({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
    });
  }

  async updateProvider(
    provider: string,
    dto: UpdatePaymentProviderDto,
    adminUserId: string,
  ) {
    const existing = await this.getByProvider(provider);

    const updated = await this.prisma.paymentProviderConfig.update({
      where: { provider: provider.toLowerCase() },
      data: {
        enabled: dto.enabled ?? existing.enabled,
        displayName: dto.displayName ?? existing.displayName,
        description: dto.description ?? existing.description,
        logoUrl: dto.logoUrl ?? existing.logoUrl,
        supportedCurrencies: dto.supportedCurrencies ?? existing.supportedCurrencies,
        supportedCountries: dto.supportedCountries ?? existing.supportedCountries,
        priority: dto.priority ?? existing.priority,
        settings: dto.settings ?? existing.settings,
        lastEnabledAt: dto.enabled === true ? new Date() : existing.lastEnabledAt,
        lastDisabledAt: dto.enabled === false ? new Date() : existing.lastDisabledAt,
        lastEnabledBy: dto.enabled === true ? adminUserId : existing.lastEnabledBy,
        lastDisabledBy: dto.enabled === false ? adminUserId : existing.lastDisabledBy,
      },
    });

    // Audit log
    await this.auditLog.log({
      userId: adminUserId,
      action: 'payment_provider_updated',
      resourceType: 'payment_provider_config',
      resourceId: updated.id,
      metadata: {
        provider: updated.provider,
        changes: dto,
        oldEnabled: existing.enabled,
        newEnabled: updated.enabled,
      },
    });

    return updated;
  }

  async enableProvider(provider: string, adminUserId: string) {
    return this.updateProvider(provider, { enabled: true }, adminUserId);
  }

  async disableProvider(provider: string, adminUserId: string) {
    // Ensure at least one provider remains enabled
    const enabledCount = await this.prisma.paymentProviderConfig.count({
      where: { enabled: true },
    });

    if (enabledCount === 1) {
      const lastEnabled = await this.prisma.paymentProviderConfig.findFirst({
        where: { enabled: true },
      });

      if (lastEnabled?.provider === provider.toLowerCase()) {
        throw new BadRequestException(
          'Cannot disable the last enabled payment provider. At least one provider must remain active.',
        );
      }
    }

    return this.updateProvider(provider, { enabled: false }, adminUserId);
  }

  async isProviderEnabled(provider: string): Promise<boolean> {
    const config = await this.prisma.paymentProviderConfig.findUnique({
      where: { provider: provider.toLowerCase() },
      select: { enabled: true },
    });

    // Default to true if not configured (backward compatibility)
    return config?.enabled ?? true;
  }
}
```

#### 2.2 Create DTOs

**File**: `api/src/admin/dto/update-payment-provider.dto.ts`

```typescript
import { IsBoolean, IsString, IsOptional, IsArray, IsInt, IsObject, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaymentProviderDto {
  @ApiPropertyOptional({ description: 'Enable or disable the provider' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Display name for the provider' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description of the provider' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Supported currencies (ISO codes)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedCurrencies?: string[];

  @ApiPropertyOptional({ description: 'Supported countries (ISO codes)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedCountries?: string[];

  @ApiPropertyOptional({ description: 'Display priority (higher = first)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Provider-specific settings (JSON)' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
```

#### 2.3 Modify PaymentService to Check Provider Status

**File**: `api/src/orders/services/payment.service.ts`

Add provider status checking:

```typescript
import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PAYMENT_PROVIDERS } from '../tokens';
import { PaymentProvider, PaymentProviderName } from '../providers/payment-provider.interface';

@Injectable()
export class PaymentService {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;
  private providerConfigCache: Map<string, { enabled: boolean; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    @Inject(PAYMENT_PROVIDERS) paymentProviders: PaymentProvider[],
  ) {
    this.providers = paymentProviders.reduce(
      (acc, provider) => {
        acc[provider.name] = provider;
        return acc;
      },
      {} as Record<PaymentProviderName, PaymentProvider>,
    );
  }

  // New method: Get enabled providers
  async getAvailableProviders() {
    const configs = await this.prisma.paymentProviderConfig.findMany({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
      select: {
        provider: true,
        displayName: true,
        description: true,
        logoUrl: true,
        supportedCurrencies: true,
        supportedCountries: true,
        priority: true,
      },
    });

    // Filter by providers that actually exist in code
    return configs.filter((config) =>
      this.providers[config.provider as PaymentProviderName]
    );
  }

  // New method: Check if provider is enabled (with caching)
  private async isProviderEnabled(provider: string): Promise<boolean> {
    const normalizedProvider = provider.toLowerCase();
    const cached = this.providerConfigCache.get(normalizedProvider);
    const now = Date.now();

    // Return cached value if still fresh
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.enabled;
    }

    // Fetch from database
    const config = await this.prisma.paymentProviderConfig.findUnique({
      where: { provider: normalizedProvider },
      select: { enabled: true },
    });

    const enabled = config?.enabled ?? true; // Default to true if not configured

    // Update cache
    this.providerConfigCache.set(normalizedProvider, { enabled, timestamp: now });

    return enabled;
  }

  // New method: Invalidate provider cache (call when config changes)
  invalidateProviderCache(provider?: string) {
    if (provider) {
      this.providerConfigCache.delete(provider.toLowerCase());
    } else {
      this.providerConfigCache.clear();
    }
  }

  // Modified method: Add provider enabled check
  private async getProvider(provider: string): Promise<PaymentProvider> {
    const normalized = provider.toLowerCase() as PaymentProviderName;
    const resolved = this.providers[normalized];

    if (!resolved) {
      throw new BadRequestException(`Invalid payment provider: ${provider}`);
    }

    // Check if provider is enabled in configuration
    const isEnabled = await this.isProviderEnabled(normalized);
    if (!isEnabled) {
      throw new BadRequestException(
        `Payment provider '${provider}' is currently unavailable. Please select another payment method.`
      );
    }

    return resolved;
  }

  // Existing methods continue to work but now check provider status
  async createPaymentIntent(orderId: string, dto: CreatePaymentDto) {
    // ... existing validation ...

    // getProvider() now checks if provider is enabled
    const provider = await this.getProvider(dto.provider);

    // ... rest of existing logic ...
  }

  async processPayment(orderId: string, dto: ProcessPaymentDto) {
    // Find payment
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Note: We don't check if provider is enabled here because we need to
    // process payments for orders even if provider is later disabled
    const provider = this.providers[payment.provider as PaymentProviderName];

    if (!provider) {
      throw new BadRequestException(`Invalid payment provider: ${payment.provider}`);
    }

    // ... rest of existing logic ...
  }

  async refundPayment(payment: Payment, amountCents?: number) {
    // Allow refunds even if provider is disabled (backward compatibility)
    const provider = this.providers[payment.provider as PaymentProviderName];

    if (!provider) {
      throw new BadRequestException(`Invalid payment provider: ${payment.provider}`);
    }

    // ... rest of existing logic ...
  }
}
```

#### 2.4 Create Admin Controller Endpoints

**File**: `api/src/admin/controllers/payment-providers-admin.controller.ts`

```typescript
import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PaymentProviderConfigService } from '../services/payment-provider-config.service';
import { UpdatePaymentProviderDto } from '../dto/update-payment-provider.dto';

@ApiTags('Admin - Payment Providers')
@ApiBearerAuth()
@Controller('admin/payment-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PaymentProvidersAdminController {
  constructor(
    private readonly providerConfigService: PaymentProviderConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all payment providers' })
  @ApiResponse({ status: 200, description: 'List of payment providers' })
  async listProviders() {
    return this.providerConfigService.getAll();
  }

  @Get(':provider')
  @ApiOperation({ summary: 'Get payment provider details' })
  @ApiResponse({ status: 200, description: 'Payment provider details' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProvider(@Param('provider') provider: string) {
    return this.providerConfigService.getByProvider(provider);
  }

  @Patch(':provider')
  @ApiOperation({ summary: 'Update payment provider configuration' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async updateProvider(
    @Param('provider') provider: string,
    @Body() dto: UpdatePaymentProviderDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.providerConfigService.updateProvider(provider, dto, adminUserId);
  }

  @Post(':provider/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a payment provider' })
  @ApiResponse({ status: 200, description: 'Provider enabled successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async enableProvider(
    @Param('provider') provider: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.providerConfigService.enableProvider(provider, adminUserId);
  }

  @Post(':provider/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a payment provider' })
  @ApiResponse({ status: 200, description: 'Provider disabled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot disable last provider' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async disableProvider(
    @Param('provider') provider: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.providerConfigService.disableProvider(provider, adminUserId);
  }
}
```

#### 2.5 Create Public API Endpoint for Available Providers

**File**: `api/src/orders/controllers/payment-providers.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';

@ApiTags('Payment Providers')
@Controller('payment-providers')
export class PaymentProvidersController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available payment providers' })
  @ApiResponse({
    status: 200,
    description: 'List of enabled payment providers',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          provider: { type: 'string', example: 'stripe' },
          displayName: { type: 'string', example: 'Stripe' },
          description: { type: 'string', example: 'Accept payments globally' },
          logoUrl: { type: 'string', example: '/logos/stripe.svg' },
          supportedCurrencies: { type: 'array', items: { type: 'string' } },
          supportedCountries: { type: 'array', items: { type: 'string' } },
          priority: { type: 'number', example: 100 },
        },
      },
    },
  })
  async getAvailableProviders() {
    return this.paymentService.getAvailableProviders();
  }
}
```

#### 2.6 Update Admin Module

**File**: `api/src/admin/admin.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PaymentProviderConfigService } from './services/payment-provider-config.service';
import { PaymentProvidersAdminController } from './controllers/payment-providers-admin.controller';
// ... other imports

@Module({
  imports: [CommonModule],
  providers: [
    // ... existing services
    PaymentProviderConfigService,
  ],
  controllers: [
    // ... existing controllers
    PaymentProvidersAdminController,
  ],
  exports: [PaymentProviderConfigService],
})
export class AdminModule {}
```

#### 2.7 Update Orders Module

**File**: `api/src/orders/orders.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { OrdersService } from './orders.service';
import { PaymentService } from './services/payment.service';
import { OrdersController } from './orders.controller';
import { PaymentProvidersController } from './controllers/payment-providers.controller';
// ... other imports

@Module({
  imports: [CommonModule, PromotionsModule],
  providers: [
    OrdersService,
    PaymentService,
    // ... payment providers
  ],
  controllers: [
    OrdersController,
    PaymentProvidersController, // NEW
  ],
  exports: [OrdersService, PaymentService],
})
export class OrdersModule {}
```

### Phase 3: Frontend Implementation

#### 3.1 Admin Payment Providers Page

**File**: `frontend/web-app/app/(admin)/admin/settings/payment-providers/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface PaymentProvider {
  id: string;
  provider: string;
  enabled: boolean;
  displayName: string;
  description: string | null;
  logoUrl: string | null;
  supportedCurrencies: string[];
  supportedCountries: string[];
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastEnabledAt: string | null;
  lastDisabledAt: string | null;
}

export default function PaymentProvidersPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get('/admin/payment-providers');
      setProviders(response.data);
    } catch (error) {
      toast.error('Failed to load payment providers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (provider: PaymentProvider) => {
    setToggling(provider.provider);
    try {
      const endpoint = provider.enabled ? 'disable' : 'enable';
      await apiClient.post(`/admin/payment-providers/${provider.provider}/${endpoint}`);

      toast.success(
        `${provider.displayName} ${provider.enabled ? 'disabled' : 'enabled'} successfully`
      );

      await fetchProviders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update provider');
      console.error(error);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Providers</h1>
        <p className="text-gray-600 mt-1">
          Manage which payment providers are available for event organizers and attendees
        </p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="border border-gray-200 rounded-lg p-6 bg-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {provider.logoUrl && (
                  <img
                    src={provider.logoUrl}
                    alt={provider.displayName}
                    className="h-12 w-12 object-contain"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {provider.displayName}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        provider.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {provider.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {provider.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {provider.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>
                      Currencies: {provider.supportedCurrencies.join(', ')}
                    </span>
                    <span>
                      Priority: {provider.priority}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleProvider(provider)}
                disabled={toggling === provider.provider}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  provider.enabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {toggling === provider.provider
                  ? 'Updating...'
                  : provider.enabled
                  ? 'Disable'
                  : 'Enable'}
              </button>
            </div>

            {(provider.lastEnabledAt || provider.lastDisabledAt) && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                {provider.enabled && provider.lastEnabledAt && (
                  <p>Last enabled: {new Date(provider.lastEnabledAt).toLocaleString()}</p>
                )}
                {!provider.enabled && provider.lastDisabledAt && (
                  <p>Last disabled: {new Date(provider.lastDisabledAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No payment providers configured</p>
        </div>
      )}
    </div>
  );
}
```

#### 3.2 Update Payment Selection Component

**File**: `frontend/web-app/components/checkout/payment-provider-selector.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface AvailableProvider {
  provider: string;
  displayName: string;
  description: string | null;
  logoUrl: string | null;
  supportedCurrencies: string[];
  supportedCountries: string[];
  priority: number;
}

interface PaymentProviderSelectorProps {
  selectedProvider: string | null;
  onProviderSelect: (provider: string) => void;
  currency?: string;
  country?: string;
}

export function PaymentProviderSelector({
  selectedProvider,
  onProviderSelect,
  currency = 'USD',
  country,
}: PaymentProviderSelectorProps) {
  const [providers, setProviders] = useState<AvailableProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableProviders();
  }, []);

  const fetchAvailableProviders = async () => {
    try {
      const response = await apiClient.get('/payment-providers/available');
      let filteredProviders = response.data;

      // Filter by currency if provided
      if (currency) {
        filteredProviders = filteredProviders.filter((p: AvailableProvider) =>
          p.supportedCurrencies.includes(currency)
        );
      }

      // Filter by country if provided
      if (country) {
        filteredProviders = filteredProviders.filter((p: AvailableProvider) =>
          p.supportedCountries.includes(country) || p.supportedCountries.includes('*')
        );
      }

      setProviders(filteredProviders);

      // Auto-select first provider if none selected
      if (!selectedProvider && filteredProviders.length > 0) {
        onProviderSelect(filteredProviders[0].provider);
      }
    } catch (error) {
      toast.error('Failed to load payment providers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">No payment providers available</p>
        <p className="text-red-600 text-sm mt-1">
          Please contact support or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Select Payment Method
      </label>
      {providers.map((provider) => (
        <button
          key={provider.provider}
          type="button"
          onClick={() => onProviderSelect(provider.provider)}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            selectedProvider === provider.provider
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {provider.logoUrl && (
              <img
                src={provider.logoUrl}
                alt={provider.displayName}
                className="h-8 w-8 object-contain"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{provider.displayName}</p>
              {provider.description && (
                <p className="text-sm text-gray-600">{provider.description}</p>
              )}
            </div>
            {selectedProvider === provider.provider && (
              <svg
                className="h-5 w-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
```

### Phase 4: Testing and Validation

#### 4.1 Unit Tests

**File**: `api/src/admin/services/payment-provider-config.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentProviderConfigService } from './payment-provider-config.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../../common/audit-log/audit-log.service';

describe('PaymentProviderConfigService', () => {
  let service: PaymentProviderConfigService;
  let prisma: PrismaService;
  let auditLog: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentProviderConfigService,
        {
          provide: PrismaService,
          useValue: {
            paymentProviderConfig: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentProviderConfigService>(PaymentProviderConfigService);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
  });

  describe('disableProvider', () => {
    it('should prevent disabling the last enabled provider', async () => {
      jest.spyOn(prisma.paymentProviderConfig, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.paymentProviderConfig, 'findFirst').mockResolvedValue({
        id: '1',
        provider: 'stripe',
        enabled: true,
      } as any);

      await expect(
        service.disableProvider('stripe', 'admin-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow disabling when multiple providers are enabled', async () => {
      jest.spyOn(prisma.paymentProviderConfig, 'count').mockResolvedValue(2);
      jest.spyOn(prisma.paymentProviderConfig, 'findUnique').mockResolvedValue({
        id: '1',
        provider: 'stripe',
        enabled: true,
      } as any);
      jest.spyOn(prisma.paymentProviderConfig, 'update').mockResolvedValue({
        id: '1',
        provider: 'stripe',
        enabled: false,
      } as any);

      const result = await service.disableProvider('stripe', 'admin-123');
      expect(result.enabled).toBe(false);
    });
  });
});
```

#### 4.2 E2E Tests

**File**: `api/test/payment-providers-admin.e2e-spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Payment Providers Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Get admin token (assume auth is set up)
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@eventflow.dev', password: 'password' });
    adminToken = authResponse.body.access_token;
  });

  it('/admin/payment-providers (GET) - should list all providers', () => {
    return request(app.getHttpServer())
      .get('/admin/payment-providers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/admin/payment-providers/:provider/enable (POST) - should enable provider', async () => {
    // First disable it
    await prisma.paymentProviderConfig.update({
      where: { provider: 'stripe' },
      data: { enabled: false },
    });

    return request(app.getHttpServer())
      .post('/admin/payment-providers/stripe/enable')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.enabled).toBe(true);
      });
  });

  it('/admin/payment-providers/:provider/disable (POST) - should prevent disabling last provider', async () => {
    // Ensure only stripe is enabled
    await prisma.paymentProviderConfig.updateMany({
      data: { enabled: false },
    });
    await prisma.paymentProviderConfig.update({
      where: { provider: 'stripe' },
      data: { enabled: true },
    });

    return request(app.getHttpServer())
      .post('/admin/payment-providers/stripe/disable')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

#### 4.3 Manual Testing Checklist

```markdown
## Manual Testing Checklist

### Admin Panel
- [ ] List all payment providers
- [ ] Enable a disabled provider
- [ ] Disable an enabled provider
- [ ] Verify cannot disable last enabled provider
- [ ] Update provider configuration (display name, priority, etc.)
- [ ] Verify audit logs are created for all changes

### Payment Flow
- [ ] Create order with enabled provider (Stripe)
- [ ] Create order with enabled provider (Paystack)
- [ ] Attempt to create order with disabled provider (should fail)
- [ ] Complete payment with enabled provider
- [ ] Process refund for order (even if provider later disabled)
- [ ] Verify webhooks still work for disabled providers

### Frontend
- [ ] Payment provider selector shows only enabled providers
- [ ] Providers sorted by priority
- [ ] Provider logos display correctly
- [ ] Auto-selects first provider if none selected
- [ ] Shows appropriate message when no providers available
- [ ] Filters providers by currency and country

### Cache and Performance
- [ ] Verify provider status is cached (check logs)
- [ ] Verify cache invalidation when config changes
- [ ] Test with high concurrent requests
```

### Phase 5: Documentation and Deployment

#### 5.1 Update API Documentation

Add Swagger documentation to all new endpoints in controllers.

#### 5.2 Update CLAUDE.md

Add section about payment provider configuration:

```markdown
### Payment Provider Configuration

Platform administrators can enable/disable payment providers through the admin panel:

**Admin Endpoints:**
- `GET /admin/payment-providers` - List all providers
- `PATCH /admin/payment-providers/:provider` - Update provider config
- `POST /admin/payment-providers/:provider/enable` - Enable provider
- `POST /admin/payment-providers/:provider/disable` - Disable provider

**Public Endpoint:**
- `GET /payment-providers/available` - List enabled providers for users

**Configuration:**
- Provider status stored in `PaymentProviderConfig` table
- Changes are audited in `AuditLog`
- Provider status is cached for 1 minute for performance
- At least one provider must remain enabled at all times

**Frontend Integration:**
- Admin panel at `/admin/settings/payment-providers`
- User checkout shows only enabled providers
- Providers filtered by currency and country support
```

#### 5.3 Deployment Steps

```bash
# 1. Run migration
cd api
npx prisma migrate deploy

# 2. Seed provider configuration
npx prisma db seed

# 3. Build and deploy
npm run build
npm run start:prod

# 4. Verify providers are configured
curl http://localhost:3000/payment-providers/available

# 5. Test admin endpoints
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/admin/payment-providers
```

## Summary

This implementation plan provides:

### ✅ Core Features
- Database schema for payment provider configuration
- Admin API endpoints to manage providers
- Public API to list available providers
- Provider status checking in payment flow
- Cache for performance optimization
- Audit logging for all changes
- Protection against disabling all providers

### ✅ User Experience
- Frontend admin panel to toggle providers
- Clear error messages when provider unavailable
- Auto-filtering by currency and country
- Backward compatibility for existing orders

### ✅ Technical Quality
- Type-safe implementation
- Comprehensive error handling
- Unit and E2E tests
- Performance optimization with caching
- Swagger API documentation
- Audit trail for compliance

### 📋 Implementation Order
1. **Phase 1**: Database schema and migrations (1-2 hours)
2. **Phase 2**: Backend services and APIs (3-4 hours)
3. **Phase 3**: Frontend implementation (2-3 hours)
4. **Phase 4**: Testing and validation (2-3 hours)
5. **Phase 5**: Documentation and deployment (1 hour)

**Total Estimated Time**: 9-13 hours for complete implementation

### 🔄 Future Enhancements
- Per-organization payment provider preferences
- Provider-specific settings (fees, limits, etc.)
- A/B testing for providers
- Provider health monitoring and auto-disable
- Provider usage analytics and reporting
- Conditional provider availability (e.g., by event type, ticket value)
