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

CREATE TABLE IF NOT EXISTS moderation_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('message','user')),
    target_id BIGINT NOT NULL,
    conversation_id BIGINT REFERENCES conversations(id) ON DELETE SET NULL,
    reason_code VARCHAR(32) NOT NULL CHECK (
        reason_code IN (
            'spam',
            'harassment',
            'hate_or_abuse',
            'sexual_content',
            'threat_or_violence',
            'impersonation',
            'other'
        )
    ),
    detail TEXT CHECK (detail IS NULL OR char_length(detail) <= 1000),
    review_status VARCHAR(16) NOT NULL DEFAULT 'open'
        CHECK (review_status IN ('open','reviewing','resolved','dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX IF NOT EXISTS idx_moderation_reports_review
    ON moderation_reports(review_status, created_at ASC);

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
