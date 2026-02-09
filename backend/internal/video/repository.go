package video

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/models"
)

// PostgresRepository implements the Repository interface for PostgreSQL
type PostgresRepository struct {
	db *sql.DB
}

// NewPostgresRepository creates a new PostgreSQL repository
func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

// GetVideoByID retrieves a video by ID
func (r *PostgresRepository) GetVideoByID(ctx context.Context, id int64) (*models.Video, error) {
	query := `
		SELECT id, user_id, title, description, thumbnail_url, stream_url, is_live, 
		       is_adult_content, view_count, created_at, updated_at
		FROM videos
		WHERE id = $1
	`

	video := &models.Video{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&video.ID,
		&video.UserID,
		&video.Title,
		&video.Description,
		&video.ThumbnailURL,
		&video.StreamURL,
		&video.IsLive,
		&video.IsAdultContent,
		&video.ViewCount,
		&video.CreatedAt,
		&video.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return video, nil
}

// GetVideos retrieves a list of videos
func (r *PostgresRepository) GetVideos(ctx context.Context, limit, offset int, isLive bool) ([]*models.Video, error) {
	query := `
		SELECT id, user_id, title, description, thumbnail_url, stream_url, is_live, 
		       is_adult_content, view_count, created_at, updated_at
		FROM videos
		WHERE is_live = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, isLive, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var videos []*models.Video
	for rows.Next() {
		video := &models.Video{}
		err := rows.Scan(
			&video.ID,
			&video.UserID,
			&video.Title,
			&video.Description,
			&video.ThumbnailURL,
			&video.StreamURL,
			&video.IsLive,
			&video.IsAdultContent,
			&video.ViewCount,
			&video.CreatedAt,
			&video.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		videos = append(videos, video)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return videos, nil
}

// GetVideosByUserID retrieves videos for a specific user
func (r *PostgresRepository) GetVideosByUserID(ctx context.Context, userID int64, limit, offset int) ([]*models.Video, error) {
	query := `
		SELECT id, user_id, title, description, thumbnail_url, stream_url, is_live, 
		       is_adult_content, view_count, created_at, updated_at
		FROM videos
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var videos []*models.Video
	for rows.Next() {
		video := &models.Video{}
		err := rows.Scan(
			&video.ID,
			&video.UserID,
			&video.Title,
			&video.Description,
			&video.ThumbnailURL,
			&video.StreamURL,
			&video.IsLive,
			&video.IsAdultContent,
			&video.ViewCount,
			&video.CreatedAt,
			&video.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		videos = append(videos, video)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return videos, nil
}

// CreateVideo creates a new video
func (r *PostgresRepository) CreateVideo(ctx context.Context, video *models.Video) error {
	query := `
		INSERT INTO videos (user_id, title, description, thumbnail_url, stream_url, is_live, is_adult_content, view_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		video.UserID,
		video.Title,
		video.Description,
		video.ThumbnailURL,
		video.StreamURL,
		video.IsLive,
		video.IsAdultContent,
		video.ViewCount,
		video.CreatedAt,
		video.UpdatedAt,
	).Scan(&video.ID)

	if err != nil {
		return fmt.Errorf("failed to insert video: %w", err)
	}

	return nil
}

// UpdateVideo updates a video
func (r *PostgresRepository) UpdateVideo(ctx context.Context, video *models.Video) error {
	query := `
		UPDATE videos
		SET title = $1, description = $2, thumbnail_url = $3, stream_url = $4, 
		    is_live = $5, is_adult_content = $6, view_count = $7, updated_at = $8
		WHERE id = $9
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		video.Title,
		video.Description,
		video.ThumbnailURL,
		video.StreamURL,
		video.IsLive,
		video.IsAdultContent,
		video.ViewCount,
		video.UpdatedAt,
		video.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update video: %w", err)
	}

	return nil
}
