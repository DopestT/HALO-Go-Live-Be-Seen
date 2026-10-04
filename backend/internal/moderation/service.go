package moderation

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

var ErrForbidden = errors.New("moderation action is forbidden")

type Scope string

const (
	ScopePlatform     Scope = "platform"
	ScopeOrganization Scope = "organization"
	ScopeChannel      Scope = "channel"
)

type Role string

const (
	RoleViewer        Role = "viewer"
	RoleModerator     Role = "moderator"
	RoleAdministrator Role = "administrator"
	RoleOwner         Role = "owner"
	RolePlatformStaff Role = "platform_staff"
)

type Action string

const (
	ActionMute           Action = "mute"
	ActionTimeout        Action = "timeout"
	ActionRemove         Action = "remove"
	ActionBan            Action = "ban"
	ActionEndStream      Action = "end_stream"
	ActionSuspendChannel Action = "suspend_channel"
)

type Outcome string

const (
	OutcomeAllowed   Outcome = "allowed"
	OutcomeDenied    Outcome = "denied"
	OutcomeSucceeded Outcome = "succeeded"
	OutcomeFailed    Outcome = "failed"
)

type Actor struct {
	UserID         int64
	Scope          Scope
	Role           Role
	ChannelID      platform.HALOID
	OrganizationID platform.HALOID
}

type Request struct {
	Action       Action
	ChannelID    platform.HALOID
	BroadcastID  platform.HALOID
	TargetUserID int64
	ReasonCode   string
}

type ModerationAction struct {
	ActorUserID  int64
	ActorScope   Scope
	ChannelID    platform.HALOID
	BroadcastID  platform.HALOID
	TargetUserID int64
	Action       Action
	ReasonCode   string
}

type AuditEvent struct {
	ActorUserID int64
	ActorScope  Scope
	Action      Action
	ChannelID   platform.HALOID
	BroadcastID platform.HALOID
	TargetUserID int64
	ReasonCode  string
	Outcome     Outcome
}

type AtomicAction struct {
	Action ModerationAction
	Audit  AuditEvent
}

type Store interface {
	ApplyActionWithAudit(ctx context.Context, write AtomicAction) error
}

type AuditLog interface {
	Append(ctx context.Context, event AuditEvent) error
}

type StreamController interface {
	EmergencyEndBroadcast(ctx context.Context, broadcastID platform.HALOID) error
}

type Service struct {
	store      Store
	audit      AuditLog
	controller StreamController
}

func NewService(store Store, audit AuditLog, controller StreamController) *Service {
	return &Service{store: store, audit: audit, controller: controller}
}

func (s *Service) Apply(ctx context.Context, actor Actor, request Request) error {
	if s == nil || s.store == nil || s.audit == nil || s.controller == nil {
		return errors.New("moderation service is not configured")
	}
	if err := validateActor(actor); err != nil {
		return err
	}
	if err := validateRequest(request); err != nil {
		return err
	}

	if !authorized(actor, request) {
		event := auditEvent(actor, request, OutcomeDenied)
		if err := s.audit.Append(ctx, event); err != nil {
			return fmt.Errorf("record denied moderation attempt: %w", err)
		}
		return ErrForbidden
	}

	if request.Action == ActionEndStream {
		return s.emergencyEnd(ctx, actor, request)
	}

	write := AtomicAction{
		Action: ModerationAction{
			ActorUserID:  actor.UserID,
			ActorScope:   actor.Scope,
			ChannelID:    request.ChannelID,
			BroadcastID:  request.BroadcastID,
			TargetUserID: request.TargetUserID,
			Action:       request.Action,
			ReasonCode:   request.ReasonCode,
		},
		Audit: auditEvent(actor, request, OutcomeSucceeded),
	}
	if err := s.store.ApplyActionWithAudit(ctx, write); err != nil {
		return fmt.Errorf("apply moderation action atomically: %w", err)
	}
	return nil
}

func (s *Service) emergencyEnd(ctx context.Context, actor Actor, request Request) error {
	intent := auditEvent(actor, request, OutcomeAllowed)
	if err := s.audit.Append(ctx, intent); err != nil {
		return fmt.Errorf("record emergency-stop intent: %w", err)
	}

	if err := s.controller.EmergencyEndBroadcast(ctx, request.BroadcastID); err != nil {
		failed := auditEvent(actor, request, OutcomeFailed)
		if auditErr := s.audit.Append(ctx, failed); auditErr != nil {
			return fmt.Errorf("end broadcast: %v; record failed outcome: %w", err, auditErr)
		}
		return fmt.Errorf("end broadcast: %w", err)
	}

	succeeded := auditEvent(actor, request, OutcomeSucceeded)
	if err := s.audit.Append(ctx, succeeded); err != nil {
		return fmt.Errorf("record emergency-stop success: %w", err)
	}
	return nil
}

func authorized(actor Actor, request Request) bool {
	if actor.Scope == ScopePlatform && actor.Role == RolePlatformStaff {
		return true
	}
	if actor.Scope != ScopeChannel || strings.TrimSpace(string(actor.ChannelID)) == "" || actor.ChannelID != request.ChannelID {
		return false
	}

	switch actor.Role {
	case RoleModerator, RoleAdministrator, RoleOwner:
		switch request.Action {
		case ActionMute, ActionTimeout, ActionRemove, ActionBan, ActionEndStream:
			return true
		default:
			return false
		}
	default:
		return false
	}
}

func validateActor(actor Actor) error {
	if actor.UserID <= 0 {
		return errors.New("moderation actor user id is required")
	}
	switch actor.Scope {
	case ScopePlatform, ScopeOrganization, ScopeChannel:
	default:
		return errors.New("moderation actor scope is invalid")
	}
	return nil
}

func validateRequest(request Request) error {
	if strings.TrimSpace(string(request.ChannelID)) == "" {
		return errors.New("channel id is required")
	}
	if strings.TrimSpace(request.ReasonCode) == "" {
		return errors.New("moderation reason code is required")
	}
	switch request.Action {
	case ActionMute, ActionTimeout, ActionRemove, ActionBan:
		if request.TargetUserID <= 0 {
			return errors.New("target user id is required")
		}
	case ActionEndStream:
		if strings.TrimSpace(string(request.BroadcastID)) == "" {
			return errors.New("broadcast id is required")
		}
	case ActionSuspendChannel:
	default:
		return errors.New("moderation action is invalid")
	}
	return nil
}

func auditEvent(actor Actor, request Request, outcome Outcome) AuditEvent {
	return AuditEvent{
		ActorUserID:  actor.UserID,
		ActorScope:   actor.Scope,
		Action:       request.Action,
		ChannelID:    request.ChannelID,
		BroadcastID:  request.BroadcastID,
		TargetUserID: request.TargetUserID,
		ReasonCode:   request.ReasonCode,
		Outcome:      outcome,
	}
}
