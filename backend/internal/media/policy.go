package media

import (
	"errors"
	"net"
	"net/url"
	"strings"
)

var (
	ErrInvalidMediaURL      = errors.New("media URL is not permitted")
	ErrInvalidThumbnailURL  = errors.New("thumbnail URL is not permitted")
	ErrMissingRightsEvidence = errors.New("rights evidence is required")
)

// RemoteMediaInput contains only the policy inputs needed to decide whether
// remote media is eligible to enter HALO's staging pipeline. Passing this
// validation does not publish the asset and does not authorize a network fetch.
type RemoteMediaInput struct {
	MediaURL        string
	ThumbnailURL    string
	AllowedHosts    []string
	RightsReference string
}

// IsAllowedRemoteURL validates the static URL policy for a remote media target.
// Fetchers must additionally re-resolve DNS, re-check resolved addresses on
// every redirect, enforce egress controls, and apply response size/time limits.
func IsAllowedRemoteURL(rawURL string, allowedHosts []string) bool {
	if strings.TrimSpace(rawURL) == "" || len(allowedHosts) == 0 {
		return false
	}

	u, err := url.Parse(rawURL)
	if err != nil || u.Scheme != "https" || u.Host == "" || u.User != nil {
		return false
	}

	host := strings.TrimSuffix(strings.ToLower(u.Hostname()), ".")
	if host == "" {
		return false
	}

	if ip := net.ParseIP(host); ip != nil && isUnsafeIP(ip) {
		return false
	}

	for _, allowedHost := range allowedHosts {
		normalized := strings.TrimSuffix(strings.ToLower(strings.TrimSpace(allowedHost)), ".")
		if normalized == "" {
			continue
		}

		// Never allow a configured private/link-local/loopback IP literal to
		// override the SSRF boundary.
		if ip := net.ParseIP(normalized); ip != nil && isUnsafeIP(ip) {
			continue
		}

		if host == normalized || strings.HasSuffix(host, "."+normalized) {
			return true
		}
	}

	return false
}

func ValidateRemoteMedia(input RemoteMediaInput) error {
	if strings.TrimSpace(input.RightsReference) == "" {
		return ErrMissingRightsEvidence
	}
	if !IsAllowedRemoteURL(input.MediaURL, input.AllowedHosts) {
		return ErrInvalidMediaURL
	}
	if strings.TrimSpace(input.ThumbnailURL) != "" && !IsAllowedRemoteURL(input.ThumbnailURL, input.AllowedHosts) {
		return ErrInvalidThumbnailURL
	}
	return nil
}

func isUnsafeIP(ip net.IP) bool {
	return ip.IsLoopback() ||
		ip.IsPrivate() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() ||
		ip.IsUnspecified() ||
		ip.IsMulticast()
}
