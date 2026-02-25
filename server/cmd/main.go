package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

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
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

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
		&models.SystemSetting{},
	); err != nil {
		log.Fatalf("❌ Failed to run migrations: %v", err)
	}

	fmt.Println("✅ Database migrated")

	// ── Seed system settings ──
	seedSettings(db, cfg)

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
	securityService := services.NewSecurityService(securityRepo)
	settingsService := services.NewSettingsService(settingsRepo, securityService)
	encryptionService := services.NewEncryptionService()
	releaseService := services.NewReleaseService(releaseRepo, s3Store, settingsService, securityService, encryptionService, redisClient)
	updateService := services.NewUpdateService(releaseRepo, deviceRepo, redisClient)
	deviceService := services.NewDeviceService(deviceRepo, securityService)
	channelService := services.NewChannelService(channelRepo, settingsService)
	analyticsService := services.NewAnalyticsService(analyticsRepo, deviceRepo, releaseRepo)
	emailService := services.NewEmailService(cfg.BackendURL)
	paymentService := services.NewPaymentService(settingsRepo, cfg, securityService)

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
	paymentHandler := handlers.NewPaymentHandler(paymentService)

	// ── Setup Gin engine ──
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// ── Register routes ──
	startTime := time.Now()
	api.SetupRoutes(
		r,
		cfg.JWTSecret,
		cfg.FrontendURL,
		redisClient,
		db,
		startTime,
		authHandler,
		releaseHandler,
		updateHandler,
		deviceHandler,
		channelHandler,
		analyticsHandler,
		securityHandler,
		settingsHandler,
		adminHandler,
		paymentHandler,
	)

	// ── Start server ──
	addr := ":" + cfg.Port
	fmt.Printf("\n🚀 HotPatch API listening on http://localhost%s\n\n", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("❌ Server failed: %v", err)
	}
}

func seedSettings(db *gorm.DB, cfg *config.Config) {
	fmt.Println("⏳ Seeding system settings from environment...")
	settings := []models.SystemSetting{
		{Key: "JWT_SECRET", Value: cfg.JWTSecret, Description: "Secret key for signing JSON Web Tokens."},
		{Key: "S3_BUCKET", Value: cfg.S3Bucket, Description: "S3 bucket name for bundle storage."},
		{Key: "S3_REGION", Value: cfg.S3Region, Description: "AWS region for S3 bucket."},
		{Key: "S3_ENDPOINT", Value: cfg.S3Endpoint, Description: "Custom S3 endpoint URL (e.g. for Cloudflare R2 or MinIO)."},
		{Key: "AWS_ACCESS_KEY_ID", Value: cfg.AWSAccessKey, Description: "Access key ID for S3 storage."},
		{Key: "AWS_SECRET_ACCESS_KEY", Value: cfg.AWSSecretKey, Description: "Secret access key for S3 storage."},
		{Key: "STRIPE_SECRET_KEY", Value: cfg.StripeSecretKey, Description: "Stripe secret API key for payments."},
		{Key: "STRIPE_WEBHOOK_SECRET", Value: cfg.StripeWebhookSecret, Description: "Webhook signing secret for Stripe."},
		{Key: "STRIPE_PRICE_ID_PRO", Value: cfg.StripePriceIDPro, Description: "Stripe Price ID for Pro plan."},
		{Key: "STRIPE_PRICE_ID_ENTERPRISE", Value: cfg.StripePriceIDEnt, Description: "Stripe Price ID for Enterprise plan."},
		{Key: "GOOGLE_CLIENT_ID", Value: cfg.GoogleClientID, Description: "Google OAuth 2.0 Client ID."},
		{Key: "GOOGLE_CLIENT_SECRET", Value: cfg.GoogleClientSecret, Description: "Google OAuth 2.0 Client Secret."},
		{Key: "SUPERADMIN_EMAIL", Value: cfg.SuperadminEmail, Description: "Default superadmin email address."},
		{Key: "ENVIRONMENT", Value: cfg.Environment, Description: "Application environment (development/production)."},
		{Key: "BACKEND_URL", Value: cfg.BackendURL, Description: "Base URL of the backend API."},
		{Key: "FRONTEND_URL", Value: cfg.FrontendURL, Description: "Base URL of the frontend application."},
	}

	for _, s := range settings {
		var existing models.SystemSetting
		if err := db.Where("key = ?", s.Key).First(&existing).Error; err != nil {
			if err := db.Create(&s).Error; err != nil {
				fmt.Printf("⚠️ Failed to seed setting %s: %v\n", s.Key, err)
			}
		}
	}
	fmt.Println("✅ System settings synchronized")
}
