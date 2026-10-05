package livekit

import (
	"errors"
	"strings"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
	"github.com/livekit/protocol/auth"
)

type JoinRole string

const (
	JoinRoleViewer    JoinRole = "viewer"
	JoinRolePublisher JoinRole = "publisher"
)

var (
	ErrInvalidTokenCredentials = errors.New("livekit token credentials are invalid")
	ErrWeakIdentityKey         = errors.New("livekit identity key must be at least 32 bytes")
	ErrInvalidJoinRole         = errors.New("invalid livekit join role")
)

type TokenIssuer struct {
	apiKey      string
	apiSecret   string
	identityKey []byte
	policy      TokenPolicy
}

func NewTokenIssuer(apiKey, apiSecret string, identityKey []byte) (*TokenIssuer, error) {
	apiKey = strings.TrimSpace(apiKey)
	apiSecret = strings.TrimSpace(apiSecret)
	if apiKey == "" || apiSecret == "" {
		return nil, ErrInvalidTokenCredentials
	}
	if len(identityKey) < 32 {
		return nil, ErrWeakIdentityKey
	}

	keyCopy := append([]byte(nil), identityKey...)
	return &TokenIssuer{
		apiKey:      apiKey,
		apiSecret:   apiSecret,
		identityKey: keyCopy,
		policy:      DefaultTokenPolicy(),
	}, nil
}

func (i *TokenIssuer) IssueJoinToken(broadcastID platform.HALOID, userID int64, role JoinRole) (string, error) {
	if i == nil {
		return "", ErrInvalidTokenCredentials
	}

	roomName, err := roomNameForBroadcast(broadcastID)
	if err != nil {
		return "", err
	}

	var canPublish bool
	switch role {
	case JoinRoleViewer:
		canPublish = i.policy.ViewerCanPublish
	case JoinRolePublisher:
		canPublish = i.policy.PublisherCanPublish
	default:
		return "", ErrInvalidJoinRole
	}

	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     roomName,
	}
	grant.SetCanPublish(canPublish)
	grant.SetCanSubscribe(true)
	grant.SetCanPublishData(false)
	grant.SetCanUpdateOwnMetadata(false)

	identity := ParticipantIdentity(i.identityKey, broadcastID, userID)
	return auth.NewAccessToken(i.apiKey, i.apiSecret).
		SetVideoGrant(grant).
		SetIdentity(identity).
		SetValidFor(i.policy.TTL).
		ToJWT()
}
