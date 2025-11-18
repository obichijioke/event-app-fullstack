-- Recreate currency tables with column names matching Prisma schema

DROP TABLE IF EXISTS "currency_change_logs" CASCADE;
DROP TABLE IF EXISTS "exchange_rates" CASCADE;
DROP TABLE IF EXISTS "currency_configuration" CASCADE;

CREATE TABLE "currency_configuration" (
  "id" TEXT PRIMARY KEY,
  "defaultCurrency" TEXT NOT NULL DEFAULT 'NGN',
  "supportedCurrencies" TEXT[] NOT NULL DEFAULT ARRAY['NGN','USD','GBP','EUR','GHS','KES','ZAR'],
  "multi_currency_enabled" BOOLEAN NOT NULL DEFAULT false,
  "currencySymbol" TEXT NOT NULL DEFAULT '?',
  "currencyPosition" TEXT NOT NULL DEFAULT 'before',
  "decimal_separator" TEXT NOT NULL DEFAULT '.',
  "thousands_separator" TEXT NOT NULL DEFAULT ',',
  "decimal_places" INTEGER NOT NULL DEFAULT 2,
  "exchange_rates_enabled" BOOLEAN NOT NULL DEFAULT false,
  "exchange_rate_provider" TEXT,
  "exchange_rate_api_key" TEXT,
  "last_rate_update" TIMESTAMP(3),
  "auto_update_rates" BOOLEAN NOT NULL DEFAULT false,
  "update_frequency" TEXT NOT NULL DEFAULT 'daily',
  "allow_organizer_currency" BOOLEAN NOT NULL DEFAULT false,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "currency_configuration_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE "exchange_rates" (
  "id" TEXT PRIMARY KEY,
  "fromCurrency" TEXT NOT NULL,
  "toCurrency" TEXT NOT NULL,
  "rate" DECIMAL(65,30) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exchange_rates_from_to_unique" UNIQUE ("fromCurrency","toCurrency","valid_from")
);

CREATE INDEX "exchange_rates_active_idx" ON "exchange_rates"("fromCurrency","toCurrency","is_active");

CREATE TABLE "currency_change_logs" (
  "id" TEXT PRIMARY KEY,
  "change_type" TEXT NOT NULL,
  "changed_by" TEXT,
  "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "previous_config" JSONB,
  "new_config" JSONB,
  CONSTRAINT "currency_change_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "currency_change_logs_changed_by_idx" ON "currency_change_logs"("changed_by");
CREATE INDEX "currency_change_logs_type_idx" ON "currency_change_logs"("change_type","changed_at");
