package audience

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

var ErrExplicitConsentRequired = errors.New("explicit consent is required before restoring a follow")

type Reference struct {
	ID                  platform.HALOID
	CreatorChannelID    platform.HALOID
	Provider            string
	ExternalUserID      string
	RelationshipType    string
	ClaimedHALOUserID   int64
}

type ImportedRelationship struct {
	ExternalUserID    string
	RelationshipType  string
}

type ImportRequest struct {
	CreatorChannelID platform.HALOID
	Provider         string
	Relationships    []ImportedRelationship
}

type ImportResult struct {
	Imported     int
	Deduplicated int
}

type VerifiedExternalIdentity struct {
	HALOUserID     int64
	Provider       string
	ExternalUserID string
}

type ClaimSuggestion struct {
	ReferenceID      platform.HALOID
	CreatorChannelID platform.HALOID
	RelationshipType string
}

type ClaimConsent struct {
	HALOUserID int64
	Suggestion ClaimSuggestion
	Follow     bool
}

type Claim struct {
	ReferenceID platform.HALOID
	UserID      int64
}

type Follow struct {
	UserID    int64
	ChannelID platform.HALOID
	Source    string
}

type Store interface {
	UpsertReference(ctx context.Context, ref Reference) (inserted bool, err error)
	MatchingReferences(ctx context.Context, provider, externalUserID string) ([]Reference, error)
	AcceptClaim(ctx context.Context, claim Claim, follow Follow) error
}

type Service struct {
	store Store
}

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (s *Service) ImportReferences(ctx context.Context, request ImportRequest) (ImportResult, error) {
	if s == nil || s.store == nil {
		return ImportResult{}, errors.New("audience service is not configured")
	}
	if strings.TrimSpace(string(request.CreatorChannelID)) == "" {
		return ImportResult{}, errors.New("creator channel id is required")
	}
	provider := strings.TrimSpace(request.Provider)
	if provider == "" {
		return ImportResult{}, errors.New("provider is required")
	}

	var result ImportResult
	seen := make(map[string]struct{}, len(request.Relationships))
	for _, relationship := range request.Relationships {
		externalUserID := strings.TrimSpace(relationship.ExternalUserID)
		relationshipType := strings.TrimSpace(relationship.RelationshipType)
		if externalUserID == "" {
			return result, errors.New("external user id is required")
		}
		if !validRelationshipType(relationshipType) {
			return result, fmt.Errorf("unsupported relationship type %q", relationshipType)
		}

		key := string(request.CreatorChannelID) + ":" + provider + ":" + externalUserID
		if _, duplicate := seen[key]; duplicate {
			result.Deduplicated++
			continue
		}
		seen[key] = struct{}{}

		inserted, err := s.store.UpsertReference(ctx, Reference{
			CreatorChannelID: request.CreatorChannelID,
			Provider:         provider,
			ExternalUserID:   externalUserID,
			RelationshipType: relationshipType,
		})
		if err != nil {
			return result, fmt.Errorf("store audience reference: %w", err)
		}
		if inserted {
			result.Imported++
		} else {
			result.Deduplicated++
		}
	}
	return result, nil
}

func (s *Service) ProposeClaims(ctx context.Context, identity VerifiedExternalIdentity) ([]ClaimSuggestion, error) {
	if s == nil || s.store == nil {
		return nil, errors.New("audience service is not configured")
	}
	if identity.HALOUserID <= 0 {
		return nil, errors.New("HALO user id is required")
	}
	provider := strings.TrimSpace(identity.Provider)
	externalUserID := strings.TrimSpace(identity.ExternalUserID)
	if provider == "" || externalUserID == "" {
		return nil, errors.New("verified external identity is incomplete")
	}

	references, err := s.store.MatchingReferences(ctx, provider, externalUserID)
	if err != nil {
		return nil, fmt.Errorf("find matching audience references: %w", err)
	}

	suggestions := make([]ClaimSuggestion, 0, len(references))
	for _, ref := range references {
		if strings.TrimSpace(string(ref.ID)) == "" || strings.TrimSpace(string(ref.CreatorChannelID)) == "" {
			continue
		}
		if ref.ClaimedHALOUserID != 0 && ref.ClaimedHALOUserID != identity.HALOUserID {
			continue
		}
		suggestions = append(suggestions, ClaimSuggestion{
			ReferenceID:      ref.ID,
			CreatorChannelID: ref.CreatorChannelID,
			RelationshipType: ref.RelationshipType,
		})
	}
	return suggestions, nil
}

func (s *Service) AcceptClaim(ctx context.Context, consent ClaimConsent) error {
	if s == nil || s.store == nil {
		return errors.New("audience service is not configured")
	}
	if !consent.Follow {
		return ErrExplicitConsentRequired
	}
	if consent.HALOUserID <= 0 {
		return errors.New("HALO user id is required")
	}
	if strings.TrimSpace(string(consent.Suggestion.ReferenceID)) == "" {
		return errors.New("audience reference id is required")
	}
	if strings.TrimSpace(string(consent.Suggestion.CreatorChannelID)) == "" {
		return errors.New("creator channel id is required")
	}
	if !validRelationshipType(consent.Suggestion.RelationshipType) {
		return errors.New("claim suggestion has invalid relationship type")
	}

	claim := Claim{
		ReferenceID: consent.Suggestion.ReferenceID,
		UserID:      consent.HALOUserID,
	}
	follow := Follow{
		UserID:    consent.HALOUserID,
		ChannelID: consent.Suggestion.CreatorChannelID,
		Source:    "audience_migration",
	}
	if err := s.store.AcceptClaim(ctx, claim, follow); err != nil {
		return fmt.Errorf("accept audience claim atomically: %w", err)
	}
	return nil
}

func validRelationshipType(value string) bool {
	switch value {
	case "follower", "subscriber", "member", "supporter":
		return true
	default:
		return false
	}
}
