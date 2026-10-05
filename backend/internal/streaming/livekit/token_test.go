package livekit

import (
	"testing"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/platform"
)

func TestTokenIssuerRejectsWeakSecrets(t *testing.T) {
	if _, err := NewTokenIssuer("api-key", "api-secret", []byte("short")); err == nil {
		t.Fatal("NewTokenIssuer() accepted weak identity key")
	}
	if _, err := NewTokenIssuer("", "api-secret", []byte("0123456789abcdef0123456789abcdef")); err == nil {
		t.Fatal("NewTokenIssuer() accepted empty API key")
	}
}

func TestViewerJoinTokenIsShortLivedAndCannotPublish(t *testing.T) {
	issuer, err := NewTokenIssuer(
		"api-key",
		"api-secret-0123456789abcdef",
		[]byte("0123456789abcdef0123456789abcdef"),
	)
	if err != nil {
		t.Fatalf("NewTokenIssuer() error = %v", err)
	}

	raw, err := issuer.IssueJoinToken(
		platform.HALOID("550e8400-e29b-41d4-a716-446655440000"),
		42,
		JoinRoleViewer,
	)
	if err != nil {
		t.Fatalf("IssueJoinToken() error = %v", err)
	}

	claims := parseTokenClaims(t, raw, "api-secret-0123456789abcdef")
	assertTokenEnvelope(t, claims, false)
}

func TestPublisherJoinTokenCanPublish(t *testing.T) {
	issuer, err := NewTokenIssuer(
		"api-key",
		"api-secret-0123456789abcdef",
		[]byte("0123456789abcdef0123456789abcdef"),
	)
	if err != nil {
		t.Fatalf("NewTokenIssuer() error = %v", err)
	}

	raw, err := issuer.IssueJoinToken(
		platform.HALOID("550e8400-e29b-41d4-a716-446655440000"),
		42,
		JoinRolePublisher,
	)
	if err != nil {
		t.Fatalf("IssueJoinToken() error = %v", err)
	}

	claims := parseTokenClaims(t, raw, "api-secret-0123456789abcdef")
	assertTokenEnvelope(t, claims, true)
}

func TestJoinTokenRejectsUnknownRole(t *testing.T) {
	issuer, err := NewTokenIssuer(
		"api-key",
		"api-secret-0123456789abcdef",
		[]byte("0123456789abcdef0123456789abcdef"),
	)
	if err != nil {
		t.Fatalf("NewTokenIssuer() error = %v", err)
	}
	if _, err := issuer.IssueJoinToken(
		platform.HALOID("550e8400-e29b-41d4-a716-446655440000"),
		42,
		JoinRole("admin"),
	); err == nil {
		t.Fatal("IssueJoinToken() accepted unknown role")
	}
}

func parseTokenClaims(t *testing.T, raw, secret string) jwt.MapClaims {
	t.Helper()
	parsed, err := jwt.Parse(raw, func(token *jwt.Token) (any, error) {
		return []byte(secret), nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		t.Fatalf("jwt.Parse() error = %v", err)
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok || !parsed.Valid {
		t.Fatal("issued token is not a valid JWT")
	}
	return claims
}

func assertTokenEnvelope(t *testing.T, claims jwt.MapClaims, wantPublish bool) {
	t.Helper()
	sub, _ := claims["sub"].(string)
	if sub == "" || sub == "42" || len(sub) < 10 {
		t.Fatalf("subject is not pseudonymous: %q", sub)
	}

	video, ok := claims["video"].(map[string]any)
	if !ok {
		t.Fatalf("video grant missing or wrong type: %#v", claims["video"])
	}
	if got, _ := video["roomJoin"].(bool); !got {
		t.Fatal("roomJoin is not true")
	}
	if got, _ := video["canSubscribe"].(bool); !got {
		t.Fatal("canSubscribe is not true")
	}
	if got, ok := video["canPublish"].(bool); !ok || got != wantPublish {
		t.Fatalf("canPublish = %#v; want %v", video["canPublish"], wantPublish)
	}
	if got, ok := video["canPublishData"].(bool); !ok || got {
		t.Fatalf("canPublishData = %#v; want false", video["canPublishData"])
	}
	room, _ := video["room"].(string)
	if room != "halo_broadcast_550e8400-e29b-41d4-a716-446655440000" {
		t.Fatalf("room = %q", room)
	}

	iat, err := claims.GetIssuedAt()
	if err != nil || iat == nil {
		t.Fatalf("iat missing: %v", err)
	}
	exp, err := claims.GetExpirationTime()
	if err != nil || exp == nil {
		t.Fatalf("exp missing: %v", err)
	}
	ttl := exp.Time.Sub(iat.Time)
	if ttl <= 0 || ttl > 5*time.Minute+time.Second {
		t.Fatalf("token TTL = %s; want <=5m", ttl)
	}
}
