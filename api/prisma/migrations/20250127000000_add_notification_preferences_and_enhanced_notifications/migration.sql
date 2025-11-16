-- CreateEnum for NotificationCategory, NotificationFrequency (if not exists)
DO $$ BEGIN
 CREATE TYPE "NotificationCategory" AS ENUM ('order', 'event', 'payout', 'moderation', 'ticket', 'system', 'marketing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "NotificationFrequency" AS ENUM ('instant', 'daily_digest', 'weekly_digest', 'disabled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for NotificationType, NotificationChannel (if not exists)
DO $$ BEGIN
 CREATE TYPE "NotificationType" AS ENUM ('info','success','warning','error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "NotificationChannel" AS ENUM ('in_app','email','push','sms');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: notifications (if not exists)
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'info',
  "category" "NotificationCategory" NOT NULL DEFAULT 'system',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "channels" "NotificationChannel"[] NOT NULL DEFAULT '{}',
  "read_at" TIMESTAMP(3),
  "action_url" TEXT,
  "action_text" TEXT,
  "image_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable: Add new columns to notifications table (if not exist)
ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "category" "NotificationCategory" NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS "action_url" TEXT,
  ADD COLUMN IF NOT EXISTS "action_text" TEXT,
  ADD COLUMN IF NOT EXISTS "image_url" TEXT;

-- CreateTable: NotificationPreference (if not exists)
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "in_app" "NotificationFrequency" NOT NULL DEFAULT 'instant',
    "email" "NotificationFrequency" NOT NULL DEFAULT 'instant',
    "push" "NotificationFrequency" NOT NULL DEFAULT 'instant',
    "sms" "NotificationFrequency" NOT NULL DEFAULT 'disabled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_id_category_key" ON "notification_preferences"("user_id", "category");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- AddForeignKey (if not exists)
DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create index on notifications.category for better query performance
CREATE INDEX IF NOT EXISTS "notifications_category_idx" ON "notifications"("category");
CREATE INDEX IF NOT EXISTS "notifications_user_id_category_idx" ON "notifications"("user_id", "category");
CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_desc_idx" ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
