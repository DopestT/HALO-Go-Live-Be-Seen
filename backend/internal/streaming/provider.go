package streaming

import (
	"context"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

// ProvisionedSession contains only provider-owned transport identity. HALO
// canonical identity is created separately by the orchestration service.
type ProvisionedSession struct {
	ProviderSessionID platform.ProviderID
}

// Provider is the replaceable media-provider boundary. Provider credentials and
// secrets belong inside adapters, never in HALO domain records.
type Provider interface {
	Name() string
	ProvisionBroadcast(ctx context.Context, broadcastID platform.HALOID) (ProvisionedSession, error)
	EndBroadcast(ctx context.Context, providerSessionID platform.ProviderID) error
}

// Repository persists HALO-owned broadcast state independently of the provider.
type Repository interface {
	GetBroadcastStatus(ctx context.Context, broadcastID platform.HALOID) (platform.BroadcastStatus, error)
	SetBroadcastStatus(ctx context.Context, broadcastID platform.HALOID, status platform.BroadcastStatus) error
	SaveProviderSession(ctx context.Context, session platform.StreamProviderSession) error
	GetActiveProviderSession(ctx context.Context, broadcastID platform.HALOID) (platform.StreamProviderSession, error)
}
