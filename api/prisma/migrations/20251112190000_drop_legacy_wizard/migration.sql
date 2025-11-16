-- Drop legacy Event Creation Wizard tables and enums
-- Safe to run multiple times (IF EXISTS)

-- Drop dependent tables first due to FKs
DROP TABLE IF EXISTS "wizard_analytics" CASCADE;
DROP TABLE IF EXISTS "wizard_auto_saves" CASCADE;
DROP TABLE IF EXISTS "draft_policies" CASCADE;
DROP TABLE IF EXISTS "draft_assets" CASCADE;
DROP TABLE IF EXISTS "draft_price_tiers" CASCADE;
DROP TABLE IF EXISTS "draft_ticket_types" CASCADE;
DROP TABLE IF EXISTS "wizard_step_completions" CASCADE;
DROP TABLE IF EXISTS "wizard_sessions" CASCADE;
DROP TABLE IF EXISTS "wizard_templates" CASCADE;

-- Drop enums (PostgreSQL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WizardStep') THEN
    EXECUTE 'DROP TYPE "WizardStep"';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WizardSessionStatus') THEN
    EXECUTE 'DROP TYPE "WizardSessionStatus"';
  END IF;
END $$;

