-- Add optional notes column to payouts for organizer-provided context
ALTER TABLE "payouts"
ADD COLUMN "notes" TEXT NULL;
