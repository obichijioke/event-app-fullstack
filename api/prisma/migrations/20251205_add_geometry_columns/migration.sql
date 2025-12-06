-- Add geometry columns to events, venues, and venue_catalogs tables
-- Using geography type (SRID 4326) for accurate distance calculations on Earth's surface

-- Add geometry column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Add geometry column to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Add geometry column to venue_catalogs table
ALTER TABLE venue_catalogs ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Populate geometry from existing lat/lon for events
UPDATE events
SET location = ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

-- Populate geometry from existing lat/lon for venues
UPDATE venues
SET location = ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

-- Populate geometry from existing lat/lon for venue_catalogs
UPDATE venue_catalogs
SET location = ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

-- Create GIST spatial indexes for efficient spatial queries
CREATE INDEX IF NOT EXISTS idx_events_location_gist ON events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_venues_location_gist ON venues USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_venue_catalogs_location_gist ON venue_catalogs USING GIST(location);

-- Create a function to automatically update geometry when lat/lon changes
CREATE OR REPLACE FUNCTION update_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude::float, NEW.latitude::float), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update geometry on insert/update
DROP TRIGGER IF EXISTS trg_events_update_location ON events;
CREATE TRIGGER trg_events_update_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_location_geometry();

DROP TRIGGER IF EXISTS trg_venues_update_location ON venues;
CREATE TRIGGER trg_venues_update_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_location_geometry();

DROP TRIGGER IF EXISTS trg_venue_catalogs_update_location ON venue_catalogs;
CREATE TRIGGER trg_venue_catalogs_update_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON venue_catalogs
  FOR EACH ROW
  EXECUTE FUNCTION update_location_geometry();
