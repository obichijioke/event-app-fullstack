-- ========================================
-- MULTI-STEP EVENT WIZARD STATE PERSISTENCE
-- Migration: Add tables for wizard state management
-- ========================================

-- Enum for wizard steps
CREATE TYPE "WizardStep" AS ENUM (
  'basic_info',
  'date_time',
  'location',
  'seating',
  'ticket_types',
  'price_tiers',
  'policies',
  'media',
  'review'
);

-- Enum for wizard session status
CREATE TYPE "WizardSessionStatus" AS ENUM (
  'in_progress',
  'completed',
  'abandoned',
  'published'
);

-- ========================================
-- 1. WIZARD SESSION TABLE
-- Tracks the overall wizard session and progress
-- ========================================
CREATE TABLE "wizard_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "org_id" TEXT NOT NULL,
  "event_id" TEXT, -- NULL initially, populated when event draft is created
  "current_step" "WizardStep" NOT NULL DEFAULT 'basic_info',
  "status" "WizardSessionStatus" NOT NULL DEFAULT 'in_progress',
  "template_used" TEXT, -- Template identifier if user selected one
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "abandoned_at" TIMESTAMP(3),
  "metadata" JSONB DEFAULT '{}', -- Additional session metadata

  CONSTRAINT "wizard_sessions_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "wizard_sessions_org_id_fkey" FOREIGN KEY ("org_id")
    REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "wizard_sessions_event_id_fkey" FOREIGN KEY ("event_id")
    REFERENCES "events"("id") ON DELETE CASCADE
);

-- Indexes for wizard sessions
CREATE INDEX "wizard_sessions_user_id_idx" ON "wizard_sessions"("user_id");
CREATE INDEX "wizard_sessions_org_id_idx" ON "wizard_sessions"("org_id");
CREATE INDEX "wizard_sessions_status_idx" ON "wizard_sessions"("status");
CREATE INDEX "wizard_sessions_last_activity_idx" ON "wizard_sessions"("last_activity_at");
CREATE INDEX "wizard_sessions_event_id_idx" ON "wizard_sessions"("event_id");

COMMENT ON TABLE "wizard_sessions" IS 'Tracks multi-step wizard sessions for event creation';
COMMENT ON COLUMN "wizard_sessions"."metadata" IS 'Stores additional session data: {device, browser, ip, abTestVariant, etc.}';

-- ========================================
-- 2. WIZARD STEP COMPLETION TABLE
-- Tracks which steps have been completed
-- ========================================
CREATE TABLE "wizard_step_completions" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" TEXT NOT NULL,
  "step" "WizardStep" NOT NULL,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "is_valid" BOOLEAN NOT NULL DEFAULT false, -- Validation status
  "validation_errors" JSONB DEFAULT '[]', -- Array of validation error messages
  "time_spent_seconds" INTEGER DEFAULT 0, -- Time spent on this step
  "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "data_snapshot" JSONB, -- Snapshot of data entered in this step

  CONSTRAINT "wizard_step_completions_session_id_fkey" FOREIGN KEY ("session_id")
    REFERENCES "wizard_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_session_step" UNIQUE ("session_id", "step")
);

CREATE INDEX "wizard_step_completions_session_id_idx" ON "wizard_step_completions"("session_id");
CREATE INDEX "wizard_step_completions_step_idx" ON "wizard_step_completions"("step");

COMMENT ON TABLE "wizard_step_completions" IS 'Tracks completion status and validation for each wizard step';
COMMENT ON COLUMN "wizard_step_completions"."data_snapshot" IS 'Stores the data entered in this specific step for analytics';

-- ========================================
-- 3. DRAFT TICKET TYPES TABLE
-- Stores ticket types before event is published
-- ========================================
CREATE TABLE "draft_ticket_types" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" TEXT NOT NULL,
  "event_id" TEXT, -- NULL if event not yet created
  "name" TEXT NOT NULL,
  "kind" "TicketKind" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "price_cents" BIGINT NOT NULL,
  "fee_cents" BIGINT DEFAULT 0,
  "capacity" INTEGER,
  "per_order_limit" INTEGER,
  "sales_start" TIMESTAMP(3),
  "sales_end" TIMESTAMP(3),
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "draft_ticket_types_session_id_fkey" FOREIGN KEY ("session_id")
    REFERENCES "wizard_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "draft_ticket_types_event_id_fkey" FOREIGN KEY ("event_id")
    REFERENCES "events"("id") ON DELETE CASCADE
);

