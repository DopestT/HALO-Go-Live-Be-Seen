package media

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

var (
	ErrReviewForbidden         = errors.New("media review action is forbidden")
	ErrInvalidReviewTransition = errors.New("media review transition is invalid")
	ErrSourceNotApproved       = errors.New("media source is not approved")
)

type ReviewOutcome string

const (
	ReviewOutcomeDenied    ReviewOutcome = "denied"
	ReviewOutcomeSucceeded ReviewOutcome = "succeeded"
)

type ReviewActor struct {
	UserID int64
}

type ReviewRequest struct {
	AssetID platform.HALOID
	To      ReviewStatus
	Reason  string
}

type ReviewAuditEvent struct {
	ActorUserID int64
	AssetID     platform.HALOID
	SourceID    platform.HALOID
	From        ReviewStatus
	To          ReviewStatus
	Reason      string
	Outcome     ReviewOutcome
}

type ReviewWrite struct {
	Before StagedMedia
	After  StagedMedia
	Audit  ReviewAuditEvent
}

type ReviewStore interface {
	GetMediaSource(ctx context.Context, sourceID platform.HALOID) (MediaSource, error)
	GetStagedMedia(ctx context.Context, assetID platform.HALOID) (StagedMedia, error)
	ApplyReviewWithAudit(ctx context.Context, write ReviewWrite) error
}

type ReviewAuditLog interface {
	Append(ctx context.Context, event ReviewAuditEvent) error
}

type ReviewAuthorizer interface {
	CanReviewMedia(ctx context.Context, actor ReviewActor, source MediaSource) bool
}

type ReviewService struct {
	store      ReviewStore
	audit      ReviewAuditLog
	authorizer ReviewAuthorizer
}

func NewReviewService(store ReviewStore, audit ReviewAuditLog, authorizer ReviewAuthorizer) *ReviewService {
	return &ReviewService{store: store, audit: audit, authorizer: authorizer}
}

func (s *ReviewService) Review(ctx context.Context, actor ReviewActor, request ReviewRequest) error {
	if s == nil || s.store == nil || s.audit == nil || s.authorizer == nil {
		return errors.New("media review service is not configured")
	}
	if actor.UserID <= 0 {
		return errors.New("review actor user id is required")
	}
	if strings.TrimSpace(string(request.AssetID)) == "" {
		return errors.New("review asset id is required")
	}
	if !request.To.Valid() {
		return errors.New("review target status is invalid")
	}
	reason := strings.TrimSpace(request.Reason)
	if reason == "" {
		return errors.New("review reason is required")
	}

	asset, err := s.store.GetStagedMedia(ctx, request.AssetID)
	if err != nil {
		return fmt.Errorf("load staged media: %w", err)
	}
	if err := asset.Validate(); err != nil {
		return fmt.Errorf("validate staged media: %w", err)
	}

	source, err := s.store.GetMediaSource(ctx, asset.SourceID)
	if err != nil {
		return fmt.Errorf("load media source: %w", err)
	}
	if err := source.Validate(); err != nil {
		return fmt.Errorf("validate media source: %w", err)
	}

	if !s.authorizer.CanReviewMedia(ctx, actor, source) {
		event := reviewAudit(actor, asset, request.To, reason, ReviewOutcomeDenied)
		if err := s.audit.Append(ctx, event); err != nil {
			return fmt.Errorf("record denied media review: %w", err)
		}
		return ErrReviewForbidden
	}

	if !asset.ReviewStatus.CanTransitionTo(request.To) {
		return ErrInvalidReviewTransition
	}

	if request.To == ReviewApproved {
		if source.ID != asset.SourceID || source.Authorization != SourceApproved {
			return ErrSourceNotApproved
		}
	}

	after := asset
	after.ReviewStatus = request.To

	write := ReviewWrite{
		Before: asset,
		After:  after,
		Audit:  reviewAudit(actor, asset, request.To, reason, ReviewOutcomeSucceeded),
	}
	if err := s.store.ApplyReviewWithAudit(ctx, write); err != nil {
		return fmt.Errorf("apply media review atomically: %w", err)
	}
	return nil
}

func reviewAudit(actor ReviewActor, asset StagedMedia, to ReviewStatus, reason string, outcome ReviewOutcome) ReviewAuditEvent {
	return ReviewAuditEvent{
		ActorUserID: actor.UserID,
		AssetID:     asset.ID,
		SourceID:    asset.SourceID,
		From:        asset.ReviewStatus,
		To:          to,
		Reason:      reason,
		Outcome:     outcome,
	}
}
