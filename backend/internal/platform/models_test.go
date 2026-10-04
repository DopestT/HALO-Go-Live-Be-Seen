package platform

import "testing"

func TestBroadcastStatusValidation(t *testing.T) {
	tests := []struct {
		name  string
		value BroadcastStatus
		valid bool
	}{
		{"scheduled", BroadcastScheduled, true},
		{"provisioning", BroadcastProvisioning, true},
		{"live", BroadcastLive, true},
		{"ending", BroadcastEnding, true},
		{"ended", BroadcastEnded, true},
		{"failed", BroadcastFailed, true},
		{"unknown", BroadcastStatus("unknown"), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.value.Valid(); got != tt.valid {
				t.Fatalf("Valid() = %v, want %v", got, tt.valid)
			}
		})
	}
}

func TestProviderSessionRequiresCanonicalIdentity(t *testing.T) {
	session := StreamProviderSession{
		ID:                HALOID("session-1"),
		BroadcastID:       HALOID("broadcast-1"),
		Provider:          "livekit",
		ProviderSessionID: ProviderID("LK-room-123"),
		Status:            ProviderSessionActive,
	}

	if err := session.Validate(); err != nil {
		t.Fatalf("Validate() returned unexpected error: %v", err)
	}

	withoutCanonicalID := session
	withoutCanonicalID.ID = ""
	if err := withoutCanonicalID.Validate(); err == nil {
		t.Fatal("Validate() accepted a provider session without a HALO canonical ID")
	}

	withoutProviderID := session
	withoutProviderID.ProviderSessionID = ""
	if err := withoutProviderID.Validate(); err == nil {
		t.Fatal("Validate() accepted an active provider session without a provider ID")
	}
}

func TestExternalAudienceReferenceDedupeKey(t *testing.T) {
	ref := ExternalAudienceReference{
		CreatorChannelID: HALOID("channel-7"),
		Provider:         "twitch",
		ExternalUserID:   "external-user-42",
	}

	got := ref.DedupeKey()
	want := "channel-7:twitch:external-user-42"
	if got != want {
		t.Fatalf("DedupeKey() = %q, want %q", got, want)
	}
}

func TestExternalAudienceReferenceRejectsMissingIdentityParts(t *testing.T) {
	cases := []ExternalAudienceReference{
		{Provider: "twitch", ExternalUserID: "user-1"},
		{CreatorChannelID: HALOID("channel-1"), ExternalUserID: "user-1"},
		{CreatorChannelID: HALOID("channel-1"), Provider: "twitch"},
	}

	for i, ref := range cases {
		if err := ref.Validate(); err == nil {
			t.Fatalf("case %d: Validate() accepted incomplete external audience identity", i)
		}
	}
}
