-- Add missing inverseRate column
ALTER TABLE "exchange_rates" 
  ADD COLUMN IF NOT EXISTS "inverseRate" DECIMAL(18,6);
