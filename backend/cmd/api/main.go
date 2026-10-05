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
	logger.Init()
	logger.InfoLogger.Println("Starting HALO API Gateway...")

	cfg, err := config.Load()
	if err != nil {
		logger.ErrorLogger.Fatalf("Failed to load configuration: %v", err)
	}

	gin.SetMode(gin.ReleaseMode)

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

	authRepo := auth.NewPostgresRepository(db.DB)
	videoRepo := video.NewPostgresRepository(db.DB)

	authService := auth.NewService(authRepo)
	videoService := video.NewService(videoRepo, redisClient)

	jwtManager := auth.NewJWTManager(cfg.JWT.SecretKey, cfg.JWT.ExpirationHours)

	authHandler := auth.NewHandler(authService, jwtManager)
	videoHandler := video.NewHandler(videoService)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.LoggerMiddleware())
	router.Use(middleware.CORSMiddleware(cfg.CORS.AllowedOrigins))

	// Rate limits are configuration-backed and validated before the server starts.
	// This avoids a permissive hard-coded production default.
	rateLimiter := middleware.NewRateLimiter(cfg.Server.RateLimitRPS, cfg.Server.RateLimitBurst)
	rateLimiter.CleanupOldLimiters()
	router.Use(middleware.RateLimitMiddleware(rateLimiter))

	router.GET("/health", func(c *gin.Context) {
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

	v1 := router.Group("/api/v1")
	{
		authRoutes := v1.Group("/auth")
		{
			authRoutes.POST("/register", authHandler.Register)
			authRoutes.POST("/login", authHandler.Login)
		}

		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.AuthMiddleware(jwtManager))
		{
			authProtected.GET("/me", authHandler.GetProfile)
		}

		videoRoutes := v1.Group("/videos")
		{
			videoRoutes.GET("", videoHandler.GetVideos)
			videoRoutes.GET("/:id", videoHandler.GetVideo)
		}

		videoProtected := v1.Group("/videos")
		videoProtected.Use(middleware.AuthMiddleware(jwtManager))
		{
			videoProtected.POST("/:id/engagement/:metric", videoHandler.IncrementEngagement)
		}

		v1.GET("/users/:user_id/videos", videoHandler.GetUserVideos)
	}

	srv := &http.Server{
		Addr:           fmt.Sprintf(":%s", cfg.Server.Port),
		Handler:        router,
		ReadTimeout:    time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout:   time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:    time.Duration(cfg.Server.IdleTimeout) * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	go func() {
		logger.InfoLogger.Printf("Server listening on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.ErrorLogger.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.InfoLogger.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.ErrorLogger.Fatalf("Server forced to shutdown: %v", err)
	}

	logger.InfoLogger.Println("Server exited")
}
