-- CreateEnum
CREATE TYPE "VenueVisibility" AS ENUM ('shared_ref', 'private');

-- CreateTable
CREATE TABLE "venue_catalogs" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" JSONB NOT NULL,
    "timezone" TEXT NOT NULL,
    "capacity_min" INTEGER,
    "capacity_max" INTEGER,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "tags" TEXT[] NOT NULL DEFAULT '{}'::text[],
    "default_seatmap_spec" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "venue_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venue_catalogs_slug_key" ON "venue_catalogs"("slug");

-- AlterTable
ALTER TABLE "venues"
ADD COLUMN "catalog_venue_id" TEXT,
ADD COLUMN "visibility" "VenueVisibility" NOT NULL DEFAULT 'private';

-- CreateIndex
CREATE INDEX "venues_catalog_venue_id_idx" ON "venues"("catalog_venue_id");

-- AddForeignKey
ALTER TABLE "venues"
ADD CONSTRAINT "venues_catalog_venue_id_fkey" FOREIGN KEY ("catalog_venue_id") REFERENCES "venue_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
