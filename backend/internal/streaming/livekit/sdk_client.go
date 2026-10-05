package livekit

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"

	lksdk "github.com/livekit/server-sdk-go/v2"
	lkproto "github.com/livekit/protocol/livekit"
)

var ErrInvalidLiveKitConfig = errors.New("invalid LiveKit configuration")

// SDKRoomClient is the concrete LiveKit room-control adapter. HALO always
// supplies URL and credentials explicitly so runtime behavior never depends on
// ambient LIVEKIT_* environment variables inside the SDK.
type SDKRoomClient struct {
	api *lksdk.LiveKitAPI
}

func NewSDKRoomClient(rawURL, apiKey, apiSecret string) (*SDKRoomClient, error) {
	rawURL = strings.TrimSpace(rawURL)
	apiKey = strings.TrimSpace(apiKey)
	apiSecret = strings.TrimSpace(apiSecret)

	if rawURL == "" || apiKey == "" || apiSecret == "" {
		return nil, ErrInvalidLiveKitConfig
	}

	u, err := url.Parse(rawURL)
	if err != nil || u.Scheme != "https" || u.Host == "" || u.User != nil {
		return nil, ErrInvalidLiveKitConfig
	}
	if u.Path != "" || u.RawQuery != "" || u.Fragment != "" {
		return nil, ErrInvalidLiveKitConfig
	}

	api, err := lksdk.NewLiveKitAPI(
		lksdk.WithURL(rawURL),
		lksdk.WithAPIKey(apiKey, apiSecret),
	)
	if err != nil {
		return nil, fmt.Errorf("construct LiveKit API client: %w", err)
	}

	return &SDKRoomClient{api: api}, nil
}

func (c *SDKRoomClient) CreateRoom(ctx context.Context, roomName string) error {
	if c == nil || c.api == nil {
		return ErrInvalidLiveKitConfig
	}
	if !isHALORoomName(roomName) {
		return ErrInvalidSessionID
	}

	_, err := c.api.Room().CreateRoom(ctx, &lkproto.CreateRoomRequest{Name: roomName})
	if err != nil {
		return fmt.Errorf("livekit create room: %w", err)
	}
	return nil
}

func (c *SDKRoomClient) DeleteRoom(ctx context.Context, roomName string) error {
	if c == nil || c.api == nil {
		return ErrInvalidLiveKitConfig
	}
	if !isHALORoomName(roomName) {
		return ErrInvalidSessionID
	}

	_, err := c.api.Room().DeleteRoom(ctx, &lkproto.DeleteRoomRequest{Room: roomName})
	if err != nil {
		return fmt.Errorf("livekit delete room: %w", err)
	}
	return nil
}

var _ RoomClient = (*SDKRoomClient)(nil)
