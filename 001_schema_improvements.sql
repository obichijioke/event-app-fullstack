-- Migration: High-impact schema improvements + snapshots + triggers
-- Note: Review in a non-prod environment first.

BEGIN;

-- 1) Holds scoping + GA quantity
ALTER TABLE holds
  ADD COLUMN IF NOT EXISTS occurrence_id UUID REFERENCES event_occurrences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0);

-- Drop old unique seat constraint (name may vary; using common default)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'holds' AND constraint_type = 'UNIQUE' AND constraint_name = 'holds_seat_id_key'
  ) THEN
    ALTER TABLE holds DROP CONSTRAINT holds_seat_id_key;
  END IF;
END $$;

-- Unique per (event, occurrence, seat) for seated holds
CREATE UNIQUE INDEX IF NOT EXISTS uq_holds_seat_per_show
  ON holds(event_id, occurrence_id, seat_id)
  WHERE seat_id IS NOT NULL;

-- 2) Tickets: prevent double-selling of seats per showtime
CREATE UNIQUE INDEX IF NOT EXISTS uq_tickets_seat_once
  ON tickets(event_id, occurrence_id, seat_id)
  WHERE seat_id IS NOT NULL AND status IN ('issued','checked_in','transferred');

-- 3) Seatmap snapshots per event
CREATE TABLE IF NOT EXISTS event_seatmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  seatmap_id UUID NOT NULL REFERENCES seatmaps(id) ON DELETE RESTRICT,
  snapshot JSONB NOT NULL, -- frozen spec + seats at time of assignment
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Function: populate snapshot when seatmap assigned to event
CREATE OR REPLACE FUNCTION snapshot_seatmap_for_event()
RETURNS TRIGGER AS $$
DECLARE
  snapshot_json JSONB;
BEGIN
  IF NEW.seatmap_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM event_seatmaps esm WHERE esm.event_id = NEW.id) THEN
    SELECT jsonb_build_object(
      'seatmap', sm.spec,
      'seats', COALESCE(
        (
          SELECT jsonb_agg(jsonb_build_object(
            'id', s.id,
            'section', s.section,
            'row', s.row,
            'number', s.number,
            'pos', s.pos
          ))
          FROM seats s WHERE s.seatmap_id = NEW.seatmap_id
        ), '[]'::jsonb)
    ) INTO snapshot_json
    FROM seatmaps sm WHERE sm.id = NEW.seatmap_id;

    INSERT INTO event_seatmaps(event_id, seatmap_id, snapshot)
    VALUES (NEW.id, NEW.seatmap_id, COALESCE(snapshot_json, '{}'::jsonb));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Prevent changing seatmap after first sale
CREATE OR REPLACE FUNCTION prevent_seatmap_change_if_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seatmap_id IS DISTINCT FROM OLD.seatmap_id THEN
    IF EXISTS (SELECT 1 FROM tickets t WHERE t.event_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot change event seatmap after ticket sales have started';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Prevent edits to event_seatmaps after sales
CREATE OR REPLACE FUNCTION prevent_event_seatmaps_update_if_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM tickets t WHERE t.event_id = NEW.event_id) THEN
    RAISE EXCEPTION 'Cannot modify event_seatmaps after ticket sales have started';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers on events for snapshot + lock
DROP TRIGGER IF EXISTS trg_snapshot_seatmap_on_insert ON events;
CREATE TRIGGER trg_snapshot_seatmap_on_insert
AFTER INSERT ON events
FOR EACH ROW
WHEN (NEW.seatmap_id IS NOT NULL)
EXECUTE FUNCTION snapshot_seatmap_for_event();

DROP TRIGGER IF EXISTS trg_snapshot_seatmap_on_update ON events;
CREATE TRIGGER trg_snapshot_seatmap_on_update
AFTER UPDATE OF seatmap_id ON events
FOR EACH ROW
WHEN (NEW.seatmap_id IS NOT NULL)
EXECUTE FUNCTION snapshot_seatmap_for_event();

DROP TRIGGER IF EXISTS trg_prevent_seatmap_change_if_sold ON events;
CREATE TRIGGER trg_prevent_seatmap_change_if_sold
BEFORE UPDATE OF seatmap_id ON events
FOR EACH ROW
EXECUTE FUNCTION prevent_seatmap_change_if_sold();

-- Attach triggers on event_seatmaps to prevent modification after sales
DROP TRIGGER IF EXISTS trg_no_update_event_seatmaps_if_sold ON event_seatmaps;
CREATE TRIGGER trg_no_update_event_seatmaps_if_sold
BEFORE UPDATE OR DELETE ON event_seatmaps
FOR EACH ROW
EXECUTE FUNCTION prevent_event_seatmaps_update_if_sold();

-- 4) Index coverage improvements
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_seats_seatmap ON seats(seatmap_id);
CREATE INDEX IF NOT EXISTS idx_event_assets_event ON event_assets(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_sale_window ON ticket_types(status, sales_start, sales_end);
CREATE INDEX IF NOT EXISTS idx_events_publish_live_approved
  ON events(status, publish_at)
  WHERE status IN ('live','approved');
-- Index on holds expires_at (removed WHERE clause with now() as it's not immutable)
CREATE INDEX IF NOT EXISTS idx_holds_active_expires_at
  ON holds(expires_at);

-- 5) Dispute lifecycle → orders.status transitions on final outcomes
CREATE OR REPLACE FUNCTION sync_order_status_on_dispute()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'lost' THEN
    UPDATE orders SET status = 'chargeback', updated_at = now()
    WHERE id = NEW.order_id AND status <> 'chargeback';
  ELSIF NEW.status = 'won' THEN
    UPDATE orders SET status = 'paid', updated_at = now()
    WHERE id = NEW.order_id AND status = 'chargeback';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_status_on_dispute_ins ON disputes;
CREATE TRIGGER trg_sync_order_status_on_dispute_ins
AFTER INSERT ON disputes
FOR EACH ROW
EXECUTE FUNCTION sync_order_status_on_dispute();

DROP TRIGGER IF EXISTS trg_sync_order_status_on_dispute_upd ON disputes;
CREATE TRIGGER trg_sync_order_status_on_dispute_upd
AFTER UPDATE OF status ON disputes
FOR EACH ROW
EXECUTE FUNCTION sync_order_status_on_dispute();

-- 6) Promo codes: org-wide unique where event_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS uq_promo_org_code
  ON promo_codes(org_id, code)
  WHERE event_id IS NULL;

-- 7) Soft deletes
ALTER TABLE events       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE venues       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 8) Auto-update timestamps (updated_at)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to selected tables that have updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_users ON users;
CREATE TRIGGER trg_set_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_events ON events;
CREATE TRIGGER trg_set_updated_at_events
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_orgs ON organizations;
CREATE TRIGGER trg_set_updated_at_orgs
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_orders ON orders;
CREATE TRIGGER trg_set_updated_at_orders
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9) Payment idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_charge
  ON payments(provider, provider_charge)
  WHERE provider_charge IS NOT NULL;

COMMIT;

