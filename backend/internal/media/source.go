package media

import (
	"errors"
	"net"
	"strings"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type SourceAuthorization string

const (
	SourcePending  SourceAuthorization = "pending"
	SourceApproved SourceAuthorization = "approved"
	SourceRejected SourceAuthorization = "rejected"
	SourceRevoked  SourceAuthorization = "revoked"
)

func (s SourceAuthorization) Valid() bool {
	switch s {
	case SourcePending, SourceApproved, SourceRejected, SourceRevoked:
		return true
	default:
		return false
	}
}

// MediaSource is HALO's canonical record for an external or creator-controlled
// media origin. Approval is explicit and independent of possession of a URL.
type MediaSource struct {
	ID            platform.HALOID
	Name          string
	Authorization SourceAuthorization
	AllowedHosts  []string
}

func (s MediaSource) Validate() error {
	if strings.TrimSpace(string(s.ID)) == "" {
		return errors.New("canonical media source id is required")
	}
	if strings.TrimSpace(s.Name) == "" {
		return errors.New("media source name is required")
	}
	if !s.Authorization.Valid() {
		return errors.New("media source authorization state is invalid")
	}
	if len(s.AllowedHosts) == 0 {
		return errors.New("media source requires at least one allowed host")
	}
	for _, host := range s.AllowedHosts {
		if !validAllowedHost(host) {
			return errors.New("media source contains an invalid or unsafe allowed host")
		}
	}
	return nil
}

// CanStageRemoteMedia is intentionally stricter than URL parsing. A source
// must be explicitly approved and the URL must satisfy the shared remote-media
// policy before it is eligible to enter the pending moderation pipeline.
func (s MediaSource) CanStageRemoteMedia(rawURL string) bool {
	if s.Authorization != SourceApproved || s.Validate() != nil {
		return false
	}
	return IsAllowedRemoteURL(rawURL, s.AllowedHosts)
}

func validAllowedHost(raw string) bool {
	host := strings.TrimSuffix(strings.ToLower(strings.TrimSpace(raw)), ".")
	if host == "" || strings.ContainsAny(host, "/:@*?#[]") {
		return false
	}
	if net.ParseIP(host) != nil {
		// Media origins are hostname based. This prevents configuration from
		// bypassing the IP-literal SSRF boundary and allows DNS checks to be
		// centralized in the fetcher layer.
		return false
	}
	if strings.HasPrefix(host, ".") || strings.Contains(host, "..") {
		return false
	}

	labels := strings.Split(host, ".")
	if len(labels) < 2 {
		return false
	}
	for _, label := range labels {
		if label == "" || len(label) > 63 || strings.HasPrefix(label, "-") || strings.HasSuffix(label, "-") {
			return false
		}
		for _, r := range label {
			if (r < 'a' || r > 'z') && (r < '0' || r > '9') && r != '-' {
				return false
			}
		}
	}
	return true
}
