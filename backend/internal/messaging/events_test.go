package messaging

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
)

type recordingPublisher struct {
	events []Event
	err    error
}

func (p *recordingPublisher) Publish(_ context.Context, event Event) error {
	p.events = append(p.events, event)
	return p.err
}

type failingCreateStore struct {
	*fakeStore
	err error
}

func (s *failingCreateStore) CreateConversationWithInitialMessage(_ context.Context, _, _ int64, _ string) (Conversation, Message, error) {
	return Conversation{}, Message{}, s.err
}

type failingSendStore struct {
	*fakeStore
	err error
}

func (s *failingSendStore) SendMessage(_ context.Context, _, _, _ int64, _ string) (Message, error) {
	return Message{}, s.err
}

func TestEventNotPublishedWhenPersistenceFails(t *testing.T) {
	publisher := &recordingPublisher{}
	store := &failingCreateStore{fakeStore: newFakeStore(), err: errors.New("db failed")}
	service := NewService(store, publisher)

	if _, _, err := service.CreateConversation(context.Background(), 1, 2, "hello"); err == nil {
		t.Fatal("expected persistence failure")
	}
	if len(publisher.events) != 0 {
		t.Fatalf("published %d events after persistence failure", len(publisher.events))
	}
}

func TestPublisherFailureDoesNotTurnPersistedMessageIntoFailure(t *testing.T) {
	publisher := &recordingPublisher{err: errors.New("redis unavailable")}
	store := newFakeStore()
	service := NewService(store, publisher)

	conversation, message, err := service.CreateConversation(context.Background(), 1, 2, "private message body")
	if err != nil {
		t.Fatalf("persisted create must remain successful when publisher fails: %v", err)
	}
	if conversation.ID == 0 || message.ID == 0 {
		t.Fatalf("expected persisted result: %#v %#v", conversation, message)
	}
	if len(publisher.events) != 1 || publisher.events[0].Type != EventConversationRequested {
		t.Fatalf("unexpected events: %#v", publisher.events)
	}
}

func TestMessageEventContainsIdentifiersButNeverPlaintextBody(t *testing.T) {
	publisher := &recordingPublisher{}
	store := newFakeStore()
	service := NewService(store, publisher)

	message, err := service.SendMessage(context.Background(), 1, 10, "top secret messenger text")
	if err != nil {
		t.Fatalf("send: %v", err)
	}
	if len(publisher.events) != 1 {
		t.Fatalf("events=%d", len(publisher.events))
	}
	event := publisher.events[0]
	if event.Type != EventMessagePersisted || event.ConversationID != 10 || event.MessageID != message.ID || event.ActorUserID != 1 || event.TargetUserID != 2 {
		t.Fatalf("unexpected event: %#v", event)
	}
	payload, err := json.Marshal(event)
	if err != nil { t.Fatal(err) }
	if strings.Contains(string(payload), "top secret messenger text") || strings.Contains(strings.ToLower(string(payload)), `"body"`) {
		t.Fatalf("event leaked message content: %s", payload)
	}
}

func TestApprovedStateTransitionsPublishExpectedEvents(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name string
		prepare func(*fakeStore)
		invoke func(*Service) error
		want EventType
	}{
		{
			name: "accept",
			prepare: func(store *fakeStore) { store.conversations[10] = Conversation{ID:10, CreatedBy:2, UserLowID:1, UserHighID:2, RequestStatus:RequestPending} },
			invoke: func(service *Service) error { _, err := service.AcceptRequest(ctx, 1, 10); return err },
			want: EventConversationAccepted,
		},
		{
			name: "decline",
			prepare: func(store *fakeStore) { store.conversations[10] = Conversation{ID:10, CreatedBy:2, UserLowID:1, UserHighID:2, RequestStatus:RequestPending} },
			invoke: func(service *Service) error { _, err := service.DeclineRequest(ctx, 1, 10); return err },
			want: EventConversationDeclined,
		},
		{
			name: "read",
			prepare: func(store *fakeStore) {},
			invoke: func(service *Service) error { return service.MarkRead(ctx, 1, 10, 101) },
			want: EventConversationRead,
		},
		{
			name: "block",
			prepare: func(store *fakeStore) {},
			invoke: func(service *Service) error { return service.BlockUser(ctx, 1, 2) },
			want: EventUserBlocked,
		},
		{
			name: "unblock",
			prepare: func(store *fakeStore) { store.blocked[[2]int64{1,2}] = true },
			invoke: func(service *Service) error { return service.UnblockUser(ctx, 1, 2) },
			want: EventUserUnblocked,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			store := newFakeStore()
			tc.prepare(store)
			publisher := &recordingPublisher{}
			service := NewService(store, publisher)
			if err := tc.invoke(service); err != nil { t.Fatalf("invoke: %v", err) }
			if len(publisher.events) != 1 || publisher.events[0].Type != tc.want {
				t.Fatalf("events=%#v want=%s", publisher.events, tc.want)
			}
		})
	}
}

func TestFailedSendDoesNotPublish(t *testing.T) {
	publisher := &recordingPublisher{}
	store := &failingSendStore{fakeStore: newFakeStore(), err: errors.New("db failed")}
	service := NewService(store, publisher)
	if _, err := service.SendMessage(context.Background(), 1, 10, "hello"); err == nil {
		t.Fatal("expected send failure")
	}
	if len(publisher.events) != 0 {
		t.Fatalf("published after failed send: %#v", publisher.events)
	}
}
