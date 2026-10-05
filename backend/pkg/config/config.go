package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

const (
	defaultRateLimitRPS   = 100
	defaultRateLimitBurst = 200
	maxProductionRPS      = 500
	maxProductionBurst    = 1000
)

// Config holds all application configuration.
type Config struct {
	Environment string
	Server      ServerConfig
	Database    DatabaseConfig
	Redis       RedisConfig
	JWT         JWTConfig
	CORS        CORSConfig
}

// ServerConfig holds server-related configuration.
type ServerConfig struct {
	Port           string
	ReadTimeout    int
	WriteTimeout   int
	IdleTimeout    int
	RateLimitRPS   int
	RateLimitBurst int
}

// DatabaseConfig holds PostgreSQL configuration.
type DatabaseConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	DBName          string
	SSLMode         string
	SSLRootCert     string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int
}

// RedisConfig holds Redis configuration.
type RedisConfig struct {
	Host         string
	Port         string
	Password     string
	DB           int
	PoolSize     int
	MinIdleConns int
}

// JWTConfig holds JWT configuration.
type JWTConfig struct {
	SecretKey       string
	ExpirationHours int
}

// CORSConfig holds CORS configuration.
type CORSConfig struct {
	AllowedOrigins string
}

// Load loads configuration from environment variables.
func Load() (*Config, error) {
	environment := strings.ToLower(strings.TrimSpace(getEnv("APP_ENV", "development")))

	config := &Config{
		Environment: environment,
		Server: ServerConfig{
			Port:           getEnv("SERVER_PORT", "8080"),
			ReadTimeout:    getEnvAsInt("SERVER_READ_TIMEOUT", 10),
			WriteTimeout:   getEnvAsInt("SERVER_WRITE_TIMEOUT", 10),
			IdleTimeout:    getEnvAsInt("SERVER_IDLE_TIMEOUT", 120),
			RateLimitRPS:   getEnvAsInt("RATE_LIMIT_RPS", defaultRateLimitRPS),
			RateLimitBurst: getEnvAsInt("RATE_LIMIT_BURST", defaultRateLimitBurst),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "5432"),
			User:            getEnv("DB_USER", "postgres"),
			Password:        getEnv("DB_PASSWORD", ""),
			DBName:          getEnv("DB_NAME", "halo"),
			SSLMode:         strings.ToLower(strings.TrimSpace(getEnv("DB_SSL_MODE", "disable"))),
			SSLRootCert:     strings.TrimSpace(getEnv("DB_SSL_ROOT_CERT", "")),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 100),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 10),
			ConnMaxLifetime: getEnvAsInt("DB_CONN_MAX_LIFETIME", 3600),
		},
		Redis: RedisConfig{
			Host:         getEnv("REDIS_HOST", "localhost"),
			Port:         getEnv("REDIS_PORT", "6379"),
			Password:     getEnv("REDIS_PASSWORD", ""),
			DB:           getEnvAsInt("REDIS_DB", 0),
			PoolSize:     getEnvAsInt("REDIS_POOL_SIZE", 100),
			MinIdleConns: getEnvAsInt("REDIS_MIN_IDLE_CONNS", 10),
		},
		JWT: JWTConfig{
			SecretKey:       getEnv("JWT_SECRET_KEY", "your-secret-key-change-in-production"),
			ExpirationHours: getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
		},
		CORS: CORSConfig{
			AllowedOrigins: strings.TrimSpace(getEnv("CORS_ALLOWED_ORIGINS", "*")),
		},
	}

	if err := config.validate(); err != nil {
		return nil, err
	}

	return config, nil
}

// validate checks security-sensitive configuration before the server starts.
func (c *Config) validate() error {
	switch c.Environment {
	case "development", "test", "staging", "production":
	default:
		return fmt.Errorf("APP_ENV must be one of development, test, staging, or production")
	}

	if strings.TrimSpace(c.Database.Password) == "" {
		return fmt.Errorf("DB_PASSWORD is required")
	}
	if c.Server.RateLimitRPS <= 0 || c.Server.RateLimitBurst <= 0 || c.Server.RateLimitBurst < c.Server.RateLimitRPS {
		return fmt.Errorf("RATE_LIMIT_RPS and RATE_LIMIT_BURST must be positive and burst must be at least RPS")
	}

	if c.Environment != "production" {
		if strings.TrimSpace(c.JWT.SecretKey) == "" {
			return fmt.Errorf("JWT_SECRET_KEY is required")
		}
		return nil
	}

	if len([]byte(c.JWT.SecretKey)) < 32 || c.JWT.SecretKey == "your-secret-key-change-in-production" {
		return fmt.Errorf("JWT_SECRET_KEY must be at least 32 bytes in production")
	}
	if c.Database.SSLMode != "verify-full" {
		return fmt.Errorf("DB_SSL_MODE must be verify-full in production")
	}
	if c.Server.RateLimitRPS > maxProductionRPS || c.Server.RateLimitBurst > maxProductionBurst {
		return fmt.Errorf("RATE_LIMIT_RPS or RATE_LIMIT_BURST exceeds the production safety ceiling")
	}
	if err := validateProductionOrigins(c.CORS.AllowedOrigins); err != nil {
		return err
	}
	return nil
}

func validateProductionOrigins(raw string) error {
	if raw == "" || raw == "*" {
		return fmt.Errorf("CORS_ALLOWED_ORIGINS must contain explicit HTTPS origins in production")
	}

	for _, item := range strings.Split(raw, ",") {
		origin := strings.TrimSpace(item)
		if origin == "" || origin == "*" {
			return fmt.Errorf("CORS_ALLOWED_ORIGINS cannot contain a wildcard in production")
		}

		u, err := url.Parse(origin)
		if err != nil || u.Scheme != "https" || u.Host == "" {
			return fmt.Errorf("CORS_ALLOWED_ORIGINS must contain HTTPS origins only")
		}
		if u.User != nil || u.Path != "" || u.RawQuery != "" || u.Fragment != "" {
			return fmt.Errorf("CORS_ALLOWED_ORIGINS entries must be origins without credentials, paths, queries, or fragments")
		}
	}
	return nil
}

// getEnv gets an environment variable or returns a default value.
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as an integer or returns a default value.
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

// GetDSN returns the PostgreSQL connection string.
func (c *DatabaseConfig) GetDSN() string {
	parts := []string{
		fmt.Sprintf("host=%s", c.Host),
		fmt.Sprintf("port=%s", c.Port),
		fmt.Sprintf("user=%s", c.User),
		fmt.Sprintf("password=%s", c.Password),
		fmt.Sprintf("dbname=%s", c.DBName),
		fmt.Sprintf("sslmode=%s", c.SSLMode),
	}
	if c.SSLRootCert != "" {
		parts = append(parts, fmt.Sprintf("sslrootcert=%s", c.SSLRootCert))
	}
	return strings.Join(parts, " ")
}

// GetRedisAddr returns the Redis address.
func (c *RedisConfig) GetRedisAddr() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}
