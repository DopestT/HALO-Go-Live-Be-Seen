package livekit

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/streaming"
)

const roomPrefix = "halo_broadcast_"

var (
	canonicalIDPattern = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	ErrInvalidBroadcastID = errors.New("invalid HALO broadcast ID")
	ErrInvalidSessionID   = errors.New("invalid HALO LiveKit session ID")
)

// RoomClient is the deliberately small boundary HALO needs from a realtime
// room provider. The concrete LiveKit SDK adapter lives behind this interface.
type RoomClient interface {
	CreateRoom(ctx context.Context, roomName string) error
	DeleteRoom(ctx context.Context, roomName string) error
}

// Provider adapts a LiveKit room client to HALO's provider-independent
// streaming.Provider contract.
type Provider struct {
	client RoomClient
}

func NewProviderWithClient(client RoomClient) *Provider {
	return &Provider{client: client}
}

func (p *Provider) Name() string {
	return "livekit"
}

func (p *Provider) ProvisionBroadcast(ctx context.Context, broadcastID platform.HALOID) (streaming.ProvisionedSession, error) {
	roomName, err := roomNameForBroadcast(broadcastID)
	if err != nil {
		return streaming.ProvisionedSession{}, err
	}
	if p == nil || p.client == nil {
		return streaming.ProvisionedSession{}, errors.New("livekit room client is not configured")
	}
	if err := p.client.CreateRoom(ctx, roomName); err != nil {
		return streaming.ProvisionedSession{}, fmt.Errorf("create livekit room: %w", err)
	}

	return streaming.ProvisionedSession{
		ProviderSessionID: platform.ProviderID(roomName),
	}, nil
}

func (p *Provider) EndBroadcast(ctx context.Context, sessionID platform.ProviderID) error {
	roomName := string(sessionID)
	if !isHALORoomName(roomName) {
		return ErrInvalidSessionID
	}
	if p == nil || p.client == nil {
		return errors.New("livekit room client is not configured")
	}
	if err := p.client.DeleteRoom(ctx, roomName); err != nil {
		return fmt.Errorf("delete livekit room: %w", err)
	}
	return nil
}

func roomNameForBroadcast(broadcastID platform.HALOID) (string, error) {
	raw := strings.TrimSpace(string(broadcastID))
	if !canonicalIDPattern.MatchString(raw) {
		return "", ErrInvalidBroadcastID
	}
	return roomPrefix + strings.ToLower(raw), nil
}

func isHALORoomName(roomName string) bool {
	if !strings.HasPrefix(roomName, roomPrefix) {
		return false
	}
	return canonicalIDPattern.MatchString(strings.TrimPrefix(roomName, roomPrefix))
}

// ParticipantIdentity produces a deterministic, broadcast-scoped pseudonym
// for the realtime provider. It intentionally avoids sending HALO user IDs,
// usernames, email addresses, or the raw broadcast ID to the provider.
func ParticipantIdentity(key []byte, broadcastID platform.HALOID, userID int64) string {
	mac := hmac.New(sha256.New, key)
	_, _ = mac.Write([]byte(string(broadcastID)))
	_, _ = mac.Write([]byte{0})
	_, _ = mac.Write([]byte(strconv.FormatInt(userID, 10)))
	sum := mac.Sum(nil)
	return "p_" + base64.RawURLEncoding.EncodeToString(sum[:18])
}

// TokenPolicy defines HALO's provider-token safety envelope. Concrete token
// issuers must enforce these grants rather than trusting client-supplied roles.
type TokenPolicy struct {
	TTL                   time.Duration
	ViewerCanPublish      bool
	ViewerCanSubscribe    bool
	PublisherCanPublish   bool
	PublisherCanSubscribe bool
}

func DefaultTokenPolicy() TokenPolicy {
	return TokenPolicy{
		TTL:                   5 * time.Minute,
		ViewerCanPublish:      false,
		ViewerCanSubscribe:    true,
		PublisherCanPublish:   true,
		PublisherCanSubscribe: true,
	}
}

var _ streaming.Provider = (*Provider)(nil)
