package streaming

import (
	"context"
	"errors"
	"fmt"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type SessionIDFactory func() platform.HALOID

type Service struct {
	repo      Repository
	provider  Provider
	newID     SessionIDFactory
}

func NewService(repo Repository, provider Provider, newID SessionIDFactory) *Service {
	return &Service{repo: repo, provider: provider, newID: newID}
}

func (s *Service) StartBroadcast(ctx context.Context, broadcastID platform.HALOID) (platform.StreamProviderSession, error) {
	if s == nil || s.repo == nil || s.provider == nil || s.newID == nil {
		return platform.StreamProviderSession{}, errors.New("streaming service is not configured")
	}

	status, err := s.repo.GetBroadcastStatus(ctx, broadcastID)
	if err != nil {
		return platform.StreamProviderSession{}, fmt.Errorf("get broadcast status: %w", err)
	}
	if status != platform.BroadcastScheduled {
		return platform.StreamProviderSession{}, fmt.Errorf("broadcast cannot start from status %q", status)
	}

	if err := s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastProvisioning); err != nil {
		return platform.StreamProviderSession{}, fmt.Errorf("mark broadcast provisioning: %w", err)
	}

	provisioned, err := s.provider.ProvisionBroadcast(ctx, broadcastID)
	if err != nil {
		_ = s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastFailed)
		return platform.StreamProviderSession{}, fmt.Errorf("provision broadcast with %s: %w", s.provider.Name(), err)
	}

	session := platform.StreamProviderSession{
		ID:                s.newID(),
		BroadcastID:       broadcastID,
		Provider:          s.provider.Name(),
		ProviderSessionID: provisioned.ProviderSessionID,
		Status:            platform.ProviderSessionActive,
	}
	if err := session.Validate(); err != nil {
		_ = s.provider.EndBroadcast(ctx, provisioned.ProviderSessionID)
		_ = s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastFailed)
		return platform.StreamProviderSession{}, fmt.Errorf("invalid provider session: %w", err)
	}
	if err := s.repo.SaveProviderSession(ctx, session); err != nil {
		_ = s.provider.EndBroadcast(ctx, provisioned.ProviderSessionID)
		_ = s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastFailed)
		return platform.StreamProviderSession{}, fmt.Errorf("save provider session: %w", err)
	}
	if err := s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastLive); err != nil {
		_ = s.provider.EndBroadcast(ctx, provisioned.ProviderSessionID)
		_ = s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastFailed)
		return platform.StreamProviderSession{}, fmt.Errorf("mark broadcast live: %w", err)
	}

	return session, nil
}

func (s *Service) EndBroadcast(ctx context.Context, broadcastID platform.HALOID) error {
	if s == nil || s.repo == nil || s.provider == nil {
		return errors.New("streaming service is not configured")
	}

	status, err := s.repo.GetBroadcastStatus(ctx, broadcastID)
	if err != nil {
		return fmt.Errorf("get broadcast status: %w", err)
	}
	if status != platform.BroadcastLive {
		return fmt.Errorf("broadcast cannot end from status %q", status)
	}

	if err := s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastEnding); err != nil {
		return fmt.Errorf("mark broadcast ending: %w", err)
	}

	session, err := s.repo.GetActiveProviderSession(ctx, broadcastID)
	if err != nil {
		return fmt.Errorf("get active provider session: %w", err)
	}
	if session.Provider != s.provider.Name() {
		return fmt.Errorf("provider session belongs to %q, active provider is %q", session.Provider, s.provider.Name())
	}

	if err := s.provider.EndBroadcast(ctx, session.ProviderSessionID); err != nil {
		return fmt.Errorf("end provider broadcast: %w", err)
	}
	if err := s.repo.SetBroadcastStatus(ctx, broadcastID, platform.BroadcastEnded); err != nil {
		return fmt.Errorf("mark broadcast ended: %w", err)
	}
	return nil
}
