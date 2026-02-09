package video

import (
	"net/http"
	"strconv"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// Handler handles video HTTP requests
type Handler struct {
	service *Service
}

// NewHandler creates a new video handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// GetVideo handles getting a video by ID
// @Summary Get video by ID
// @Tags videos
// @Produce json
// @Param id path int true "Video ID"
// @Success 200 {object} models.VideoWithEngagement
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /videos/{id} [get]
func (h *Handler) GetVideo(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid video ID",
		})
		return
	}

	video, err := h.service.GetVideoByID(c.Request.Context(), id)
	if err != nil {
		if err == ErrVideoNotFound {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error:   "not_found",
				Message: "Video not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to get video",
		})
		return
	}

	c.JSON(http.StatusOK, video)
}

// GetVideos handles getting a list of videos
// @Summary Get videos
// @Tags videos
// @Produce json
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param live query bool false "Filter by live status"
// @Success 200 {array} models.VideoWithEngagement
// @Failure 400 {object} models.ErrorResponse
// @Router /videos [get]
func (h *Handler) GetVideos(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	isLive := c.Query("live") == "true"

	// Limit maximum items per page for performance
	if limit > 100 {
		limit = 100
	}

	videos, err := h.service.GetVideos(c.Request.Context(), limit, offset, isLive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to get videos",
		})
		return
	}

	c.JSON(http.StatusOK, videos)
}

// GetUserVideos handles getting videos for a specific user
// @Summary Get user videos
// @Tags videos
// @Produce json
// @Param user_id path int true "User ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {array} models.VideoWithEngagement
// @Failure 400 {object} models.ErrorResponse
// @Router /users/{user_id}/videos [get]
func (h *Handler) GetUserVideos(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid user ID",
		})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	// Limit maximum items per page
	if limit > 100 {
		limit = 100
	}

	videos, err := h.service.GetVideosByUserID(c.Request.Context(), userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to get user videos",
		})
		return
	}

	c.JSON(http.StatusOK, videos)
}

// IncrementEngagement handles incrementing engagement metrics
// @Summary Increment engagement metric
// @Tags videos
// @Accept json
// @Produce json
// @Param id path int true "Video ID"
// @Param metric path string true "Metric name (likes, comments, live_viewers)"
// @Success 200 {object} models.SuccessResponse
// @Failure 400 {object} models.ErrorResponse
// @Router /videos/{id}/engagement/{metric} [post]
func (h *Handler) IncrementEngagement(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid video ID",
		})
		return
	}

	metric := c.Param("metric")
	validMetrics := map[string]bool{
		"likes":        true,
		"comments":     true,
		"live_viewers": true,
	}

	if !validMetrics[metric] {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_metric",
			Message: "Invalid metric name",
		})
		return
	}

	if err := h.service.IncrementEngagement(c.Request.Context(), id, metric); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to increment engagement",
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Engagement incremented successfully",
	})
}
