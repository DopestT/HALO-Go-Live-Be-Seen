package auth

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

// NewPostgresRepository creates a new user repository
func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) CreateUser(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (email, username, password_hash, display_name, bio, avatar_url, is_adult, adult_mode, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`
	err := r.db.QueryRowContext(ctx, query, user.Email, user.Username, user.PasswordHash, user.DisplayName, user.Bio, user.AvatarURL, user.IsAdult, user.AdultMode, user.CreatedAt, user.UpdatedAt).Scan(&user.ID)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	return nil
}

func (r *PostgresRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, display_name, bio, avatar_url, is_adult, adult_mode, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, email).Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.DisplayName, &user.Bio, &user.AvatarURL, &user.IsAdult, &user.AdultMode, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *PostgresRepository) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, display_name, bio, avatar_url, is_adult, adult_mode, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.DisplayName, &user.Bio, &user.AvatarURL, &user.IsAdult, &user.AdultMode, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *PostgresRepository) UpdateUser(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET email = $1, username = $2, display_name = $3, bio = $4, avatar_url = $5,
		    is_adult = $6, adult_mode = $7, updated_at = $8
		WHERE id = $9
	`
	_, err := r.db.ExecContext(ctx, query, user.Email, user.Username, user.DisplayName, user.Bio, user.AvatarURL, user.IsAdult, user.AdultMode, user.UpdatedAt, user.ID)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

// ListPublicCreators returns only public creator fields and only for users who
// have at least one video record.
func (r *PostgresRepository) ListPublicCreators(ctx context.Context, limit, offset int) ([]*models.PublicCreator, error) {
	query := `
		SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url
		FROM users u
		WHERE EXISTS (SELECT 1 FROM videos v WHERE v.user_id = u.id)
		ORDER BY u.id ASC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list public creators: %w", err)
	}
	defer rows.Close()

	creators := make([]*models.PublicCreator, 0)
	for rows.Next() {
		creator := &models.PublicCreator{}
		if err := rows.Scan(&creator.ID, &creator.Username, &creator.DisplayName, &creator.Bio, &creator.AvatarURL); err != nil {
			return nil, fmt.Errorf("failed to scan public creator: %w", err)
		}
		creators = append(creators, creator)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate public creators: %w", err)
	}
	return creators, nil
}

// GetPublicCreator returns one creator's public fields only if the user has at
// least one video record.
func (r *PostgresRepository) GetPublicCreator(ctx context.Context, id int64) (*models.PublicCreator, error) {
	query := `
		SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url
		FROM users u
		WHERE u.id = $1
		  AND EXISTS (SELECT 1 FROM videos v WHERE v.user_id = u.id)
	`
	creator := &models.PublicCreator{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(&creator.ID, &creator.Username, &creator.DisplayName, &creator.Bio, &creator.AvatarURL)
	if err != nil {
		return nil, err
	}
	return creator, nil
}