CREATE INDEX "draft_ticket_types_session_id_idx" ON "draft_ticket_types"("session_id");
CREATE INDEX "draft_ticket_types_event_id_idx" ON "draft_ticket_types"("event_id");

COMMENT ON TABLE "draft_ticket_types" IS 'Temporary storage for ticket types during wizard flow';

-- ========================================
-- 4. DRAFT PRICE TIERS TABLE
-- Stores price tiers before event is published
-- ========================================
CREATE TABLE "draft_price_tiers" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "draft_ticket_type_id" TEXT NOT NULL,
  "name" TEXT, -- e.g., "Early Bird", "Regular", "Group Discount"
  "tier_type" TEXT NOT NULL, -- 'time_based' | 'quantity_based'
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "min_qty" INTEGER DEFAULT 1,
  "price_cents" BIGINT NOT NULL,
  "fee_cents" BIGINT DEFAULT 0,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "draft_price_tiers_draft_ticket_type_id_fkey" FOREIGN KEY ("draft_ticket_type_id")
    REFERENCES "draft_ticket_types"("id") ON DELETE CASCADE
);

CREATE INDEX "draft_price_tiers_draft_ticket_type_id_idx" ON "draft_price_tiers"("draft_ticket_type_id");

COMMENT ON TABLE "draft_price_tiers" IS 'Temporary storage for price tiers during wizard flow';
COMMENT ON COLUMN "draft_price_tiers"."tier_type" IS 'Indicates whether tier is based on time or quantity purchased';

-- ========================================
-- 5. DRAFT ASSETS TABLE
-- Stores asset references before event is published
-- ========================================
CREATE TABLE "draft_assets" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" TEXT NOT NULL,
  "event_id" TEXT, -- NULL if event not yet created
  "kind" TEXT NOT NULL, -- 'cover_image', 'gallery_image', 'video', 'document'
  "url" TEXT NOT NULL,
  "alt_text" TEXT,
  "file_size" INTEGER, -- in bytes
  "mime_type" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "sort_order" INTEGER DEFAULT 0,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "draft_assets_session_id_fkey" FOREIGN KEY ("session_id")
    REFERENCES "wizard_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "draft_assets_event_id_fkey" FOREIGN KEY ("event_id")
    REFERENCES "events"("id") ON DELETE CASCADE
);

CREATE INDEX "draft_assets_session_id_idx" ON "draft_assets"("session_id");
CREATE INDEX "draft_assets_event_id_idx" ON "draft_assets"("event_id");

COMMENT ON TABLE "draft_assets" IS 'Temporary storage for uploaded assets during wizard flow';

-- ========================================
-- 6. DRAFT POLICIES TABLE
-- Stores event policies before event is published
-- ========================================
CREATE TABLE "draft_policies" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" TEXT NOT NULL,
  "event_id" TEXT, -- NULL if event not yet created
  "refund_policy" TEXT,
  "transfer_allowed" BOOLEAN DEFAULT true,
  "transfer_cutoff" TEXT, -- e.g., "2 hours", "1 day"
  "resale_allowed" BOOLEAN DEFAULT false,
  "terms_and_conditions" TEXT,
  "additional_info" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "draft_policies_session_id_fkey" FOREIGN KEY ("session_id")
    REFERENCES "wizard_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "draft_policies_event_id_fkey" FOREIGN KEY ("event_id")
    REFERENCES "events"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_session_policy" UNIQUE ("session_id")
);

CREATE INDEX "draft_policies_session_id_idx" ON "draft_policies"("session_id");

COMMENT ON TABLE "draft_policies" IS 'Temporary storage for event policies during wizard flow';

-- ========================================
-- 7. WIZARD AUTO-SAVE SNAPSHOTS TABLE
-- Stores periodic snapshots for disaster recovery
-- ========================================
CREATE TABLE "wizard_auto_saves" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" TEXT NOT NULL,
  "snapshot_data" JSONB NOT NULL, -- Complete wizard state
  "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "wizard_auto_saves_session_id_fkey" FOREIGN KEY ("session_id")
    REFERENCES "wizard_sessions"("id") ON DELETE CASCADE
);

CREATE INDEX "wizard_auto_saves_session_id_idx" ON "wizard_auto_saves"("session_id");
CREATE INDEX "wizard_auto_saves_saved_at_idx" ON "wizard_auto_saves"("saved_at");

