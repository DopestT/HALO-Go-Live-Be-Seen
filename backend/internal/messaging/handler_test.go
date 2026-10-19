package messaging

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

type stubHandlerService struct {
	err       error
	lastActor int64
	lastTarget int64
	lastConversation int64
	lastMessage string
	lastBucket Bucket
	lastCursor int64
	lastLimit int32
	lastReport ReportInput
}

func (s *stubHandlerService) CreateConversation(_ context.Context, actorID, targetID int64, body string) (Conversation, Message, error) {
	s.lastActor, s.lastTarget, s.lastMessage = actorID, targetID, body
	if s.err != nil { return Conversation{}, Message{}, s.err }
	return Conversation{ID: 10, CreatedBy: actorID, UserLowID: 1, UserHighID: 2, RequestStatus: RequestPending}, Message{ID: 100, ConversationID: 10, SenderID: actorID, Body: body}, nil
}

func (s *stubHandlerService) ListConversations(_ context.Context, actorID int64, bucket Bucket, cursor int64, limit int32) ([]ConversationSummary, error) {
	s.lastActor, s.lastBucket, s.lastCursor, s.lastLimit = actorID, bucket, cursor, limit
	if s.err != nil { return nil, s.err }
	return []ConversationSummary{{Conversation: Conversation{ID: 10, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestAccepted}, OtherUserID: 2}}, nil
}

func (s *stubHandlerService) GetConversation(_ context.Context, actorID, conversationID int64, cursor int64, limit int32) (Conversation, []Message, error) {
	s.lastActor, s.lastConversation, s.lastCursor, s.lastLimit = actorID, conversationID, cursor, limit
	if s.err != nil { return Conversation{}, nil, s.err }
	return Conversation{ID: conversationID, CreatedBy: 1, UserLowID: 1, UserHighID: 2, RequestStatus: RequestAccepted}, []Message{{ID: 100, ConversationID: conversationID, SenderID: 1, Body: "hello"}}, nil
}

func (s *stubHandlerService) SendMessage(_ context.Context, actorID, conversationID int64, body string) (Message, error) {
	s.lastActor, s.lastConversation, s.lastMessage = actorID, conversationID, body
	if s.err != nil { return Message{}, s.err }
	return Message{ID: 101, ConversationID: conversationID, SenderID: actorID, Body: body}, nil
}

func (s *stubHandlerService) AcceptRequest(_ context.Context, actorID, conversationID int64) (Conversation, error) {
	s.lastActor, s.lastConversation = actorID, conversationID
	if s.err != nil { return Conversation{}, s.err }
	return Conversation{ID: conversationID, CreatedBy: 2, UserLowID: 1, UserHighID: 2, RequestStatus: RequestAccepted}, nil
}

func (s *stubHandlerService) DeclineRequest(_ context.Context, actorID, conversationID int64) (Conversation, error) {
	s.lastActor, s.lastConversation = actorID, conversationID
	if s.err != nil { return Conversation{}, s.err }
	return Conversation{ID: conversationID, CreatedBy: 2, UserLowID: 1, UserHighID: 2, RequestStatus: RequestDeclined}, nil
}

func (s *stubHandlerService) MarkRead(_ context.Context, actorID, conversationID, _ int64) error {
	s.lastActor, s.lastConversation = actorID, conversationID
	return s.err
}

func (s *stubHandlerService) HideConversation(_ context.Context, actorID, conversationID int64) error {
	s.lastActor, s.lastConversation = actorID, conversationID
	return s.err
}

func (s *stubHandlerService) BlockUser(_ context.Context, actorID, targetID int64) error {
	s.lastActor, s.lastTarget = actorID, targetID
	return s.err
}

func (s *stubHandlerService) UnblockUser(_ context.Context, actorID, targetID int64) error {
	s.lastActor, s.lastTarget = actorID, targetID
	return s.err
}

