package streaming

import (
	"context"
	"errors"
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type fakeRepository struct {
	status        platform.BroadcastStatus
	savedSession *platform.StreamProviderSession
	statusWrites  []platform.BroadcastStatus
}

func (r *fakeRepository) GetBroadcastStatus(context.Context, platform.HALOID) (platform.BroadcastStatus, error) {
	return r.status, nil
}

func (r *fakeRepository) SetBroadcastStatus(_ context.Context, _ platform.HALOID, status platform.BroadcastStatus) error {
	r.status = status
	r.statusWrites = append(r.statusWrites, status)
	return nil
}

func (r *fakeRepository) SaveProviderSession(_ context.Context, session platform.StreamProviderSession) error {
	copy := session
	r.savedSession = &copy
	return nil
}

func (r *fakeRepository) GetActiveProviderSession(context.Context, platform.HALOID) (platform.StreamProviderSession, error) {
	if r.savedSession == nil {
		return platform.StreamProviderSession{}, errors.New("not found")
	}
	return *r.savedSession, nil
}

type fakeProvider struct {
	name          string
	providerID    platform.ProviderID
	provisionErr  error
	endErr        error
	provisionCalls int
	endCalls       int
}

func (p *fakeProvider) Name() string { return p.name }

func (p *fakeProvider) ProvisionBroadcast(context.Context, platform.HALOID) (ProvisionedSession, error) {
	p.provisionCalls++
	if p.provisionErr != nil {
		return ProvisionedSession{}, p.provisionErr
	}
	return ProvisionedSession{ProviderSessionID: p.providerID}, nil
}

func (p *fakeProvider) EndBroadcast(context.Context, platform.ProviderID) error {
	p.endCalls++
	return p.endErr
}

func TestStartBroadcastSeparatesCanonicalAndProviderIdentity(t *testing.T) {
	repo := &fakeRepository{status: platform.BroadcastScheduled}
	provider := &fakeProvider{name: "livekit", providerID: platform.ProviderID("provider-room-9")}
	service := NewService(repo, provider, func() platform.HALOID { return platform.HALOID("halo-session-1") })

	session, err := service.StartBroadcast(context.Background(), platform.HALOID("broadcast-1"))
	if err != nil {
		t.Fatalf("StartBroadcast() error = %v", err)
	}
	if session.ID != platform.HALOID("halo-session-1") {
		t.Fatalf("canonical session ID = %q", session.ID)
	}
	if session.ProviderSessionID != platform.ProviderID("provider-room-9") {
		t.Fatalf("provider session ID = %q", session.ProviderSessionID)
	}
	if platform.ProviderID(session.ID) == session.ProviderSessionID {
		t.Fatal("provider identifier became the canonical HALO identifier")
	}
	if repo.status != platform.BroadcastLive {
		t.Fatalf("broadcast status = %q, want live", repo.status)
	}
}

func TestStartBroadcastProviderFailureLeavesCanonicalFailedState(t *testing.T) {
	repo := &fakeRepository{status: platform.BroadcastScheduled}
	provider := &fakeProvider{name: "livekit", provisionErr: errors.New("provider unavailable")}
	service := NewService(repo, provider, func() platform.HALOID { return platform.HALOID("halo-session-1") })

	_, err := service.StartBroadcast(context.Background(), platform.HALOID("broadcast-2"))
	if err == nil {
		t.Fatal("StartBroadcast() succeeded despite provider failure")
	}
	if repo.status != platform.BroadcastFailed {
		t.Fatalf("broadcast status = %q, want failed", repo.status)
	}
	if repo.savedSession != nil {
		t.Fatal("provider failure wrote a provider session")
	}
}

func TestStartBroadcastRejectsIllegalLifecycleWithoutCallingProvider(t *testing.T) {
	repo := &fakeRepository{status: platform.BroadcastEnded}
	provider := &fakeProvider{name: "livekit", providerID: platform.ProviderID("provider-room-9")}
	service := NewService(repo, provider, func() platform.HALOID { return platform.HALOID("halo-session-1") })

	_, err := service.StartBroadcast(context.Background(), platform.HALOID("broadcast-3"))
	if err == nil {
		t.Fatal("StartBroadcast() accepted an ended broadcast")
	}
	if provider.provisionCalls != 0 {
		t.Fatalf("provider called %d times for illegal lifecycle", provider.provisionCalls)
	}
}

func TestEndBroadcastProviderFailureRemainsEndingForRecovery(t *testing.T) {
	session := platform.StreamProviderSession{
		ID:                platform.HALOID("halo-session-1"),
		BroadcastID:       platform.HALOID("broadcast-4"),
		Provider:          "livekit",
		ProviderSessionID: platform.ProviderID("provider-room-9"),
		Status:            platform.ProviderSessionActive,
	}
	repo := &fakeRepository{status: platform.BroadcastLive, savedSession: &session}
	provider := &fakeProvider{name: "livekit", endErr: errors.New("provider timeout")}
	service := NewService(repo, provider, func() platform.HALOID { return platform.HALOID("unused") })

	err := service.EndBroadcast(context.Background(), platform.HALOID("broadcast-4"))
	if err == nil {
		t.Fatal("EndBroadcast() succeeded despite provider failure")
	}
	if repo.status != platform.BroadcastEnding {
		t.Fatalf("broadcast status = %q, want ending for retry/reconciliation", repo.status)
	}
	if provider.endCalls != 1 {
		t.Fatalf("provider end calls = %d, want 1", provider.endCalls)
	}
}