COMMENT ON TABLE "wizard_auto_saves" IS 'Periodic auto-save snapshots of wizard state for recovery';

-- ========================================
-- 8. WIZARD ANALYTICS TABLE
-- Tracks user behavior for optimization
-- ========================================
CREATE TABLE "wizard_analytics" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL, -- 'step_entered', 'step_exited', 'validation_error', 'save_draft', 'navigation_back', etc.
  "step" "WizardStep",
  "event_data" JSONB DEFAULT '{}',
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "wizard_analytics_session_id_fkey" FOREIGN KEY ("session_id")
    REFERENCES "wizard_sessions"("id") ON DELETE CASCADE
);

CREATE INDEX "wizard_analytics_session_id_idx" ON "wizard_analytics"("session_id");
CREATE INDEX "wizard_analytics_event_type_idx" ON "wizard_analytics"("event_type");
CREATE INDEX "wizard_analytics_timestamp_idx" ON "wizard_analytics"("timestamp");

COMMENT ON TABLE "wizard_analytics" IS 'Tracks detailed user interactions within wizard for analytics';
COMMENT ON COLUMN "wizard_analytics"."event_data" IS 'Additional event context: {errorType, fieldName, templateId, etc.}';

-- ========================================
-- 9. CREATE CLEANUP FUNCTION
-- Auto-cleanup abandoned sessions after 30 days
-- ========================================
CREATE OR REPLACE FUNCTION cleanup_abandoned_wizard_sessions()
RETURNS void AS $$
BEGIN
  -- Mark sessions as abandoned if inactive for 7 days
  UPDATE wizard_sessions
  SET status = 'abandoned', abandoned_at = NOW()
  WHERE status = 'in_progress'
    AND last_activity_at < NOW() - INTERVAL '7 days'
    AND abandoned_at IS NULL;

  -- Delete abandoned sessions older than 30 days
  DELETE FROM wizard_sessions
  WHERE status = 'abandoned'
    AND abandoned_at < NOW() - INTERVAL '30 days';

  -- Delete orphaned auto-saves older than 7 days
  DELETE FROM wizard_auto_saves
  WHERE saved_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_abandoned_wizard_sessions IS 'Cleans up abandoned wizard sessions and old auto-save snapshots';

-- ========================================
-- 10. CREATE TRIGGER FOR LAST ACTIVITY UPDATE
-- ========================================
CREATE OR REPLACE FUNCTION update_wizard_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wizard_sessions
  SET last_activity_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to step completions
CREATE TRIGGER update_last_activity_on_step_completion
AFTER INSERT OR UPDATE ON wizard_step_completions
FOR EACH ROW
EXECUTE FUNCTION update_wizard_last_activity();

-- Apply trigger to draft ticket types
CREATE TRIGGER update_last_activity_on_ticket_type
AFTER INSERT OR UPDATE ON draft_ticket_types
FOR EACH ROW
EXECUTE FUNCTION update_wizard_last_activity();

-- Apply trigger to draft assets
CREATE TRIGGER update_last_activity_on_asset
AFTER INSERT OR UPDATE ON draft_assets
FOR EACH ROW
EXECUTE FUNCTION update_wizard_last_activity();

-- ========================================
-- 11. HELPFUL VIEWS
-- ========================================

-- View: Active wizard sessions with progress
CREATE VIEW active_wizard_sessions AS
SELECT
  ws.id,
  ws.user_id,
  ws.org_id,
  ws.event_id,
  ws.current_step,
  ws.status,
  ws.started_at,
  ws.last_activity_at,
  u.email as user_email,
  u.name as user_name,
  o.name as org_name,
  COUNT(DISTINCT wsc.step) FILTER (WHERE wsc.is_completed = true) as completed_steps,
  COUNT(DISTINCT dtt.id) as ticket_types_count,
  COUNT(DISTINCT da.id) as assets_count,
  EXTRACT(EPOCH FROM (NOW() - ws.started_at)) as session_duration_seconds
FROM wizard_sessions ws
LEFT JOIN users u ON ws.user_id = u.id
LEFT JOIN organizations o ON ws.org_id = o.id
LEFT JOIN wizard_step_completions wsc ON ws.id = wsc.session_id
LEFT JOIN draft_ticket_types dtt ON ws.id = dtt.session_id
LEFT JOIN draft_assets da ON ws.id = da.session_id
WHERE ws.status = 'in_progress'
GROUP BY ws.id, u.email, u.name, o.name;

