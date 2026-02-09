package middleware

import (
	"time"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

// LoggerMiddleware logs HTTP requests
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(startTime)

		// Get status code
		statusCode := c.Writer.Status()

		// Log request
		logger.InfoLogger.Printf(
			"%s %s %d %v %s",
			c.Request.Method,
			c.Request.URL.Path,
			statusCode,
			latency,
			c.ClientIP(),
		)
	}
}
