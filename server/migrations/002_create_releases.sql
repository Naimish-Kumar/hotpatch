-- 002_create_releases.sql
-- HotPatch OTA: Releases table
-- Stores metadata for every published OTA bundle.

CREATE TABLE IF NOT EXISTS releases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id              UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    version             VARCHAR(50)  NOT NULL,
    channel             VARCHAR(50)  NOT NULL DEFAULT 'production',
    bundle_url          TEXT         NOT NULL,
    hash                VARCHAR(64)  NOT NULL,   -- SHA256 hex
    signature           TEXT         NOT NULL,    -- Ed25519 base64
    mandatory           BOOLEAN      NOT NULL DEFAULT false,
    rollout_percentage  SMALLINT     NOT NULL DEFAULT 100 CHECK (rollout_percentage BETWEEN 1 AND 100),
    is_active           BOOLEAN      NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE(app_id, version, channel)
);

-- Critical index for the /update/check endpoint
CREATE INDEX IF NOT EXISTS idx_releases_active
    ON releases(app_id, channel, is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_releases_app_created
    ON releases(app_id, created_at DESC);
