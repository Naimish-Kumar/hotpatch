-- 001_create_apps.sql
-- HotPatch OTA: Apps table
-- Each app represents a registered React Native application.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS apps (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(255) NOT NULL UNIQUE,
    platform                VARCHAR(10)  NOT NULL CHECK (platform IN ('android', 'ios')),
    api_key                 VARCHAR(64)  NOT NULL UNIQUE,
    owner_id                UUID,
    tier                    VARCHAR(20)  NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    stripe_customer_id      VARCHAR(255) DEFAULT '',
    stripe_subscription_id  VARCHAR(255) DEFAULT '',
    subscription_status     VARCHAR(20)  DEFAULT 'none',
    subscription_end        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_api_key ON apps(api_key);
CREATE INDEX IF NOT EXISTS idx_apps_owner_id ON apps(owner_id);
CREATE INDEX IF NOT EXISTS idx_apps_stripe_subscription_id ON apps(stripe_subscription_id);
