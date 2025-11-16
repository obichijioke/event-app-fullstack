-- Bootstrap
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------- Enumerations ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_role') THEN
    CREATE TYPE platform_role AS ENUM ('attendee','organizer','moderator','admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_member_role') THEN
    CREATE TYPE org_member_role AS ENUM ('owner','manager','finance','staff');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('draft','pending','approved','live','paused','ended','canceled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
    CREATE TYPE visibility AS ENUM ('public','unlisted','private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_kind') THEN
    CREATE TYPE ticket_kind AS ENUM ('GA','SEATED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending','paid','canceled','refunded','chargeback');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM ('issued','transferred','refunded','checked_in','void');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hold_reason') THEN
    CREATE TYPE hold_reason AS ENUM ('checkout','reservation','organizer_hold');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
    CREATE TYPE payout_status AS ENUM ('pending','in_review','paid','failed','canceled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
    CREATE TYPE refund_status AS ENUM ('pending','approved','processed','failed','canceled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('requires_action','authorized','captured','voided','failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
    CREATE TYPE moderation_status AS ENUM ('open','needs_changes','approved','rejected','resolved');
  END IF;
END$$;

-- ---------- Identity & Access ----------
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
email CITEXT UNIQUE NOT NULL,
email_verified_at TIMESTAMPTZ,
password_hash TEXT, -- if using password auth
name TEXT,
phone TEXT,
role platform_role NOT NULL DEFAULT 'attendee',
twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
status TEXT NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at TIMESTAMPTZ
);

CREATE TABLE user_sessions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
user_agent TEXT,
ip_addr INET,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
expires_at TIMESTAMPTZ NOT NULL,
revoked_at TIMESTAMPTZ
);
CREATE INDEX ON user_sessions (user_id);
CREATE INDEX ON user_sessions (expires_at);

CREATE TABLE api_keys (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
name TEXT NOT NULL,
prefix TEXT NOT NULL, -- for quick lookup
hashed_secret TEXT NOT NULL, -- store hash only
scopes TEXT[] NOT NULL DEFAULT '{}',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
last_used_at TIMESTAMPTZ,
revoked_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX api_keys_prefix_key ON api_keys(prefix);

-- ---------- Organizations & Payouts ----------
CREATE TABLE organizations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
owner_id UUID NOT NULL REFERENCES users(id),
name TEXT NOT NULL,
legal_name TEXT,
website TEXT,
country TEXT,
support_email CITEXT,
tax_id TEXT,
status TEXT NOT NULL DEFAULT 'pending', -- 'pending','active','suspended'
payout_provider TEXT, -- e.g., 'stripe','adyen'
payout_account_id TEXT, -- external account/ref
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE org_members (
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
role org_member_role NOT NULL,
invited_by UUID REFERENCES users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
PRIMARY KEY (org_id, user_id)
);

CREATE TABLE payout_accounts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
provider TEXT NOT NULL,
external_id TEXT NOT NULL,
default_account BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (org_id, provider, external_id)
);

CREATE TABLE payouts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
amount_cents BIGINT NOT NULL,
currency TEXT NOT NULL,
status payout_status NOT NULL DEFAULT 'pending',
scheduled_for DATE,
initiated_at TIMESTAMPTZ,
provider TEXT,
provider_ref TEXT,
failure_reason TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON payouts (org_id, status);

-- ---------- Venues & Seatmaps ----------
CREATE TABLE venues (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
name TEXT NOT NULL,
address JSONB, -- {line1, line2, city, region, postal, country}
timezone TEXT NOT NULL,
capacity INT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON venues (org_id);

CREATE TABLE seatmaps (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
name TEXT NOT NULL,
spec JSONB NOT NULL, -- full map for rendering
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE seats (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
seatmap_id UUID NOT NULL REFERENCES seatmaps(id) ON DELETE CASCADE,
section TEXT,
row TEXT,
number TEXT,
-- Optional absolute coordinates for selection UI
pos JSONB, -- {x,y,w,h}
UNIQUE (seatmap_id, section, row, number)
);

-- ---------- Events ----------
CREATE TABLE categories (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
slug TEXT UNIQUE NOT NULL,
name TEXT NOT NULL,
parent_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE events (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
seatmap_id UUID REFERENCES seatmaps(id) ON DELETE SET NULL,
title TEXT NOT NULL,
description_md TEXT,
status event_status NOT NULL DEFAULT 'draft',
visibility visibility NOT NULL DEFAULT 'public',
category_id UUID REFERENCES categories(id),
start_at TIMESTAMPTZ NOT NULL,
end_at TIMESTAMPTZ NOT NULL,
door_time TIMESTAMPTZ,
publish_at TIMESTAMPTZ,
age_restriction TEXT,
cover_image_url TEXT,
language TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON events (org_id, status);
CREATE INDEX ON events (visibility, publish_at);
CREATE INDEX ON events (start_at);

-- Optional: support multi-show runs
CREATE TABLE event_occurrences (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
starts_at TIMESTAMPTZ NOT NULL,
ends_at TIMESTAMPTZ NOT NULL,
gate_open_at TIMESTAMPTZ
);
CREATE INDEX ON event_occurrences (event_id, starts_at);

CREATE TABLE event_assets (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
kind TEXT NOT NULL, -- 'image','pdf','video','seatmap-render'
url TEXT NOT NULL,
alt_text TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_policies (
event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
refund_policy TEXT, -- rich text or markdown
transfer_allowed BOOLEAN NOT NULL DEFAULT TRUE,
transfer_cutoff INTERVAL, -- e.g., '2 hours'
resale_allowed BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------- Ticketing & Pricing ----------
CREATE TABLE ticket_types (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
name TEXT NOT NULL,
kind ticket_kind NOT NULL,
currency TEXT NOT NULL,
price_cents BIGINT NOT NULL,
fee_cents BIGINT NOT NULL DEFAULT 0, -- organizer fee component
capacity INT, -- null means unlimited, but guard in app
per_order_limit INT,
sales_start TIMESTAMPTZ,
sales_end TIMESTAMPTZ,
status TEXT NOT NULL DEFAULT 'active',
sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX ON ticket_types (event_id);

-- Optional price tiers (early bird, etc.)
CREATE TABLE ticket_price_tiers (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
starts_at TIMESTAMPTZ,
ends_at TIMESTAMPTZ,
min_qty INT DEFAULT 1,
price_cents BIGINT NOT NULL,
fee_cents BIGINT NOT NULL DEFAULT 0,
UNIQUE (ticket_type_id, starts_at, ends_at)
);

-- Reserved seating mapping (which seats a ticket type can sell)
CREATE TABLE ticket_type_seats (
ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
PRIMARY KEY (ticket_type_id, seat_id)
);

-- Holds (inventory reservations)
CREATE TABLE holds (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
user_id UUID REFERENCES users(id) ON DELETE SET NULL,
reason hold_reason NOT NULL DEFAULT 'checkout',
expires_at TIMESTAMPTZ NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
-- Prevent double-selling a seat or overselling a GA bucket
UNIQUE (seat_id),
UNIQUE (event_id, ticket_type_id, user_id) -- avoids duplicate cart rows per type
);
CREATE INDEX ON holds (event_id, expires_at);

-- ---------- Orders, Payments, Tickets ----------
CREATE TABLE orders (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
occurrence_id UUID REFERENCES event_occurrences(id) ON DELETE SET NULL,
status order_status NOT NULL DEFAULT 'pending',
subtotal_cents BIGINT NOT NULL DEFAULT 0,
fees_cents BIGINT NOT NULL DEFAULT 0, -- platform + organizer fees
tax_cents BIGINT NOT NULL DEFAULT 0,
total_cents BIGINT NOT NULL DEFAULT 0,
currency TEXT NOT NULL,
payment_intent_id TEXT, -- PSP intent id
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
paid_at TIMESTAMPTZ,
canceled_at TIMESTAMPTZ
);
CREATE INDEX ON orders (buyer_id, created_at DESC);
CREATE INDEX ON orders (event_id, created_at DESC);
CREATE INDEX ON orders (status);

CREATE TABLE order_items (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
seat_id UUID, -- filled for SEATED
quantity INT NOT NULL CHECK (quantity > 0),
unit_price_cents BIGINT NOT NULL,
unit_fee_cents BIGINT NOT NULL DEFAULT 0,
currency TEXT NOT NULL
);
CREATE INDEX ON order_items (order_id);
CREATE INDEX ON order_items (ticket_type_id);

-- Taxes and fees captured at order time (immutable lines)
CREATE TABLE order_tax_lines (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
name TEXT NOT NULL, -- 'Sales tax', 'VAT'
rate NUMERIC(6,4) NOT NULL, -- e.g., 0.0725
amount_cents BIGINT NOT NULL
);

CREATE TABLE order_fee_lines (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
name TEXT NOT NULL, -- 'Platform fee', 'Processing fee'
amount_cents BIGINT NOT NULL,
beneficiary TEXT NOT NULL -- 'platform' or 'organizer'
);

CREATE TABLE payments (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
provider TEXT NOT NULL, -- 'stripe','adyen', etc.
provider_intent TEXT,
provider_charge TEXT,
status payment_status NOT NULL,
amount_cents BIGINT NOT NULL,
currency TEXT NOT NULL,
captured_at TIMESTAMPTZ,
failure_code TEXT,
failure_message TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON payments (order_id);
CREATE INDEX ON payments (status);

CREATE TABLE tickets (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
occurrence_id UUID REFERENCES event_occurrences(id) ON DELETE SET NULL,
ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
seat_id UUID REFERENCES seats(id),
owner_id UUID NOT NULL REFERENCES users(id),
status ticket_status NOT NULL DEFAULT 'issued',
qr_code TEXT UNIQUE, -- store payload or token id
barcode TEXT,
issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
transferred_from UUID REFERENCES users(id)
);
CREATE INDEX ON tickets (event_id, status);
CREATE INDEX ON tickets (owner_id);

CREATE TABLE transfers (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
from_user_id UUID NOT NULL REFERENCES users(id),
to_user_id UUID NOT NULL REFERENCES users(id),
initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
accepted_at TIMESTAMPTZ,
canceled_at TIMESTAMPTZ
);
CREATE INDEX ON transfers (to_user_id, initiated_at DESC);

CREATE TABLE checkins (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
scanner_id UUID, -- device id (optional FK to devices table)
gate TEXT,
scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (ticket_id) -- single entry; use additional table for multi-exit
);
CREATE INDEX ON checkins (event_id, scanned_at DESC);

-- ---------- Promotions ----------
CREATE TABLE promo_codes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
event_id UUID REFERENCES events(id) ON DELETE CASCADE,
code TEXT NOT NULL,
kind TEXT NOT NULL, -- 'percent','amount','access','hold'
percent_off NUMERIC(5,2),
amount_off_cents BIGINT,
currency TEXT,
max_redemptions INT,
per_user_limit INT,
starts_at TIMESTAMPTZ,
ends_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (event_id, code)
);

CREATE TABLE promo_redemptions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
promo_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES users(id),
redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON promo_redemptions (promo_id);
CREATE INDEX ON promo_redemptions (user_id);

-- ---------- Refunds & Disputes ----------
CREATE TABLE refunds (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
amount_cents BIGINT NOT NULL,
currency TEXT NOT NULL,
reason TEXT,
status refund_status NOT NULL DEFAULT 'pending',
created_by UUID REFERENCES users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
processed_at TIMESTAMPTZ,
provider_ref TEXT
);
CREATE INDEX ON refunds (order_id, status);

CREATE TABLE disputes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
provider TEXT NOT NULL,
case_id TEXT NOT NULL,
status TEXT NOT NULL, -- 'needs_response','won','lost','warning', etc.
amount_cents BIGINT,
reason TEXT,
opened_at TIMESTAMPTZ NOT NULL,
closed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX ON disputes (provider, case_id);

-- ---------- Moderation ----------
CREATE TABLE flags (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
target_kind TEXT NOT NULL, -- 'user','organization','event','ticket'
target_id UUID NOT NULL,
reason TEXT,
status moderation_status NOT NULL DEFAULT 'open',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
resolved_at TIMESTAMPTZ
);
CREATE INDEX ON flags (target_kind, target_id);
CREATE INDEX ON flags (status);

CREATE TABLE moderation_actions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
moderator_id UUID NOT NULL REFERENCES users(id),
target_kind TEXT NOT NULL,
target_id UUID NOT NULL,
action TEXT NOT NULL, -- 'approve','reject','pause','unlist','suspend-user'
notes TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Settings, Tax, Fees ----------
CREATE TABLE site_settings (
key TEXT PRIMARY KEY,
value JSONB NOT NULL,
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tax_rates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
country TEXT NOT NULL,
region TEXT,
city TEXT,
postal TEXT,
rate NUMERIC(6,4) NOT NULL,
name TEXT NOT NULL, -- 'Sales Tax', 'VAT'
active BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fee_schedules (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
kind TEXT NOT NULL, -- 'platform','processing'
name TEXT NOT NULL,
percent NUMERIC(6,4) DEFAULT 0,
fixed_cents BIGINT DEFAULT 0,
currency TEXT, -- optional for fixed fees
active BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE org_fee_overrides (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
fee_schedule_id UUID NOT NULL REFERENCES fee_schedules(id) ON DELETE CASCADE,
starts_at TIMESTAMPTZ,
ends_at TIMESTAMPTZ
);

-- ---------- Webhooks & Integrations ----------
CREATE TABLE webhook_endpoints (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
url TEXT NOT NULL,
secret TEXT NOT NULL,
event_filters TEXT[] NOT NULL DEFAULT '{}',
active BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_events (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
topic TEXT NOT NULL, -- 'order.paid','ticket.checked_in', etc.
payload JSONB NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_attempts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
webhook_event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
status_code INT,
success BOOLEAN NOT NULL DEFAULT FALSE,
error_message TEXT,
attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
retry_count INT NOT NULL DEFAULT 0
);
CREATE INDEX ON webhook_attempts (endpoint_id, attempted_at DESC);

-- ---------- Audit & Observability ----------
CREATE TABLE audit_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
actor_id UUID REFERENCES users(id),
action TEXT NOT NULL, -- 'create','update','delete','login', etc.
target_kind TEXT NOT NULL,
target_id UUID,
meta JSONB,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_logs (target_kind, target_id);
CREATE INDEX ON audit_logs (actor_id, created_at DESC);
