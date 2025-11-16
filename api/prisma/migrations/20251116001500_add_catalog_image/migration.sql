-- AlterTable
ALTER TABLE "venue_catalogs"
ADD COLUMN IF NOT EXISTS "image_url" TEXT;
