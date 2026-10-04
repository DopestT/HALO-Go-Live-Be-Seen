package moderation

import (
	"context"
	"errors"
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type fakeStore struct {
	atomicWrites []AtomicAction
	writeErr     error
}

func (s *fakeStore) ApplyActionWithAudit(_ context.Context, write AtomicAction) error {
	if s.writeErr != nil {
		return s.writeErr
	}
	s.atomicWrites = append(s.atomicWrites, write)
	return nil
}

type fakeAudit struct {
	events []AuditEvent
	err    error
}

func (a *fakeAudit) Append(_ context.Context, event AuditEvent) error {
	if a.err != nil {
		return a.err
	}
	a.events = append(a.events, event)
	return nil
}

type fakeController struct {
	calls int
	err   error
}

func (c *fakeController) EmergencyEndBroadcast(context.Context, platform.HALOID) error {
	c.calls++
	return c.err
}

func TestViewerCannotBanAndDeniedAttemptIsAudited(t *testing.T) {
	store := &fakeStore{}
	audit := &fakeAudit{}
	controller := &fakeController{}
	service := NewService(store, audit, controller)

	err := service.Apply(context.Background(), Actor{
		UserID:    77,
		Scope:     ScopeChannel,
		Role:      RoleViewer,
		ChannelID: platform.HALOID("channel-1"),
	}, Request{
		Action:       ActionBan,
		ChannelID:    platform.HALOID("channel-1"),
		TargetUserID: 88,
		ReasonCode:   "harassment",
	})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("Apply() error = %v, want ErrForbidden", err)
	}
	if len(store.atomicWrites) != 0 {
		t.Fatal("denied moderation attempt mutated moderation state")
	}
	if len(audit.events) != 1 || audit.events[0].Outcome != OutcomeDenied {
		t.Fatalf("audit events = %+v, want one denied event", audit.events)
	}
}

func TestChannelModeratorCanTimeoutButCannotSuspendChannel(t *testing.T) {
	store := &fakeStore{}
	audit := &fakeAudit{}
	service := NewService(store, audit, &fakeController{})
	actor := Actor{UserID: 12, Scope: ScopeChannel, Role: RoleModerator, ChannelID: platform.HALOID("channel-1")}

	if err := service.Apply(context.Background(), actor, Request{
		Action:       ActionTimeout,
		ChannelID:    platform.HALOID("channel-1"),
		TargetUserID: 88,
		ReasonCode:   "spam",
	}); err != nil {
		t.Fatalf("timeout Apply() error = %v", err)
	}
	if len(store.atomicWrites) != 1 {
		t.Fatalf("atomic writes = %d, want 1", len(store.atomicWrites))
	}
	if store.atomicWrites[0].Audit.ActorScope != ScopeChannel {
		t.Fatalf("actor scope = %q, want channel", store.atomicWrites[0].Audit.ActorScope)
	}

	err := service.Apply(context.Background(), actor, Request{
		Action:     ActionSuspendChannel,
		ChannelID:  platform.HALOID("channel-1"),
		ReasonCode: "platform_safety",
	})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("suspend Apply() error = %v, want ErrForbidden", err)
	}
}

func TestChannelModeratorCannotModerateAnotherChannel(t *testing.T) {
	store := &fakeStore{}
	audit := &fakeAudit{}
	service := NewService(store, audit, &fakeController{})

	err := service.Apply(context.Background(), Actor{
		UserID:    12,
		Scope:     ScopeChannel,
		Role:      RoleModerator,
		ChannelID: platform.HALOID("channel-1"),
	}, Request{
		Action:       ActionBan,
		ChannelID:    platform.HALOID("channel-2"),
		TargetUserID: 88,
		ReasonCode:   "spam",
	})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("cross-channel Apply() error = %v, want ErrForbidden", err)
	}
	if len(store.atomicWrites) != 0 {
		t.Fatal("cross-channel moderation mutated moderation state")
	}
	if len(audit.events) != 1 || audit.events[0].Outcome != OutcomeDenied {
		t.Fatalf("cross-channel denial audit = %+v", audit.events)
	}
}

func TestPlatformStaffCanSuspendChannel(t *testing.T) {
	store := &fakeStore{}
	service := NewService(store, &fakeAudit{}, &fakeController{})

	err := service.Apply(context.Background(), Actor{
		UserID: 1,
		Scope:  ScopePlatform,
		Role:   RolePlatformStaff,
	}, Request{
		Action:     ActionSuspendChannel,
		ChannelID:  platform.HALOID("channel-9"),
		ReasonCode: "credible_threat",
	})
	if err != nil {
		t.Fatalf("Apply() error = %v", err)
	}
	if len(store.atomicWrites) != 1 {
		t.Fatalf("atomic writes = %d, want 1", len(store.atomicWrites))
	}
}

func TestEmergencyStopRequiresAuditIntentBeforeProviderSideEffect(t *testing.T) {
	store := &fakeStore{}
	audit := &fakeAudit{err: errors.New("audit unavailable")}
	controller := &fakeController{}
	service := NewService(store, audit, controller)

	err := service.Apply(context.Background(), Actor{
		UserID:    12,
		Scope:     ScopeChannel,
		Role:      RoleModerator,
		ChannelID: platform.HALOID("channel-1"),
	}, Request{
		Action:      ActionEndStream,
		ChannelID:   platform.HALOID("channel-1"),
		BroadcastID: platform.HALOID("broadcast-1"),
		ReasonCode:  "immediate_danger",
	})
	if err == nil {
		t.Fatal("Apply() succeeded despite audit intent failure")
	}
	if controller.calls != 0 {
		t.Fatalf("provider/control side effect called %d times before durable audit intent", controller.calls)
	}
}

func TestEmergencyStopProviderFailureIsAuditedAsFailed(t *testing.T) {
	audit := &fakeAudit{}
	controller := &fakeController{err: errors.New("provider unavailable")}
	service := NewService(&fakeStore{}, audit, controller)

	err := service.Apply(context.Background(), Actor{
		UserID:    12,
		Scope:     ScopeChannel,
		Role:      RoleModerator,
		ChannelID: platform.HALOID("channel-1"),
	}, Request{
		Action:      ActionEndStream,
		ChannelID:   platform.HALOID("channel-1"),
		BroadcastID: platform.HALOID("broadcast-1"),
		ReasonCode:  "immediate_danger",
	})
	if err == nil {
		t.Fatal("Apply() succeeded despite provider failure")
	}
	if controller.calls != 1 {
		t.Fatalf("controller calls = %d, want 1", controller.calls)
	}
	if len(audit.events) != 2 {
		t.Fatalf("audit events = %d, want intent + result", len(audit.events))
	}
	if audit.events[0].Outcome != OutcomeAllowed || audit.events[1].Outcome != OutcomeFailed {
		t.Fatalf("audit outcomes = %q/%q, want allowed/failed", audit.events[0].Outcome, audit.events[1].Outcome)
	}
}
