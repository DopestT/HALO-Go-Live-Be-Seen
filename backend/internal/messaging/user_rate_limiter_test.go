package messaging

import (
	"testing"
	"time"
)

func TestUserRateLimiterExactBoundariesAndReset(t *testing.T) {
	now := time.Date(2026, 10, 19, 12, 0, 0, 0, time.UTC)
	limiter := NewUserRateLimiter(func() time.Time { return now })

	tests := []struct {
		name   string
		action RateAction
		limit  int
		window time.Duration
	}{
		{name: "conversation create", action: RateConversationCreate, limit: 10, window: time.Hour},
		{name: "message send", action: RateMessageSend, limit: 30, window: time.Minute},
		{name: "report", action: RateReport, limit: 20, window: time.Hour},
		{name: "block changes", action: RateBlockChange, limit: 30, window: time.Hour},
	}

	for i, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			userID := int64(100 + i)
			for attempt := 1; attempt <= tc.limit; attempt++ {
				if !limiter.Allow(userID, tc.action) {
					t.Fatalf("attempt %d/%d unexpectedly rejected", attempt, tc.limit)
				}
			}
			if limiter.Allow(userID, tc.action) {
				t.Fatalf("attempt %d must be rejected", tc.limit+1)
			}
			now = now.Add(tc.window)
			if !limiter.Allow(userID, tc.action) {
				t.Fatalf("first attempt after %s window reset must be allowed", tc.window)
			}
		})
	}
}

func TestUserRateLimiterBucketsAreIndependentPerUserAndAction(t *testing.T) {
	now := time.Date(2026, 10, 19, 12, 0, 0, 0, time.UTC)
	limiter := NewUserRateLimiter(func() time.Time { return now })

	for i := 0; i < 10; i++ {
		if !limiter.Allow(1, RateConversationCreate) {
			t.Fatal("expected conversation create allowance")
		}
	}
	if limiter.Allow(1, RateConversationCreate) {
		t.Fatal("user 1 create bucket should be exhausted")
	}
	if !limiter.Allow(2, RateConversationCreate) {
		t.Fatal("user 2 must have an independent create bucket")
	}
	if !limiter.Allow(1, RateMessageSend) {
		t.Fatal("message-send bucket must remain independent of create bucket")
	}
}

func TestUserRateLimiterRejectsInvalidIdentityOrAction(t *testing.T) {
	limiter := NewUserRateLimiter(time.Now)
	if limiter.Allow(0, RateConversationCreate) {
		t.Fatal("zero user ID must be rejected")
	}
	if limiter.Allow(1, RateAction("unknown")) {
		t.Fatal("unknown action must be rejected")
	}
}
