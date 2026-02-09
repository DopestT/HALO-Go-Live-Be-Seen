package middleware

import (
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware configures CORS settings
// allowedOrigins should be a comma-separated list of allowed origins (e.g., "http://localhost:3000,https://app.halo.com")
// Use "*" only for development
func CORSMiddleware(allowedOrigins string) gin.HandlerFunc {
	origins := []string{}
	if allowedOrigins == "*" {
		origins = []string{"*"}
	} else {
		// Parse comma-separated origins
		origins = strings.Split(allowedOrigins, ",")
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
	}

	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: allowedOrigins != "*", // Only allow credentials when not using wildcard
		MaxAge:           12 * 3600,              // 12 hours
	})
}
