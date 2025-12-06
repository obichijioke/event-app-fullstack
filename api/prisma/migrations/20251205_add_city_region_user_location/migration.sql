-- Create LocationSource enum for tracking how user location was obtained
CREATE TYPE "LocationSource" AS ENUM ('ip', 'browser', 'manual', 'address');

-- Create regions table
CREATE TABLE regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location geography(POINT, 4326),
  timezone TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create cities table
CREATE TABLE cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region_id TEXT REFERENCES regions(id) ON DELETE SET NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location geography(POINT, 4326),
  population INT,
  timezone TEXT,
  aliases TEXT[] DEFAULT '{}',
  is_major BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_locations table
CREATE TABLE user_locations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location geography(POINT, 4326),
  city TEXT,
  city_id TEXT REFERENCES cities(id) ON DELETE SET NULL,
  region TEXT,
  country TEXT,
  country_code TEXT,
  source "LocationSource" NOT NULL DEFAULT 'ip',
  accuracy_meters INT,
  last_updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for cities
CREATE INDEX idx_cities_name ON cities(LOWER(name));
CREATE INDEX idx_cities_country ON cities(country_code);
CREATE INDEX idx_cities_location_gist ON cities USING GIST(location);
CREATE INDEX idx_cities_is_major ON cities(is_major) WHERE is_major = true;

-- Create indexes for regions
CREATE INDEX idx_regions_country ON regions(country_code);
CREATE INDEX idx_regions_location_gist ON regions USING GIST(location);

-- Create indexes for user_locations
CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_location_gist ON user_locations USING GIST(location);
CREATE INDEX idx_user_locations_city ON user_locations(city_id);

-- Populate geometry from lat/lon for regions
CREATE OR REPLACE FUNCTION update_region_location()
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

CREATE TRIGGER trg_regions_update_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON regions
  FOR EACH ROW
  EXECUTE FUNCTION update_region_location();

-- Populate geometry from lat/lon for cities
CREATE OR REPLACE FUNCTION update_city_location()
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

CREATE TRIGGER trg_cities_update_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_city_location();

-- Populate geometry from lat/lon for user_locations
CREATE OR REPLACE FUNCTION update_user_location_geometry()
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

CREATE TRIGGER trg_user_locations_update_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_location_geometry();
