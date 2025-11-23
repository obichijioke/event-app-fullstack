-- Rename exchange_rates columns to match Prisma schema expectations
ALTER TABLE "exchange_rates" 
  RENAME COLUMN "fromCurrency" TO "from_currency";

ALTER TABLE "exchange_rates" 
  RENAME COLUMN "toCurrency" TO "to_currency";

-- Add missing inverseRate column (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exchange_rates' AND column_name = 'inverseRate'
  ) THEN
    ALTER TABLE "exchange_rates" 
      ADD COLUMN "inverseRate" DECIMAL(18,6);
  END IF;
END $$;
