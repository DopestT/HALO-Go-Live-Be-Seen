package media

import "testing"

func TestIsAllowedRemoteURL(t *testing.T) {
	tests := []struct {
		name    string
		rawURL  string
		hosts   []string
		allowed bool
	}{
		{name: "approved https host", rawURL: "https://media.example.com/video.mp4", hosts: []string{"example.com"}, allowed: true},
		{name: "approved subdomain", rawURL: "https://cdn.media.example.com/video.mp4", hosts: []string{"example.com"}, allowed: true},
		{name: "http rejected", rawURL: "http://media.example.com/video.mp4", hosts: []string{"example.com"}, allowed: false},
		{name: "foreign host rejected", rawURL: "https://evil.example.net/video.mp4", hosts: []string{"example.com"}, allowed: false},
		{name: "suffix confusion rejected", rawURL: "https://example.com.evil.test/video.mp4", hosts: []string{"example.com"}, allowed: false},
		{name: "userinfo confusion rejected", rawURL: "https://example.com@evil.test/video.mp4", hosts: []string{"example.com"}, allowed: false},
		{name: "loopback ipv4 rejected", rawURL: "https://127.0.0.1/video.mp4", hosts: []string{"127.0.0.1"}, allowed: false},
		{name: "private ipv4 rejected", rawURL: "https://10.1.2.3/video.mp4", hosts: []string{"10.1.2.3"}, allowed: false},
		{name: "link local ipv4 rejected", rawURL: "https://169.254.169.254/latest/meta-data", hosts: []string{"169.254.169.254"}, allowed: false},
		{name: "loopback ipv6 rejected", rawURL: "https://[::1]/video.mp4", hosts: []string{"::1"}, allowed: false},
		{name: "malformed rejected", rawURL: "://not-a-url", hosts: []string{"example.com"}, allowed: false},
		{name: "empty allowlist rejected", rawURL: "https://example.com/video.mp4", hosts: nil, allowed: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsAllowedRemoteURL(tt.rawURL, tt.hosts); got != tt.allowed {
				t.Fatalf("IsAllowedRemoteURL(%q) = %v; want %v", tt.rawURL, got, tt.allowed)
			}
		})
	}
}

func TestValidateRemoteMediaRequiresEvidence(t *testing.T) {
	input := RemoteMediaInput{
		MediaURL:       "https://media.example.com/video.mp4",
		ThumbnailURL:   "https://media.example.com/thumb.jpg",
		AllowedHosts:   []string{"example.com"},
		RightsReference: "",
	}

	if err := ValidateRemoteMedia(input); err == nil {
		t.Fatal("ValidateRemoteMedia() accepted media without rights evidence")
	}
}

func TestValidateRemoteMediaAcceptsApprovedInput(t *testing.T) {
	input := RemoteMediaInput{
		MediaURL:        "https://media.example.com/video.mp4",
		ThumbnailURL:    "https://media.example.com/thumb.jpg",
		AllowedHosts:    []string{"example.com"},
		RightsReference: "license:creator-upload-123",
	}

	if err := ValidateRemoteMedia(input); err != nil {
		t.Fatalf("ValidateRemoteMedia() error = %v", err)
	}
}
