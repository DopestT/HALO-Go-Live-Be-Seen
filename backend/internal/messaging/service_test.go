package messaging

import (
	"context"
	"errors"
	"strings"
	"testing"
)

type fakeStore struct {
	users         map[int64]bool
	conversations map[int64]Conversation
	blocked       map[[2]int64]bool
	createdBody   string
	sentBody      string
	status        RequestStatus
	markedRead    int64
	hidden        bool
	blockCalls    int
	unblockCalls  int
	report        Report
	unread        int64
}

func newFakeStore() *fakeStore {
	return &fakeStore{
		users: map[int64]bool{1: true, 2: true, 3: true},
		conversations: map[int64]Conversation{
			10: {ID: 10, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestAccepted},
		},
		blocked: make(map[[2]int64]bool),
		unread:  3,
	}
}

func (f *fakeStore) UserExists(_ context.Context, userID int64) (bool, error) {
	return f.users[userID], nil
}

func (f *fakeStore) IsBlockedBetween(_ context.Context, a, b int64) (bool, error) {
	return f.blocked[[2]int64{a, b}] || f.blocked[[2]int64{b, a}], nil
}

func (f *fakeStore) CreateConversationWithInitialMessage(_ context.Context, actorID, targetID int64, body string) (Conversation, Message, error) {
	f.createdBody = body
	conversation := Conversation{ID: 20, CreatedBy: actorID, UserLowID: min64(actorID, targetID), UserHighID: max64(actorID, targetID), RequestStatus: RequestPending}
	return conversation, Message{ID: 100, ConversationID: 20, SenderID: actorID, Body: body}, nil
}

func (f *fakeStore) ListConversations(_ context.Context, _ int64, _ Bucket, _ int64, _ int32) ([]ConversationSummary, error) {
	return nil, nil
}

func (f *fakeStore) GetConversation(_ context.Context, conversationID int64) (Conversation, error) {
	conversation, ok := f.conversations[conversationID]
	if !ok {
		return Conversation{}, ErrConversationNotFound
	}
	return conversation, nil
}

func (f *fakeStore) ListMessages(_ context.Context, _ int64, _ int64, _ int32) ([]Message, error) {
	return nil, nil
}

func (f *fakeStore) SendMessage(_ context.Context, conversationID, senderID, _ int64, body string) (Message, error) {
	f.sentBody = body
	return Message{ID: 101, ConversationID: conversationID, SenderID: senderID, Body: body}, nil
}

func (f *fakeStore) UpdateRequestStatus(_ context.Context, conversationID int64, status RequestStatus) (Conversation, error) {
	conversation, ok := f.conversations[conversationID]
	if !ok {
		return Conversation{}, ErrConversationNotFound
	}
	conversation.RequestStatus = status
	f.conversations[conversationID] = conversation
	f.status = status
	return conversation, nil
}

func (f *fakeStore) MarkRead(_ context.Context, _ int64, _ int64, messageID int64) error {
	f.markedRead = messageID
	return nil
}

func (f *fakeStore) HideConversation(_ context.Context, _ int64, _ int64) error {
	f.hidden = true
	return nil
}

func (f *fakeStore) BlockUser(_ context.Context, blockerID, blockedID int64) error {
	f.blockCalls++
	f.blocked[[2]int64{blockerID, blockedID}] = true
	return nil
}

func (f *fakeStore) UnblockUser(_ context.Context, blockerID, blockedID int64) error {
	f.unblockCalls++
	delete(f.blocked, [2]int64{blockerID, blockedID})
	return nil
}

func (f *fakeStore) CreateReport(_ context.Context, report Report) (Report, error) {
	f.report = report
	return report, nil
}

func (f *fakeStore) UnreadCount(_ context.Context, _ int64) (int64, error) {
	return f.unread, nil
}

func TestServiceCreateConversationPolicy(t *testing.T) {
	ctx := context.Background()
	store := newFakeStore()
	service := NewService(store)

	if _, _, err := service.CreateConversation(ctx, 1, 1, "hello"); !errors.Is(err, ErrSelfMessageNotAllowed) {
		t.Fatalf("expected self-message error, got %v", err)
	}
	if _, _, err := service.CreateConversation(ctx, 1, 99, "hello"); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("expected user-not-found, got %v", err)
	}

	store.blocked[[2]int64{2, 1}] = true
	if _, _, err := service.CreateConversation(ctx, 1, 2, "hello"); !errors.Is(err, ErrUserBlocked) {
		t.Fatalf("expected blocked error, got %v", err)
	}
	delete(store.blocked, [2]int64{2, 1})

	conversation, message, err := service.CreateConversation(ctx, 1, 2, "  hello NSCENE  ")
	if err != nil {
		t.Fatalf("create conversation: %v", err)
	}
	if conversation.RequestStatus != RequestPending || message.Body != "hello NSCENE" || store.createdBody != "hello NSCENE" {
		t.Fatalf("unexpected normalized create result: %#v %#v body=%q", conversation, message, store.createdBody)
	}
}

