package media

import (
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

func TestRecordingStatusTransitionsFailClosed(t *testing.T) {
	tests := []struct {
		from    RecordingStatus
		to      RecordingStatus
		allowed bool
	}{
		{RecordingRequested, RecordingActive, true},
		{RecordingRequested, RecordingFailed, true},
		{RecordingActive, RecordingProcessing, true},
		{RecordingActive, RecordingFailed, true},
		{RecordingProcessing, RecordingReady, true},
		{RecordingProcessing, RecordingFailed, true},
		{RecordingReady, RecordingDeleted, true},
		{RecordingFailed, RecordingRequested, true},
		{RecordingReady, RecordingProcessing, false},
		{RecordingDeleted, RecordingReady, false},
		{RecordingStatus("invented"), RecordingReady, false},
	}

	for _, tt := range tests {
		if got := tt.from.CanTransitionTo(tt.to); got != tt.allowed {
			t.Fatalf("recording transition %q -> %q = %v; want %v", tt.from, tt.to, got, tt.allowed)
		}
	}
}

func TestRecordingValidateKeepsProviderIdentityNonCanonical(t *testing.T) {
	recording := Recording{
		ID:                  platform.HALOID("recording-1"),
		BroadcastID:         platform.HALOID("broadcast-1"),
		Provider:            "livekit",
		ProviderRecordingID: platform.ProviderID("provider-recording-77"),
		ObjectRef:           "media/recordings/recording-1/master.mp4",
		Status:              RecordingReady,
	}

	if err := recording.Validate(); err != nil {
		t.Fatalf("Recording.Validate() error = %v", err)
	}
	if string(recording.ID) == string(recording.ProviderRecordingID) {
		t.Fatal("provider recording id became canonical HALO recording id")
	}

	recording.ID = ""
	if err := recording.Validate(); err == nil {
		t.Fatal("Recording.Validate() accepted missing canonical recording id")
	}
}

func TestClipRequestRequiresReadyRecordingAndValidRange(t *testing.T) {
	recording := Recording{
		ID:          platform.HALOID("recording-1"),
		BroadcastID: platform.HALOID("broadcast-1"),
		Provider:    "livekit",
		ObjectRef:   "media/recordings/recording-1/master.mp4",
		Status:      RecordingReady,
	}
	request := ClipRequest{
		RecordingID: recording.ID,
		StartMS:     1_000,
		DurationMS:  30_000,
	}
	if err := request.ValidateAgainst(recording); err != nil {
		t.Fatalf("ClipRequest.ValidateAgainst() error = %v", err)
	}

	processing := recording
	processing.Status = RecordingProcessing
	if err := request.ValidateAgainst(processing); err == nil {
		t.Fatal("clip request accepted a recording that is not ready")
	}

	wrong := request
	wrong.RecordingID = platform.HALOID("recording-2")
	if err := wrong.ValidateAgainst(recording); err == nil {
		t.Fatal("clip request accepted mismatched recording lineage")
	}

	badRange := request
	badRange.DurationMS = 0
	if err := badRange.ValidateAgainst(recording); err == nil {
		t.Fatal("clip request accepted zero duration")
	}
}
