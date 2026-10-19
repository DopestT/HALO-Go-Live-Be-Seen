-- name: FindDirectConversation :one
SELECT *
FROM conversations
WHERE direct_user_low_id = $1
  AND direct_user_high_id = $2
LIMIT 1;

-- name: CreateDirectConversation :one
INSERT INTO conversations (
    kind,
    created_by,
    direct_user_low_id,
    direct_user_high_id,
    request_status
) VALUES ('direct', $1, $2, $3, 'pending')
RETURNING *;

-- name: AddConversationParticipant :exec
INSERT INTO conversation_participants (conversation_id, user_id)
VALUES ($1, $2)
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- name: ListConversationParticipants :many
SELECT *
FROM conversation_participants
WHERE conversation_id = $1
ORDER BY user_id ASC;

-- name: InsertMessage :one
INSERT INTO messages (conversation_id, sender_id, body)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListConversationMessages :many
SELECT *
FROM messages
WHERE conversation_id = $1
  AND ($2::bigint = 0 OR id < $2)
ORDER BY id DESC
LIMIT $3;

-- name: UpdateConversationRequestStatus :one
UPDATE conversations
SET request_status = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: UpdateLastReadMessage :exec
UPDATE conversation_participants
SET last_read_message_id = $3
WHERE conversation_id = $1
  AND user_id = $2;

-- name: CountUnreadMessages :one
SELECT COUNT(*)::bigint
FROM messages m
JOIN conversation_participants cp
  ON cp.conversation_id = m.conversation_id
WHERE cp.user_id = $1
  AND m.sender_id <> $1
  AND m.id > COALESCE(cp.last_read_message_id, 0);

-- name: HideConversationForUser :exec
UPDATE conversation_participants
SET hidden_at = CURRENT_TIMESTAMP
WHERE conversation_id = $1
  AND user_id = $2;

-- name: UnhideConversationForUser :exec
UPDATE conversation_participants
SET hidden_at = NULL
WHERE conversation_id = $1
  AND user_id = $2;

-- name: CreateUserBlock :exec
INSERT INTO user_blocks (blocker_id, blocked_user_id)
VALUES ($1, $2)
ON CONFLICT (blocker_id, blocked_user_id) DO NOTHING;

-- name: DeleteUserBlock :exec
DELETE FROM user_blocks
WHERE blocker_id = $1
  AND blocked_user_id = $2;

-- name: CheckUserBlock :one
SELECT EXISTS (
    SELECT 1
    FROM user_blocks
    WHERE blocker_id = $1
      AND blocked_user_id = $2
)::boolean;

-- name: InsertModerationReport :one
INSERT INTO moderation_reports (
    id,
    reporter_user_id,
    messenger_target_type,
    messenger_target_id,
    conversation_id,
    reason_code,
    detail,
    status
) VALUES (
    gen_random_uuid(),
    $1,
    $2,
    $3,
    $4,
    $5,
    COALESCE($6, ''),
    'open'
)
RETURNING *;
