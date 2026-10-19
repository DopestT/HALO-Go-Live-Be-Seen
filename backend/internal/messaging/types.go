package messaging

import (
	"errors"
	"time"
)

type RequestStatus string

const (
	RequestPending  RequestStatus = "pending"
	RequestAccepted RequestStatus = "accepted"
	RequestDeclined RequestStatus = "declined"
)

type Bucket string

const (
	BucketInbox    Bucket = "inbox"
	BucketRequests Bucket = "requests"
)

type ReportTargetType string

const (
	ReportTargetMessage ReportTargetType = "message"
	ReportTargetUser    ReportTargetType = "user"
)

type Conversation struct {
	ID            int64
	CreatedBy     int64
	UserLowID     int64
	UserHighID    int64
	RequestStatus RequestStatus
	CreatedAt     time.Time
	UpdatedAt     time.Time
	LastMessageAt *time.Time
}

func (c Conversation) HasParticipant(userID int64) bool {
	return userID > 0 && (userID == c.UserLowID || userID == c.UserHighID)
}

func (c Conversation) OtherParticipant(userID int64) (int64, bool) {
	switch userID {
	case c.UserLowID:
		return c.UserHighID, true
	case c.UserHighID:
		return c.UserLowID, true
	default:
		return 0, false
	}
}

type Message struct {
	ID             int64
	ConversationID int64
	SenderID       int64
	Body           string
	CreatedAt      time.Time
}

type ConversationSummary struct {
	Conversation Conversation
	OtherUserID  int64
	LastMessage  *Message
	UnreadCount  int64
	Hidden       bool
}

type ReportInput struct {
	TargetType     ReportTargetType
	TargetID       int64
	ConversationID int64
	ReasonCode     string
	Detail         string
}

type Report struct {
	ID             string
	ReporterUserID int64
	TargetType     ReportTargetType
	TargetID       int64
	ConversationID int64
	ReasonCode     string
	Detail         string
	Status         string
	CreatedAt      time.Time
}

var (
	ErrUnauthorized           = errors.New("unauthorized")
	ErrForbidden              = errors.New("forbidden")
	ErrConversationNotFound   = errors.New("conversation_not_found")
	ErrUserNotFound           = errors.New("user_not_found")
	ErrSelfMessageNotAllowed  = errors.New("self_message_not_allowed")
	ErrMessageRequestPending  = errors.New("message_request_pending")
	ErrMessageRequestDeclined = errors.New("message_request_declined")
	ErrUserBlocked            = errors.New("user_blocked")
	ErrMessageTooLong         = errors.New("message_too_long")
	ErrInvalidMessage         = errors.New("invalid_message")
	ErrInvalidReport          = errors.New("invalid_report")
	ErrRateLimitExceeded      = errors.New("rate_limit_exceeded")
	ErrInternal               = errors.New("internal_error")
)
