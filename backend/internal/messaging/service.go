package messaging

import (
	"context"
	"log"
	"strings"
	"unicode/utf8"
)

const (
	maxMessageRunes      = 4000
	maxReportDetailRunes = 1000
	defaultPageSize      = int32(50)
	maxPageSize          = int32(100)
)

type Store interface {
	UserExists(ctx context.Context, userID int64) (bool, error)
	IsBlockedBetween(ctx context.Context, userA, userB int64) (bool, error)
	CreateConversationWithInitialMessage(ctx context.Context, actorID, targetID int64, body string) (Conversation, Message, error)
	ListConversations(ctx context.Context, actorID int64, bucket Bucket, cursor int64, limit int32) ([]ConversationSummary, error)
	GetConversation(ctx context.Context, conversationID int64) (Conversation, error)
	ListMessages(ctx context.Context, conversationID int64, cursor int64, limit int32) ([]Message, error)
	SendMessage(ctx context.Context, conversationID, senderID, recipientID int64, body string) (Message, error)
	UpdateRequestStatus(ctx context.Context, conversationID int64, status RequestStatus) (Conversation, error)
	MarkRead(ctx context.Context, conversationID, actorID, messageID int64) error
	HideConversation(ctx context.Context, conversationID, actorID int64) error
	BlockUser(ctx context.Context, blockerID, blockedID int64) error
	UnblockUser(ctx context.Context, blockerID, blockedID int64) error
	CreateReport(ctx context.Context, report Report) (Report, error)
	UnreadCount(ctx context.Context, actorID int64) (int64, error)
}

type Service struct {
	store     Store
	publisher EventPublisher
}

func NewService(store Store, publishers ...EventPublisher) *Service {
	publisher := EventPublisher(noopEventPublisher{})
	if len(publishers) > 0 && publishers[0] != nil {
		publisher = publishers[0]
	}
	return &Service{store: store, publisher: publisher}
}

func (s *Service) CreateConversation(ctx context.Context, actorID, targetID int64, body string) (Conversation, Message, error) {
	if err := s.ready(actorID); err != nil {
		return Conversation{}, Message{}, err
	}
	if targetID <= 0 {
		return Conversation{}, Message{}, ErrUserNotFound
	}
	if actorID == targetID {
		return Conversation{}, Message{}, ErrSelfMessageNotAllowed
	}
	if err := s.requireUser(ctx, targetID); err != nil {
		return Conversation{}, Message{}, err
	}
	if err := s.requireUnblocked(ctx, actorID, targetID); err != nil {
		return Conversation{}, Message{}, err
	}
	normalized, err := normalizeMessage(body)
	if err != nil {
		return Conversation{}, Message{}, err
	}
	conversation, message, err := s.store.CreateConversationWithInitialMessage(ctx, actorID, targetID, normalized)
	if err != nil {
		return Conversation{}, Message{}, err
	}
	s.publishBestEffort(ctx, Event{
		Type: EventConversationRequested,
		ConversationID: conversation.ID,
		MessageID: message.ID,
		ActorUserID: actorID,
		TargetUserID: targetID,
		RequestStatus: conversation.RequestStatus,
	})
	return conversation, message, nil
}

func (s *Service) ListConversations(ctx context.Context, actorID int64, bucket Bucket, cursor int64, limit int32) ([]ConversationSummary, error) {
	if err := s.ready(actorID); err != nil {
		return nil, err
	}
	if bucket != BucketInbox && bucket != BucketRequests {
		return nil, ErrForbidden
	}
	return s.store.ListConversations(ctx, actorID, bucket, nonnegativeCursor(cursor), pageLimit(limit))
}

func (s *Service) GetConversation(ctx context.Context, actorID, conversationID int64, cursor int64, limit int32) (Conversation, []Message, error) {
	if err := s.ready(actorID); err != nil {
		return Conversation{}, nil, err
	}
	conversation, err := s.loadParticipantConversation(ctx, actorID, conversationID)
	if err != nil {
		return Conversation{}, nil, err
	}
	messages, err := s.store.ListMessages(ctx, conversationID, nonnegativeCursor(cursor), pageLimit(limit))
	if err != nil {
		return Conversation{}, nil, err
	}
	return conversation, messages, nil
}

