CREATE EXTENSION IF NOT EXISTS postgis;

CREATE INDEX IF NOT EXISTS idx_driver_available_geo
ON "Driver"
USING GIST ((ST_SetSRID(ST_MakePoint("currentLng", "currentLat"), 4326)::geography))
WHERE "isAvailable" = true;
