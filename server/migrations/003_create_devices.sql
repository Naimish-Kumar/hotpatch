-- 003_create_devices.sql
-- HotPatch OTA: Devices and Installations tables
-- Tracks devices checking for updates and their installation history.

CREATE TABLE IF NOT EXISTS devices (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id        VARCHAR(255) NOT NULL UNIQUE,   -- SDK-generated UUID
    app_id           UUID         NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    platform         VARCHAR(10)  NOT NULL CHECK (platform IN ('android', 'ios')),
    current_version  VARCHAR(50),
    last_seen        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_app ON devices(app_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(app_id, last_seen DESC);

CREATE TABLE IF NOT EXISTS installations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id    UUID        NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    release_id   UUID        NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL CHECK (status IN ('applied', 'failed', 'rolled_back')),
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installations_release ON installations(release_id);
CREATE INDEX IF NOT EXISTS idx_installations_device  ON installations(device_id);
