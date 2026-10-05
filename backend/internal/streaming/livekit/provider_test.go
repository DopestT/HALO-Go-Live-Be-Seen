package livekit

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type fakeRoomClient struct {
	createdRoom string
	deletedRoom string
	createErr   error
	deleteErr   error
}

func (f *fakeRoomClient) CreateRoom(_ context.Context, roomName string) error {
	f.createdRoom = roomName
	return f.createErr
}

func (f *fakeRoomClient) DeleteRoom(_ context.Context, roomName string) error {
	f.deletedRoom = roomName
	return f.deleteErr
}

func TestProviderProvisionUsesOpaqueCanonicalRoomName(t *testing.T) {
	client := &fakeRoomClient{}
	provider := NewProviderWithClient(client)
	broadcastID := platform.HALOID("550e8400-e29b-41d4-a716-446655440000")

	session, err := provider.ProvisionBroadcast(context.Background(), broadcastID)
	if err != nil {
		t.Fatalf("ProvisionBroadcast() error = %v", err)
	}

	want := "halo_broadcast_550e8400-e29b-41d4-a716-446655440000"
	if client.createdRoom != want {
		t.Fatalf("created room = %q; want %q", client.createdRoom, want)
	}
	if session.ProviderSessionID != platform.ProviderID(want) {
		t.Fatalf("provider session = %q; want %q", session.ProviderSessionID, want)
	}
	if provider.Name() != "livekit" {
		t.Fatalf("provider name = %q; want livekit", provider.Name())
	}
}

func TestProviderRejectsInvalidCanonicalID(t *testing.T) {
	provider := NewProviderWithClient(&fakeRoomClient{})
	if _, err := provider.ProvisionBroadcast(context.Background(), platform.HALOID("../../room")); err == nil {
		t.Fatal("ProvisionBroadcast() accepted unsafe canonical ID")
	}
}

func TestProviderEndDeletesOnlyHALORoom(t *testing.T) {
	client := &fakeRoomClient{}
	provider := NewProviderWithClient(client)
	sessionID := platform.ProviderID("halo_broadcast_550e8400-e29b-41d4-a716-446655440000")

	if err := provider.EndBroadcast(context.Background(), sessionID); err != nil {
		t.Fatalf("EndBroadcast() error = %v", err)
	}
	if client.deletedRoom != string(sessionID) {
		t.Fatalf("deleted room = %q; want %q", client.deletedRoom, sessionID)
	}

	if err := provider.EndBroadcast(context.Background(), platform.ProviderID("foreign-room")); err == nil {
		t.Fatal("EndBroadcast() accepted non-HALO provider room")
	}
}

func TestParticipantIdentityIsPseudonymousAndScopedToBroadcast(t *testing.T) {
	key := []byte("0123456789abcdef0123456789abcdef")
	a := ParticipantIdentity(key, platform.HALOID("550e8400-e29b-41d4-a716-446655440000"), 42)
	b := ParticipantIdentity(key, platform.HALOID("550e8400-e29b-41d4-a716-446655440001"), 42)
	a2 := ParticipantIdentity(key, platform.HALOID("550e8400-e29b-41d4-a716-446655440000"), 42)

	if a == "" || a != a2 {
		t.Fatalf("identity must be deterministic; got %q and %q", a, a2)
	}
	if a == b {
		t.Fatal("identity must differ across broadcasts")
	}
	if strings.Contains(a, "42") || strings.Contains(a, "550e8400") {
		t.Fatalf("identity leaks canonical identifiers: %q", a)
	}
}

func TestTokenPolicyIsShortLivedAndLeastPrivilege(t *testing.T) {
	policy := DefaultTokenPolicy()
	if policy.TTL <= 0 || policy.TTL > 10*time.Minute {
		t.Fatalf("token TTL = %s; want >0 and <=10m", policy.TTL)
	}
	if policy.ViewerCanPublish {
		t.Fatal("viewer policy allows publishing")
	}
	if !policy.ViewerCanSubscribe {
		t.Fatal("viewer policy must allow subscribing")
	}
	if !policy.PublisherCanPublish || !policy.PublisherCanSubscribe {
		t.Fatal("publisher policy must allow publish and subscribe")
	}
}
