package messaging

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/models"
	"github.com/gin-gonic/gin"
)

const maxMessengerJSONBody = int64(16 << 10)

type HandlerService interface {
	CreateConversation(ctx context.Context, actorID, targetID int64, body string) (Conversation, Message, error)
	ListConversations(ctx context.Context, actorID int64, bucket Bucket, cursor int64, limit int32) ([]ConversationSummary, error)
	GetConversation(ctx context.Context, actorID, conversationID int64, cursor int64, limit int32) (Conversation, []Message, error)
	SendMessage(ctx context.Context, actorID, conversationID int64, body string) (Message, error)
	AcceptRequest(ctx context.Context, actorID, conversationID int64) (Conversation, error)
	DeclineRequest(ctx context.Context, actorID, conversationID int64) (Conversation, error)
	MarkRead(ctx context.Context, actorID, conversationID, messageID int64) error
	HideConversation(ctx context.Context, actorID, conversationID int64) error
	BlockUser(ctx context.Context, actorID, targetID int64) error
	UnblockUser(ctx context.Context, actorID, targetID int64) error
	CreateReport(ctx context.Context, actorID int64, input ReportInput) (Report, error)
	UnreadCount(ctx context.Context, actorID int64) (int64, error)
}

type Handler struct {
	service HandlerService
	limiter *UserRateLimiter
}

func NewHandler(service HandlerService, limiter *UserRateLimiter) *Handler {
	if limiter == nil {
		limiter = NewUserRateLimiter(nil)
	}
	return &Handler{service: service, limiter: limiter}
}

func (h *Handler) RegisterRoutes(group *gin.RouterGroup) {
	group.GET("/conversations", h.listConversations)
	group.POST("/conversations", h.createConversation)
	group.GET("/conversations/:id", h.getConversation)
	group.POST("/conversations/:id/messages", h.sendMessage)
	group.POST("/conversations/:id/accept", h.acceptRequest)
	group.POST("/conversations/:id/decline", h.declineRequest)
	group.POST("/conversations/:id/read", h.markRead)
	group.DELETE("/conversations/:id/inbox", h.hideConversation)
	group.POST("/users/:id/block", h.blockUser)
	group.DELETE("/users/:id/block", h.unblockUser)
	group.POST("/reports", h.createReport)
	group.GET("/unread-count", h.unreadCount)
}

type createConversationRequest struct {
	TargetUserID int64  `json:"target_user_id" binding:"required"`
	Message      string `json:"message" binding:"required"`
}

type sendMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

type markReadRequest struct {
	MessageID int64 `json:"message_id" binding:"required"`
}

type createReportRequest struct {
	TargetType     ReportTargetType `json:"target_type" binding:"required"`
	TargetID       int64            `json:"target_id" binding:"required"`
	ConversationID int64            `json:"conversation_id"`
	ReasonCode     string           `json:"reason_code" binding:"required"`
	Detail         string           `json:"detail"`
}

func (h *Handler) createConversation(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	if !h.allow(c, actorID, RateConversationCreate) { return }
	var req createConversationRequest
	if !bindMessengerJSON(c, &req) { return }
	conversation, message, err := h.service.CreateConversation(c.Request.Context(), actorID, req.TargetUserID, req.Message)
	if err != nil { writeServiceError(c, err); return }
	c.JSON(http.StatusCreated, gin.H{"conversation": conversation, "message": message})
}

func (h *Handler) listConversations(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	bucket := Bucket(c.DefaultQuery("bucket", string(BucketInbox)))
	if bucket != BucketInbox && bucket != BucketRequests {
		writeBadRequest(c, "invalid_bucket", "bucket must be inbox or requests")
		return
	}
	cursor, limit, ok := parsePagination(c)
	if !ok { return }
	items, err := h.service.ListConversations(c.Request.Context(), actorID, bucket, cursor, limit)
	if err != nil { writeServiceError(c, err); return }
	next := int64(0)
	if len(items) == int(limit) && len(items) > 0 { next = items[len(items)-1].Conversation.ID }
	c.JSON(http.StatusOK, gin.H{"conversations": items, "next_cursor": next})
}

