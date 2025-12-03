-- Saved events allow users to bookmark events

CREATE TABLE IF NOT EXISTS "saved_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "saved_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "saved_events_user_id_event_id_key" ON "saved_events"("user_id", "event_id");
CREATE INDEX IF NOT EXISTS "saved_events_user_id_idx" ON "saved_events"("user_id");
CREATE INDEX IF NOT EXISTS "saved_events_event_id_idx" ON "saved_events"("event_id");

ALTER TABLE "saved_events"
  ADD CONSTRAINT "saved_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_events"
  ADD CONSTRAINT "saved_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
