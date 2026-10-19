package messaging

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/messaging/dbgen"
)

type PostgresRepository struct {
	db      *sql.DB
	queries *dbgen.Queries
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	if db == nil {
		return &PostgresRepository{}
	}
	return &PostgresRepository{db: db, queries: dbgen.New(db)}
}

func (r *PostgresRepository) UserExists(ctx context.Context, userID int64) (bool, error) {
	if r == nil || r.queries == nil {
		return false, ErrInternal
	}
	return r.queries.UserExists(ctx, userID)
}

func (r *PostgresRepository) IsBlockedBetween(ctx context.Context, userA, userB int64) (bool, error) {
	if r == nil || r.queries == nil {
		return false, ErrInternal
	}
	return r.queries.IsBlockedBetween(ctx, dbgen.IsBlockedBetweenParams{UserA: userA, UserB: userB})
}

func (r *PostgresRepository) CreateConversationWithInitialMessage(ctx context.Context, actorID, targetID int64, body string) (Conversation, Message, error) {
	if r == nil || r.db == nil {
		return Conversation{}, Message{}, ErrInternal
	}
	low, high := canonicalPair(actorID, targetID)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return Conversation{}, Message{}, err
	}
	defer func() { _ = tx.Rollback() }()
	if err := lockUserPair(ctx, tx, low, high); err != nil {
		return Conversation{}, Message{}, err
	}
	q := dbgen.New(tx)
	blocked, err := q.IsBlockedBetween(ctx, dbgen.IsBlockedBetweenParams{UserA: actorID, UserB: targetID})
	if err != nil {
		return Conversation{}, Message{}, err
	}
	if blocked {
		return Conversation{}, Message{}, ErrUserBlocked
	}

	row, err := q.CreateDirectConversation(ctx, dbgen.CreateDirectConversationParams{
		CreatedBy: actorID,
		UserLowID: low,
		UserHighID: high,
	})
	if errors.Is(err, sql.ErrNoRows) {
		existing, findErr := q.FindDirectConversation(ctx, dbgen.FindDirectConversationParams{UserLowID: low, UserHighID: high})
		if findErr != nil {
			return Conversation{}, Message{}, mapNotFound(findErr)
		}
		first, firstErr := q.GetFirstConversationMessage(ctx, existing.ID)
		if firstErr != nil {
			return Conversation{}, Message{}, mapNotFound(firstErr)
		}
		if err := tx.Commit(); err != nil {
			return Conversation{}, Message{}, err
		}
		return conversationFromDB(existing), messageFromDB(first), nil
	}
	if err != nil {
		return Conversation{}, Message{}, err
	}

	for _, userID := range []int64{low, high} {
		if err := q.AddConversationParticipant(ctx, dbgen.AddConversationParticipantParams{ConversationID: row.ID, UserID: userID}); err != nil {
			return Conversation{}, Message{}, err
		}
	}
	messageRow, err := q.InsertMessage(ctx, dbgen.InsertMessageParams{ConversationID: row.ID, SenderID: actorID, Body: body})
	if err != nil {
		return Conversation{}, Message{}, err
	}
	if err := q.TouchConversationAfterMessage(ctx, row.ID); err != nil {
		return Conversation{}, Message{}, err
	}
	if err := tx.Commit(); err != nil {
		return Conversation{}, Message{}, err
	}
	return conversationFromDB(row), messageFromDB(messageRow), nil
}