func (s *Service) SendMessage(ctx context.Context, actorID, conversationID int64, body string) (Message, error) {
	if err := s.ready(actorID); err != nil {
		return Message{}, err
	}
	conversation, err := s.loadParticipantConversation(ctx, actorID, conversationID)
	if err != nil {
		return Message{}, err
	}
	recipientID, ok := conversation.OtherParticipant(actorID)
	if !ok {
		return Message{}, ErrForbidden
	}
	if err := s.requireUnblocked(ctx, actorID, recipientID); err != nil {
		return Message{}, err
	}
	switch conversation.RequestStatus {
	case RequestPending:
		return Message{}, ErrMessageRequestPending
	case RequestDeclined:
		return Message{}, ErrMessageRequestDeclined
	case RequestAccepted:
		// allowed
	default:
		return Message{}, ErrForbidden
	}
	normalized, err := normalizeMessage(body)
	if err != nil {
		return Message{}, err
	}
	message, err := s.store.SendMessage(ctx, conversationID, actorID, recipientID, normalized)
	if err != nil {
		return Message{}, err
	}
	s.publishBestEffort(ctx, Event{
		Type: EventMessagePersisted,
		ConversationID: conversationID,
		MessageID: message.ID,
		ActorUserID: actorID,
		TargetUserID: recipientID,
		RequestStatus: RequestAccepted,
	})
	return message, nil
}

func (s *Service) AcceptRequest(ctx context.Context, actorID, conversationID int64) (Conversation, error) {
	return s.transitionRequest(ctx, actorID, conversationID, RequestAccepted)
}

func (s *Service) DeclineRequest(ctx context.Context, actorID, conversationID int64) (Conversation, error) {
	return s.transitionRequest(ctx, actorID, conversationID, RequestDeclined)
}

func (s *Service) transitionRequest(ctx context.Context, actorID, conversationID int64, target RequestStatus) (Conversation, error) {
	if err := s.ready(actorID); err != nil {
		return Conversation{}, err
	}
	conversation, err := s.loadParticipantConversation(ctx, actorID, conversationID)
	if err != nil {
		return Conversation{}, err
	}
	if conversation.CreatedBy == actorID {
		return Conversation{}, ErrForbidden
	}
	targetUserID, _ := conversation.OtherParticipant(actorID)
	switch conversation.RequestStatus {
	case RequestDeclined:
		return Conversation{}, ErrMessageRequestDeclined
	case RequestAccepted:
		if target == RequestAccepted {
			return conversation, nil
		}
		return Conversation{}, ErrForbidden
	case RequestPending:
		updated, err := s.store.UpdateRequestStatus(ctx, conversationID, target)
		if err != nil {
			return Conversation{}, err
		}
		eventType := EventConversationAccepted
		if target == RequestDeclined {
			eventType = EventConversationDeclined
		}
		s.publishBestEffort(ctx, Event{
			Type: eventType,
			ConversationID: conversationID,
			ActorUserID: actorID,
			TargetUserID: targetUserID,
			RequestStatus: updated.RequestStatus,
		})
		return updated, nil
	default:
		return Conversation{}, ErrForbidden
	}
}

func (s *Service) MarkRead(ctx context.Context, actorID, conversationID, messageID int64) error {
	if err := s.ready(actorID); err != nil {
		return err
	}
	if messageID <= 0 {
		return ErrForbidden
	}
	conversation, err := s.loadParticipantConversation(ctx, actorID, conversationID)
	if err != nil {
		return err
	}
	if err := s.store.MarkRead(ctx, conversationID, actorID, messageID); err != nil {
		return err
	}
	targetUserID, _ := conversation.OtherParticipant(actorID)
	s.publishBestEffort(ctx, Event{
		Type: EventConversationRead,
		ConversationID: conversationID,
		MessageID: messageID,
		ActorUserID: actorID,
		TargetUserID: targetUserID,
		RequestStatus: conversation.RequestStatus,
	})
	return nil
}

func (s *Service) HideConversation(ctx context.Context, actorID, conversationID int64) error {
	if err := s.ready(actorID); err != nil {
		return err
	}
	if _, err := s.loadParticipantConversation(ctx, actorID, conversationID); err != nil {
		return err
	}
	return s.store.HideConversation(ctx, conversationID, actorID)
}

func (s *Service) BlockUser(ctx context.Context, actorID, targetID int64) error {
	if err := s.ready(actorID); err != nil {
		return err
	}
	if targetID <= 0 || actorID == targetID {
		return ErrForbidden
	}
	if err := s.requireUser(ctx, targetID); err != nil {
		return err
	}
	if err := s.store.BlockUser(ctx, actorID, targetID); err != nil {
		return err
	}
	s.publishBestEffort(ctx, Event{Type: EventUserBlocked, ActorUserID: actorID, TargetUserID: targetID})
	return nil
}

