package auth

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// Handler handles authentication and public creator HTTP requests.
type Handler struct {
	service    *Service
	jwtManager *JWTManager
}

func NewHandler(service *Service, jwtManager *JWTManager) *Handler {
	return &Handler{service: service, jwtManager: jwtManager}
}

// Register handles user registration.
func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_request", Message: err.Error()})
		return
	}

	user, err := h.service.Register(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, ErrUserExists) {
			c.JSON(http.StatusConflict, models.ErrorResponse{Error: "user_exists", Message: "A user with this email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_error", Message: "Failed to create user"})
		return
	}

	token, err := h.jwtManager.GenerateToken(user.ID, user.Email, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_error", Message: "Failed to generate token"})
		return
	}
	c.JSON(http.StatusCreated, models.AuthResponse{Token: token, User: user})
}

// Login handles user login.
func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_request", Message: err.Error()})
		return
	}

	user, err := h.service.Login(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "invalid_credentials", Message: "Invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_error", Message: "Failed to authenticate user"})
		return
	}

	token, err := h.jwtManager.GenerateToken(user.ID, user.Email, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_error", Message: "Failed to generate token"})
		return
	}
	c.JSON(http.StatusOK, models.AuthResponse{Token: token, User: user})
}

// GetProfile returns the authenticated user's full private profile.
func (h *Handler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "unauthorized", Message: "User not authenticated"})
		return
	}

	user, err := h.service.GetUserByID(c.Request.Context(), userID.(int64))
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "not_found", Message: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_error", Message: "Failed to get user profile"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// ListPublicCreators returns only creators that have published at least one video.
func (h *Handler) ListPublicCreators(c *gin.Context) {
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_pagination", Message: "Invalid limit"})
		return
	}
	offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_pagination", Message: "Invalid offset"})
		return
	}

	creators, err := h.service.ListPublicCreators(c.Request.Context(), limit, offset)
	if err != nil {
		if errors.Is(err, ErrInvalidPagination) {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_pagination", Message: "limit must be 1-100 and offset must be zero or greater"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_error", Message: "Failed to load creators"})
		return
	}
	c.JSON(http.StatusOK, creators)
}

// GetPublicCreator returns one creator's public profile fields only.
func (h *Handler) GetPublicCreator(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_id", Message: "Invalid creator ID"})
		return
	}

	creator, err := h.service.GetPublicCreator(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, ErrPublicCreatorNotFound) {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "not_found", Message: "Creator not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_error", Message: "Failed to load creator"})
		return
	}
	c.JSON(http.StatusOK, creator)
}
