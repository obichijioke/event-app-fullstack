/*
  Warnings:

  - You are about to drop the column `changed_at` on the `currency_change_logs` table. All the data in the column will be lost.
  - You are about to drop the column `new_config` on the `currency_change_logs` table. All the data in the column will be lost.
  - You are about to drop the column `previous_config` on the `currency_change_logs` table. All the data in the column will be lost.
  - You are about to alter the column `rate` on the `exchange_rates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,6)`.
  - A unique constraint covering the columns `[event_id]` on the table `event_creator_drafts` will be added. If there are existing duplicate values, this will fail.
  - Made the column `changed_by` on table `currency_change_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `inverseRate` on table `exchange_rates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source` on table `exchange_rates` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('info', 'warning', 'important', 'urgent');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('pending', 'answered', 'converted_to_faq', 'dismissed');

-- DropForeignKey
ALTER TABLE "public"."currency_change_logs" DROP CONSTRAINT "currency_change_logs_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."currency_configuration" DROP CONSTRAINT "currency_configuration_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."twofactor_codes" DROP CONSTRAINT "twofactor_codes_user_id_fkey";

-- DropIndex
DROP INDEX "public"."currency_change_logs_type_idx";

-- DropIndex
DROP INDEX "public"."notifications_category_idx";

-- AlterTable
ALTER TABLE "currency_change_logs" DROP COLUMN "changed_at",
DROP COLUMN "new_config",
DROP COLUMN "previous_config",
ADD COLUMN     "affected_events" INTEGER DEFAULT 0,
ADD COLUMN     "affected_orders" INTEGER DEFAULT 0,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "new_value" JSONB,
ADD COLUMN     "old_value" JSONB,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "user_agent" TEXT,
ALTER COLUMN "changed_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "currency_configuration" ALTER COLUMN "currencySymbol" SET DEFAULT '₦',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "short_description" TEXT;

-- AlterTable
ALTER TABLE "exchange_rates" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "inverseRate" SET NOT NULL,
ALTER COLUMN "source" SET NOT NULL;

-- AlterTable
ALTER TABLE "payout_accounts" ADD COLUMN     "account_name" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "bic" TEXT,
ADD COLUMN     "sort_code" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_key" TEXT,
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" TEXT;

-- AlterTable
ALTER TABLE "venue_catalogs" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "event_announcements" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'info',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_for" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_views" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_dismissals" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dismissed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_faqs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'organizer',
    "source_question_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_questions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'pending',
    "moderator_note" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_upvotes" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_announcements_event_id_created_at_idx" ON "event_announcements"("event_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "event_announcements_event_id_is_active_idx" ON "event_announcements"("event_id", "is_active");

-- CreateIndex
CREATE INDEX "event_announcements_scheduled_for_idx" ON "event_announcements"("scheduled_for");

-- CreateIndex
CREATE INDEX "event_announcements_event_id_published_at_idx" ON "event_announcements"("event_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "announcement_views_announcement_id_idx" ON "announcement_views"("announcement_id");

-- CreateIndex
CREATE INDEX "announcement_views_user_id_viewed_at_idx" ON "announcement_views"("user_id", "viewed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_views_announcement_id_user_id_key" ON "announcement_views"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "announcement_dismissals_announcement_id_idx" ON "announcement_dismissals"("announcement_id");

-- CreateIndex
CREATE INDEX "announcement_dismissals_user_id_idx" ON "announcement_dismissals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_dismissals_announcement_id_user_id_key" ON "announcement_dismissals"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "event_faqs_event_id_sort_order_idx" ON "event_faqs"("event_id", "sort_order");

-- CreateIndex
CREATE INDEX "event_faqs_event_id_is_active_idx" ON "event_faqs"("event_id", "is_active");

-- CreateIndex
CREATE INDEX "event_questions_event_id_status_created_at_idx" ON "event_questions"("event_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "event_questions_user_id_idx" ON "event_questions"("user_id");

-- CreateIndex
CREATE INDEX "question_upvotes_question_id_idx" ON "question_upvotes"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_upvotes_question_id_user_id_key" ON "question_upvotes"("question_id", "user_id");

-- CreateIndex
CREATE INDEX "currency_change_logs_change_type_created_at_idx" ON "currency_change_logs"("change_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_creator_drafts_event_id_key" ON "event_creator_drafts"("event_id");

-- CreateIndex
CREATE INDEX "exchange_rates_is_active_valid_from_idx" ON "exchange_rates"("is_active", "valid_from");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twofactor_codes" ADD CONSTRAINT "twofactor_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_configuration" ADD CONSTRAINT "currency_configuration_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_change_logs" ADD CONSTRAINT "currency_change_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "event_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "event_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_faqs" ADD CONSTRAINT "event_faqs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_faqs" ADD CONSTRAINT "event_faqs_source_question_id_fkey" FOREIGN KEY ("source_question_id") REFERENCES "event_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_questions" ADD CONSTRAINT "event_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_upvotes" ADD CONSTRAINT "question_upvotes_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "event_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_upvotes" ADD CONSTRAINT "question_upvotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "exchange_rates_active_idx" RENAME TO "exchange_rates_from_currency_to_currency_is_active_idx";

-- RenameIndex
ALTER INDEX "exchange_rates_from_to_unique" RENAME TO "exchange_rates_from_currency_to_currency_valid_from_key";
