-- Add agenda and speakers metadata to events
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "agenda" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "speakers" JSONB NOT NULL DEFAULT '[]'::jsonb;
