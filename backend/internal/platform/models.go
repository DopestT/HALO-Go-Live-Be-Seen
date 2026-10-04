package platform

import (
	"errors"
	"strings"
)

// HALOID is an application-owned canonical identifier. Provider identifiers must
// never be substituted for HALO identifiers.
type HALOID string

// ProviderID is an identifier issued by an external provider such as LiveKit.
type ProviderID string

type BroadcastStatus string

const (
	BroadcastScheduled    BroadcastStatus = "scheduled"
	BroadcastProvisioning BroadcastStatus = "provisioning"
	BroadcastLive         BroadcastStatus = "live"
	BroadcastEnding       BroadcastStatus = "ending"
	BroadcastEnded        BroadcastStatus = "ended"
	BroadcastFailed       BroadcastStatus = "failed"
)

func (s BroadcastStatus) Valid() bool {
	switch s {
	case BroadcastScheduled, BroadcastProvisioning, BroadcastLive, BroadcastEnding, BroadcastEnded, BroadcastFailed:
		return true
	default:
		return false
	}
}

type ProviderSessionStatus string

const (
	ProviderSessionProvisioning ProviderSessionStatus = "provisioning"
	ProviderSessionActive       ProviderSessionStatus = "active"
	ProviderSessionEnded        ProviderSessionStatus = "ended"
	ProviderSessionFailed       ProviderSessionStatus = "failed"
)

func (s ProviderSessionStatus) Valid() bool {
	switch s {
	case ProviderSessionProvisioning, ProviderSessionActive, ProviderSessionEnded, ProviderSessionFailed:
		return true
	default:
		return false
	}
}

// StreamProviderSession binds HALO-owned broadcast state to replaceable provider state.
type StreamProviderSession struct {
	ID                HALOID
	BroadcastID       HALOID
	Provider          string
	ProviderSessionID ProviderID
	Status            ProviderSessionStatus
}

func (s StreamProviderSession) Validate() error {
	if strings.TrimSpace(string(s.ID)) == "" {
		return errors.New("canonical provider-session id is required")
	}
	if strings.TrimSpace(string(s.BroadcastID)) == "" {
		return errors.New("canonical broadcast id is required")
	}
	if strings.TrimSpace(s.Provider) == "" {
		return errors.New("provider is required")
	}
	if !s.Status.Valid() {
		return errors.New("provider session status is invalid")
	}
	if s.Status != ProviderSessionProvisioning && strings.TrimSpace(string(s.ProviderSessionID)) == "" {
		return errors.New("provider session id is required after provisioning")
	}
	return nil
}

// ExternalAudienceReference represents an authorized relationship imported from
// an external platform. It is not a HALO user account.
type ExternalAudienceReference struct {
	CreatorChannelID HALOID
	Provider         string
	ExternalUserID   string
}

func (r ExternalAudienceReference) Validate() error {
	if strings.TrimSpace(string(r.CreatorChannelID)) == "" {
		return errors.New("creator channel id is required")
	}
	if strings.TrimSpace(r.Provider) == "" {
		return errors.New("provider is required")
	}
	if strings.TrimSpace(r.ExternalUserID) == "" {
		return errors.New("external user id is required")
	}
	return nil
}

func (r ExternalAudienceReference) DedupeKey() string {
	return string(r.CreatorChannelID) + ":" + r.Provider + ":" + r.ExternalUserID
}
