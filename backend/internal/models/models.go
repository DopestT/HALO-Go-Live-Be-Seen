package models

import "time"

// User represents a user in the system
type User struct {
	ID           int64     `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	DisplayName  string    `json:"display_name" db:"display_name"`
	Bio          string    `json:"bio" db:"bio"`
	AvatarURL    string    `json:"avatar_url" db:"avatar_url"`
	IsAdult      bool      `json:"is_adult" db:"is_adult"`
	AdultMode    bool      `json:"adult_mode" db:"adult_mode"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// Video represents video metadata
type Video struct {
	ID          int64     `json:"id" db:"id"`
	UserID      int64     `json:"user_id" db:"user_id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	ThumbnailURL string   `json:"thumbnail_url" db:"thumbnail_url"`
	StreamURL   string    `json:"stream_url" db:"stream_url"`
	IsLive      bool      `json:"is_live" db:"is_live"`
	IsAdultContent bool   `json:"is_adult_content" db:"is_adult_content"`
	ViewCount   int64     `json:"view_count" db:"view_count"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// VideoWithEngagement extends Video with real-time engagement data
type VideoWithEngagement struct {
	Video
	LiveViewers  int64 `json:"live_viewers"`
	LikeCount    int64 `json:"like_count"`
	CommentCount int64 `json:"comment_count"`
}

// LoginRequest represents login credentials
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// RegisterRequest represents registration data
type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Username    string `json:"username" binding:"required,min=3,max=30"`
	Password    string `json:"password" binding:"required,min=8"`
	DisplayName string `json:"display_name" binding:"required,min=1,max=50"`
	IsAdult     bool   `json:"is_adult"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// SuccessResponse represents a generic success response
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
