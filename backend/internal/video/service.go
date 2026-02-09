package video

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/database"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/models"
)

var (
	ErrVideoNotFound = errors.New("video not found")
)

// Repository defines the interface for video data access
type Repository interface {
	GetVideoByID(ctx context.Context, id int64) (*models.Video, error)
	GetVideos(ctx context.Context, limit, offset int, isLive bool) ([]*models.Video, error)
	GetVideosByUserID(ctx context.Context, userID int64, limit, offset int) ([]*models.Video, error)
	CreateVideo(ctx context.Context, video *models.Video) error
	UpdateVideo(ctx context.Context, video *models.Video) error
}

// Service handles video business logic
type Service struct {
	repo  Repository
	redis *database.RedisClient
}

// NewService creates a new video service
func NewService(repo Repository, redis *database.RedisClient) *Service {
	return &Service{
		repo:  repo,
		redis: redis,
	}
}

// GetVideoByID retrieves a video by ID with engagement data
func (s *Service) GetVideoByID(ctx context.Context, id int64) (*models.VideoWithEngagement, error) {
	video, err := s.repo.GetVideoByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrVideoNotFound
		}
		return nil, fmt.Errorf("failed to get video: %w", err)
	}

	// Get engagement data from Redis
	engagement, err := s.redis.GetMultipleEngagements(ctx, id)
	if err != nil {
		// Log error but don't fail the request
		engagement = map[string]int64{
			"live_viewers": 0,
			"likes":        0,
			"comments":     0,
		}
	}

	return &models.VideoWithEngagement{
		Video:        *video,
		LiveViewers:  engagement["live_viewers"],
		LikeCount:    engagement["likes"],
		CommentCount: engagement["comments"],
	}, nil
}

// GetVideos retrieves a list of videos with engagement data
func (s *Service) GetVideos(ctx context.Context, limit, offset int, isLive bool) ([]*models.VideoWithEngagement, error) {
	videos, err := s.repo.GetVideos(ctx, limit, offset, isLive)
	if err != nil {
		return nil, fmt.Errorf("failed to get videos: %w", err)
	}

	// Enrich with engagement data
	result := make([]*models.VideoWithEngagement, len(videos))
	for i, video := range videos {
		engagement, err := s.redis.GetMultipleEngagements(ctx, video.ID)
		if err != nil {
			// Log error but don't fail the request
			engagement = map[string]int64{
				"live_viewers": 0,
				"likes":        0,
				"comments":     0,
			}
		}

		result[i] = &models.VideoWithEngagement{
			Video:        *video,
			LiveViewers:  engagement["live_viewers"],
			LikeCount:    engagement["likes"],
			CommentCount: engagement["comments"],
		}
	}

	return result, nil
}

// GetVideosByUserID retrieves videos for a specific user
func (s *Service) GetVideosByUserID(ctx context.Context, userID int64, limit, offset int) ([]*models.VideoWithEngagement, error) {
	videos, err := s.repo.GetVideosByUserID(ctx, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get user videos: %w", err)
	}

	// Enrich with engagement data
	result := make([]*models.VideoWithEngagement, len(videos))
	for i, video := range videos {
		engagement, err := s.redis.GetMultipleEngagements(ctx, video.ID)
		if err != nil {
			engagement = map[string]int64{
				"live_viewers": 0,
				"likes":        0,
				"comments":     0,
			}
		}

		result[i] = &models.VideoWithEngagement{
			Video:        *video,
			LiveViewers:  engagement["live_viewers"],
			LikeCount:    engagement["likes"],
			CommentCount: engagement["comments"],
		}
	}

	return result, nil
}

// IncrementEngagement increments an engagement metric for a video
func (s *Service) IncrementEngagement(ctx context.Context, videoID int64, metric string) error {
	return s.redis.IncrementEngagement(ctx, videoID, metric)
}
