package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hotpatch/server/internal/api"
	"github.com/hotpatch/server/internal/api/handlers"
	"github.com/hotpatch/server/internal/config"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
	"github.com/hotpatch/server/internal/services"
	"github.com/hotpatch/server/internal/storage"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// ── Load configuration ──
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("⚡ HotPatch OTA — Backend API Server")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("  Environment: %s\n", cfg.Environment)
	fmt.Printf("  Port:        %s\n", cfg.Port)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// ── Connect to PostgreSQL ──
	gormLogger := logger.Default.LogMode(logger.Warn)
	if cfg.Environment == "development" {
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	var db *gorm.DB
	if strings.HasSuffix(cfg.DatabaseURL, ".db") || cfg.DatabaseURL == "sqlite" {
		db, err = gorm.Open(sqlite.Open(cfg.DatabaseURL), &gorm.Config{
			Logger: gormLogger,
		})
		fmt.Println("✅ Connected to SQLite")
	} else {
		fmt.Println("⏳ Connecting to PostgreSQL...")
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
			Logger:                                   gormLogger,
			DisableForeignKeyConstraintWhenMigrating: true,
		})
		if err == nil {
			fmt.Println("✅ Connected to PostgreSQL")
		}
	}

	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ Failed to get SQL DB: %v", err)
	}
	// Connection pool settings for high concurrency
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)

	fmt.Println("✅ Connected to PostgreSQL")

	// ── Auto-migrate models ──
	// ── Auto-migrate models ──
	fmt.Println("⏳ Running database migrations (FKs disabled for initial setup)...")

	if err := db.AutoMigrate(
		&models.User{},
		&models.App{},
		&models.Channel{},
		&models.Release{},
		&models.Patch{},
		&models.Device{},
		&models.Installation{},
		&models.ApiKey{},
		&models.SigningKey{},
		&models.AuditLog{},
		&models.Webhook{},
	); err != nil {
		log.Fatalf("❌ Failed to run migrations: %v", err)
	}

	fmt.Println("✅ Database migrated")

	// ── Initialize S3/R2 storage ──
	var s3Store *storage.S3Storage
	if cfg.AWSAccessKey != "" {
		s3Store, err = storage.NewS3Storage(cfg)
		if err != nil {
			log.Fatalf("❌ Failed to initialize S3 storage: %v", err)
		}
		fmt.Println("✅ S3/R2 storage connected")
	} else {
		fmt.Println("⚠️  S3/R2 not configured — bundle uploads will fail")
	}

	// ── Initialize Redis ──
	var redisClient *redis.Client
	if cfg.RedisURL != "" {
		opt, err := redis.ParseURL(cfg.RedisURL)
		if err == nil {
			redisClient = redis.NewClient(opt)
			if err := redisClient.Ping(context.Background()).Err(); err == nil {
				fmt.Println("✅ Connected to Redis")
			} else {
				fmt.Printf("⚠️  Redis ping failed: %v\n", err)
				redisClient = nil
			}
		} else {
			fmt.Printf("⚠️  Invalid Redis URL: %v\n", err)
		}
	} else {
		fmt.Println("⚠️  Redis not configured — caching disabled")
	}

	// ── Initialize repositories ──
	releaseRepo := repository.NewReleaseRepository(db)
	deviceRepo := repository.NewDeviceRepository(db)
	channelRepo := repository.NewChannelRepository(db)
	analyticsRepo := repository.NewAnalyticsRepository(db)
	securityRepo := repository.NewSecurityRepository(db)
	settingsRepo := repository.NewSettingsRepository(db)

	// ── Initialize services ──
	settingsService := services.NewSettingsService(settingsRepo)
	releaseService := services.NewReleaseService(releaseRepo, s3Store, settingsService, redisClient)
	updateService := services.NewUpdateService(releaseRepo, deviceRepo, redisClient)
	deviceService := services.NewDeviceService(deviceRepo)
	channelService := services.NewChannelService(channelRepo)
	analyticsService := services.NewAnalyticsService(analyticsRepo, deviceRepo, releaseRepo)
	securityService := services.NewSecurityService(securityRepo)
	emailService := services.NewEmailService(cfg.BackendURL)

	// ── Initialize handlers ──
	authHandler := handlers.NewAuthHandler(db, channelService, emailService, cfg.JWTSecret, cfg.JWTExpiration, cfg.SuperadminEmail, cfg.SuperadminPassword, cfg.BackendURL, cfg.FrontendURL, cfg.GoogleClientID, cfg.GoogleClientSecret)
	adminHandler := handlers.NewAdminHandler(db)
	releaseHandler := handlers.NewReleaseHandler(releaseService)
	updateHandler := handlers.NewUpdateHandler(updateService)
	deviceHandler := handlers.NewDeviceHandler(deviceService)
	channelHandler := handlers.NewChannelHandler(channelService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	securityHandler := handlers.NewSecurityHandler(securityService)
	settingsHandler := handlers.NewSettingsHandler(settingsService)

	// ── Setup Gin engine ──
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// ── Register routes ──
	api.SetupRoutes(
		r,
		cfg.JWTSecret,
		redisClient,
		authHandler,
		releaseHandler,
		updateHandler,
		deviceHandler,
		channelHandler,
		analyticsHandler,
		securityHandler,
		settingsHandler,
		adminHandler,
	)

	// ── Start server ──
	addr := ":" + cfg.Port
	fmt.Printf("\n🚀 HotPatch API listening on http://localhost%s\n\n", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("❌ Server failed: %v", err)
	}
}
