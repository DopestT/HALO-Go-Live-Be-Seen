-- name: UserExists :one
SELECT EXISTS (SELECT 1 FROM users WHERE id = sqlc.arg(user_id))::boolean;

-- name: FindDirectConversation :one
SELECT *
FROM conversations
WHERE direct_user_low_id = sqlc.arg(user_low_id)
  AND direct_user_high_id = sqlc.arg(user_high_id)
LIMIT 1;

-- name: FindDirectConversationForUpdate :one
SELECT *
FROM conversations
WHERE direct_user_low_id = sqlc.arg(user_low_id)
  AND direct_user_high_id = sqlc.arg(user_high_id)
LIMIT 1
FOR UPDATE;

-- name: GetConversation :one
SELECT *
FROM conversations
WHERE id = sqlc.arg(conversation_id)
LIMIT 1;

-- name: GetConversationForUpdate :one
SELECT *
FROM conversations
WHERE id = sqlc.arg(conversation_id)
LIMIT 1
FOR UPDATE;

-- name: CreateDirectConversation :one
INSERT INTO conversations (
    kind,
    created_by,
    direct_user_low_id,
    direct_user_high_id,
    request_status
) VALUES (
    'direct',
    sqlc.arg(created_by),
    sqlc.arg(user_low_id),
    sqlc.arg(user_high_id),
    'pending'
)
ON CONFLICT (direct_user_low_id, direct_user_high_id) DO NOTHING
RETURNING *;

-- name: AddConversationParticipant :exec
INSERT INTO conversation_participants (conversation_id, user_id)
VALUES (sqlc.arg(conversation_id), sqlc.arg(user_id))
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- name: ListConversationParticipants :many
SELECT *
FROM conversation_participants
WHERE conversation_id = sqlc.arg(conversation_id)
ORDER BY user_id ASC;

-- name: InsertMessage :one
INSERT INTO messages (conversation_id, sender_id, body)
VALUES (sqlc.arg(conversation_id), sqlc.arg(sender_id), sqlc.arg(body))
RETURNING *;

-- name: GetFirstConversationMessage :one
SELECT *
FROM messages
WHERE conversation_id = sqlc.arg(conversation_id)
ORDER BY id ASC
LIMIT 1;

-- name: ListConversationMessages :many
SELECT *
FROM messages
WHERE conversation_id = sqlc.arg(conversation_id)
  AND (sqlc.arg(cursor_id)::bigint = 0 OR id < sqlc.arg(cursor_id))
ORDER BY id DESC
LIMIT sqlc.arg(page_limit);

-- name: UpdateConversationRequestStatus :one
UPDATE conversations
SET request_status = sqlc.arg(request_status),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg(conversation_id)
  AND request_status = 'pending'
RETURNING *;

-- name: TouchConversationAfterMessage :exec
UPDATE conversations
SET last_message_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg(conversation_id);

-- name: UpdateLastReadMessage :exec
UPDATE conversation_participants cp
SET last_read_message_id = sqlc.arg(message_id)::bigint
WHERE cp.conversation_id = sqlc.arg(conversation_id)
  AND cp.user_id = sqlc.arg(user_id)
  AND EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = sqlc.arg(message_id)::bigint
        AND m.conversation_id = cp.conversation_id
  );

-- name: CountUnreadMessages :one
SELECT COUNT(*)::bigint
FROM messages m
JOIN conversation_participants cp
  ON cp.conversation_id = m.conversation_id
JOIN conversations c
  ON c.id = m.conversation_id
WHERE cp.user_id = sqlc.arg(user_id)
  AND cp.hidden_at IS NULL
  AND c.request_status = 'accepted'
  AND m.sender_id <> sqlc.arg(user_id)
  AND m.id > COALESCE(cp.last_read_message_id, 0);

-- name: HideConversationForUser :exec
UPDATE conversation_participants
SET hidden_at = CURRENT_TIMESTAMP
WHERE conversation_id = sqlc.arg(conversation_id)
  AND user_id = sqlc.arg(user_id);

-- name: UnhideConversationForUser :exec
UPDATE conversation_participants
SET hidden_at = NULL
WHERE conversation_id = sqlc.arg(conversation_id)
  AND user_id = sqlc.arg(user_id);

-- name: CreateUserBlock :exec
INSERT INTO user_blocks (blocker_id, blocked_user_id)
VALUES (sqlc.arg(blocker_id), sqlc.arg(blocked_user_id))
ON CONFLICT (blocker_id, blocked_user_id) DO NOTHING;

-- name: DeleteUserBlock :exec
DELETE FROM user_blocks
WHERE blocker_id = sqlc.arg(blocker_id)
  AND blocked_user_id = sqlc.arg(blocked_user_id);

-- name: CheckUserBlock :one
SELECT EXISTS (
    SELECT 1
    FROM user_blocks
    WHERE blocker_id = sqlc.arg(blocker_id)
      AND blocked_user_id = sqlc.arg(blocked_user_id)
)::boolean;

-- name: IsBlockedBetween :one
SELECT EXISTS (
    SELECT 1
    FROM user_blocks
    WHERE (blocker_id = sqlc.arg(user_a) AND blocked_user_id = sqlc.arg(user_b))
       OR (blocker_id = sqlc.arg(user_b) AND blocked_user_id = sqlc.arg(user_a))
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
    sqlc.arg(reporter_user_id),
    sqlc.arg(target_type),
    sqlc.arg(target_id),
    sqlc.narg(conversation_id),
    sqlc.arg(reason_code),
    COALESCE(sqlc.narg(detail), ''),
    'open'
)
RETURNING *;
