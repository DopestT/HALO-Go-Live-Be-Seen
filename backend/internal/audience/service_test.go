package audience

import (
	"context"
	"errors"
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type fakeStore struct {
	refs           map[string]Reference
	claims         []Claim
	follows        []Follow
	matching       []Reference
	upsertFailures error
}

func newFakeStore() *fakeStore { return &fakeStore{refs: map[string]Reference{}} }

func (s *fakeStore) UpsertReference(_ context.Context, ref Reference) (bool, error) {
	if s.upsertFailures != nil {
		return false, s.upsertFailures
	}
	key := string(ref.CreatorChannelID) + ":" + ref.Provider + ":" + ref.ExternalUserID
	if _, exists := s.refs[key]; exists {
		return false, nil
	}
	s.refs[key] = ref
	return true, nil
}

func (s *fakeStore) MatchingReferences(context.Context, string, string) ([]Reference, error) {
	return append([]Reference(nil), s.matching...), nil
}

func (s *fakeStore) SaveClaim(_ context.Context, claim Claim) error {
	s.claims = append(s.claims, claim)
	return nil
}

func (s *fakeStore) CreateFollow(_ context.Context, follow Follow) error {
	s.follows = append(s.follows, follow)
	return nil
}

func TestImportReferencesDeduplicatesWithoutCreatingHALOUsers(t *testing.T) {
	store := newFakeStore()
	service := NewService(store)
	request := ImportRequest{
		CreatorChannelID: platform.HALOID("channel-1"),
		Provider:         "twitch",
		Relationships: []ImportedRelationship{
			{ExternalUserID: "fan-7", RelationshipType: "follower"},
			{ExternalUserID: "fan-7", RelationshipType: "follower"},
		},
	}

	result, err := service.ImportReferences(context.Background(), request)
	if err != nil {
		t.Fatalf("ImportReferences() error = %v", err)
	}
	if result.Imported != 1 || result.Deduplicated != 1 {
		t.Fatalf("result = %+v, want imported=1 deduplicated=1", result)
	}
	if len(store.refs) != 1 {
		t.Fatalf("stored refs = %d, want 1", len(store.refs))
	}
	for _, ref := range store.refs {
		if ref.ClaimedHALOUserID != 0 {
			t.Fatal("import silently created or claimed a HALO user")
		}
	}
}

func TestProposeClaimsDoesNotMutateFollowOrClaimState(t *testing.T) {
	store := newFakeStore()
	store.matching = []Reference{{
		ID:               platform.HALOID("audref-1"),
		CreatorChannelID: platform.HALOID("channel-9"),
		Provider:         "youtube",
		ExternalUserID:   "yt-user-2",
		RelationshipType: "subscriber",
	}}
	service := NewService(store)

	suggestions, err := service.ProposeClaims(context.Background(), VerifiedExternalIdentity{
		HALOUserID:     42,
		Provider:       "youtube",
		ExternalUserID: "yt-user-2",
	})
	if err != nil {
		t.Fatalf("ProposeClaims() error = %v", err)
	}
	if len(suggestions) != 1 || suggestions[0].CreatorChannelID != platform.HALOID("channel-9") {
		t.Fatalf("suggestions = %+v", suggestions)
	}
	if len(store.claims) != 0 || len(store.follows) != 0 {
		t.Fatal("claim proposal mutated state without explicit consent")
	}
}

func TestAcceptClaimRequiresExplicitFollowConsent(t *testing.T) {
	store := newFakeStore()
	service := NewService(store)
	suggestion := ClaimSuggestion{
		ReferenceID:      platform.HALOID("audref-1"),
		CreatorChannelID: platform.HALOID("channel-9"),
		RelationshipType: "follower",
	}

	err := service.AcceptClaim(context.Background(), ClaimConsent{
		HALOUserID: 42,
		Suggestion: suggestion,
		Follow:     false,
	})
	if !errors.Is(err, ErrExplicitConsentRequired) {
		t.Fatalf("AcceptClaim() error = %v, want ErrExplicitConsentRequired", err)
	}
	if len(store.claims) != 0 || len(store.follows) != 0 {
		t.Fatal("claim accepted or follow created without consent")
	}
}

func TestAcceptClaimWithConsentPersistsClaimAndFollow(t *testing.T) {
	store := newFakeStore()
	service := NewService(store)
	suggestion := ClaimSuggestion{
		ReferenceID:      platform.HALOID("audref-1"),
		CreatorChannelID: platform.HALOID("channel-9"),
		RelationshipType: "follower",
	}

	err := service.AcceptClaim(context.Background(), ClaimConsent{
		HALOUserID: 42,
		Suggestion: suggestion,
		Follow:     true,
	})
	if err != nil {
		t.Fatalf("AcceptClaim() error = %v", err)
	}
	if len(store.claims) != 1 || len(store.follows) != 1 {
		t.Fatalf("claims=%d follows=%d, want 1/1", len(store.claims), len(store.follows))
	}
	if store.follows[0].ChannelID != platform.HALOID("channel-9") || store.follows[0].UserID != 42 {
		t.Fatalf("follow = %+v", store.follows[0])
	}
}
