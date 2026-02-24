-- 005_add_installation_columns.sql
-- HotPatch OTA: Add missing columns to installations table for patch tracking and download metrics.
-- These columns are defined in the GORM model but were missing from the original migration.

ALTER TABLE installations
    ADD COLUMN IF NOT EXISTS is_patch BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS download_size BIGINT NOT NULL DEFAULT 0;
