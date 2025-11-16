-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('attendee', 'organizer', 'moderator', 'admin');

-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('owner', 'manager', 'finance', 'staff');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'pending', 'approved', 'live', 'paused', 'ended', 'canceled');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'unlisted', 'private');

-- CreateEnum
CREATE TYPE "TicketKind" AS ENUM ('GA', 'SEATED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'canceled', 'refunded', 'chargeback');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('issued', 'transferred', 'refunded', 'checked_in', 'void');

-- CreateEnum
CREATE TYPE "HoldReason" AS ENUM ('checkout', 'reservation', 'organizer_hold');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'in_review', 'paid', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'approved', 'processed', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('requires_action', 'authorized', 'captured', 'voided', 'failed');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('open', 'needs_changes', 'approved', 'rejected', 'resolved');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('business', 'personal', 'nonprofit', 'government');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('pending', 'submitted', 'under_review', 'approved', 'rejected', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('business_license', 'tax_id', 'bank_statement', 'identity_proof', 'address_proof', 'incorporation_docs', 'other');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'success', 'warning', 'error');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'push', 'sms');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('order', 'event', 'payout', 'moderation', 'ticket', 'system', 'marketing');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('instant', 'daily_digest', 'weekly_digest', 'disabled');

-- CreateEnum
CREATE TYPE "EventCreatorDraftStatus" AS ENUM ('draft', 'ready', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "EventCreatorSectionType" AS ENUM ('basics', 'story', 'tickets', 'schedule', 'checkout');

-- CreateEnum
CREATE TYPE "EventCreatorSectionStatus" AS ENUM ('incomplete', 'valid', 'blocked');

-- CreateEnum
CREATE TYPE "EventCreatorEventType" AS ENUM ('in_person', 'online', 'hybrid');

-- CreateEnum
CREATE TYPE "EventCreatorTicketKind" AS ENUM ('free', 'paid', 'donation', 'hidden', 'hold');

-- CreateEnum
CREATE TYPE "EventCreatorTicketVisibility" AS ENUM ('public', 'hidden');

-- CreateEnum
CREATE TYPE "EventCreatorFeeMode" AS ENUM ('absorb', 'pass_on');

-- CreateEnum
CREATE TYPE "EventCreatorCollaboratorRole" AS ENUM ('owner', 'editor', 'finance', 'check_in');

-- CreateEnum
CREATE TYPE "EventCreatorScheduleType" AS ENUM ('single', 'multi_day', 'recurring');

-- CreateEnum
CREATE TYPE "EventCreatorDiscountType" AS ENUM ('percent', 'amount', 'access');

-- CreateEnum
CREATE TYPE "EventCreatorFormFieldType" AS ENUM ('text', 'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'phone', 'email', 'country', 'state', 'date', 'time');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "password_hash" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "role" "PlatformRole" NOT NULL DEFAULT 'attendee',
    "twofa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_addr" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hashed_secret" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'personal',
    "legal_name" TEXT,
    "website" TEXT,
    "country" TEXT,
    "support_email" TEXT,
    "tax_id" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'pending',
    "payout_provider" TEXT,
    "payout_account_id" TEXT,
    "trust_score" DECIMAL(65,30) DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "verification_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "type" "VerificationDocumentType" NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_appeals" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "review_notes" TEXT,

    CONSTRAINT "organization_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL,
    "invited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("org_id","user_id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_accounts" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "default_account" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "scheduled_for" TIMESTAMP(3),
    "initiatedAt" TIMESTAMP(3),
    "provider" TEXT,
    "provider_ref" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "timezone" TEXT NOT NULL,
    "capacity" INTEGER,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seatmaps" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "spec" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seatmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "seatmap_id" TEXT NOT NULL,
    "section" TEXT,
    "row" TEXT,
    "number" TEXT,
    "pos" JSONB,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_seatmaps" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "seatmap_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_seatmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "venue_id" TEXT,
    "seatmap_id" TEXT,
    "title" TEXT NOT NULL,
    "description_md" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "category_id" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "door_time" TIMESTAMP(3),
    "publish_at" TIMESTAMP(3),
    "age_restriction" TEXT,
    "cover_image_url" TEXT,
    "language" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_occurrences" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "gate_open_at" TIMESTAMP(3),

    CONSTRAINT "event_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_assets" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_policies" (
    "event_id" TEXT NOT NULL,
    "refund_policy" TEXT,
    "transfer_allowed" BOOLEAN NOT NULL DEFAULT true,
    "transferCutoff" TEXT,
    "resale_allowed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_policies_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "event_reviews" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_reviews" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TicketKind" NOT NULL,
    "currency" TEXT NOT NULL,
    "price_cents" BIGINT NOT NULL,
    "fee_cents" BIGINT NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "per_order_limit" INTEGER,
    "sales_start" TIMESTAMP(3),
    "sales_end" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_price_tiers" (
    "id" TEXT NOT NULL,
    "ticket_type_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "min_qty" INTEGER NOT NULL DEFAULT 1,
    "price_cents" BIGINT NOT NULL,
    "fee_cents" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "ticket_price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_type_seats" (
    "ticket_type_id" TEXT NOT NULL,
    "seat_id" TEXT NOT NULL,

    CONSTRAINT "ticket_type_seats_pkey" PRIMARY KEY ("ticket_type_id","seat_id")
);

-- CreateTable
CREATE TABLE "holds" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "ticket_type_id" TEXT,
    "seat_id" TEXT,
    "occurrence_id" TEXT,
    "user_id" TEXT,
    "reason" "HoldReason" NOT NULL DEFAULT 'checkout',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "occurrence_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "subtotal_cents" BIGINT NOT NULL DEFAULT 0,
    "fees_cents" BIGINT NOT NULL DEFAULT 0,
    "tax_cents" BIGINT NOT NULL DEFAULT 0,
    "total_cents" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "payment_intent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "ticket_type_id" TEXT NOT NULL,
    "seat_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" BIGINT NOT NULL,
    "unit_fee_cents" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_tax_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "amount_cents" BIGINT NOT NULL,

    CONSTRAINT "order_tax_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fee_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "beneficiary" TEXT NOT NULL,

    CONSTRAINT "order_fee_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_intent" TEXT,
    "provider_charge" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3),
    "failure_code" TEXT,
    "failure_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "occurrence_id" TEXT,
    "ticket_type_id" TEXT NOT NULL,
    "seat_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'issued',
    "qr_code" TEXT,
    "barcode" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferred_from" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "scanner_id" TEXT,
    "gate" TEXT,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "discount_type" TEXT,
    "discount_value" INTEGER,
    "currency" TEXT,
    "max_uses" INTEGER NOT NULL DEFAULT 0,
    "max_uses_per_user" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "event_ids" TEXT[],
    "ticket_type_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_order_amount" INTEGER,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "promotion_id" TEXT,
    "event_id" TEXT,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "percent_off" DECIMAL(65,30),
    "amount_off_cents" BIGINT,
    "currency" TEXT,
    "max_redemptions" INTEGER,
    "per_user_limit" INTEGER,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_redemptions" (
    "id" TEXT NOT NULL,
    "promo_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "provider_ref" TEXT,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount_cents" BIGINT,
    "reason" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flags" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "target_kind" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "moderator_id" TEXT NOT NULL,
    "target_kind" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "city" TEXT,
    "postal" TEXT,
    "rate" DECIMAL(65,30) NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_schedules" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fixed_cents" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_fee_overrides" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "fee_schedule_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "org_fee_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "event_filters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_attempts" (
    "id" TEXT NOT NULL,
    "webhook_event_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "status_code" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "webhook_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "category" "NotificationCategory" NOT NULL DEFAULT 'system',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "channels" "NotificationChannel"[],
    "read_at" TIMESTAMP(3),
    "action_url" TEXT,
    "action_text" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "in_app" "NotificationFrequency" NOT NULL DEFAULT 'instant',
    "email" "NotificationFrequency" NOT NULL DEFAULT 'instant',
    "push" "NotificationFrequency" NOT NULL DEFAULT 'instant',
    "sms" "NotificationFrequency" NOT NULL DEFAULT 'disabled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_kind" TEXT NOT NULL,
    "target_id" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_drafts" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "status" "EventCreatorDraftStatus" NOT NULL DEFAULT 'draft',
    "event_type" "EventCreatorEventType" NOT NULL,
    "timezone" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "title" TEXT,
    "slug" TEXT,
    "cover_image_url" TEXT,
    "short_description" TEXT,
    "completion_percent" INTEGER NOT NULL DEFAULT 0,
    "active_section" "EventCreatorSectionType",
    "last_autosaved_at" TIMESTAMP(3),
    "preview_token" TEXT,
    "preview_token_expires_at" TIMESTAMP(3),
    "target_publish_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_sections" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "section" "EventCreatorSectionType" NOT NULL,
    "status" "EventCreatorSectionStatus" NOT NULL DEFAULT 'incomplete',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "errors" JSONB DEFAULT '[]',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_versions" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "section" "EventCreatorSectionType",
    "payload" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_creator_draft_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "sections" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_template_access" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "user_id" TEXT,
    "role" "EventCreatorCollaboratorRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_creator_template_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_collaborators" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "EventCreatorCollaboratorRole" NOT NULL DEFAULT 'editor',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_creator_draft_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_schedule_rules" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "rule_type" "EventCreatorScheduleType" NOT NULL,
    "timezone" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "rrule" TEXT,
    "exceptions" JSONB DEFAULT '[]',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_schedule_occurrences" (
    "id" TEXT NOT NULL,
    "schedule_rule_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "capacity_override" INTEGER,
    "door_time" TIMESTAMP(3),
    "venue_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_schedule_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_venues" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "mode" "EventCreatorEventType" NOT NULL,
    "label" TEXT,
    "place_id" TEXT,
    "address" JSONB,
    "online_url" TEXT,
    "instructions" TEXT,
    "timezone" TEXT,
    "map_snapshot" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_ticket_types" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "kind" "EventCreatorTicketKind" NOT NULL DEFAULT 'paid',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "price_cents" BIGINT,
    "fee_mode" "EventCreatorFeeMode" NOT NULL DEFAULT 'pass_on',
    "quantity" INTEGER,
    "quantity_sold" INTEGER DEFAULT 0,
    "sales_start" TIMESTAMP(3),
    "sales_end" TIMESTAMP(3),
    "per_order_min" INTEGER DEFAULT 1,
    "per_order_max" INTEGER,
    "visibility" "EventCreatorTicketVisibility" NOT NULL DEFAULT 'public',
    "access_code_required" BOOLEAN NOT NULL DEFAULT false,
    "waitlist_enabled" BOOLEAN NOT NULL DEFAULT false,
    "seat_mode" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_ticket_addons" (
    "id" TEXT NOT NULL,
    "ticket_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" BIGINT,
    "quantity" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_ticket_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_tax_fees" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "tax_type" TEXT NOT NULL,
    "rate" DECIMAL(7,4),
    "absorb_fees" BOOLEAN NOT NULL DEFAULT false,
    "applies_to" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_tax_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_promo_codes" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" "EventCreatorDiscountType" NOT NULL,
    "amount_off" BIGINT,
    "percent_off" DECIMAL(5,2),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "per_customer_limit" INTEGER,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "applies_to" JSONB DEFAULT '[]',
    "access_type" "EventCreatorTicketVisibility" NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_creator_draft_checkout_fields" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" "EventCreatorFormFieldType" NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "applies_to" JSONB DEFAULT '[]',
    "options" JSONB DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_creator_draft_checkout_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_prefix_key" ON "api_keys"("prefix");

-- CreateIndex
CREATE INDEX "verification_documents_org_id_idx" ON "verification_documents"("org_id");

-- CreateIndex
CREATE INDEX "verification_documents_status_idx" ON "verification_documents"("status");

-- CreateIndex
CREATE INDEX "organization_appeals_org_id_idx" ON "organization_appeals"("org_id");

-- CreateIndex
CREATE INDEX "organization_appeals_status_idx" ON "organization_appeals"("status");

-- CreateIndex
CREATE INDEX "org_members_user_id_idx" ON "org_members"("user_id");

-- CreateIndex
CREATE INDEX "user_follows_user_id_idx" ON "user_follows"("user_id");

-- CreateIndex
CREATE INDEX "user_follows_organization_id_idx" ON "user_follows"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_user_id_organization_id_key" ON "user_follows"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "payout_accounts_org_id_provider_external_id_key" ON "payout_accounts"("org_id", "provider", "external_id");

-- CreateIndex
CREATE INDEX "payouts_org_id_status_idx" ON "payouts"("org_id", "status");

-- CreateIndex
CREATE INDEX "venues_org_id_idx" ON "venues"("org_id");

-- CreateIndex
CREATE INDEX "venues_latitude_longitude_idx" ON "venues"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "seatmaps_venue_id_idx" ON "seatmaps"("venue_id");

-- CreateIndex
CREATE INDEX "seats_seatmap_id_idx" ON "seats"("seatmap_id");

-- CreateIndex
CREATE UNIQUE INDEX "seats_seatmap_id_section_row_number_key" ON "seats"("seatmap_id", "section", "row", "number");

-- CreateIndex
CREATE UNIQUE INDEX "event_seatmaps_event_id_key" ON "event_seatmaps"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "events_org_id_status_idx" ON "events"("org_id", "status");

-- CreateIndex
CREATE INDEX "events_visibility_publish_at_idx" ON "events"("visibility", "publish_at");

-- CreateIndex
CREATE INDEX "events_start_at_idx" ON "events"("start_at");

-- CreateIndex
CREATE INDEX "events_status_publish_at_idx" ON "events"("status", "publish_at");

-- CreateIndex
CREATE INDEX "events_latitude_longitude_idx" ON "events"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "event_occurrences_event_id_starts_at_idx" ON "event_occurrences"("event_id", "starts_at");

-- CreateIndex
CREATE INDEX "event_assets_event_id_idx" ON "event_assets"("event_id");

-- CreateIndex
CREATE INDEX "event_reviews_event_id_idx" ON "event_reviews"("event_id");

-- CreateIndex
CREATE INDEX "event_reviews_user_id_idx" ON "event_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_reviews_event_id_user_id_key" ON "event_reviews"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "organizer_reviews_org_id_idx" ON "organizer_reviews"("org_id");

-- CreateIndex
CREATE INDEX "organizer_reviews_user_id_idx" ON "organizer_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_reviews_org_id_user_id_key" ON "organizer_reviews"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "ticket_types_event_id_idx" ON "ticket_types"("event_id");

-- CreateIndex
CREATE INDEX "ticket_types_status_sales_start_sales_end_idx" ON "ticket_types"("status", "sales_start", "sales_end");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_price_tiers_ticket_type_id_starts_at_ends_at_key" ON "ticket_price_tiers"("ticket_type_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "holds_event_id_expires_at_idx" ON "holds"("event_id", "expires_at");

-- CreateIndex
CREATE INDEX "holds_expires_at_idx" ON "holds"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "holds_event_id_occurrence_id_seat_id_key" ON "holds"("event_id", "occurrence_id", "seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "holds_event_id_ticket_type_id_user_id_key" ON "holds"("event_id", "ticket_type_id", "user_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_created_at_idx" ON "orders"("buyer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_event_id_created_at_idx" ON "orders"("event_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_ticket_type_id_idx" ON "order_items"("ticket_type_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_charge_key" ON "payments"("provider", "provider_charge");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_code_key" ON "tickets"("qr_code");

-- CreateIndex
CREATE INDEX "tickets_event_id_status_idx" ON "tickets"("event_id", "status");

-- CreateIndex
CREATE INDEX "tickets_owner_id_idx" ON "tickets"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_event_id_occurrence_id_seat_id_key" ON "tickets"("event_id", "occurrence_id", "seat_id");

-- CreateIndex
CREATE INDEX "transfers_to_user_id_initiated_at_idx" ON "transfers"("to_user_id", "initiated_at" DESC);

-- CreateIndex
CREATE INDEX "checkins_event_id_scanned_at_idx" ON "checkins"("event_id", "scanned_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "checkins_ticket_id_key" ON "checkins"("ticket_id");

-- CreateIndex
CREATE INDEX "promotions_org_id_starts_at_idx" ON "promotions"("org_id", "starts_at");

-- CreateIndex
CREATE INDEX "promo_codes_promotion_id_idx" ON "promo_codes"("promotion_id");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_event_id_code_key" ON "promo_codes"("event_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_org_id_code_key" ON "promo_codes"("org_id", "code");

-- CreateIndex
CREATE INDEX "promo_redemptions_promo_id_idx" ON "promo_redemptions"("promo_id");

-- CreateIndex
CREATE INDEX "promo_redemptions_user_id_idx" ON "promo_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "refunds_order_id_status_idx" ON "refunds"("order_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_provider_case_id_key" ON "disputes"("provider", "case_id");

-- CreateIndex
CREATE INDEX "flags_target_kind_target_id_idx" ON "flags"("target_kind", "target_id");

-- CreateIndex
CREATE INDEX "flags_status_idx" ON "flags"("status");

-- CreateIndex
CREATE INDEX "webhook_attempts_endpoint_id_attempted_at_idx" ON "webhook_attempts"("endpoint_id", "attempted_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_category_idx" ON "notifications"("user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_category_key" ON "notification_preferences"("user_id", "category");

-- CreateIndex
CREATE INDEX "audit_logs_target_kind_target_id_idx" ON "audit_logs"("target_kind", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "event_creator_drafts_organization_id_idx" ON "event_creator_drafts"("organization_id");

-- CreateIndex
CREATE INDEX "event_creator_drafts_owner_user_id_idx" ON "event_creator_drafts"("owner_user_id");

-- CreateIndex
CREATE INDEX "event_creator_drafts_status_idx" ON "event_creator_drafts"("status");

-- CreateIndex
CREATE INDEX "event_creator_drafts_updated_at_idx" ON "event_creator_drafts"("updated_at");

-- CreateIndex
CREATE INDEX "event_creator_draft_sections_draft_id_section_status_idx" ON "event_creator_draft_sections"("draft_id", "section", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_creator_draft_sections_draft_id_section_key" ON "event_creator_draft_sections"("draft_id", "section");

-- CreateIndex
CREATE INDEX "event_creator_draft_versions_draft_id_section_idx" ON "event_creator_draft_versions"("draft_id", "section");

-- CreateIndex
CREATE INDEX "event_creator_draft_versions_created_by_idx" ON "event_creator_draft_versions"("created_by");

-- CreateIndex
CREATE INDEX "event_creator_templates_organization_id_idx" ON "event_creator_templates"("organization_id");

-- CreateIndex
CREATE INDEX "event_creator_templates_is_active_idx" ON "event_creator_templates"("is_active");

-- CreateIndex
CREATE INDEX "event_creator_template_access_template_id_idx" ON "event_creator_template_access"("template_id");

-- CreateIndex
CREATE INDEX "event_creator_template_access_user_id_idx" ON "event_creator_template_access"("user_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_collaborators_role_idx" ON "event_creator_draft_collaborators"("role");

-- CreateIndex
CREATE UNIQUE INDEX "event_creator_draft_collaborators_draft_id_user_id_key" ON "event_creator_draft_collaborators"("draft_id", "user_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_schedule_rules_draft_id_idx" ON "event_creator_draft_schedule_rules"("draft_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_schedule_occurrences_schedule_rule_id_idx" ON "event_creator_draft_schedule_occurrences"("schedule_rule_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_venues_draft_id_idx" ON "event_creator_draft_venues"("draft_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_ticket_types_draft_id_idx" ON "event_creator_draft_ticket_types"("draft_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_ticket_addons_ticket_type_id_idx" ON "event_creator_draft_ticket_addons"("ticket_type_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_tax_fees_draft_id_idx" ON "event_creator_draft_tax_fees"("draft_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_promo_codes_draft_id_idx" ON "event_creator_draft_promo_codes"("draft_id");

-- CreateIndex
CREATE INDEX "event_creator_draft_promo_codes_code_idx" ON "event_creator_draft_promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "event_creator_draft_promo_codes_draft_id_code_key" ON "event_creator_draft_promo_codes"("draft_id", "code");

-- CreateIndex
CREATE INDEX "event_creator_draft_checkout_fields_draft_id_idx" ON "event_creator_draft_checkout_fields"("draft_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_creator_draft_checkout_fields_draft_id_field_key_key" ON "event_creator_draft_checkout_fields"("draft_id", "field_key");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_appeals" ADD CONSTRAINT "organization_appeals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_appeals" ADD CONSTRAINT "organization_appeals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seatmaps" ADD CONSTRAINT "seatmaps_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_seatmap_id_fkey" FOREIGN KEY ("seatmap_id") REFERENCES "seatmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_seatmaps" ADD CONSTRAINT "event_seatmaps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_seatmaps" ADD CONSTRAINT "event_seatmaps_seatmap_id_fkey" FOREIGN KEY ("seatmap_id") REFERENCES "seatmaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_seatmap_id_fkey" FOREIGN KEY ("seatmap_id") REFERENCES "seatmaps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_assets" ADD CONSTRAINT "event_assets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_policies" ADD CONSTRAINT "event_policies_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_reviews" ADD CONSTRAINT "organizer_reviews_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_reviews" ADD CONSTRAINT "organizer_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_price_tiers" ADD CONSTRAINT "ticket_price_tiers_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_type_seats" ADD CONSTRAINT "ticket_type_seats_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_type_seats" ADD CONSTRAINT "ticket_type_seats_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holds" ADD CONSTRAINT "holds_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holds" ADD CONSTRAINT "holds_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holds" ADD CONSTRAINT "holds_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holds" ADD CONSTRAINT "holds_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "event_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holds" ADD CONSTRAINT "holds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "event_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_tax_lines" ADD CONSTRAINT "order_tax_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fee_lines" ADD CONSTRAINT "order_fee_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "event_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flags" ADD CONSTRAINT "flags_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flags" ADD CONSTRAINT "flags_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_fee_overrides" ADD CONSTRAINT "org_fee_overrides_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_fee_overrides" ADD CONSTRAINT "org_fee_overrides_fee_schedule_id_fkey" FOREIGN KEY ("fee_schedule_id") REFERENCES "fee_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_attempts" ADD CONSTRAINT "webhook_attempts_webhook_event_id_fkey" FOREIGN KEY ("webhook_event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_attempts" ADD CONSTRAINT "webhook_attempts_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_drafts" ADD CONSTRAINT "event_creator_drafts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_drafts" ADD CONSTRAINT "event_creator_drafts_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_drafts" ADD CONSTRAINT "event_creator_drafts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_sections" ADD CONSTRAINT "event_creator_draft_sections_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_versions" ADD CONSTRAINT "event_creator_draft_versions_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_versions" ADD CONSTRAINT "event_creator_draft_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_templates" ADD CONSTRAINT "event_creator_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_templates" ADD CONSTRAINT "event_creator_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_template_access" ADD CONSTRAINT "event_creator_template_access_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "event_creator_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_template_access" ADD CONSTRAINT "event_creator_template_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_collaborators" ADD CONSTRAINT "event_creator_draft_collaborators_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_collaborators" ADD CONSTRAINT "event_creator_draft_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_schedule_rules" ADD CONSTRAINT "event_creator_draft_schedule_rules_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_schedule_occurrences" ADD CONSTRAINT "event_creator_draft_schedule_occurrences_schedule_rule_id_fkey" FOREIGN KEY ("schedule_rule_id") REFERENCES "event_creator_draft_schedule_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_schedule_occurrences" ADD CONSTRAINT "event_creator_draft_schedule_occurrences_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "event_creator_draft_venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_venues" ADD CONSTRAINT "event_creator_draft_venues_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_ticket_types" ADD CONSTRAINT "event_creator_draft_ticket_types_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_ticket_addons" ADD CONSTRAINT "event_creator_draft_ticket_addons_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "event_creator_draft_ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_tax_fees" ADD CONSTRAINT "event_creator_draft_tax_fees_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_promo_codes" ADD CONSTRAINT "event_creator_draft_promo_codes_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_creator_draft_checkout_fields" ADD CONSTRAINT "event_creator_draft_checkout_fields_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "event_creator_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

