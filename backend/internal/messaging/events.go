package messaging

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/database"
)

const MessengerEventChannel = "nscene:messenger:events"

type EventType string

const (
	EventMessagePersisted       EventType = "message.persisted"
	EventConversationRequested  EventType = "conversation.requested"
	EventConversationAccepted   EventType = "conversation.accepted"
	EventConversationDeclined   EventType = "conversation.declined"
	EventConversationRead       EventType = "conversation.read"
	EventUserBlocked            EventType = "user.blocked"
	EventUserUnblocked          EventType = "user.unblocked"
)

type Event struct {
	Type           EventType     `json:"type"`
	ConversationID int64         `json:"conversation_id,omitempty"`
	MessageID      int64         `json:"message_id,omitempty"`
	ActorUserID    int64         `json:"actor_user_id,omitempty"`
	TargetUserID   int64         `json:"target_user_id,omitempty"`
	RequestStatus  RequestStatus `json:"request_status,omitempty"`
}

type EventPublisher interface {
	Publish(ctx context.Context, event Event) error
}

type noopEventPublisher struct{}

func (noopEventPublisher) Publish(context.Context, Event) error { return nil }

type RedisEventPublisher struct {
	client *database.RedisClient
}

func NewRedisEventPublisher(client *database.RedisClient) EventPublisher {
	if client == nil || client.Client == nil {
		return noopEventPublisher{}
	}
	return &RedisEventPublisher{client: client}
}

func (p *RedisEventPublisher) Publish(ctx context.Context, event Event) error {
	if p == nil || p.client == nil || p.client.Client == nil {
		return errors.New("messenger redis publisher is not configured")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return p.client.Publish(ctx, MessengerEventChannel, payload).Err()
}