func (h *Handler) getConversation(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	conversationID, ok := positivePathID(c, "id")
	if !ok { return }
	cursor, limit, ok := parsePagination(c)
	if !ok { return }
	conversation, messages, err := h.service.GetConversation(c.Request.Context(), actorID, conversationID, cursor, limit)
	if err != nil { writeServiceError(c, err); return }
	next := int64(0)
	if len(messages) == int(limit) && len(messages) > 0 { next = messages[len(messages)-1].ID }
	c.JSON(http.StatusOK, gin.H{"conversation": conversation, "messages": messages, "next_cursor": next})
}

func (h *Handler) sendMessage(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	conversationID, ok := positivePathID(c, "id")
	if !ok { return }
	if !h.allow(c, actorID, RateMessageSend) { return }
	var req sendMessageRequest
	if !bindMessengerJSON(c, &req) { return }
	message, err := h.service.SendMessage(c.Request.Context(), actorID, conversationID, req.Message)
	if err != nil { writeServiceError(c, err); return }
	c.JSON(http.StatusCreated, message)
}

func (h *Handler) acceptRequest(c *gin.Context) {
	h.transitionRequest(c, true)
}

func (h *Handler) declineRequest(c *gin.Context) {
	h.transitionRequest(c, false)
}

func (h *Handler) transitionRequest(c *gin.Context, accept bool) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	conversationID, ok := positivePathID(c, "id")
	if !ok { return }
	var conversation Conversation
	var err error
	if accept {
		conversation, err = h.service.AcceptRequest(c.Request.Context(), actorID, conversationID)
	} else {
		conversation, err = h.service.DeclineRequest(c.Request.Context(), actorID, conversationID)
	}
	if err != nil { writeServiceError(c, err); return }
	c.JSON(http.StatusOK, conversation)
}

func (h *Handler) markRead(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	conversationID, ok := positivePathID(c, "id")
	if !ok { return }
	var req markReadRequest
	if !bindMessengerJSON(c, &req) { return }
	if req.MessageID <= 0 { writeBadRequest(c, "invalid_message", "message_id must be positive"); return }
	if err := h.service.MarkRead(c.Request.Context(), actorID, conversationID, req.MessageID); err != nil { writeServiceError(c, err); return }
	c.Status(http.StatusNoContent)
}

func (h *Handler) hideConversation(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	conversationID, ok := positivePathID(c, "id")
	if !ok { return }
	if err := h.service.HideConversation(c.Request.Context(), actorID, conversationID); err != nil { writeServiceError(c, err); return }
	c.Status(http.StatusNoContent)
}

func (h *Handler) blockUser(c *gin.Context) {
	h.changeBlock(c, true)
}

func (h *Handler) unblockUser(c *gin.Context) {
	h.changeBlock(c, false)
}

func (h *Handler) changeBlock(c *gin.Context, block bool) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	targetID, ok := positivePathID(c, "id")
	if !ok { return }
	if !h.allow(c, actorID, RateBlockChange) { return }
	var err error
	if block { err = h.service.BlockUser(c.Request.Context(), actorID, targetID) } else { err = h.service.UnblockUser(c.Request.Context(), actorID, targetID) }
	if err != nil { writeServiceError(c, err); return }
	c.Status(http.StatusNoContent)
}

func (h *Handler) createReport(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	if !h.allow(c, actorID, RateReport) { return }
	var req createReportRequest
	if !bindMessengerJSON(c, &req) { return }
	report, err := h.service.CreateReport(c.Request.Context(), actorID, ReportInput{
		TargetType: req.TargetType,
		TargetID: req.TargetID,
		ConversationID: req.ConversationID,
		ReasonCode: req.ReasonCode,
		Detail: req.Detail,
	})
	if err != nil { writeServiceError(c, err); return }
	c.JSON(http.StatusCreated, report)
}

