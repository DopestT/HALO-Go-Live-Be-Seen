package media

import (
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

func TestReviewStatusTransitionsFailClosed(t *testing.T) {
	tests := []struct {
		name    string
		from    ReviewStatus
		to      ReviewStatus
		allowed bool
	}{
		{name: "pending approve", from: ReviewPending, to: ReviewApproved, allowed: true},
		{name: "pending reject", from: ReviewPending, to: ReviewRejected, allowed: true},
		{name: "pending block", from: ReviewPending, to: ReviewBlocked, allowed: true},
		{name: "approved block", from: ReviewApproved, to: ReviewBlocked, allowed: true},
		{name: "rejected reopen", from: ReviewRejected, to: ReviewPending, allowed: true},
		{name: "blocked reopen", from: ReviewBlocked, to: ReviewPending, allowed: true},
		{name: "approved cannot return pending", from: ReviewApproved, to: ReviewPending, allowed: false},
		{name: "rejected cannot approve directly", from: ReviewRejected, to: ReviewApproved, allowed: false},
		{name: "blocked cannot approve directly", from: ReviewBlocked, to: ReviewApproved, allowed: false},
		{name: "unknown target rejected", from: ReviewPending, to: ReviewStatus("invented"), allowed: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.from.CanTransitionTo(tt.to); got != tt.allowed {
				t.Fatalf("%q -> %q = %v; want %v", tt.from, tt.to, got, tt.allowed)
			}
		})
	}
}

func TestStagedMediaValidateRequiresCanonicalReferencesAndRights(t *testing.T) {
	asset := StagedMedia{
		ID:              platform.HALOID("asset-1"),
		SourceID:        platform.HALOID("source-1"),
		ExternalID:      "provider-video-7",
		RightsReference: "",
		ReviewStatus:    ReviewPending,
	}
	if err := asset.Validate(); err == nil {
		t.Fatal("StagedMedia.Validate() accepted missing rights evidence")
	}

	asset.RightsReference = "license:creator-owned"
	asset.SourceID = ""
	if err := asset.Validate(); err == nil {
		t.Fatal("StagedMedia.Validate() accepted missing canonical source id")
	}
}

func TestStagedMediaPublicationRequiresApprovedSourceAndReview(t *testing.T) {
	source := MediaSource{
		ID:            platform.HALOID("source-1"),
		Name:          "Creator media origin",
		Authorization: SourceApproved,
		AllowedHosts:  []string{"example.com"},
	}
	asset := StagedMedia{
		ID:              platform.HALOID("asset-1"),
		SourceID:        source.ID,
		ExternalID:      "provider-video-7",
		RightsReference: "license:creator-owned",
		ReviewStatus:    ReviewApproved,
	}

	if !asset.CanPublish(source) {
		t.Fatal("approved asset from approved source was not publishable")
	}

	pending := asset
	pending.ReviewStatus = ReviewPending
	if pending.CanPublish(source) {
		t.Fatal("pending asset was publishable")
	}

	revoked := source
	revoked.Authorization = SourceRevoked
	if asset.CanPublish(revoked) {
		t.Fatal("asset from revoked source was publishable")
	}

	wrongSource := source
	wrongSource.ID = platform.HALOID("source-2")
	if asset.CanPublish(wrongSource) {
		t.Fatal("asset was publishable through a mismatched source record")
	}
}