func (r *PostgresRepository) ListConversations(ctx context.Context, actorID int64, bucket Bucket, cursor int64, limit int32) ([]ConversationSummary, error) {
	if r == nil || r.db == nil {
		return nil, ErrInternal
	}
	bucketClause := `(c.request_status = 'accepted' OR (c.request_status = 'pending' AND c.created_by = $1))`
	if bucket == BucketRequests {
		bucketClause = `(c.request_status = 'pending' AND c.created_by <> $1)`
	}
	query := fmt.Sprintf(`
SELECT
    c.id, c.created_by, c.direct_user_low_id, c.direct_user_high_id, c.request_status,
    c.created_at, c.updated_at, c.last_message_at,
    CASE WHEN c.direct_user_low_id = $1 THEN c.direct_user_high_id ELSE c.direct_user_low_id END AS other_user_id,
    lm.id, lm.sender_id, lm.body, lm.created_at,
    COALESCE((
        SELECT COUNT(*) FROM messages um
        WHERE um.conversation_id = c.id
          AND um.sender_id <> $1
          AND um.id > COALESCE(cp.last_read_message_id, 0)
    ), 0)::bigint AS unread_count
FROM conversations c
JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
LEFT JOIN LATERAL (
    SELECT id, sender_id, body, created_at
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY id DESC
    LIMIT 1
) lm ON true
WHERE cp.hidden_at IS NULL
  AND %s
  AND ($2::bigint = 0 OR c.id < $2)
  AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE (ub.blocker_id = $1 AND ub.blocked_user_id = CASE WHEN c.direct_user_low_id = $1 THEN c.direct_user_high_id ELSE c.direct_user_low_id END)
         OR (ub.blocked_user_id = $1 AND ub.blocker_id = CASE WHEN c.direct_user_low_id = $1 THEN c.direct_user_high_id ELSE c.direct_user_low_id END)
  )
ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC
LIMIT $3`, bucketClause)

	rows, err := r.db.QueryContext(ctx, query, actorID, cursor, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]ConversationSummary, 0)
	for rows.Next() {
		var summary ConversationSummary
		var status string
		var lastMessageAt sql.NullTime
		var lastID, lastSender sql.NullInt64
		var lastBody sql.NullString
		var lastCreated sql.NullTime
		if err := rows.Scan(
			&summary.Conversation.ID,
			&summary.Conversation.CreatedBy,
			&summary.Conversation.UserLowID,
			&summary.Conversation.UserHighID,
			&status,
			&summary.Conversation.CreatedAt,
			&summary.Conversation.UpdatedAt,
			&lastMessageAt,
			&summary.OtherUserID,
			&lastID,
			&lastSender,
			&lastBody,
			&lastCreated,
			&summary.UnreadCount,
		); err != nil {
			return nil, err
		}
		summary.Conversation.RequestStatus = RequestStatus(status)
		if lastMessageAt.Valid {
			t := lastMessageAt.Time
			summary.Conversation.LastMessageAt = &t
		}
		if lastID.Valid {
			summary.LastMessage = &Message{ID: lastID.Int64, ConversationID: summary.Conversation.ID, SenderID: lastSender.Int64, Body: lastBody.String, CreatedAt: lastCreated.Time}
		}
		result = append(result, summary)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func (r *PostgresRepository) GetConversation(ctx context.Context, conversationID int64) (Conversation, error) {
	if r == nil || r.queries == nil {
		return Conversation{}, ErrInternal
	}
	row, err := r.queries.GetConversation(ctx, conversationID)
	if err != nil {
		return Conversation{}, mapNotFound(err)
	}
	return conversationFromDB(row), nil
}

func (r *PostgresRepository) ListMessages(ctx context.Context, conversationID int64, cursor int64, limit int32) ([]Message, error) {
	if r == nil || r.queries == nil {
		return nil, ErrInternal
	}
	rows, err := r.queries.ListConversationMessages(ctx, dbgen.ListConversationMessagesParams{ConversationID: conversationID, CursorID: cursor, PageLimit: limit})
	if err != nil {
		return nil, err
	}
	result := make([]Message, 0, len(rows))
	for _, row := range rows {
		result = append(result, messageFromDB(row))
	}
	return result, nil
}

func (r *PostgresRepository) SendMessage(ctx context.Context, conversationID, senderID, recipientID int64, body string) (Message, error) {
	if r == nil || r.db == nil {
		return Message{}, ErrInternal
	}
	low, high := canonicalPair(senderID, recipientID)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return Message{}, err
	}
	defer func() { _ = tx.Rollback() }()
	if err := lockUserPair(ctx, tx, low, high); err != nil {
		return Message{}, err
	}
	q := dbgen.New(tx)

	conversation, err := q.GetConversationForUpdate(ctx, conversationID)
	if err != nil {
		return Message{}, mapNotFound(err)
	}
	if !((conversation.DirectUserLowID == low && conversation.DirectUserHighID == high)) {
		return Message{}, ErrForbidden
	}
	if RequestStatus(conversation.RequestStatus) != RequestAccepted {
		if RequestStatus(conversation.RequestStatus) == RequestDeclined {
			return Message{}, ErrMessageRequestDeclined
		}
		return Message{}, ErrMessageRequestPending
	}
	blocked, err := q.IsBlockedBetween(ctx, dbgen.IsBlockedBetweenParams{UserA: senderID, UserB: recipientID})
	if err != nil {
		return Message{}, err
	}
	if blocked {
		return Message{}, ErrUserBlocked
	}
	row, err := q.InsertMessage(ctx, dbgen.InsertMessageParams{ConversationID: conversationID, SenderID: senderID, Body: body})
	if err != nil {
		return Message{}, err
	}
	if err := q.TouchConversationAfterMessage(ctx, conversationID); err != nil {
		return Message{}, err
	}
	if err := q.UnhideConversationForUser(ctx, dbgen.UnhideConversationForUserParams{ConversationID: conversationID, UserID: recipientID}); err != nil {
		return Message{}, err
	}
	if err := tx.Commit(); err != nil {
		return Message{}, err
	}
	return messageFromDB(row), nil
}

func (r *PostgresRepository) UpdateRequestStatus(ctx context.Context, conversationID int64, status RequestStatus) (Conversation, error) {
	if r == nil || r.queries == nil {
		return Conversation{}, ErrInternal
	}
	row, err := r.queries.UpdateConversationRequestStatus(ctx, dbgen.UpdateConversationRequestStatusParams{ConversationID: conversationID, RequestStatus: string(status)})
	if err == nil {
		return conversationFromDB(row), nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Conversation{}, err
	}
	current, currentErr := r.queries.GetConversation(ctx, conversationID)
	if currentErr != nil {
		return Conversation{}, mapNotFound(currentErr)
	}
	currentConversation := conversationFromDB(current)
	if currentConversation.RequestStatus == status {
		return currentConversation, nil
	}
	if currentConversation.RequestStatus == RequestDeclined {
		return Conversation{}, ErrMessageRequestDeclined
	}
	return Conversation{}, ErrForbidden
}