func (h *Handler) unreadCount(c *gin.Context) {
	actorID, ok := authenticatedActor(c)
	if !ok { return }
	count, err := h.service.UnreadCount(c.Request.Context(), actorID)
	if err != nil { writeServiceError(c, err); return }
	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

func (h *Handler) allow(c *gin.Context, actorID int64, action RateAction) bool {
	if h == nil || h.limiter == nil || !h.limiter.Allow(actorID, action) {
		writeServiceError(c, ErrRateLimitExceeded)
		return false
	}
	return true
}

func authenticatedActor(c *gin.Context) (int64, bool) {
	value, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "unauthorized", Message: "Authentication required"})
		return 0, false
	}
	userID, ok := value.(int64)
	if !ok || userID <= 0 {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "unauthorized", Message: "Authentication required"})
		return 0, false
	}
	return userID, true
}

func positivePathID(c *gin.Context, name string) (int64, bool) {
	id, err := strconv.ParseInt(c.Param(name), 10, 64)
	if err != nil || id <= 0 {
		writeBadRequest(c, "invalid_id", "ID must be a positive integer")
		return 0, false
	}
	return id, true
}

func parsePagination(c *gin.Context) (int64, int32, bool) {
	cursor, err := strconv.ParseInt(c.DefaultQuery("cursor", "0"), 10, 64)
	if err != nil || cursor < 0 {
		writeBadRequest(c, "invalid_pagination", "cursor must be zero or greater")
		return 0, 0, false
	}
	limit64, err := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	if err != nil || limit64 < 1 || limit64 > 100 {
		writeBadRequest(c, "invalid_pagination", "limit must be between 1 and 100")
		return 0, 0, false
	}
	return cursor, int32(limit64), true
}

func bindMessengerJSON(c *gin.Context, dst any) bool {
	if c.Request.Body == nil {
		writeBadRequest(c, "invalid_request", "JSON body is required")
		return false
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxMessengerJSONBody)
	if err := c.ShouldBindJSON(dst); err != nil {
		writeBadRequest(c, "invalid_request", "Invalid request body")
		return false
	}
	return true
}

func writeBadRequest(c *gin.Context, code, message string) {
	c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: code, Message: message})
}

func writeServiceError(c *gin.Context, err error) {
	status, code, message := http.StatusInternalServerError, "internal_error", "Unable to complete Messenger request"
	switch {
	case errors.Is(err, ErrUnauthorized):
		status, code, message = http.StatusUnauthorized, "unauthorized", "Authentication required"
	case errors.Is(err, ErrForbidden):
		status, code, message = http.StatusForbidden, "forbidden", "Messenger action is not allowed"
	case errors.Is(err, ErrUserBlocked):
		status, code, message = http.StatusForbidden, "user_blocked", "Messaging is blocked between these users"
	case errors.Is(err, ErrConversationNotFound):
		status, code, message = http.StatusNotFound, "conversation_not_found", "Conversation not found"
	case errors.Is(err, ErrUserNotFound):
		status, code, message = http.StatusNotFound, "user_not_found", "User not found"
	case errors.Is(err, ErrSelfMessageNotAllowed):
		status, code, message = http.StatusBadRequest, "self_message_not_allowed", "You cannot message yourself"
	case errors.Is(err, ErrMessageRequestPending):
		status, code, message = http.StatusConflict, "message_request_pending", "Message request is still pending"
	case errors.Is(err, ErrMessageRequestDeclined):
		status, code, message = http.StatusConflict, "message_request_declined", "Message request was declined"
	case errors.Is(err, ErrInvalidMessage):
		status, code, message = http.StatusBadRequest, "invalid_message", "Message is invalid"
	case errors.Is(err, ErrMessageTooLong):
		status, code, message = http.StatusBadRequest, "message_too_long", "Message is too long"
	case errors.Is(err, ErrInvalidReport):
		status, code, message = http.StatusBadRequest, "invalid_report", "Report is invalid"
	case errors.Is(err, ErrRateLimitExceeded):
		status, code, message = http.StatusTooManyRequests, "rate_limit_exceeded", "Too many Messenger requests"
	}
	c.JSON(status, models.ErrorResponse{Error: code, Message: message})
}
