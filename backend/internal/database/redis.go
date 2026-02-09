package database

import (
	"context"
	"fmt"
	"time"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/pkg/config"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/pkg/logger"
	"github.com/redis/go-redis/v9"
)

// RedisClient wraps the Redis client
type RedisClient struct {
	*redis.Client
}

// NewRedisClient creates a new Redis client
func NewRedisClient(cfg *config.RedisConfig) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         cfg.GetRedisAddr(),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     cfg.PoolSize,
		MinIdleConns: cfg.MinIdleConns,
		// Optimize for low latency
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolTimeout:  4 * time.Second,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logger.InfoLogger.Println("Successfully connected to Redis")

	return &RedisClient{client}, nil
}

// Close closes the Redis connection
func (rc *RedisClient) Close() error {
	logger.InfoLogger.Println("Closing Redis connection")
	return rc.Client.Close()
}

// IncrementEngagement increments an engagement counter for a video
func (rc *RedisClient) IncrementEngagement(ctx context.Context, videoID int64, metric string) error {
	key := fmt.Sprintf("video:%d:%s", videoID, metric)
	return rc.Incr(ctx, key).Err()
}

// GetEngagement gets an engagement counter for a video
func (rc *RedisClient) GetEngagement(ctx context.Context, videoID int64, metric string) (int64, error) {
	key := fmt.Sprintf("video:%d:%s", videoID, metric)
	val, err := rc.Get(ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return val, err
}

// SetEngagement sets an engagement counter for a video
func (rc *RedisClient) SetEngagement(ctx context.Context, videoID int64, metric string, value int64) error {
	key := fmt.Sprintf("video:%d:%s", videoID, metric)
	return rc.Set(ctx, key, value, 0).Err()
}

// GetMultipleEngagements gets multiple engagement metrics for a video
func (rc *RedisClient) GetMultipleEngagements(ctx context.Context, videoID int64) (map[string]int64, error) {
	metrics := []string{"live_viewers", "likes", "comments"}
	keys := make([]string, len(metrics))
	for i, metric := range metrics {
		keys[i] = fmt.Sprintf("video:%d:%s", videoID, metric)
	}

	values, err := rc.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, err
	}

	result := make(map[string]int64)
	for i, metric := range metrics {
		if values[i] != nil {
			if val, ok := values[i].(string); ok {
				var intVal int64
				fmt.Sscanf(val, "%d", &intVal)
				result[metric] = intVal
			}
		} else {
			result[metric] = 0
		}
	}

	return result, nil
}

// HealthCheck checks if Redis is healthy
func (rc *RedisClient) HealthCheck(ctx context.Context) error {
	return rc.Ping(ctx).Err()
}
