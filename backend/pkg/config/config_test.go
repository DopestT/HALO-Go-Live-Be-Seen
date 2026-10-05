package config

import (
	"os"
	"strings"
	"testing"
)

func setBaseTestEnv(t *testing.T) {
	t.Helper()
	keys := []string{
		"APP_ENV", "DB_PASSWORD", "DB_SSL_MODE", "DB_SSL_ROOT_CERT",
		"JWT_SECRET_KEY", "CORS_ALLOWED_ORIGINS", "RATE_LIMIT_RPS", "RATE_LIMIT_BURST",
	}
	for _, key := range keys {
		original, ok := os.LookupEnv(key)
		key := key
		if ok {
			t.Cleanup(func() { _ = os.Setenv(key, original) })
		} else {
			t.Cleanup(func() { _ = os.Unsetenv(key) })
		}
	}
	_ = os.Setenv("DB_PASSWORD", "testpass")
	_ = os.Setenv("JWT_SECRET_KEY", "0123456789abcdef0123456789abcdef")
}

func TestLoadDevelopmentDefaults(t *testing.T) {
	setBaseTestEnv(t)
	_ = os.Setenv("APP_ENV", "development")
	_ = os.Unsetenv("DB_SSL_MODE")
	_ = os.Unsetenv("CORS_ALLOWED_ORIGINS")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Environment != "development" {
		t.Fatalf("Environment = %q; want development", cfg.Environment)
	}
	if cfg.Database.SSLMode != "disable" {
		t.Fatalf("development SSL mode = %q; want disable", cfg.Database.SSLMode)
	}
	if cfg.CORS.AllowedOrigins != "*" {
		t.Fatalf("development CORS = %q; want *", cfg.CORS.AllowedOrigins)
	}
}

func TestProductionRejectsWildcardCORS(t *testing.T) {
	setBaseTestEnv(t)
	_ = os.Setenv("APP_ENV", "production")
	_ = os.Setenv("DB_SSL_MODE", "verify-full")
	_ = os.Setenv("CORS_ALLOWED_ORIGINS", "*")

	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "CORS") {
		t.Fatalf("Load() error = %v; want production CORS rejection", err)
	}
}

func TestProductionRejectsNonHTTPSOrigin(t *testing.T) {
	setBaseTestEnv(t)
	_ = os.Setenv("APP_ENV", "production")
	_ = os.Setenv("DB_SSL_MODE", "verify-full")
	_ = os.Setenv("CORS_ALLOWED_ORIGINS", "http://halo.example.com")

	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "HTTPS") {
		t.Fatalf("Load() error = %v; want non-HTTPS origin rejection", err)
	}
}

func TestProductionRequiresVerifyFullDatabaseTLS(t *testing.T) {
	setBaseTestEnv(t)
	_ = os.Setenv("APP_ENV", "production")
	_ = os.Setenv("DB_SSL_MODE", "disable")
	_ = os.Setenv("CORS_ALLOWED_ORIGINS", "https://halo.example.com")

	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "DB_SSL_MODE") {
		t.Fatalf("Load() error = %v; want database TLS rejection", err)
	}
}

func TestProductionRequiresStrongJWTSecret(t *testing.T) {
	setBaseTestEnv(t)
	_ = os.Setenv("APP_ENV", "production")
	_ = os.Setenv("DB_SSL_MODE", "verify-full")
	_ = os.Setenv("CORS_ALLOWED_ORIGINS", "https://halo.example.com")
	_ = os.Setenv("JWT_SECRET_KEY", "too-short")

	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "JWT_SECRET_KEY") {
		t.Fatalf("Load() error = %v; want weak JWT secret rejection", err)
	}
}

func TestDatabaseDSNUsesTLSSettings(t *testing.T) {
	cfg := DatabaseConfig{
		Host: "db.internal",
		Port: "5432",
		User: "halo",
		Password: "secret",
		DBName: "halo",
		SSLMode: "verify-full",
		SSLRootCert: "/run/secrets/halo-db-ca.pem",
	}
	dsn := cfg.GetDSN()
	for _, expected := range []string{"sslmode=verify-full", "sslrootcert=/run/secrets/halo-db-ca.pem"} {
		if !strings.Contains(dsn, expected) {
			t.Fatalf("DSN %q missing %q", dsn, expected)
		}
	}
}

func TestProductionRateLimitsAreBounded(t *testing.T) {
	setBaseTestEnv(t)
	_ = os.Setenv("APP_ENV", "production")
	_ = os.Setenv("DB_SSL_MODE", "verify-full")
	_ = os.Setenv("CORS_ALLOWED_ORIGINS", "https://halo.example.com")
	_ = os.Setenv("RATE_LIMIT_RPS", "1001")
	_ = os.Setenv("RATE_LIMIT_BURST", "2000")

	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "RATE_LIMIT") {
		t.Fatalf("Load() error = %v; want unsafe rate limit rejection", err)
	}
}
