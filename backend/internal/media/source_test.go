package media

import (
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

func TestMediaSourceValidateRequiresCanonicalIdentity(t *testing.T) {
	source := MediaSource{
		ID:            platform.HALOID(""),
		Name:          "Authorized Creator CDN",
		Authorization: SourceApproved,
		AllowedHosts:  []string{"media.example.com"},
	}

	if err := source.Validate(); err == nil {
		t.Fatal("MediaSource.Validate() accepted an empty canonical id")
	}
}

func TestMediaSourceValidateRejectsUnsafeAllowlistEntries(t *testing.T) {
	for _, host := range []string{
		"127.0.0.1",
		"10.0.0.8",
		"169.254.169.254",
		"https://media.example.com",
		"*.example.com",
		"example.com/path",
	} {
		t.Run(host, func(t *testing.T) {
			source := MediaSource{
				ID:            platform.HALOID("source-1"),
				Name:          "Source",
				Authorization: SourceApproved,
				AllowedHosts:  []string{host},
			}
			if err := source.Validate(); err == nil {
				t.Fatalf("MediaSource.Validate() accepted unsafe allowlist host %q", host)
			}
		})
	}
}

func TestMediaSourceCanStageRemoteMediaOnlyWhenApproved(t *testing.T) {
	approved := MediaSource{
		ID:            platform.HALOID("source-approved"),
		Name:          "Authorized Creator CDN",
		Authorization: SourceApproved,
		AllowedHosts:  []string{"example.com"},
	}
	pending := approved
	pending.ID = platform.HALOID("source-pending")
	pending.Authorization = SourcePending

	const mediaURL = "https://media.example.com/video.mp4"
	if !approved.CanStageRemoteMedia(mediaURL) {
		t.Fatal("approved source could not stage allowlisted media")
	}
	if pending.CanStageRemoteMedia(mediaURL) {
		t.Fatal("pending source was allowed to stage remote media")
	}
}

func TestMediaSourceValidateRejectsUnknownAuthorizationState(t *testing.T) {
	source := MediaSource{
		ID:            platform.HALOID("source-1"),
		Name:          "Source",
		Authorization: SourceAuthorization("invented"),
		AllowedHosts:  []string{"example.com"},
	}
	if err := source.Validate(); err == nil {
		t.Fatal("MediaSource.Validate() accepted unknown authorization state")
	}
}
