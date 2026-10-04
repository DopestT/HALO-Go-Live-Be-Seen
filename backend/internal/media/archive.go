package media

import (
	"errors"
	"strings"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

type RecordingStatus string

const (
	RecordingRequested  RecordingStatus = "requested"
	RecordingActive     RecordingStatus = "recording"
	RecordingProcessing RecordingStatus = "processing"
	RecordingReady      RecordingStatus = "ready"
	RecordingFailed     RecordingStatus = "failed"
	RecordingDeleted    RecordingStatus = "deleted"
)

func (s RecordingStatus) Valid() bool {
	switch s {
	case RecordingRequested, RecordingActive, RecordingProcessing, RecordingReady, RecordingFailed, RecordingDeleted:
		return true
	default:
		return false
	}
}

func (s RecordingStatus) CanTransitionTo(to RecordingStatus) bool {
	if !s.Valid() || !to.Valid() || s == to {
		return false
	}

	switch s {
	case RecordingRequested:
		return to == RecordingActive || to == RecordingFailed
	case RecordingActive:
		return to == RecordingProcessing || to == RecordingFailed
	case RecordingProcessing:
		return to == RecordingReady || to == RecordingFailed
	case RecordingReady:
		return to == RecordingDeleted
	case RecordingFailed:
		return to == RecordingRequested
	case RecordingDeleted:
		return false
	default:
		return false
	}
}

// Recording keeps HALO's canonical recording identity separate from any media
// provider's identifier. ObjectRef is an internal storage reference, not a
// public URL and must be exchanged for authorized playback separately.
type Recording struct {
	ID                  platform.HALOID
	BroadcastID         platform.HALOID
	Provider            string
	ProviderRecordingID platform.ProviderID
	ObjectRef           string
	Status              RecordingStatus
}

func (r Recording) Validate() error {
	if strings.TrimSpace(string(r.ID)) == "" {
		return errors.New("canonical recording id is required")
	}
	if strings.TrimSpace(string(r.BroadcastID)) == "" {
		return errors.New("canonical broadcast id is required")
	}
	if strings.TrimSpace(r.Provider) == "" {
		return errors.New("recording provider is required")
	}
	if !r.Status.Valid() {
		return errors.New("recording status is invalid")
	}
	if r.Status == RecordingReady && strings.TrimSpace(r.ObjectRef) == "" {
		return errors.New("ready recording requires an internal object reference")
	}
	return nil
}

type ClipRequest struct {
	RecordingID platform.HALOID
	StartMS     int64
	DurationMS  int64
}

func (c ClipRequest) ValidateAgainst(recording Recording) error {
	if recording.Validate() != nil {
		return errors.New("recording is invalid")
	}
	if recording.Status != RecordingReady {
		return errors.New("recording is not ready for clipping")
	}
	if strings.TrimSpace(string(c.RecordingID)) == "" || c.RecordingID != recording.ID {
		return errors.New("clip recording lineage does not match")
	}
	if c.StartMS < 0 {
		return errors.New("clip start must be non-negative")
	}
	if c.DurationMS <= 0 {
		return errors.New("clip duration must be positive")
	}
	return nil
}
