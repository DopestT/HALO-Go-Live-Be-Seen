-- HALO hardened external-media ingestion foundation.
-- Remote URLs remain untrusted input. Approval in these tables does not bypass
-- application-layer URL/DNS/egress validation at fetch or playback time.

CREATE TABLE IF NOT EXISTS media_sources (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
    authorization_status VARCHAR(24) NOT NULL DEFAULT 'pending'
        CHECK (authorization_status IN ('pending','approved','rejected','revoked')),
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    authorization_actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    authorization_reason TEXT,
    authorized_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (authorization_status = 'approved' AND authorized_at IS NOT NULL)
        OR authorization_status <> 'approved'
    ),
    CHECK (
        (authorization_status = 'revoked' AND revoked_at IS NOT NULL)
        OR authorization_status <> 'revoked'
    )
);

CREATE TABLE IF NOT EXISTS media_source_allowed_hosts (
    source_id UUID NOT NULL REFERENCES media_sources(id) ON DELETE CASCADE,
    hostname VARCHAR(253) NOT NULL,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_id, hostname),
    CHECK (hostname = lower(hostname)),
    CHECK (char_length(hostname) BETWEEN 3 AND 253),
    CHECK (hostname LIKE '%.%'),
    CHECK (hostname !~ '[:/@*?#\[\]\\]'),
    CHECK (hostname !~ '^\.'),
    CHECK (hostname !~ '\.$'),
    CHECK (hostname !~ '\.\.'),
    CHECK (hostname !~ '^[0-9.]+$')
);

CREATE TABLE IF NOT EXISTS external_media_assets (
    id UUID PRIMARY KEY,
    source_id UUID NOT NULL REFERENCES media_sources(id) ON DELETE RESTRICT,
    external_id VARCHAR(255) NOT NULL CHECK (char_length(btrim(external_id)) BETWEEN 1 AND 255),
    media_url TEXT NOT NULL CHECK (char_length(btrim(media_url)) > 0),
    thumbnail_url TEXT,
    rights_reference TEXT NOT NULL CHECK (char_length(btrim(rights_reference)) > 0),
    attribution_text TEXT,
    review_status VARCHAR(24) NOT NULL DEFAULT 'pending'
        CHECK (review_status IN ('pending','approved','rejected','blocked')),
    removal_reason TEXT,
    reviewed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_id, external_id),
    CHECK (
        (review_status IN ('approved','rejected','blocked') AND reviewed_at IS NOT NULL)
        OR review_status = 'pending'
    ),
    CHECK (
        (review_status = 'blocked' AND removal_reason IS NOT NULL AND char_length(btrim(removal_reason)) > 0)
        OR review_status <> 'blocked'
    )
);

CREATE INDEX IF NOT EXISTS idx_media_sources_channel_status
    ON media_sources(channel_id, authorization_status);
CREATE INDEX IF NOT EXISTS idx_media_assets_source_review
    ON external_media_assets(source_id, review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_review_queue
    ON external_media_assets(review_status, created_at)
    WHERE review_status = 'pending';

CREATE TRIGGER update_media_sources_updated_at BEFORE UPDATE ON media_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_media_assets_updated_at BEFORE UPDATE ON external_media_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
