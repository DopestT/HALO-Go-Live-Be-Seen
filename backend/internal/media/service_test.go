package media

import (
	"context"
	"errors"
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type fakeReviewAuthorizer struct {
	allowed bool
}

func (f fakeReviewAuthorizer) CanReviewMedia(context.Context, ReviewActor, MediaSource) bool {
	return f.allowed
}

type fakeReviewStore struct {
	source     MediaSource
	asset      StagedMedia
	write      ReviewWrite
	writeCalls int
}

func (f *fakeReviewStore) GetMediaSource(context.Context, platform.HALOID) (MediaSource, error) {
	return f.source, nil
}

func (f *fakeReviewStore) GetStagedMedia(context.Context, platform.HALOID) (StagedMedia, error) {
	return f.asset, nil
}

func (f *fakeReviewStore) ApplyReviewWithAudit(_ context.Context, write ReviewWrite) error {
	f.write = write
	f.writeCalls++
	return nil
}

type fakeReviewAudit struct {
	events []ReviewAuditEvent
}

func (f *fakeReviewAudit) Append(_ context.Context, event ReviewAuditEvent) error {
	f.events = append(f.events, event)
	return nil
}

func approvedReviewFixture() (MediaSource, StagedMedia) {
	source := MediaSource{
		ID:            platform.HALOID("source-1"),
		Name:          "Creator CDN",
		Authorization: SourceApproved,
		AllowedHosts:  []string{"example.com"},
	}
	asset := StagedMedia{
		ID:              platform.HALOID("asset-1"),
		SourceID:        source.ID,
		ExternalID:      "provider-asset-1",
		RightsReference: "license:creator-owned",
		ReviewStatus:    ReviewPending,
	}
	return source, asset
}

func TestReviewServiceDeniesUnauthorizedActorWithoutMutation(t *testing.T) {
	source, asset := approvedReviewFixture()
	store := &fakeReviewStore{source: source, asset: asset}
	audit := &fakeReviewAudit{}
	service := NewReviewService(store, audit, fakeReviewAuthorizer{allowed: false})

	err := service.Review(context.Background(), ReviewActor{UserID: 77}, ReviewRequest{
		AssetID: asset.ID,
		To:      ReviewApproved,
		Reason:  "rights verified",
	})
	if !errors.Is(err, ErrReviewForbidden) {
		t.Fatalf("Review() error = %v; want ErrReviewForbidden", err)
	}
	if store.writeCalls != 0 {
		t.Fatalf("unauthorized review mutated durable state %d time(s)", store.writeCalls)
	}
	if len(audit.events) != 1 || audit.events[0].Outcome != ReviewOutcomeDenied {
		t.Fatalf("denied attempt audit = %#v; want one denied event", audit.events)
	}
}

func TestReviewServiceApprovesAtomicallyWithBeforeAfterAudit(t *testing.T) {
	source, asset := approvedReviewFixture()
	store := &fakeReviewStore{source: source, asset: asset}
	audit := &fakeReviewAudit{}
	service := NewReviewService(store, audit, fakeReviewAuthorizer{allowed: true})

	err := service.Review(context.Background(), ReviewActor{UserID: 77}, ReviewRequest{
		AssetID: asset.ID,
		To:      ReviewApproved,
		Reason:  "rights verified",
	})
	if err != nil {
		t.Fatalf("Review() error = %v", err)
	}
	if store.writeCalls != 1 {
		t.Fatalf("review write calls = %d; want 1", store.writeCalls)
	}
	if store.write.Before.ReviewStatus != ReviewPending || store.write.After.ReviewStatus != ReviewApproved {
		t.Fatalf("review transition = %q -> %q; want pending -> approved", store.write.Before.ReviewStatus, store.write.After.ReviewStatus)
	}
	if store.write.Audit.ActorUserID != 77 || store.write.Audit.Reason != "rights verified" || store.write.Audit.Outcome != ReviewOutcomeSucceeded {
		t.Fatalf("atomic audit = %#v", store.write.Audit)
	}
	if len(audit.events) != 0 {
		t.Fatal("successful atomic review also wrote a separate non-atomic audit event")
	}
}

func TestReviewServiceRefusesApprovalWhenSourceIsRevoked(t *testing.T) {
	source, asset := approvedReviewFixture()
	source.Authorization = SourceRevoked
	store := &fakeReviewStore{source: source, asset: asset}
	service := NewReviewService(store, &fakeReviewAudit{}, fakeReviewAuthorizer{allowed: true})

	err := service.Review(context.Background(), ReviewActor{UserID: 77}, ReviewRequest{
		AssetID: asset.ID,
		To:      ReviewApproved,
		Reason:  "approve",
	})
	if !errors.Is(err, ErrSourceNotApproved) {
		t.Fatalf("Review() error = %v; want ErrSourceNotApproved", err)
	}
	if store.writeCalls != 0 {
		t.Fatal("revoked source approval mutated durable state")
	}
}

func TestReviewServiceRejectsImpossibleTransitionBeforeWrite(t *testing.T) {
	source, asset := approvedReviewFixture()
	asset.ReviewStatus = ReviewApproved
	store := &fakeReviewStore{source: source, asset: asset}
	service := NewReviewService(store, &fakeReviewAudit{}, fakeReviewAuthorizer{allowed: true})

	err := service.Review(context.Background(), ReviewActor{UserID: 77}, ReviewRequest{
		AssetID: asset.ID,
		To:      ReviewPending,
		Reason:  "try to rewind approved state",
	})
	if !errors.Is(err, ErrInvalidReviewTransition) {
		t.Fatalf("Review() error = %v; want ErrInvalidReviewTransition", err)
	}
	if store.writeCalls != 0 {
		t.Fatal("invalid transition mutated durable state")
	}
}

func TestReviewServiceRequiresReasonAndActor(t *testing.T) {
	source, asset := approvedReviewFixture()
	store := &fakeReviewStore{source: source, asset: asset}
	service := NewReviewService(store, &fakeReviewAudit{}, fakeReviewAuthorizer{allowed: true})

	for _, request := range []struct {
		actor  ReviewActor
		reason string
	}{
		{actor: ReviewActor{UserID: 0}, reason: "valid"},
		{actor: ReviewActor{UserID: 77}, reason: ""},
	} {
		err := service.Review(context.Background(), request.actor, ReviewRequest{
			AssetID: asset.ID,
			To:      ReviewApproved,
			Reason:  request.reason,
		})
		if err == nil {
			t.Fatal("Review() accepted missing actor or reason")
		}
	}
	if store.writeCalls != 0 {
		t.Fatal("invalid review request mutated durable state")
	}
}
