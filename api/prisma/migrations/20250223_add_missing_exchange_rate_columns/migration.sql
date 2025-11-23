-- Add missing columns to exchange_rates table
ALTER TABLE "exchange_rates" 
  ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'manual';

ALTER TABLE "exchange_rates" 
  ADD COLUMN IF NOT EXISTS "provider" TEXT;

ALTER TABLE "exchange_rates" 
  ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';

ALTER TABLE "exchange_rates" 
  ADD COLUMN IF NOT EXISTS "valid_until" TIMESTAMP(3);
