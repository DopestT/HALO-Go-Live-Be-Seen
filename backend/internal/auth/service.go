package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound          = errors.New("user not found")
	ErrInvalidCredentials    = errors.New("invalid credentials")
	ErrUserExists            = errors.New("user already exists")
	ErrPublicCreatorNotFound = errors.New("public creator not found")
	ErrInvalidPagination     = errors.New("invalid pagination")
)

// Repository defines the interface for user data access
type Repository interface {
	CreateUser(ctx context.Context, user *models.User) error
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetUserByID(ctx context.Context, id int64) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error
	ListPublicCreators(ctx context.Context, limit, offset int) ([]*models.PublicCreator, error)
	GetPublicCreator(ctx context.Context, id int64) (*models.PublicCreator, error)
}

// Service handles authentication and public creator read logic.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error) {
	existingUser, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existingUser != nil {
		return nil, ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		DisplayName:  req.DisplayName,
		IsAdult:      req.IsAdult,
		AdultMode:    false,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	return user, nil
}

func (s *Service) Login(ctx context.Context, req *models.LoginRequest) (*models.User, error) {
	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return user, nil
}

func (s *Service) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

func (s *Service) ListPublicCreators(ctx context.Context, limit, offset int) ([]*models.PublicCreator, error) {
	if limit < 1 || limit > 100 || offset < 0 {
		return nil, ErrInvalidPagination
	}
	creators, err := s.repo.ListPublicCreators(ctx, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list public creators: %w", err)
	}
	if creators == nil {
		return []*models.PublicCreator{}, nil
	}
	return creators, nil
}

func (s *Service) GetPublicCreator(ctx context.Context, id int64) (*models.PublicCreator, error) {
	creator, err := s.repo.GetPublicCreator(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPublicCreatorNotFound
		}
		return nil, fmt.Errorf("failed to get public creator: %w", err)
	}
	return creator, nil
}