COMMENT ON VIEW active_wizard_sessions IS 'Overview of active wizard sessions with progress metrics';

-- View: Wizard completion funnel analytics
CREATE VIEW wizard_funnel_analytics AS
SELECT
  step,
  COUNT(DISTINCT session_id) as sessions_reached,
  COUNT(DISTINCT session_id) FILTER (WHERE is_completed = true) as sessions_completed,
  ROUND(AVG(time_spent_seconds), 2) as avg_time_spent_seconds,
  COUNT(*) FILTER (WHERE NOT is_valid) as validation_failures
FROM wizard_step_completions
GROUP BY step
ORDER BY
  CASE step
    WHEN 'basic_info' THEN 1
    WHEN 'date_time' THEN 2
    WHEN 'location' THEN 3
    WHEN 'seating' THEN 4
    WHEN 'ticket_types' THEN 5
    WHEN 'price_tiers' THEN 6
    WHEN 'policies' THEN 7
    WHEN 'media' THEN 8
    WHEN 'review' THEN 9
  END;

COMMENT ON VIEW wizard_funnel_analytics IS 'Funnel analysis showing drop-off rates per wizard step';

-- ========================================
-- 12. SEED DEFAULT TEMPLATES (Optional)
-- ========================================
CREATE TABLE "wizard_templates" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT, -- 'concert', 'conference', 'sports', 'theater', etc.
  "icon" TEXT,
  "template_data" JSONB NOT NULL, -- Pre-filled wizard data
  "is_active" BOOLEAN DEFAULT true,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "wizard_templates_category_idx" ON "wizard_templates"("category");
CREATE INDEX "wizard_templates_is_active_idx" ON "wizard_templates"("is_active");

COMMENT ON TABLE "wizard_templates" IS 'Pre-configured templates for quick event creation';

-- Insert default templates
INSERT INTO wizard_templates (slug, name, description, category, template_data, sort_order) VALUES
('concert-general', 'Concert / Live Music', 'Perfect for concerts, live performances, and music festivals', 'music',
  '{"visibility": "public", "ageRestriction": "All Ages", "policies": {"transferAllowed": true, "resaleAllowed": false}, "ticketTypes": [{"name": "General Admission", "kind": "GA"}, {"name": "VIP", "kind": "GA"}]}'::jsonb, 1),

('conference-business', 'Conference / Seminar', 'Ideal for business conferences, seminars, and workshops', 'business',
  '{"visibility": "public", "policies": {"transferAllowed": true, "resaleAllowed": false}, "ticketTypes": [{"name": "Early Bird", "kind": "GA"}, {"name": "Regular", "kind": "GA"}, {"name": "Group Pass (5+)", "kind": "GA"}]}'::jsonb, 2),

('sports-game', 'Sports Event', 'Great for sports games and athletic competitions', 'sports',
  '{"visibility": "public", "policies": {"transferAllowed": true, "resaleAllowed": true}, "ticketTypes": [{"name": "Premium Seating", "kind": "SEATED"}, {"name": "Standard", "kind": "SEATED"}]}'::jsonb, 3),

('theater-performance', 'Theater / Arts', 'Perfect for theater performances, plays, and art shows', 'arts',
  '{"visibility": "public", "policies": {"transferAllowed": true, "resaleAllowed": false}, "ticketTypes": [{"name": "Orchestra", "kind": "SEATED"}, {"name": "Balcony", "kind": "SEATED"}]}'::jsonb, 4),

('networking-social', 'Networking Event', 'Ideal for networking events and social gatherings', 'social',
  '{"visibility": "unlisted", "policies": {"transferAllowed": true, "resaleAllowed": false}, "ticketTypes": [{"name": "General Admission", "kind": "GA"}]}'::jsonb, 5),

('festival-multi-day', 'Festival / Multi-Day Event', 'Great for festivals and multi-day events', 'festival',
  '{"visibility": "public", "policies": {"transferAllowed": false, "resaleAllowed": false}, "ticketTypes": [{"name": "Day Pass", "kind": "GA"}, {"name": "Weekend Pass", "kind": "GA"}, {"name": "VIP All Access", "kind": "GA"}]}'::jsonb, 6);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