func (s *Service) UnblockUser(ctx context.Context, actorID, targetID int64) error {
	if err := s.ready(actorID); err != nil {
		return err
	}
	if targetID <= 0 || actorID == targetID {
		return ErrForbidden
	}
	if err := s.requireUser(ctx, targetID); err != nil {
		return err
	}
	if err := s.store.UnblockUser(ctx, actorID, targetID); err != nil {
		return err
	}
	s.publishBestEffort(ctx, Event{Type: EventUserUnblocked, ActorUserID: actorID, TargetUserID: targetID})
	return nil
}

func (s *Service) CreateReport(ctx context.Context, actorID int64, input ReportInput) (Report, error) {
	if err := s.ready(actorID); err != nil {
		return Report{}, err
	}
	if input.TargetID <= 0 || !validReportTarget(input.TargetType) || !validReportReason(input.ReasonCode) {
		return Report{}, ErrInvalidReport
	}
	detail := strings.TrimSpace(input.Detail)
	if utf8.RuneCountInString(detail) > maxReportDetailRunes {
		return Report{}, ErrInvalidReport
	}
	if input.TargetType == ReportTargetMessage {
		if input.ConversationID <= 0 {
			return Report{}, ErrInvalidReport
		}
		if _, err := s.loadParticipantConversation(ctx, actorID, input.ConversationID); err != nil {
			return Report{}, err
		}
	}
	if input.TargetType == ReportTargetUser {
		if err := s.requireUser(ctx, input.TargetID); err != nil {
			return Report{}, err
		}
	}
	report := Report{
		ReporterUserID: actorID,
		TargetType: input.TargetType,
		TargetID: input.TargetID,
		ConversationID: input.ConversationID,
		ReasonCode: input.ReasonCode,
		Detail: detail,
		Status: "open",
	}
	return s.store.CreateReport(ctx, report)
}

func (s *Service) UnreadCount(ctx context.Context, actorID int64) (int64, error) {
	if err := s.ready(actorID); err != nil {
		return 0, err
	}
	return s.store.UnreadCount(ctx, actorID)
}

func (s *Service) publishBestEffort(ctx context.Context, event Event) {
	if s == nil || s.publisher == nil {
		return
	}
	if err := s.publisher.Publish(ctx, event); err != nil {
		log.Printf("messenger event publish failed type=%s conversation_id=%d actor_user_id=%d target_user_id=%d: %v", event.Type, event.ConversationID, event.ActorUserID, event.TargetUserID, err)
	}
}

func (s *Service) ready(actorID int64) error {
	if s == nil || s.store == nil {
		return ErrInternal
	}
	if actorID <= 0 {
		return ErrUnauthorized
	}
	return nil
}

func (s *Service) requireUser(ctx context.Context, userID int64) error {
	exists, err := s.store.UserExists(ctx, userID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrUserNotFound
	}
	return nil
}

func (s *Service) requireUnblocked(ctx context.Context, userA, userB int64) error {
	blocked, err := s.store.IsBlockedBetween(ctx, userA, userB)
	if err != nil {
		return err
	}
	if blocked {
		return ErrUserBlocked
	}
	return nil
}

func (s *Service) loadParticipantConversation(ctx context.Context, actorID, conversationID int64) (Conversation, error) {
	if conversationID <= 0 {
		return Conversation{}, ErrConversationNotFound
	}
	conversation, err := s.store.GetConversation(ctx, conversationID)
	if err != nil {
		return Conversation{}, err
	}
	if !conversation.HasParticipant(actorID) {
		return Conversation{}, ErrForbidden
	}
	return conversation, nil
}

func normalizeMessage(body string) (string, error) {
	normalized := strings.TrimSpace(body)
	if normalized == "" {
		return "", ErrInvalidMessage
	}
	if utf8.RuneCountInString(normalized) > maxMessageRunes {
		return "", ErrMessageTooLong
	}
	return normalized, nil
}

func pageLimit(limit int32) int32 {
	if limit <= 0 {
		return defaultPageSize
	}
	if limit > maxPageSize {
		return maxPageSize
	}
	return limit
}

func nonnegativeCursor(cursor int64) int64 {
	if cursor < 0 {
		return 0
	}
	return cursor
}

func validReportTarget(target ReportTargetType) bool {
	return target == ReportTargetMessage || target == ReportTargetUser
}

func validReportReason(reason string) bool {
	switch reason {
	case "spam", "harassment", "hate_or_abuse", "sexual_content", "threat_or_violence", "impersonation", "other":
		return true
	default:
		return false
	}
}
