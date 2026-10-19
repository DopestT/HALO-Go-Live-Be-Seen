package messaging

import (
	"sync"
	"time"
)

type RateAction string

const (
	RateConversationCreate RateAction = "conversation_create"
	RateMessageSend        RateAction = "message_send"
	RateReport             RateAction = "report"
	RateBlockChange        RateAction = "block_change"
)

type rateRule struct {
	limit  int
	window time.Duration
}

type rateBucket struct {
	startedAt time.Time
	count     int
}

type userRateKey struct {
	userID int64
	action RateAction
}

type UserRateLimiter struct {
	mu      sync.Mutex
	now     func() time.Time
	buckets map[userRateKey]rateBucket
}

func NewUserRateLimiter(now func() time.Time) *UserRateLimiter {
	if now == nil {
		now = time.Now
	}
	return &UserRateLimiter{
		now:     now,
		buckets: make(map[userRateKey]rateBucket),
	}
}

func (l *UserRateLimiter) Allow(userID int64, action RateAction) bool {
	if l == nil || userID <= 0 {
		return false
	}
	rule, ok := rateRuleFor(action)
	if !ok {
		return false
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	key := userRateKey{userID: userID, action: action}
	bucket, exists := l.buckets[key]
	if !exists || now.Sub(bucket.startedAt) >= rule.window || now.Before(bucket.startedAt) {
		l.buckets[key] = rateBucket{startedAt: now, count: 1}
		return true
	}
	if bucket.count >= rule.limit {
		return false
	}
	bucket.count++
	l.buckets[key] = bucket
	return true
}

func rateRuleFor(action RateAction) (rateRule, bool) {
	switch action {
	case RateConversationCreate:
		return rateRule{limit: 10, window: time.Hour}, true
	case RateMessageSend:
		return rateRule{limit: 30, window: time.Minute}, true
	case RateReport:
		return rateRule{limit: 20, window: time.Hour}, true
	case RateBlockChange:
		return rateRule{limit: 30, window: time.Hour}, true
	default:
		return rateRule{}, false
	}
}
