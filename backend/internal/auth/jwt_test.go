package auth

import (
	"testing"
	"time"
)

func TestJWTManager(t *testing.T) {
	secretKey := "test-secret-key"
	expirationHours := 24

	manager := NewJWTManager(secretKey, expirationHours)

	t.Run("GenerateToken", func(t *testing.T) {
		token, err := manager.GenerateToken(1, "test@example.com", "testuser")
		if err != nil {
			t.Fatalf("Failed to generate token: %v", err)
		}

		if token == "" {
			t.Error("Generated token is empty")
		}
	})

	t.Run("ValidateToken", func(t *testing.T) {
		token, _ := manager.GenerateToken(1, "test@example.com", "testuser")

		claims, err := manager.ValidateToken(token)
		if err != nil {
			t.Fatalf("Failed to validate token: %v", err)
		}

		if claims.UserID != 1 {
			t.Errorf("Expected UserID 1, got %d", claims.UserID)
		}

		if claims.Email != "test@example.com" {
			t.Errorf("Expected email test@example.com, got %s", claims.Email)
		}

		if claims.Username != "testuser" {
			t.Errorf("Expected username testuser, got %s", claims.Username)
		}
	})

	t.Run("ValidateExpiredToken", func(t *testing.T) {
		// Create manager with -1 hour expiration (expired immediately)
		expiredManager := NewJWTManager(secretKey, -1)
		token, _ := expiredManager.GenerateToken(1, "test@example.com", "testuser")

		// Wait a moment to ensure expiration
		time.Sleep(10 * time.Millisecond)

		_, err := manager.ValidateToken(token)
		if err == nil {
			t.Error("Expected error for expired token")
		}
	})

	t.Run("ValidateInvalidToken", func(t *testing.T) {
		_, err := manager.ValidateToken("invalid-token")
		if err == nil {
			t.Error("Expected error for invalid token")
		}
	})
}
