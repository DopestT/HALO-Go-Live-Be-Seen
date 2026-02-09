package config

import (
	"os"
	"testing"
)

func TestLoad(t *testing.T) {
	// Set required environment variables
	os.Setenv("DB_PASSWORD", "testpass")
	os.Setenv("JWT_SECRET_KEY", "test-secret-key")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	if cfg.Server.Port != "8080" {
		t.Errorf("Expected port 8080, got %s", cfg.Server.Port)
	}

	if cfg.Database.Password != "testpass" {
		t.Error("Database password not set correctly")
	}

	if cfg.JWT.SecretKey != "test-secret-key" {
		t.Error("JWT secret key not set correctly")
	}
}

func TestValidate(t *testing.T) {
	// Test missing password
	cfg := &Config{
		Database: DatabaseConfig{Password: ""},
		JWT:      JWTConfig{SecretKey: "test-key"},
	}

	err := cfg.validate()
	if err == nil {
		t.Error("Expected error for missing DB_PASSWORD")
	}

	// Test default JWT key
	cfg = &Config{
		Database: DatabaseConfig{Password: "test"},
		JWT:      JWTConfig{SecretKey: "your-secret-key-change-in-production"},
	}

	err = cfg.validate()
	if err == nil {
		t.Error("Expected error for default JWT_SECRET_KEY")
	}
}
