-- 004_add_release_columns.sql
-- HotPatch OTA: Add missing columns to releases table for encryption, patching, and key management.
-- These columns are defined in the GORM model but were missing from the original migration.

ALTER TABLE releases
    ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_patch BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS base_version VARCHAR(50),
    ADD COLUMN IF NOT EXISTS key_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS size BIGINT NOT NULL DEFAULT 0;
