-- 001_create_apps.sql
-- HotPatch OTA: Apps table
-- Each app represents a registered React Native application.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS apps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL UNIQUE,
    platform    VARCHAR(10)  NOT NULL CHECK (platform IN ('android', 'ios')),
    api_key     VARCHAR(64)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_api_key ON apps(api_key);
