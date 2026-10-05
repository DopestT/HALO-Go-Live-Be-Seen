package livekit

import "testing"

func TestNewSDKRoomClientRejectsUnsafeConfiguration(t *testing.T) {
	tests := []struct {
		name      string
		serverURL string
		apiKey    string
		apiSecret string
	}{
		{name: "empty URL", serverURL: "", apiKey: "key", apiSecret: "secret"},
		{name: "http URL", serverURL: "http://livekit.example.com", apiKey: "key", apiSecret: "secret"},
		{name: "URL with userinfo", serverURL: "https://user:pass@livekit.example.com", apiKey: "key", apiSecret: "secret"},
		{name: "URL with path", serverURL: "https://livekit.example.com/admin", apiKey: "key", apiSecret: "secret"},
		{name: "empty key", serverURL: "https://livekit.example.com", apiKey: "", apiSecret: "secret"},
		{name: "empty secret", serverURL: "https://livekit.example.com", apiKey: "key", apiSecret: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := NewSDKRoomClient(tt.serverURL, tt.apiKey, tt.apiSecret); err == nil {
				t.Fatalf("NewSDKRoomClient(%q) accepted unsafe configuration", tt.serverURL)
			}
		})
	}
}

func TestNewSDKRoomClientAcceptsExplicitHTTPSConfiguration(t *testing.T) {
	client, err := NewSDKRoomClient(
		"https://livekit.example.com",
		"api-key",
		"api-secret-0123456789abcdef",
	)
	if err != nil {
		t.Fatalf("NewSDKRoomClient() error = %v", err)
	}
	if client == nil {
		t.Fatal("NewSDKRoomClient() returned nil client")
	}
}

func TestSDKRoomClientImplementsRoomClient(t *testing.T) {
	var _ RoomClient = (*SDKRoomClient)(nil)
}