func TestServiceSendEnforcesRequestBlockAndParticipantPolicy(t *testing.T) {
	ctx := context.Background()
	store := newFakeStore()
	service := NewService(store)

	store.conversations[10] = Conversation{ID: 10, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestPending}
	if _, err := service.SendMessage(ctx, 1, 10, "second message"); !errors.Is(err, ErrMessageRequestPending) {
		t.Fatalf("expected pending error, got %v", err)
	}

	store.conversations[10] = Conversation{ID: 10, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestDeclined}
	if _, err := service.SendMessage(ctx, 1, 10, "nope"); !errors.Is(err, ErrMessageRequestDeclined) {
		t.Fatalf("expected declined error, got %v", err)
	}

	store.conversations[10] = Conversation{ID: 10, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestAccepted}
	if _, err := service.SendMessage(ctx, 3, 10, "intrusion"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected forbidden for nonparticipant, got %v", err)
	}

	store.blocked[[2]int64{2, 1}] = true
	if _, err := service.SendMessage(ctx, 1, 10, "blocked"); !errors.Is(err, ErrUserBlocked) {
		t.Fatalf("expected blocked error, got %v", err)
	}
	delete(store.blocked, [2]int64{2, 1})

	message, err := service.SendMessage(ctx, 1, 10, "  persisted only after server  ")
	if err != nil {
		t.Fatalf("send: %v", err)
	}
	if message.Body != "persisted only after server" || store.sentBody != message.Body {
		t.Fatalf("unexpected message %#v / store body %q", message, store.sentBody)
	}
}

func TestServiceRequestTransitionsAreRecipientOnly(t *testing.T) {
	ctx := context.Background()
	store := newFakeStore()
	store.conversations[10] = Conversation{ID: 10, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestPending}
	service := NewService(store)

	if _, err := service.AcceptRequest(ctx, 1, 10); !errors.Is(err, ErrForbidden) {
		t.Fatalf("sender must not accept own request: %v", err)
	}
	accepted, err := service.AcceptRequest(ctx, 2, 10)
	if err != nil || accepted.RequestStatus != RequestAccepted || store.status != RequestAccepted {
		t.Fatalf("accept result=%#v status=%q err=%v", accepted, store.status, err)
	}

	store.conversations[10] = Conversation{ID: 10, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestPending}
	declined, err := service.DeclineRequest(ctx, 2, 10)
	if err != nil || declined.RequestStatus != RequestDeclined || store.status != RequestDeclined {
		t.Fatalf("decline result=%#v status=%q err=%v", declined, store.status, err)
	}
	if _, err := service.AcceptRequest(ctx, 2, 10); !errors.Is(err, ErrMessageRequestDeclined) {
		t.Fatalf("decline must remain terminal in V1, got %v", err)
	}
}

func TestServiceValidationBoundaries(t *testing.T) {
	ctx := context.Background()
	store := newFakeStore()
	service := NewService(store)

	for _, body := range []string{"", "   ", strings.Repeat("x", 4001)} {
		if _, _, err := service.CreateConversation(ctx, 1, 2, body); !errors.Is(err, ErrInvalidMessage) && !errors.Is(err, ErrMessageTooLong) {
			t.Fatalf("expected invalid/too-long message for len=%d, got %v", len(body), err)
		}
	}

	valid := strings.Repeat("界", 4000)
	if _, _, err := service.CreateConversation(ctx, 1, 2, valid); err != nil {
		t.Fatalf("4000 Unicode characters must be accepted: %v", err)
	}
}

func TestServiceParticipantReadHideBlockAndUnread(t *testing.T) {
	ctx := context.Background()
	store := newFakeStore()
	service := NewService(store)

	if err := service.MarkRead(ctx, 3, 10, 101); !errors.Is(err, ErrForbidden) {
		t.Fatalf("nonparticipant mark-read must be forbidden: %v", err)
	}
	if err := service.MarkRead(ctx, 1, 10, 101); err != nil || store.markedRead != 101 {
		t.Fatalf("mark read failed: id=%d err=%v", store.markedRead, err)
	}
	if err := service.HideConversation(ctx, 2, 10); err != nil || !store.hidden {
		t.Fatalf("hide failed: hidden=%v err=%v", store.hidden, err)
	}

	if err := service.BlockUser(ctx, 1, 1); !errors.Is(err, ErrForbidden) {
		t.Fatalf("self block must fail: %v", err)
	}
	if err := service.BlockUser(ctx, 1, 2); err != nil || store.blockCalls != 1 {
		t.Fatalf("block failed: calls=%d err=%v", store.blockCalls, err)
	}
	if err := service.UnblockUser(ctx, 1, 2); err != nil || store.unblockCalls != 1 {
		t.Fatalf("unblock failed: calls=%d err=%v", store.unblockCalls, err)
	}
	if got, err := service.UnreadCount(ctx, 1); err != nil || got != 3 {
		t.Fatalf("unread count=%d err=%v", got, err)
	}
}

func TestServiceReportValidation(t *testing.T) {
	ctx := context.Background()
	store := newFakeStore()
	service := NewService(store)

	if _, err := service.CreateReport(ctx, 1, ReportInput{TargetType: ReportTargetUser, TargetID: 2, ReasonCode: "made_up"}); !errors.Is(err, ErrInvalidReport) {
		t.Fatalf("invalid reason must fail: %v", err)
	}
	if _, err := service.CreateReport(ctx, 1, ReportInput{TargetType: ReportTargetUser, TargetID: 2, ReasonCode: "spam", Detail: strings.Repeat("x", 1001)}); !errors.Is(err, ErrInvalidReport) {
		t.Fatalf("oversize report detail must fail: %v", err)
	}

	report, err := service.CreateReport(ctx, 1, ReportInput{TargetType: ReportTargetMessage, TargetID: 101, ConversationID: 10, ReasonCode: "harassment", Detail: "  repeated abuse  "})
	if err != nil {
		t.Fatalf("create report: %v", err)
	}
	if report.Detail != "repeated abuse" || store.report.Detail != "repeated abuse" {
		t.Fatalf("report detail not normalized: %#v", report)
	}
}

func min64(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}

func max64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
