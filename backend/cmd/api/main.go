package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/auth"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/database"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/middleware"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/video"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/pkg/config"
	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize logger
	logger.Init()
	logger.InfoLogger.Println("Starting HALO API Gateway...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.ErrorLogger.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin to release mode for production
	gin.SetMode(gin.ReleaseMode)

	// Initialize database connections
	db, err := database.NewPostgresDB(&cfg.Database)
	if err != nil {
		logger.ErrorLogger.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()

	redisClient, err := database.NewRedisClient(&cfg.Redis)
	if err != nil {
		logger.ErrorLogger.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize repositories
	authRepo := auth.NewPostgresRepository(db.DB)
	videoRepo := video.NewPostgresRepository(db.DB)

	// Initialize services
	authService := auth.NewService(authRepo)
	videoService := video.NewService(videoRepo, redisClient)

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(cfg.JWT.SecretKey, cfg.JWT.ExpirationHours)

	// Initialize handlers
	authHandler := auth.NewHandler(authService, jwtManager)
	videoHandler := video.NewHandler(videoService)

	// Initialize Gin router
	router := gin.New()

	// Apply global middleware
	router.Use(gin.Recovery())
	router.Use(middleware.LoggerMiddleware())
	router.Use(middleware.CORSMiddleware(cfg.CORS.AllowedOrigins))

	// Initialize rate limiter (1000 requests per second, burst of 2000)
	rateLimiter := middleware.NewRateLimiter(1000, 2000)
	rateLimiter.CleanupOldLimiters()
	router.Use(middleware.RateLimitMiddleware(rateLimiter))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		// Check database health
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		dbHealthy := db.HealthCheck(ctx) == nil
		redisHealthy := redisClient.HealthCheck(ctx) == nil

		status := "healthy"
		statusCode := http.StatusOK
		if !dbHealthy || !redisHealthy {
			status = "unhealthy"
			statusCode = http.StatusServiceUnavailable
		}

		c.JSON(statusCode, gin.H{
			"status":   status,
			"database": dbHealthy,
			"redis":    redisHealthy,
			"time":     time.Now().Unix(),
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public auth routes
		authRoutes := v1.Group("/auth")
		{
			authRoutes.POST("/register", authHandler.Register)
			authRoutes.POST("/login", authHandler.Login)
		}

		// Protected auth routes
		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.AuthMiddleware(jwtManager))
		{
			authProtected.GET("/me", authHandler.GetProfile)
		}

		// Video routes (some protected, some public)
		videoRoutes := v1.Group("/videos")
		{
			videoRoutes.GET("", videoHandler.GetVideos)
			videoRoutes.GET("/:id", videoHandler.GetVideo)
		}

		// Protected video routes
		videoProtected := v1.Group("/videos")
		videoProtected.Use(middleware.AuthMiddleware(jwtManager))
		{
			videoProtected.POST("/:id/engagement/:metric", videoHandler.IncrementEngagement)
		}

		// User video routes
		v1.GET("/users/:user_id/videos", videoHandler.GetUserVideos)
	}

	// Create HTTP server with timeouts optimized for high concurrency
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
		// Optimize for high concurrency
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Start server in a goroutine
	go func() {
		logger.InfoLogger.Printf("Server listening on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.ErrorLogger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.InfoLogger.Println("Shutting down server...")

	// Give outstanding requests 5 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.ErrorLogger.Fatalf("Server forced to shutdown: %v", err)
	}

	logger.InfoLogger.Println("Server exited")
}
