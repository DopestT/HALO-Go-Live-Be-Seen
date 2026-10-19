-- NSCENE Messenger V1 durable persistence.
-- PostgreSQL is authoritative; Redis/realtime layers may only accelerate delivery.

CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    kind VARCHAR(16) NOT NULL DEFAULT 'direct'
        CHECK (kind IN ('direct')),
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    direct_user_low_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    direct_user_high_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_status VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (request_status IN ('pending','accepted','declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMPTZ,
    CHECK (direct_user_low_id < direct_user_high_id),
    UNIQUE (direct_user_low_id, direct_user_high_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
    hidden_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_id, blocked_user_id),
    CHECK (blocker_id <> blocked_user_id)
);

-- Reuse the platform moderation_reports table created by 002_live_network_core.sql.
-- Messenger-specific target metadata stays nullable so existing live reports remain valid.
ALTER TABLE moderation_reports
    ADD COLUMN IF NOT EXISTS messenger_target_type VARCHAR(16),
    ADD COLUMN IF NOT EXISTS messenger_target_id BIGINT,
    ADD COLUMN IF NOT EXISTS conversation_id BIGINT REFERENCES conversations(id) ON DELETE SET NULL;

ALTER TABLE moderation_reports
    ADD CONSTRAINT moderation_reports_messenger_target_check CHECK (
        (messenger_target_type IS NULL AND messenger_target_id IS NULL AND conversation_id IS NULL)
        OR (
            messenger_target_type IN ('message','user')
            AND messenger_target_id IS NOT NULL
        )
    ) NOT VALID,
    ADD CONSTRAINT moderation_reports_messenger_reason_check CHECK (
        messenger_target_type IS NULL
        OR reason_code IN (
            'spam',
            'harassment',
            'hate_or_abuse',
            'sexual_content',
            'threat_or_violence',
            'impersonation',
            'other'
        )
    ) NOT VALID,
    ADD CONSTRAINT moderation_reports_messenger_detail_check CHECK (
        messenger_target_type IS NULL OR char_length(detail) <= 1000
    ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
    ON conversations(last_message_at DESC NULLS LAST, id DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_request_status
    ON conversations(request_status, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
    ON conversation_participants(user_id, hidden_at, conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_cursor
    ON messages(conversation_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender
    ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
    ON user_blocks(blocked_user_id, blocker_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_messenger_review
    ON moderation_reports(status, created_at ASC)
    WHERE messenger_target_type IS NOT NULL;

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