func (s *stubHandlerService) CreateReport(_ context.Context, actorID int64, input ReportInput) (Report, error) {
	s.lastActor, s.lastReport = actorID, input
	if s.err != nil { return Report{}, s.err }
	return Report{ID: "report-1", ReporterUserID: actorID, TargetType: input.TargetType, TargetID: input.TargetID, ConversationID: input.ConversationID, ReasonCode: input.ReasonCode, Detail: input.Detail, Status: "open"}, nil
}

func (s *stubHandlerService) UnreadCount(_ context.Context, actorID int64) (int64, error) {
	s.lastActor = actorID
	if s.err != nil { return 0, s.err }
	return 7, nil
}

func testMessengerRouter(service HandlerService, withActor bool) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	if withActor {
		router.Use(func(c *gin.Context) {
			c.Set("user_id", int64(1))
			c.Next()
		})
	}
	handler := NewHandler(service, NewUserRateLimiter(time.Now))
	handler.RegisterRoutes(router.Group("/api/v1/messages"))
	return router
}

func performJSON(router http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	var payload []byte
	if body != nil {
		payload, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(payload))
	if body != nil { req.Header.Set("Content-Type", "application/json") }
	response := httptest.NewRecorder()
	router.ServeHTTP(response, req)
	return response
}

func TestHandlerRegistersCompleteMessengerRouteSurface(t *testing.T) {
	service := &stubHandlerService{}
	router := testMessengerRouter(service, true)

	tests := []struct {
		method string
		path string
		body any
		want int
	}{
		{http.MethodGet, "/api/v1/messages/conversations?bucket=inbox", nil, http.StatusOK},
		{http.MethodPost, "/api/v1/messages/conversations", map[string]any{"target_user_id": 2, "message": "hello"}, http.StatusCreated},
		{http.MethodGet, "/api/v1/messages/conversations/10", nil, http.StatusOK},
		{http.MethodPost, "/api/v1/messages/conversations/10/messages", map[string]any{"message": "hello"}, http.StatusCreated},
		{http.MethodPost, "/api/v1/messages/conversations/10/accept", map[string]any{}, http.StatusOK},
		{http.MethodPost, "/api/v1/messages/conversations/10/decline", map[string]any{}, http.StatusOK},
		{http.MethodPost, "/api/v1/messages/conversations/10/read", map[string]any{"message_id": 100}, http.StatusNoContent},
		{http.MethodDelete, "/api/v1/messages/conversations/10/inbox", nil, http.StatusNoContent},
		{http.MethodPost, "/api/v1/messages/users/2/block", map[string]any{}, http.StatusNoContent},
		{http.MethodDelete, "/api/v1/messages/users/2/block", nil, http.StatusNoContent},
		{http.MethodPost, "/api/v1/messages/reports", map[string]any{"target_type":"message","target_id":100,"conversation_id":10,"reason_code":"harassment","detail":"abuse"}, http.StatusCreated},
		{http.MethodGet, "/api/v1/messages/unread-count", nil, http.StatusOK},
	}

	for _, tc := range tests {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			response := performJSON(router, tc.method, tc.path, tc.body)
			if response.Code != tc.want {
				t.Fatalf("status=%d body=%s want=%d", response.Code, response.Body.String(), tc.want)
			}
		})
	}
}

func TestHandlerRequiresAuthenticatedActorContext(t *testing.T) {
	router := testMessengerRouter(&stubHandlerService{}, false)
	response := performJSON(router, http.MethodGet, "/api/v1/messages/unread-count", nil)
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
	}
	if !bytes.Contains(response.Body.Bytes(), []byte(`"error":"unauthorized"`)) {
		t.Fatalf("unexpected body: %s", response.Body.String())
	}
}

func TestHandlerDerivesSenderOnlyFromAuthContext(t *testing.T) {
	service := &stubHandlerService{}
	router := testMessengerRouter(service, true)
	response := performJSON(router, http.MethodPost, "/api/v1/messages/conversations", map[string]any{
		"target_user_id": 2,
		"message": "hello",
		"sender_id": 999,
	})
	if response.Code != http.StatusCreated {
		t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
	}
	if service.lastActor != 1 || service.lastTarget != 2 {
		t.Fatalf("actor=%d target=%d", service.lastActor, service.lastTarget)
	}
}