func (r *PostgresRepository) MarkRead(ctx context.Context, conversationID, actorID, messageID int64) error {
	if r == nil || r.queries == nil {
		return ErrInternal
	}
	return r.queries.UpdateLastReadMessage(ctx, dbgen.UpdateLastReadMessageParams{ConversationID: conversationID, UserID: actorID, MessageID: messageID})
}

func (r *PostgresRepository) HideConversation(ctx context.Context, conversationID, actorID int64) error {
	if r == nil || r.queries == nil {
		return ErrInternal
	}
	return r.queries.HideConversationForUser(ctx, dbgen.HideConversationForUserParams{ConversationID: conversationID, UserID: actorID})
}

func (r *PostgresRepository) BlockUser(ctx context.Context, blockerID, blockedID int64) error {
	if r == nil || r.db == nil {
		return ErrInternal
	}
	low, high := canonicalPair(blockerID, blockedID)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()
	if err := lockUserPair(ctx, tx, low, high); err != nil {
		return err
	}
	q := dbgen.New(tx)
	if _, err := q.FindDirectConversationForUpdate(ctx, dbgen.FindDirectConversationForUpdateParams{UserLowID: low, UserHighID: high}); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if err := q.CreateUserBlock(ctx, dbgen.CreateUserBlockParams{BlockerID: blockerID, BlockedUserID: blockedID}); err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `
UPDATE conversation_participants cp
SET hidden_at = CURRENT_TIMESTAMP
FROM conversations c
WHERE cp.conversation_id = c.id
  AND cp.user_id = $1
  AND ((c.direct_user_low_id = $1 AND c.direct_user_high_id = $2)
    OR (c.direct_user_low_id = $2 AND c.direct_user_high_id = $1))`, blockerID, blockedID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *PostgresRepository) UnblockUser(ctx context.Context, blockerID, blockedID int64) error {
	if r == nil || r.db == nil {
		return ErrInternal
	}
	low, high := canonicalPair(blockerID, blockedID)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()
	if err := lockUserPair(ctx, tx, low, high); err != nil {
		return err
	}
	q := dbgen.New(tx)
	if err := q.DeleteUserBlock(ctx, dbgen.DeleteUserBlockParams{BlockerID: blockerID, BlockedUserID: blockedID}); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *PostgresRepository) CreateReport(ctx context.Context, report Report) (Report, error) {
	if r == nil || r.db == nil {
		return Report{}, ErrInternal
	}
	var id string
	var createdAt time.Time
	var conversationID sql.NullInt64
	if report.ConversationID > 0 {
		conversationID = sql.NullInt64{Int64: report.ConversationID, Valid: true}
	}
	err := r.db.QueryRowContext(ctx, `
INSERT INTO moderation_reports (
    id, reporter_user_id, messenger_target_type, messenger_target_id,
    conversation_id, reason_code, detail, status
) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'open')
RETURNING id::text, created_at`,
		report.ReporterUserID,
		string(report.TargetType),
		report.TargetID,
		conversationID,
		report.ReasonCode,
		report.Detail,
	).Scan(&id, &createdAt)
	if err != nil {
		return Report{}, err
	}
	report.ID = id
	report.Status = "open"
	report.CreatedAt = createdAt
	return report, nil
}

func (r *PostgresRepository) UnreadCount(ctx context.Context, actorID int64) (int64, error) {
	if r == nil || r.queries == nil {
		return 0, ErrInternal
	}
	return r.queries.CountUnreadMessages(ctx, actorID)
}

func conversationFromDB(row dbgen.Conversation) Conversation {
	result := Conversation{
		ID: row.ID,
		CreatedBy: row.CreatedBy,
		UserLowID: row.DirectUserLowID,
		UserHighID: row.DirectUserHighID,
		RequestStatus: RequestStatus(row.RequestStatus),
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
	if row.LastMessageAt.Valid {
		t := row.LastMessageAt.Time
		result.LastMessageAt = &t
	}
	return result
}

func messageFromDB(row dbgen.Message) Message {
	return Message{ID: row.ID, ConversationID: row.ConversationID, SenderID: row.SenderID, Body: row.Body, CreatedAt: row.CreatedAt}
}

func canonicalPair(a, b int64) (int64, int64) {
	if a < b {
		return a, b
	}
	return b, a
}

func lockUserPair(ctx context.Context, tx *sql.Tx, low, high int64) error {
	rows, err := tx.QueryContext(ctx, `SELECT id FROM users WHERE id IN ($1, $2) ORDER BY id FOR UPDATE`, low, high)
	if err != nil {
		return err
	}
	defer rows.Close()
	count := 0
	for rows.Next() {
		count++
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if count != 2 {
		return ErrUserNotFound
	}
	return nil
}

func mapNotFound(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrConversationNotFound
	}
	return err
}
