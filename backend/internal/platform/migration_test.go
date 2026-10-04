package platform

import (
	"os"
	"strings"
	"testing"
)

func TestLiveNetworkMigrationSecurityAndOwnershipInvariants(t *testing.T) {
	data, err := os.ReadFile("../../migrations/002_live_network_core.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}

	sql := string(data)
	required := []string{
		"CREATE TABLE IF NOT EXISTS channels",
		"CREATE TABLE IF NOT EXISTS broadcasts",
		"CREATE TABLE IF NOT EXISTS stream_provider_sessions",
		"CREATE TABLE IF NOT EXISTS external_audience_references",
		"CREATE TABLE IF NOT EXISTS audit_events",
		"UNIQUE (creator_channel_id, provider, external_user_id)",
		"idempotency_key",
		"provider_key_ref",
		"TIMESTAMPTZ",
	}
	for _, fragment := range required {
		if !strings.Contains(sql, fragment) {
			t.Errorf("migration missing required invariant %q", fragment)
		}
	}

	forbidden := []string{
		"provider_token TEXT",
		"access_token TEXT",
		"refresh_token TEXT",
		"stream_key TEXT",
	}
	for _, fragment := range forbidden {
		if strings.Contains(sql, fragment) {
			t.Errorf("migration stores forbidden raw secret field %q", fragment)
		}
	}
}

func TestLiveNetworkMigrationUsesApplicationOwnedUUIDs(t *testing.T) {
	data, err := os.ReadFile("../../migrations/002_live_network_core.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}

	sql := string(data)
	if !strings.Contains(sql, "id UUID PRIMARY KEY") {
		t.Fatal("migration must use UUID primary keys for canonical live-network records")
	}
	if strings.Contains(sql, "provider_session_id UUID PRIMARY KEY") {
		t.Fatal("provider identifiers must not become canonical primary keys")
	}
}