func TestHandlerValidatesIDsAndPagination(t *testing.T) {
	service := &stubHandlerService{}
	router := testMessengerRouter(service, true)
	for _, path := range []string{
		"/api/v1/messages/conversations/not-a-number",
		"/api/v1/messages/conversations/0",
		"/api/v1/messages/users/nope/block",
		"/api/v1/messages/conversations?bucket=inbox&cursor=-1",
		"/api/v1/messages/conversations?bucket=nope",
	} {
		response := performJSON(router, http.MethodGet, path, nil)
		if path == "/api/v1/messages/users/nope/block" {
			response = performJSON(router, http.MethodDelete, path, nil)
		}
		if response.Code != http.StatusBadRequest {
			t.Fatalf("%s status=%d body=%s", path, response.Code, response.Body.String())
		}
	}
}

func TestHandlerMapsStableServiceErrors(t *testing.T) {
	tests := []struct {
		err error
		wantStatus int
		wantCode string
	}{
		{ErrUnauthorized, http.StatusUnauthorized, "unauthorized"},
		{ErrForbidden, http.StatusForbidden, "forbidden"},
		{ErrUserBlocked, http.StatusForbidden, "user_blocked"},
		{ErrConversationNotFound, http.StatusNotFound, "conversation_not_found"},
		{ErrUserNotFound, http.StatusNotFound, "user_not_found"},
		{ErrSelfMessageNotAllowed, http.StatusBadRequest, "self_message_not_allowed"},
		{ErrMessageRequestPending, http.StatusConflict, "message_request_pending"},
		{ErrMessageRequestDeclined, http.StatusConflict, "message_request_declined"},
		{ErrInvalidMessage, http.StatusBadRequest, "invalid_message"},
		{ErrMessageTooLong, http.StatusBadRequest, "message_too_long"},
		{ErrInvalidReport, http.StatusBadRequest, "invalid_report"},
		{ErrRateLimitExceeded, http.StatusTooManyRequests, "rate_limit_exceeded"},
		{ErrInternal, http.StatusInternalServerError, "internal_error"},
	}

	for _, tc := range tests {
		t.Run(tc.wantCode, func(t *testing.T) {
			service := &stubHandlerService{err: tc.err}
			router := testMessengerRouter(service, true)
			response := performJSON(router, http.MethodGet, "/api/v1/messages/unread-count", nil)
			if response.Code != tc.wantStatus {
				t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
			}
			if !bytes.Contains(response.Body.Bytes(), []byte(`"error":"`+tc.wantCode+`"`)) {
				t.Fatalf("unexpected body: %s", response.Body.String())
			}
		})
	}
}

func TestHandlerEnforcesProductRateLimitByAuthenticatedUser(t *testing.T) {
	now := time.Date(2026, 10, 19, 12, 0, 0, 0, time.UTC)
	service := &stubHandlerService{}
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(c *gin.Context) { c.Set("user_id", int64(1)); c.Next() })
	handler := NewHandler(service, NewUserRateLimiter(func() time.Time { return now }))
	handler.RegisterRoutes(router.Group("/api/v1/messages"))

	for i := 0; i < 10; i++ {
		response := performJSON(router, http.MethodPost, "/api/v1/messages/conversations", map[string]any{"target_user_id":2,"message":"hello"})
		if response.Code != http.StatusCreated { t.Fatalf("attempt %d status=%d", i+1, response.Code) }
	}
	response := performJSON(router, http.MethodPost, "/api/v1/messages/conversations", map[string]any{"target_user_id":2,"message":"hello"})
	if response.Code != http.StatusTooManyRequests || !bytes.Contains(response.Body.Bytes(), []byte(`"error":"rate_limit_exceeded"`)) {
		t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
	}
}
