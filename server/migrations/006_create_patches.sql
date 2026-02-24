-- 006_create_patches.sql
-- HotPatch OTA: Patches table
-- Stores binary diff patches between versions for efficient delta updates.

CREATE TABLE IF NOT EXISTS patches (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id    UUID        NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    base_version  VARCHAR(50) NOT NULL,   -- The version this patch applies FROM
    patch_url     TEXT        NOT NULL,
    hash          VARCHAR(64) NOT NULL,   -- SHA256 hex of the patch file
    signature     TEXT        NOT NULL,   -- Ed25519 base64 signature
    size          BIGINT      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patches_release ON patches(release_id);
CREATE INDEX IF NOT EXISTS idx_patches_base_version ON patches(release_id, base_version);
