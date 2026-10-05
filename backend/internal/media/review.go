package media

import (
	"errors"
	"strings"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type ReviewStatus string

const (
	ReviewPending  ReviewStatus = "pending"
	ReviewApproved ReviewStatus = "approved"
	ReviewRejected ReviewStatus = "rejected"
	ReviewBlocked  ReviewStatus = "blocked"
)

func (s ReviewStatus) Valid() bool {
	switch s {
	case ReviewPending, ReviewApproved, ReviewRejected, ReviewBlocked:
		return true
	default:
		return false
	}
}

func (s ReviewStatus) CanTransitionTo(to ReviewStatus) bool {
	if !s.Valid() || !to.Valid() || s == to {
		return false
	}

	switch s {
	case ReviewPending:
		return to == ReviewApproved || to == ReviewRejected || to == ReviewBlocked
	case ReviewApproved:
		return to == ReviewBlocked
	case ReviewRejected, ReviewBlocked:
		return to == ReviewPending
	default:
		return false
	}
}

// StagedMedia represents an untrusted external media reference after it has
// entered HALO's canonical staging model. A staged record is not publishable
// merely because it exists or because the upstream provider returned it.
type StagedMedia struct {
	ID              platform.HALOID
	SourceID        platform.HALOID
	ExternalID      string
	RightsReference string
	ReviewStatus    ReviewStatus
}

func (m StagedMedia) Validate() error {
	if strings.TrimSpace(string(m.ID)) == "" {
		return errors.New("canonical staged media id is required")
	}
	if strings.TrimSpace(string(m.SourceID)) == "" {
		return errors.New("canonical media source id is required")
	}
	if strings.TrimSpace(m.ExternalID) == "" {
		return errors.New("external media id is required")
	}
	if strings.TrimSpace(m.RightsReference) == "" {
		return errors.New("rights evidence is required")
	}
	if !m.ReviewStatus.Valid() {
		return errors.New("media review status is invalid")
	}
	return nil
}

// CanPublish requires both the media record and its exact canonical source to
// be valid and approved. Revoked, pending, mismatched, or malformed state fails
// closed even if the asset itself was previously approved.
func (m StagedMedia) CanPublish(source MediaSource) bool {
	return m.Validate() == nil &&
		source.Validate() == nil &&
		source.ID == m.SourceID &&
		source.Authorization == SourceApproved &&
		m.ReviewStatus == ReviewApproved
}
